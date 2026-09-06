import { useState } from 'react'

import ConfirmDialog from './ConfirmDialog'
import { getPromptFieldNames, getPromptFieldUsageCount, type Prompt, type PromptField, type PromptFieldType } from '../utils/prompts'
import { normalizePromptFieldName, validatePromptFieldName } from '../utils/prompt-editor'

interface FieldsManagerDialogProps {
  initialFields: PromptField[]
  prompts: Prompt[]
  isSaving: boolean
  error: string | null
  onCancel: () => void
  onSave: (fields: PromptField[]) => void
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

function toFieldDraft(field?: PromptField): FieldDraft {
  return field ? {
    name: field.name,
    label: field.label ?? '',
    help: field.help ?? '',
    placeholder: field.placeholder ?? '',
    type: field.type ?? 'text',
    value: field.value
  } : { ...emptyFieldDraft }
}

function toPromptField(draft: FieldDraft): PromptField {
  const field: PromptField = {
    name: draft.name,
    value: draft.value,
    type: draft.type
  }

  if (draft.label.trim()) field.label = draft.label.trim()
  if (draft.help.trim()) field.help = draft.help.trim()
  if (draft.placeholder.trim()) field.placeholder = draft.placeholder.trim()

  return field
}

function FieldsManagerDialog({
  initialFields,
  prompts,
  isSaving,
  error,
  onCancel,
  onSave
}: FieldsManagerDialogProps) {
  const [draftFields, setDraftFields] = useState<PromptField[]>(initialFields.map((field) => ({ ...field })))
  const [fieldDraft, setFieldDraft] = useState<FieldDraft>({ ...emptyFieldDraft })
  const [editingFieldName, setEditingFieldName] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [deleteFieldName, setDeleteFieldName] = useState<string | null>(null)

  const isFieldModalOpen = fieldDraft.name.length > 0 || editingFieldName === ''
  const inputClassName = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

  const openCreateField = () => {
    setEditingFieldName('')
    setFieldDraft({ ...emptyFieldDraft })
    setFieldError(null)
  }

  const openEditField = (field: PromptField) => {
    setEditingFieldName(field.name)
    setFieldDraft(toFieldDraft(field))
    setFieldError(null)
  }

  const closeFieldModal = () => {
    setEditingFieldName(null)
    setFieldDraft({ ...emptyFieldDraft })
    setFieldError(null)
  }

  const saveField = () => {
    const name = editingFieldName ? editingFieldName : normalizePromptFieldName(fieldDraft.name)
    if (!editingFieldName) {
      const validationError = validatePromptFieldName(fieldDraft.name, draftFields)
      if (validationError) {
        setFieldError(validationError)
        return
      }
    }

    const field = toPromptField({ ...fieldDraft, name })
    setDraftFields((current) => editingFieldName
      ? current.map((candidate) => candidate.name === editingFieldName ? field : candidate)
      : [...current, field]
    )
    closeFieldModal()
  }

  const confirmDeleteField = () => {
    if (!deleteFieldName) return
    setDraftFields((current) => current.filter((field) => field.name !== deleteFieldName))
    setDeleteFieldName(null)
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-labelledby="fields-manager-title">
      <div className="mx-auto flex min-h-full max-w-5xl items-center">
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Configuración</p>
              <h2 id="fields-manager-title" className="mt-1 text-xl font-semibold text-slate-100">Gestionar inputs</h2>
              <p className="mt-2 text-sm text-slate-400">Editá la información que acompaña a cada campo reutilizable.</p>
            </div>
            <button type="button" onClick={onCancel} disabled={isSaving} aria-label="Cerrar gestor de inputs" className="rounded-lg border border-slate-700 px-3 py-2 text-xl leading-none text-slate-400 transition hover:border-slate-500 hover:text-slate-200 disabled:opacity-50">×</button>
          </header>

          <div className="p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-4">
              <p className="text-sm text-slate-400">{draftFields.length} {draftFields.length === 1 ? 'input definido' : 'inputs definidos'}</p>
              <button type="button" onClick={openCreateField} className="flex items-center gap-2 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                Crear input
              </button>
            </div>

            {draftFields.length > 0 ? (
              <div className="grid gap-3">
                {draftFields.map((field) => {
                  const usageCount = getPromptFieldUsageCount(field.name, prompts)
                  const usageTitles = prompts.filter((prompt) => getPromptFieldNames(prompt.content).includes(field.name)).map((prompt) => prompt.title)

                  return (
                    <div key={field.name} className="flex flex-col gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate font-medium text-slate-200">{field.label ?? field.name}</span>
                          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-xs text-cyan-300">{'{{'}{field.name}{'}}'}</span>
                        </div>
                        {field.help && <p className="mt-1 text-sm text-slate-500">{field.help}</p>}
                        <p className="mt-2 text-xs text-slate-500" title={usageTitles.join(', ') || 'No se utiliza en ninguna prompt'}>
                          {usageCount === 0 ? 'No se utiliza en ninguna prompt' : 'Se utiliza en ' + usageCount + (usageCount === 1 ? ' prompt' : ' prompts')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <button type="button" onClick={() => openEditField(field)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">Editar</button>
                        <div className="group relative">
                          <button
                            type="button"
                            onClick={() => setDeleteFieldName(field.name)}
                            disabled={usageCount > 0 || isSaving}
                            aria-describedby={usageCount > 0 ? 'input-usage-' + field.name : undefined}
                            title={usageCount > 0 ? 'Quitá sus referencias de las prompts antes de eliminarlo' : 'Eliminar input'}
                            className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300 transition hover:border-red-400 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Eliminar
                          </button>
                          {usageCount > 0 && (
                            <span
                              id={'input-usage-' + field.name}
                              role="tooltip"
                              className="pointer-events-none absolute bottom-full right-0 z-10 mb-2 w-64 whitespace-pre-line rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-left text-xs leading-5 text-slate-200 opacity-0 shadow-xl transition group-hover:opacity-100 group-focus-within:opacity-100"
                            >
                              <span>No se puede eliminar porque se usa en estas prompts:</span>
                              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                                {usageTitles.map((title, titleIndex) => (
                                  <li key={title + '-' + titleIndex}>{title}</li>
                                ))}
                              </ul>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-slate-700 px-4 py-8 text-center text-sm text-slate-400">Todavía no hay inputs definidos.</p>
            )}

            {error && <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">{error}</p>}
            <p className="mt-5 text-xs leading-5 text-slate-500">Los nombres técnicos no se editan para evitar romper los placeholders existentes. Para eliminar un input utilizado, primero quitá sus referencias desde el editor de prompts.</p>
          </div>

          <footer className="flex justify-end gap-3 border-t border-slate-800 px-5 py-4 sm:px-6">
            <button type="button" onClick={onCancel} disabled={isSaving} className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:border-slate-500 disabled:opacity-50">Cancelar</button>
            <button type="button" onClick={() => onSave(draftFields)} disabled={isSaving} className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:cursor-wait disabled:opacity-50">{isSaving ? 'Guardando…' : 'Guardar cambios'}</button>
          </footer>

          {isFieldModalOpen && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="field-editor-title">
              <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Input común</p>
                    <h3 id="field-editor-title" className="mt-1 text-xl font-semibold">{editingFieldName ? 'Editar input' : 'Crear nuevo input'}</h3>
                  </div>
                  <button type="button" onClick={closeFieldModal} aria-label="Cerrar editor de input" className="text-xl text-slate-400 hover:text-slate-100">×</button>
                </div>

                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-slate-300">Nombre técnico</span>
                    <input type="text" value={fieldDraft.name} onChange={(event) => setFieldDraft((current) => ({ ...current, name: event.target.value }))} disabled={Boolean(editingFieldName)} placeholder="Ejemplo: PROYECTO" className={inputClassName + (editingFieldName ? ' cursor-not-allowed opacity-60' : '')} />
                    <span className="mt-1 block text-xs text-slate-500">Se usa como {'{{NOMBRE}}'} dentro de las prompts.</span>
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
                  <button type="button" onClick={saveField} className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">{editingFieldName ? 'Guardar input' : 'Crear input'}</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteFieldName && (
        <ConfirmDialog
          open
          title="Eliminar input"
          message={'¿Querés eliminar "' + deleteFieldName + '"? Solo se puede eliminar porque no tiene referencias en las prompts.'}
          onCancel={() => setDeleteFieldName(null)}
          onConfirm={confirmDeleteField}
        />
      )}
    </div>
  )
}

export default FieldsManagerDialog
