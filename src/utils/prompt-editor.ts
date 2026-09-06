import type { PromptField } from './prompts'

export function normalizePromptFieldName(name: string): string {
  return name.trim().replace(/\s+/g, '_').toUpperCase()
}

export function validatePromptFieldName(name: string, fields: PromptField[]): string | null {
  const trimmedName = name.trim()
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmedName)) {
    return 'El nombre solo puede usar letras, números y guiones bajos.'
  }

  if (fields.some((field) => field.name.toUpperCase() === trimmedName.toUpperCase())) {
    return 'Ya existe un input con ese nombre.'
  }

  return null
}

export function insertPromptField(
  content: string,
  name: string,
  selectionStart = content.length,
  selectionEnd = selectionStart
): { content: string; cursor: number } {
  const start = Math.max(0, Math.min(selectionStart, content.length))
  const end = Math.max(start, Math.min(selectionEnd, content.length))
  const placeholder = '{{' + name + '}}'
  const nextContent = content.slice(0, start) + placeholder + content.slice(end)

  return {
    content: nextContent,
    cursor: start + placeholder.length
  }
}
