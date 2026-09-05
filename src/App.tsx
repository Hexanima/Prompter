import { useEffect, useMemo, useRef, useState } from 'react'

import { focusField } from './utils/focus-field'
import { getPrompterApi } from './utils/renderer-api'
import { getPromptSegments, resolvePrompt, type PromptDocument } from './utils/prompts'

function App() {
  const [document, setDocument] = useState<PromptDocument | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copied, setCopied] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fieldRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

  useEffect(() => {
    const prompterApi = getPrompterApi(window)

    if (!prompterApi) {
      setError('La aplicación debe iniciarse con Electron usando "yarn dev".')
      return
    }

    prompterApi
      .loadPrompts()
      .then((loadedDocument) => {
        setDocument(loadedDocument)
        setValues(Object.fromEntries(loadedDocument.fields.map(({ name, value }) => [name, value])))
      })
      .catch(() => {
        setError('No se pudo leer PROMPTS.md. Verificá que el archivo exista en la raíz del proyecto.')
      })
  }, [])

  const resolvedPrompts = useMemo(
    () =>
      document?.prompts.map((prompt) => ({
        ...prompt,
        resolvedContent: resolvePrompt(prompt.content, values),
        segments: getPromptSegments(prompt.content, values)
      })) ?? [],
    [document, values]
  )

  const focusPromptField = (name: string) => {
    const input = fieldRefs.current[name]
    if (input) {
      focusField(input)
    }
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

        </header>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold">Campos reutilizables</h2>
              <p className="mt-1 text-sm text-slate-400">Los valores se aplican en todas las apariciones del campo.</p>
            </div>
            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-400">
              {document.fields.length} {document.fields.length === 1 ? 'campo' : 'campos'}
            </span>
          </div>

          {document.fields.length > 0 ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {document.fields.map(({ name }) => (
                <label key={name} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">{name}</span>
                  <textarea
                    ref={(input) => {
                      fieldRefs.current[name] = input
                    }}
                    value={values[name] ?? ''}
                    onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
                    placeholder={`Valor para ${name}`}
                    rows={3}
                    className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20"
                  />
                </label>
              ))}
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

          {resolvedPrompts.map(({ id, title, resolvedContent, segments }) => (
            <article key={id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="font-semibold text-slate-200">{title}</h3>
                <button
                  type="button"
                  onClick={() => copyPrompt(resolvedContent, id)}
                  className="rounded-md border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300"
                >
                  {copied === id ? '¡Copiada!' : 'Copiar'}
                </button>
              </div>
              <pre className="w-full whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950/80 p-4 font-mono text-sm leading-6 text-slate-300">
                {segments.map((segment, index) =>
                  segment.type === 'field' ? (
                    <span
                      key={`${segment.name}-${index}`}
                      className={segment.missing ? "rounded bg-red-500/15 px-1 text-red-400 ring-1 ring-inset ring-red-500/30 cursor-pointer" : "rounded bg-emerald-500/15 px-1 text-emerald-300 ring-1 ring-inset ring-emerald-500/30 cursor-pointer"}
                      title={segment.missing ? "Campo incompleto" : "Campo completado"}
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
                    <span key={`text-${index}`}>{segment.value}</span>
                  )
                )}
              </pre>
            </article>
          ))}
        </section>
      </div>
    </main>
  )
}

export default App








