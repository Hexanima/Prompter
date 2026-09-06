import type { PromptField } from '../utils/prompts'

interface PromptFieldsDialogProps {
  promptTitle: string
  fields: PromptField[]
  values: Record<string, string>
  onChange: (name: string, value: string) => void
  onClose: () => void
}

function PromptFieldsDialog({
  promptTitle,
  fields,
  values,
  onChange,
  onClose
}: PromptFieldsDialogProps) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm sm:p-8" role="dialog" aria-modal="true" aria-labelledby="prompt-fields-title">
      <div className="mx-auto flex min-h-full max-w-2xl items-center">
        <div className="w-full rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/40">
          <header className="flex items-start justify-between gap-4 border-b border-slate-800 px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Completar prompt</p>
              <h2 id="prompt-fields-title" className="mt-1 text-xl font-semibold text-slate-100">{promptTitle}</h2>
              <p className="mt-2 text-sm text-slate-400">Estos son los inputs utilizados por esta prompt.</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar campos de la prompt"
              className="rounded-lg border border-slate-700 px-3 py-2 text-xl leading-none text-slate-400 transition hover:border-slate-500 hover:text-slate-200"
            >
              ×
            </button>
          </header>

          <div className="space-y-4 p-5 sm:p-6">
            {fields.length > 0 ? fields.map((field) => {
              const inputClassName = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none transition placeholder:text-slate-600 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20'
              const inputPlaceholder = field.placeholder ?? 'Valor para ' + field.name

              return (
                <label key={field.name} className="block">
                  <span className="mb-2 block text-sm font-medium text-slate-300">{field.label ?? field.name}</span>
                  {field.help && <span className="mb-2 block text-xs leading-5 text-slate-500">{field.help}</span>}
                  {field.type === 'textarea' ? (
                    <textarea
                      value={values[field.name] ?? ''}
                      onChange={(event) => onChange(field.name, event.target.value)}
                      placeholder={inputPlaceholder}
                      rows={5}
                      className={inputClassName + ' resize-y'}
                    />
                  ) : (
                    <input
                      type="text"
                      value={values[field.name] ?? ''}
                      onChange={(event) => onChange(field.name, event.target.value)}
                      placeholder={inputPlaceholder}
                      className={inputClassName}
                    />
                  )}
                </label>
              )
            }) : (
              <p className="rounded-lg border border-dashed border-slate-700 px-4 py-6 text-center text-sm text-slate-400">
                Esta prompt no utiliza inputs reutilizables.
              </p>
            )}
          </div>

          <footer className="flex justify-end border-t border-slate-800 px-5 py-4 sm:px-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Listo
            </button>
          </footer>
        </div>
      </div>
    </div>
  )
}

export default PromptFieldsDialog