export interface PromptField {
  name: string
  value: string
}

export interface Prompt {
  id: number
  title: string
  content: string
}

export interface PromptDocument {
  prompts: Prompt[]
  fields: PromptField[]
}

export interface PromptSegment {
  type: 'text' | 'field'
  value: string
  name?: string
  missing?: boolean
}

const placeholderPattern = /{{([A-Za-z_][A-Za-z0-9_]*)}}/g

export function parsePromptMarkdown(markdown: string): PromptDocument {
  const prompts = markdown
    .split(/^\s*---\s*$/m)
    .map((content) => content.trim())
    .filter(Boolean)
    .map((content, id) => ({
      id,
      title: `Prompt ${id + 1}`,
      content
    }))

  const fields: PromptField[] = []
  const fieldNames = new Set<string>()

  for (const prompt of prompts) {
    for (const match of prompt.content.matchAll(placeholderPattern)) {
      const name = match[1]
      if (!fieldNames.has(name)) {
        fieldNames.add(name)
        fields.push({ name, value: '' })
      }
    }
  }

  return { prompts, fields }
}

export function resolvePrompt(content: string, values: Record<string, string>): string {
  return content.replace(placeholderPattern, (placeholder, name: string) => {
    const value = values[name]
    return value === undefined || value.trim() === '' ? placeholder : value
  })
}

export function getPromptSegments(content: string, values: Record<string, string>): PromptSegment[] {
  const segments: PromptSegment[] = []
  let lastIndex = 0

  const addSegment = (segment: PromptSegment) => {
    const previous = segments[segments.length - 1]
    if (previous?.type === 'text' && segment.type === 'text') {
      previous.value += segment.value
      return
    }
    segments.push(segment)
  }

  for (const match of content.matchAll(placeholderPattern)) {
    const matchIndex = match.index ?? 0
    const placeholder = match[0]
    const name = match[1]
    const value = values[name]

    if (matchIndex > lastIndex) {
      addSegment({ type: 'text', value: content.slice(lastIndex, matchIndex) })
    }

    if (value === undefined || value.trim() === '') {
      addSegment({ type: 'field', name, value: placeholder, missing: true })
    } else {
      addSegment({ type: 'field', name, value, missing: false })
    }

    lastIndex = matchIndex + placeholder.length
  }

  if (lastIndex < content.length) {
    addSegment({ type: 'text', value: content.slice(lastIndex) })
  }

  return segments
}


