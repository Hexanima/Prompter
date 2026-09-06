import { useRef, useState } from 'react'

import type { Prompt, PromptField, PromptFieldType } from '../utils/prompts'
import { insertPromptField, normalizePromptFieldName, validatePromptFieldName } from '../utils/prompt-editor'

interface PromptEditorProps {
  initialPrompt: Prompt
  initialFields: PromptField[]
  isCreating: boolean
  isSaving: boolean
  error: string | null
  onCancel: () => void
  onSave: (prompt: Prompt, fields: PromptField[]) => void
}

interface FieldDraft {
  name: string
  label: string
  help: string
  placeholder: string
  type: PromptFieldType
  value: string
}

const emptyFieldDraft: FieldDraft = {
  name: '',
  label: '',
  help: '',
  placeholder: '',
  type: 'text',
  value: ''
}

function PromptEditor({
  initialPrompt,
  initialFields,
  isCreating,
  isSaving,
  error,
  onCancel,
  onSave
}: PromptEditorProps) {
  const [draftPrompt, setDraftPrompt] = useState<Prompt>({ ...initialPrompt })
  const [draftFields, setDraftFields] = useState<PromptField[]>(initialFields.map((field) => ({ ...field })))
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
  const [fieldDraft, setFieldDraft] = useState<FieldDraft>({ ...emptyFieldDraft })
  const [fieldError, setFieldError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const insertField = (name: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? draftPrompt.content.length
    const end = textarea?.selectionEnd ?? start
    const result = insertPromptField(draftPrompt.content, name, start, end)

    setDraftPrompt((current) => ({ ...current, content: result.content }))
    window.setTimeout(() => {
      textarea?.focus()
      textarea?.setSelectionRange(result.cursor, result.cursor)
    }, 0)
  }

  const openFieldModal = () => {
    setFieldDraft({ ...emptyFieldDraft })
    setFieldError(null)
    setIsFieldModalOpen(true)
  }

  const closeFieldModal = () => {
    setIsFieldModalOpen(false)
    setFieldError(null)
  }

  const addField = () => {
    const name = normalizePromptFieldName(fieldDraft.name)
    const validationError = validatePromptFieldName(fieldDraft.name, draftFields)

    if (validationError) {
      setFieldError(validationError)
      return
    }

    const field: PromptField = {
      name,
      value: fieldDraft.value,
      type: fieldDraft.type
    }

    if (fieldDraft.label.trim()) field.label = fieldDraft.label.trim()
    if (fieldDraft.help.trim()) field.help = fieldDraft.help.trim()
    if (fieldDraft.placeholder.trim()) field.placeholder = fieldDraft.placeholder.trim()

    setDraftFields((current) => [...current, field])
    closeFieldModal()
    insertField(name)
  }

  const inputClassName = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-labelledby="prompt-editor-title">
      <div className="mx-auto flex min-h-full max-w-6xl items-center">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
                {isCreating ? 'Nueva prompt' : 'Editar prompt'}
              </p>
              <h2 id="prompt-editor-title" className="mt-1 text-xl font-semibold text-slate-100">
                {isCreating ? 'Crear una prompt' : 'Editar contenido'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              aria-label="Cerrar editor"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xl leading-none text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:opacity-50"
            >
              ×
            </button>
          </header>

          <div className="grid min-h-[540px] md:grid-cols-[240px_minmax(0,1fr)]">
            <aside className="border-b border-slate-800 bg-slate-950/50 p-5 md:border-b-0 md:border-r">
              <h3 className="font-semibold text-slate-200">Inputs comunes</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Hacé clic en un input para insertarlo donde esté el cursor.
              </p>
              <div className="mt-4 space-y-2">
                {draftFields.map((field) => (
                  <button
                    key={field.name}
                    type="button"
                    onClick={() => insertField(field.name)}
                    className="block w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-left transition hover:border-cyan-400"
                  >
                    <span className="block truncate text-sm text-slate-200">{field.label ?? field.name}</span>
                    <span className="mt-1 block truncate font-mono text-xs text-cyan-400">{'{{'}{field.name}{'}}'}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={openFieldModal}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-600 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                Crear nuevo input
              </button>
            </aside>

            <section className="p-5 sm:p-6">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Título</span>
                  <input
                    type="text"
                    value={draftPrompt.title}
                    onChange={(event) => setDraftPrompt((current) => ({ ...current, title: event.target.value }))}
                    placeholder="Título de la prompt"
                    className={inputClassName}
                    autoFocus
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Descripción</span>
                  <input
                    type="text"
                    value={draftPrompt.description ?? ''}
                    onChange={(event) => setDraftPrompt((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Información opcional para identificarla"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">Prompt</span>
                  <textarea
                    ref={textareaRef}
                    value={draftPrompt.content}
                    onChange={(event) => setDraftPrompt((current) => ({ ...current, content: event.target.value }))}
                    placeholder="Escribí el texto de la prompt y usá los inputs comunes desde la columna izquierda."
                    rows={16}
                    className={inputClassName + ' resize-y font-mono leading-6'}
                  />
                </label>

                {error && (
                  <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </p>
                )}
              </div>
            </section>
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => onSave(draftPrompt, draftFields)}
              disabled={isSaving}
              className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-50"
            >
              {isSaving ? 'Guardando…' : 'Guardar prompt'}
            </button>
          </footer>

          {isFieldModalOpen && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="new-field-title">
              <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Input común</p>
                    <h3 id="new-field-title" className="mt-1 text-xl font-semibold">Crear nuevo input</h3>
                  </div>
                  <button type="button" onClick={closeFieldModal} aria-label="Cerrar creación de input" className="text-xl text-slate-400 hover:text-slate-100">×</button>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Nombre técnico</span>
                    <input
                      type="text"
                      value={fieldDraft.name}
                      onChange={(event) => setFieldDraft((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Ejemplo: PROYECTO"
                      className={inputClassName}
                    />
                    <span className="mt-1 block text-xs text-slate-500">Se convertirá en {'{{NOMBRE}}'} dentro de la prompt.</span>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Etiqueta visible</span>
                    <input type="text" value={fieldDraft.label} onChange={(event) => setFieldDraft((current) => ({ ...current, label: event.target.value }))} placeholder="Nombre del proyecto" className={inputClassName} />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Ayuda</span>
                    <input type="text" value={fieldDraft.help} onChange={(event) => setFieldDraft((current) => ({ ...current, help: event.target.value }))} placeholder="Qué debería cargar el usuario" className={inputClassName} />
                  </label>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-300">Placeholder</span>
                      <input type="text" value={fieldDraft.placeholder} onChange={(event) => setFieldDraft((current) => ({ ...current, placeholder: event.target.value }))} placeholder="Ejemplo: Mi proyecto" className={inputClassName} />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-slate-300">Tipo</span>
                      <select value={fieldDraft.type} onChange={(event) => setFieldDraft((current) => ({ ...current, type: event.target.value as PromptFieldType }))} className={inputClassName}>
                        <option value="text">Texto corto</option>
                        <option value="textarea">Texto largo</option>
                      </select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Valor por defecto</span>
                    <input type="text" value={fieldDraft.value} onChange={(event) => setFieldDraft((current) => ({ ...current, value: event.target.value }))} placeholder="Opcional" className={inputClassName} />
                  </label>

                  {fieldError && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{fieldError}</p>}
                </div>

                <div className="mt-5 flex justify-end gap-3">
                  <button type="button" onClick={closeFieldModal} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500">Cancelar</button>
                  <button type="button" onClick={addField} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">Crear input</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PromptEditor


