import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import ConfirmDialog from './components/ConfirmDialog'
import FieldsManagerDialog from './components/FieldsManagerDialog'
import PromptFieldsDialog from './components/PromptFieldsDialog'
import PromptEditor from './components/PromptEditor'
import { focusField } from './utils/focus-field'
import { getPrompterApi } from './utils/renderer-api'
import { scrollToElement } from './utils/scroll-to-element'
import { toggleId } from './utils/toggle-id'
import { getMissingPromptFieldCount, getPromptFields, getPromptSegments, removePrompt, resolvePrompt, type Prompt, type PromptDocument, type PromptField } from './utils/prompts'

interface EditorState {
  promptIndex: number | null
  prompt: Prompt
  isCreating: boolean
}

function App() {
  const [document, setDocument] = useState<PromptDocument | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [isReloading, setIsReloading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deletePromptIndex, setDeletePromptIndex] = useState<number | null>(null)
  const [promptFieldsIndex, setPromptFieldsIndex] = useState<number | null>(null)
  const [isFieldsManagerOpen, setIsFieldsManagerOpen] = useState(false)
  const [isSavingFields, setIsSavingFields] = useState(false)
  const [fieldsManagerError, setFieldsManagerError] = useState<string | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [editorState, setEditorState] = useState<EditorState | null>(null)
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement | null>>({})
  const promptRefs = useRef<Record<number, HTMLElement | null>>({})
  const [collapsedPrompts, setCollapsedPrompts] = useState<Set<number>>(new Set())

  const updateLoadedDocument = useCallback((loadedDocument: PromptDocument) => {
    setDocument(loadedDocument)
    setValues((current) => Object.fromEntries(
      loadedDocument.fields.map((field) => [field.name, current[field.name] ?? field.value])
    ))
  }, [])

  const loadPrompts = useCallback(async () => {
    const prompterApi = getPrompterApi(window)

    if (!prompterApi) {
      throw new Error('La aplicación debe iniciarse con Electron usando "yarn dev".')
    }

    const loadedDocument = await prompterApi.loadPrompts()
    updateLoadedDocument(loadedDocument)
  }, [updateLoadedDocument])

  useEffect(() => {
    loadPrompts().catch((loadError: unknown) => {
      setError(loadError instanceof Error && loadError.message.includes('iniciarse')
        ? loadError.message
        : 'No se pudo preparar PROMPTS.md. Verificá que la plantilla esté disponible.')
    })
  }, [loadPrompts])

  const reloadPrompts = async () => {
    setError(null)
    setActionError(null)
    setIsReloading(true)

    try {
      await loadPrompts()
    } catch {
      setActionError('No se pudo recargar PROMPTS.md. Verificá que el archivo esté disponible.')
    } finally {
      setIsReloading(false)
    }
  }

  const openPromptsFile = async () => {
    const prompterApi = getPrompterApi(window)

    if (!prompterApi) {
      setError('La aplicación debe iniciarse con Electron usando "yarn dev".')
      return
    }

    try {
      await prompterApi.openPromptsFile()
    } catch {
      setActionError('No se pudo abrir PROMPTS.md. Verificá que el archivo esté disponible.')
    }
  }

  const openFieldsManager = () => {
    setFieldsManagerError(null)
    setIsFieldsManagerOpen(true)
  }

  const closeFieldsManager = () => {
    if (isSavingFields) return
    setFieldsManagerError(null)
    setIsFieldsManagerOpen(false)
  }

  const saveFields = async (fields: PromptField[]) => {
    if (!document) return

    const prompterApi = getPrompterApi(window)
    if (!prompterApi) {
      setFieldsManagerError('La aplicación debe iniciarse con Electron usando "yarn dev".')
      return
    }

    setFieldsManagerError(null)
    setIsSavingFields(true)
    try {
      await prompterApi.savePrompts({ prompts: document.prompts, fields })
      updateLoadedDocument(await prompterApi.loadPrompts())
      setIsFieldsManagerOpen(false)
    } catch {
      setFieldsManagerError('No se pudieron guardar los inputs. Verificá que PROMPTS.md esté disponible.')
    } finally {
      setIsSavingFields(false)
    }
  }

  const openPromptEditor = (promptIndex: number | null) => {
    if (!document) return

    const isCreating = promptIndex === null
    const prompt = isCreating
      ? { id: document.prompts.length, title: '', description: '', content: '' }
      : { ...document.prompts[promptIndex] }

    setEditorError(null)
    setEditorState({ promptIndex, prompt, isCreating })
  }

  const closePromptEditor = () => {
    if (isSaving) return
    setEditorError(null)
    setEditorState(null)
  }

  const savePrompt = async (prompt: Prompt, fields: PromptField[]) => {
    if (!editorState || !document) return

    if (!prompt.title.trim() || !prompt.content.trim()) {
      setEditorError('Completá el título y el contenido de la prompt.')
      return
    }

    const prompterApi = getPrompterApi(window)
    if (!prompterApi) {
      setEditorError('La aplicación debe iniciarse con Electron usando "yarn dev".')
      return
    }

    const nextPrompts = editorState.isCreating
      ? [...document.prompts, { ...prompt, id: document.prompts.length }]
      : document.prompts.map((currentPrompt, index) =>
        index === editorState.promptIndex ? { ...prompt, id: currentPrompt.id } : currentPrompt
      )
    const nextDocument: PromptDocument = { prompts: nextPrompts, fields }

    setEditorError(null)
    setIsSaving(true)

    try {
      await prompterApi.savePrompts(nextDocument)
      updateLoadedDocument(await prompterApi.loadPrompts())
      setEditorState(null)
    } catch {
      setEditorError('No se pudo guardar la prompt. Verificá que PROMPTS.md esté disponible.')
    } finally {
      setIsSaving(false)
    }
  }

  const confirmDeletePrompt = async () => {
    if (!document || deletePromptIndex === null) return

    const prompterApi = getPrompterApi(window)
    if (!prompterApi) {
      setDeletePromptIndex(null)
      setError('La aplicación debe iniciarse con Electron usando "yarn dev".')
      return
    }

    setActionError(null)
    setIsDeleting(true)
    try {
      await prompterApi.savePrompts({
        prompts: removePrompt(document.prompts, deletePromptIndex),
        fields: document.fields
      })
      updateLoadedDocument(await prompterApi.loadPrompts())
      setDeletePromptIndex(null)
    } catch {
      setActionError('No se pudo eliminar la prompt. Verificá que PROMPTS.md esté disponible.')
      setDeletePromptIndex(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const resolvedPrompts = useMemo(
    () =>
      document?.prompts.map((prompt) => ({
        ...prompt,
        resolvedContent: resolvePrompt(prompt.content, values),
        segments: getPromptSegments(prompt.content, values),
        missingFieldCount: getMissingPromptFieldCount(prompt.content, values),
        fieldCount: getPromptFields(prompt.content, document?.fields ?? []).length
      })) ?? [],
    [document, values]
  )

  const focusPromptField = (name: string) => {
    const input = fieldRefs.current[name]
    if (input) focusField(input)
  }

  const togglePrompt = (id: number) => {
    setCollapsedPrompts((current) => toggleId(current, id))
  }

  const scrollToPrompt = (id: number) => {
    setCollapsedPrompts((current) => current.has(id) ? toggleId(current, id) : current)
    window.setTimeout(() => {
      const prompt = promptRefs.current[id]
      if (prompt) scrollToElement(prompt)
    }, 0)
  }

  const copyPrompt = async (content: string, id: number) => {
    await navigator.clipboard.writeText(content)
    setCopied(id)
    window.setTimeout(() => setCopied(null), 1600)
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-slate-100">
        <div className="max-w-lg rounded-2xl border border-red-400/30 bg-red-400/10 p-8">
          <h1 className="text-xl font-semibold">No se pudieron cargar las prompts</h1>
          <p className="mt-3 text-sm text-red-100">{error}</p>
        </div>
      </main>
    )
  }

  if (!document) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <p>Cargando prompts…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-10">
        <header className="flex flex-col gap-5 border-b border-slate-800 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-cyan-400">Prompter</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Tus prompts, listas para usar</h1>
            <p className="mt-2 text-slate-400">
              Completá los campos una vez y se actualizarán en todas las prompts que los utilicen.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openPromptsFile}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Abrir archivo de prompts
            </button>
            <button
              type="button"
              onClick={reloadPrompts}
              disabled={isReloading}
              aria-label="Recargar prompts"
              title="Recargar prompts"
              className="rounded-lg border border-slate-700 p-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-wait disabled:opacity-50"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isReloading ? 'h-5 w-5 animate-spin' : 'h-5 w-5'}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 11a8.1 8.1 0 0 0-14.8-4.5L3 9m0 0V4m0 5h5M4 13a8.1 8.1 0 0 0 14.8 4.5L21 15m0 0v5m0-5h-5" />
              </svg>
            </button>
          </div>
        </header>

        {actionError && (
          <p role="alert" className="mt-5 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
            {actionError}
          </p>
        )}

        <div className="mt-8 lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <aside className="mb-8 lg:sticky lg:top-6 lg:mb-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Índice</p>
            <nav className="mt-3 space-y-1" aria-label="Índice de prompts">
              {resolvedPrompts.map(({ id, title }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => scrollToPrompt(id)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-slate-900 hover:text-cyan-300"
                >
                  <span className="mt-0.5 font-mono text-xs text-slate-600">{String(id + 1).padStart(2, '0')}</span>
                  <span>{title}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="min-w-0">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Campos reutilizables</h2>
                  <p className="mt-1 text-sm text-slate-400">Los valores se aplican en todas las apariciones del campo.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openFieldsManager}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    Gestionar inputs
                  </button>
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
                  {document.fields.length} {document.fields.length === 1 ? 'campo' : 'campos'}
                  </span>
                </div>
              </div>

              {document.fields.length > 0 ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {document.fields.map((field) => {
                    const { name, label, help, placeholder, type } = field
                    const inputPlaceholder = placeholder ?? 'Valor para ' + name
                    const inputClassName = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'

                    return (
                      <label key={name} className="block">
                        <span className="mb-2 block text-sm font-medium text-slate-300">{label ?? name}</span>
                        {help && <span className="mb-2 block text-xs leading-5 text-slate-500">{help}</span>}
                        {type === 'textarea' ? (
                          <textarea
                            ref={(input) => { fieldRefs.current[name] = input }}
                            value={values[name] ?? ''}
                            onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                            placeholder={inputPlaceholder}
                            rows={4}
                            className={inputClassName + ' resize-y'}
                          />
                        ) : (
                          <input
                            ref={(input) => { fieldRefs.current[name] = input }}
                            type="text"
                            value={values[name] ?? ''}
                            onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                            placeholder={inputPlaceholder}
                            className={inputClassName}
                          />
                        )}
                      </label>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-5 text-sm text-slate-400">No se encontraron campos editables en PROMPTS.md.</p>
              )}
            </section>

            <section className="mt-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Prompts</h2>
                <span className="text-sm text-slate-500">{resolvedPrompts.length} cargadas desde PROMPTS.md</span>
              </div>

              <button
                type="button"
                onClick={() => openPromptEditor(null)}
                aria-label="Crear prompt"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-3 text-slate-400 transition hover:border-cyan-400 hover:bg-slate-900 hover:text-cyan-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                <span className="text-sm font-medium">Nueva prompt</span>
              </button>

              {resolvedPrompts.map(({ id, title, description, resolvedContent, segments, missingFieldCount, fieldCount }, index) => (
                <article ref={(element) => { promptRefs.current[id] = element }} key={id} className="scroll-mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <button
                      type="button"
                      onClick={() => togglePrompt(id)}
                      aria-expanded={!collapsedPrompts.has(id)}
                      aria-controls={'prompt-content-' + id}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <span aria-hidden="true" className="mt-0.5 text-slate-500">{collapsedPrompts.has(id) ? '▸' : '▾'}</span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-slate-200">{title}</span>
                        {description && <span className="mt-1 block text-sm text-slate-500">{description}</span>}
                      </span>
                    </button>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPromptFieldsIndex(index)}
                        aria-label={'Completar campos de ' + title}
                        title="Completar campos de esta prompt"
                        className="flex items-center gap-2 rounded-md border border-slate-700 px-2 py-1.5 text-xs text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16M8 4v6m8 2v6" />
                        </svg>
                        <span className="hidden sm:inline">Completar</span>
                        <span className={missingFieldCount > 0 ? 'rounded-full bg-red-500/15 px-2 py-0.5 text-red-300' : fieldCount > 0 ? 'rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300' : 'rounded-full bg-slate-800 px-2 py-0.5 text-slate-400'}>
                          {missingFieldCount > 0 ? missingFieldCount + ' faltan' : fieldCount > 0 ? 'Completo' : 'Sin inputs'}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => openPromptEditor(index)}
                        aria-label={'Editar ' + title}
                        title="Editar prompt"
                        className="rounded-md border border-slate-700 p-2 text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 3.487 3.651 3.651M4 20h4l10.5-10.5a2.586 2.586 0 0 0-3.66-3.66L4.34 16.34A2.586 2.586 0 0 0 4 18v2Z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletePromptIndex(index)}
                        aria-label={'Eliminar ' + title}
                        title="Eliminar prompt"
                        className="rounded-md border border-red-500/30 p-2 text-red-300 transition hover:border-red-400 hover:bg-red-500/10"
                      >
                        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18m-2 0v14H5V6m3 0V4h8v2" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => copyPrompt(resolvedContent, id)}
                        className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                      >
                        {copied === id ? '¡Copiada!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                  {!collapsedPrompts.has(id) && (
                    <pre id={'prompt-content-' + id} className="w-full whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-slate-300">
                      {segments.map((segment, segmentIndex) =>
                        segment.type === 'field' ? (
                          <span
                            key={(segment.name ?? 'field') + '-' + segmentIndex}
                            className={segment.missing ? 'cursor-pointer rounded bg-red-500/15 px-1 text-red-400 ring-1 ring-inset ring-red-500/30' : 'cursor-pointer rounded bg-emerald-500/15 px-1 text-emerald-300 ring-1 ring-inset ring-emerald-500/30'}
                            title={segment.missing ? 'Campo incompleto' : 'Campo completado'}
                            role="button"
                            tabIndex={0}
                            onClick={() => focusPromptField(segment.name ?? '')}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                focusPromptField(segment.name ?? '')
                              }
                            }}
                          >
                            {segment.value}
                          </span>
                        ) : (
                          <span key={'text-' + segmentIndex}>{segment.value}</span>
                        )
                      )}
                    </pre>
                  )}
                </article>
              ))}

              <button
                type="button"
                onClick={() => openPromptEditor(null)}
                aria-label="Crear prompt"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 py-3 text-slate-400 transition hover:border-cyan-400 hover:bg-slate-900 hover:text-cyan-300"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                <span className="text-sm font-medium">Nueva prompt</span>
              </button>
            </section>
          </div>
        </div>
      </div>

      {isFieldsManagerOpen && (
        <FieldsManagerDialog
          initialFields={document.fields}
          prompts={document.prompts}
          isSaving={isSavingFields}
          error={fieldsManagerError}
          onCancel={closeFieldsManager}
          onSave={saveFields}
        />
      )}
      {promptFieldsIndex !== null && document.prompts[promptFieldsIndex] && (
        <PromptFieldsDialog
          promptTitle={document.prompts[promptFieldsIndex].title}
          fields={getPromptFields(document.prompts[promptFieldsIndex].content, document.fields)}
          values={values}
          onChange={(name, value) => setValues((current) => ({ ...current, [name]: value }))}
          onClose={() => setPromptFieldsIndex(null)}
        />
      )}

      {deletePromptIndex !== null && document.prompts[deletePromptIndex] && (
        <ConfirmDialog
          open
          title="Eliminar prompt"
          message={'¿Querés eliminar "' + document.prompts[deletePromptIndex].title + '"? Esta acción se guardará en PROMPTS.md.'}
          isBusy={isDeleting}
          onCancel={() => setDeletePromptIndex(null)}
          onConfirm={confirmDeletePrompt}
        />
      )}

      {editorState && (
        <PromptEditor
          key={(editorState.promptIndex === null ? 'new' : 'edit-' + editorState.promptIndex) + '-' + editorState.prompt.id}
          initialPrompt={editorState.prompt}
          initialFields={document.fields}
          isCreating={editorState.isCreating}
          isSaving={isSaving}
          error={editorError}
          onCancel={closePromptEditor}
          onSave={savePrompt}
        />
      )}
    </main>
  )
}

export default App
