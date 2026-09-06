export type PromptFieldType = 'text' | 'textarea'

export interface PromptField {
  name: string
  value: string
  label?: string
  help?: string
  placeholder?: string
  type?: PromptFieldType
}

export interface Prompt {
  id: number
  title: string
  description?: string
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
const fieldMetadataPattern = /<!--\s*@field\s+([A-Za-z_][A-Za-z0-9_]*)\s*([\s\S]*?)-->/g
const promptMetadataPattern = /^\s*<!--\s*@prompt\s*([\s\S]*?)-->\s*/

function parseMetadataProperties(body: string): Record<string, string> {
  return body.split(/\r?\n/).reduce<Record<string, string>>((properties, line) => {
    const separatorIndex = line.indexOf(':')
    if (separatorIndex === -1) {
      return properties
    }

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    if (key && value) {
      properties[key] = value
    }

    return properties
  }, {})
}

function parseFieldDefinition(name: string, body: string): PromptField {
  const properties = parseMetadataProperties(body)
  const field: PromptField = {
    name,
    value: properties.default ?? ''
  }

  if (properties.label) field.label = properties.label
  if (properties.help) field.help = properties.help
  if (properties.placeholder) field.placeholder = properties.placeholder
  if (properties.type === 'text' || properties.type === 'textarea') {
    field.type = properties.type
  }

  return field
}

function parsePromptBlock(block: string, id: number): Prompt {
  const metadataMatch = block.match(promptMetadataPattern)
  const metadata = metadataMatch ? parseMetadataProperties(metadataMatch[1]) : {}
  const content = (metadataMatch ? block.slice(metadataMatch[0].length) : block).trim()
  const prompt: Prompt = {
    id,
    title: metadata.title ?? `Prompt ${id + 1}`,
    content
  }

  if (metadata.description) {
    prompt.description = metadata.description
  }

  return prompt
}

export function parsePromptMarkdown(markdown: string): PromptDocument {
  const fieldDefinitions = new Map<string, PromptField>()
  const markdownWithoutFields = markdown.replace(fieldMetadataPattern, (_, name: string, body: string) => {
    if (!fieldDefinitions.has(name)) {
      fieldDefinitions.set(name, parseFieldDefinition(name, body))
    }
    return ''
  })

  const prompts = markdownWithoutFields
    .split(/^\s*---\s*$/m)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block, id) => parsePromptBlock(block, id))
    .filter((prompt) => prompt.content.length > 0)
    .map((prompt, id) => ({ ...prompt, id, title: prompt.title === `Prompt ${prompt.id + 1}` ? `Prompt ${id + 1}` : prompt.title }))

  const fields: PromptField[] = []
  const fieldNames = new Set<string>()

  for (const prompt of prompts) {
    for (const match of prompt.content.matchAll(placeholderPattern)) {
      const name = match[1]
      if (!fieldNames.has(name)) {
        fieldNames.add(name)
        const definition = fieldDefinitions.get(name)
        fields.push(definition ? { ...definition } : { name, value: '' })
      }
    }
  }

  for (const [name, definition] of fieldDefinitions) {
    if (!fieldNames.has(name)) {
      fields.push({ ...definition })
    }
  }

  return { prompts, fields }
}

export function getPromptFieldNames(content: string): string[] {
  return [...new Set(Array.from(content.matchAll(placeholderPattern), (match) => match[1]))]
}

export function getPromptFields(content: string, fields: PromptField[]): PromptField[] {
  return getPromptFieldNames(content).map((name) => {
    const field = fields.find((candidate) => candidate.name === name)
    return field ? { ...field } : { name, value: '' }
  })
}

export function getMissingPromptFieldCount(content: string, values: Record<string, string>): number {
  return getPromptFieldNames(content).filter((name) => {
    const value = values[name]
    return value === undefined || value.trim() === ''
  }).length
}

export function isPromptMetadataIncomplete(prompt: Prompt): boolean {
  return /^Prompt \d+$/.test(prompt.title) && !prompt.description?.trim()
}

export function isPromptFieldMetadataIncomplete(field: PromptField): boolean {
  return !field.label?.trim() && !field.help?.trim() && !field.placeholder?.trim() && !field.type
}

export function getPromptFieldUsageCount(name: string, prompts: Prompt[]): number {
  return prompts.filter((prompt) => getPromptFieldNames(prompt.content).includes(name)).length
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

function normalizeMetadataValue(value: string): string {
  return value.replace(/\r?\n/g, ' ').trim()
}

function serializeFieldDefinition(field: PromptField): string {
  const lines = [`<!--`, `@field ${field.name}`]
  if (field.label) lines.push(`label: ${normalizeMetadataValue(field.label)}`)
  if (field.help) lines.push(`help: ${normalizeMetadataValue(field.help)}`)
  if (field.placeholder) lines.push(`placeholder: ${normalizeMetadataValue(field.placeholder)}`)
  if (field.type) lines.push(`type: ${field.type}`)
  if (field.value) lines.push(`default: ${normalizeMetadataValue(field.value)}`)
  lines.push('-->')
  return lines.join('\n')
}

function serializePrompt(prompt: Prompt): string {
  const metadata = [
    '<!--',
    '@prompt',
    `title: ${normalizeMetadataValue(prompt.title) || `Prompt ${prompt.id + 1}`}`
  ]
  if (prompt.description?.trim()) {
    metadata.push(`description: ${normalizeMetadataValue(prompt.description)}`)
  }
  metadata.push('-->')

  return `${metadata.join('\n')}\n${prompt.content.trim()}`
}

export function serializePromptMarkdown(document: PromptDocument): string {
  const fieldDefinitions = document.fields.map(serializeFieldDefinition)
  const prompts = document.prompts.map(serializePrompt)
  const sections: string[] = []

  if (fieldDefinitions.length > 0) {
    sections.push(fieldDefinitions.join('\n\n'))
  }
  if (prompts.length > 0) {
    sections.push(prompts.join('\n---\n'))
  }

  return sections.length > 0 ? `${sections.join('\n\n')}\n` : ''
}

function reindexPrompts(prompts: Prompt[]): Prompt[] {
  return prompts.map((prompt, id) => ({ ...prompt, id }))
}

export function duplicatePrompt(prompts: Prompt[], index: number): Prompt[] {
  const prompt = prompts[index]
  if (!prompt) return prompts

  const copy: Prompt = {
    ...prompt,
    id: 0,
    title: `${prompt.title} — copia`
  }

  return reindexPrompts([...prompts.slice(0, index + 1), copy, ...prompts.slice(index + 1)])
}

export function removePrompt(prompts: Prompt[], index: number): Prompt[] {
  if (!prompts[index]) return prompts
  return reindexPrompts(prompts.filter((_, promptIndex) => promptIndex !== index))
}

export function movePrompt(prompts: Prompt[], index: number, offset: -1 | 1): Prompt[] {
  const targetIndex = index + offset
  if (!prompts[index] || targetIndex < 0 || targetIndex >= prompts.length) return prompts

  const reordered = [...prompts]
  const [prompt] = reordered.splice(index, 1)
  reordered.splice(targetIndex, 0, prompt)
  return reindexPrompts(reordered)
}
