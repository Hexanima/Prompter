import { describe, expect, it } from 'vitest'

import { focusField } from './focus-field'
import { scrollToElement } from './scroll-to-element'
import { toggleId } from './toggle-id'
import { ensureEditablePromptsFile, getPromptPaths } from './prompts-storage'
import { getPrompterApi } from './renderer-api'
import { duplicatePrompt, getPromptFieldNames, getPromptFields, getPromptFieldUsageCount, getPromptSegments, isPromptFieldMetadataIncomplete, isPromptMetadataIncomplete, getMissingPromptFieldCount, movePrompt, parsePromptMarkdown, removePrompt, resolvePrompt, serializePromptMarkdown } from './prompts'
import { insertPromptField, normalizePromptFieldName, validatePromptFieldName } from './prompt-editor'

describe('parsePromptMarkdown', () => {
  it('separa prompts y detecta cada campo una sola vez', () => {
    const result = parsePromptMarkdown(`Primera {{NOMBRE}}
---
Segunda {{NOMBRE}} y {{FECHA}}
---
`)

    expect(result.prompts).toEqual([
      { id: 0, title: 'Prompt 1', content: 'Primera {{NOMBRE}}' },
      {
        id: 1,
        title: 'Prompt 2',
        content: 'Segunda {{NOMBRE}} y {{FECHA}}'
      }
    ])
    expect(result.fields).toEqual([
      { name: 'NOMBRE', value: '' },
      { name: 'FECHA', value: '' }
    ])
  })

  it('ignora separadores vacíos y conserva placeholders no válidos como texto', () => {
    const result = parsePromptMarkdown(`
---
  {{VALIDO_1}} y {{ con espacios }} y {{}}
---
`)

    expect(result.prompts).toEqual([
      {
        id: 0,
        title: 'Prompt 1',
        content: '{{VALIDO_1}} y {{ con espacios }} y {{}}'
      }
    ])
    expect(result.fields).toEqual([{ name: 'VALIDO_1', value: '' }])
  })
})

describe('resolvePrompt', () => {
  it('reemplaza todos los campos compartidos y conserva los valores faltantes', () => {
    expect(
      resolvePrompt('Hola {{NOMBRE}}. Tarea: {{TAREA}}. Otra vez: {{NOMBRE}}.', {
        NOMBRE: 'Nicol'
      })
    ).toBe('Hola Nicol. Tarea: {{TAREA}}. Otra vez: Nicol.')
  })
})

describe('getPrompterApi', () => {
  it('devuelve null cuando el renderer no tiene el preload de Electron', () => {
    expect(getPrompterApi({} as Window)).toBeNull()
  })
})

describe('incomplete prompt fields', () => {
  it('conserva y marca en rojo los placeholders sin valor', () => {
    expect(getPromptSegments('Hola {{NOMBRE}} - {{TAREA}}', { NOMBRE: '', TAREA: 'Auditar' })).toEqual([
      { type: 'text', value: 'Hola ' },
      { type: 'field', name: 'NOMBRE', value: '{{NOMBRE}}', missing: true },
      { type: 'text', value: ' - ' },
      { type: 'field', name: 'TAREA', value: 'Auditar', missing: false }
    ])
  })

  it('considera incompleto un valor compuesto solo por espacios', () => {
    expect(resolvePrompt('Campo: {{NOMBRE}}', { NOMBRE: '   ' })).toBe('Campo: {{NOMBRE}}')
  })
})


describe('focusField', () => {
  it('enfoca el input y hace scroll suave hacia el centro', () => {
    let focused = false
    let scrollOptions: ScrollIntoViewOptions | undefined
    const input = {
      focus: () => {
        focused = true
      },
      scrollIntoView: (options?: ScrollIntoViewOptions) => {
        scrollOptions = options
      }
    } as unknown as HTMLElement

    focusField(input)

    expect(focused).toBe(true)
    expect(scrollOptions).toEqual({ behavior: 'smooth', block: 'center' })
  })
})

describe('prompt metadata', () => {
  it('lee títulos, descripciones y metadata de un input reutilizado', () => {
    const result = parsePromptMarkdown(`<!--
@field NOMBRE
label: Nombre visible
help: Se reutiliza en todas las apariciones.
placeholder: Ejemplo: Equipo de producto
type: text
default: Equipo base
-->

<!--
@prompt
title: Auditar tareas
description: Revisa una tarea contra sus criterios.
-->
Hola {{NOMBRE}} y {{NOMBRE}}
---
<!--
@prompt
title: Preparar plan
description: Genera un plan técnico.
-->
Plan para {{NOMBRE}}
`)

    expect(result.prompts).toEqual([
      {
        id: 0,
        title: 'Auditar tareas',
        description: 'Revisa una tarea contra sus criterios.',
        content: 'Hola {{NOMBRE}} y {{NOMBRE}}'
      },
      {
        id: 1,
        title: 'Preparar plan',
        description: 'Genera un plan técnico.',
        content: 'Plan para {{NOMBRE}}'
      }
    ])
    expect(result.fields).toEqual([
      {
        name: 'NOMBRE',
        value: 'Equipo base',
        label: 'Nombre visible',
        help: 'Se reutiliza en todas las apariciones.',
        placeholder: 'Ejemplo: Equipo de producto',
        type: 'text'
      }
    ])
  })
})

describe('prompts storage', () => {
  const paths = getPromptPaths({
    isPackaged: true,
    appPath: 'project',
    userDataPath: 'user-data',
    resourcesPath: 'resources'
  })

  it('copia la plantilla al userData cuando todavía no existe', async () => {
    const files = new Set([paths.bundledPath])
    const copiedFiles: Array<{ source: string; destination: string }> = []
    const fileSystem = {
      access: async (filePath: string) => {
        if (!files.has(filePath)) throw new Error('missing')
      },
      mkdir: async () => undefined,
      copyFile: async (source: string, destination: string) => {
        files.add(destination)
        copiedFiles.push({ source, destination })
      }
    }

    const result = await ensureEditablePromptsFile(paths, fileSystem)

    expect(result).toBe(paths.editablePath)
    expect(copiedFiles).toEqual([{ source: paths.bundledPath, destination: paths.editablePath }])
  })

  it('preserva la copia personalizada en ejecuciones posteriores', async () => {
    const files = new Set([paths.bundledPath, paths.editablePath])
    let copyCount = 0
    const fileSystem = {
      access: async (filePath: string) => {
        if (!files.has(filePath)) throw new Error('missing')
      },
      mkdir: async () => undefined,
      copyFile: async () => {
        copyCount += 1
      }
    }

    await ensureEditablePromptsFile(paths, fileSystem)

    expect(copyCount).toBe(0)
  })
})

describe('prompt navigation', () => {
  it('hace scroll suave al inicio del prompt seleccionado', () => {
    let scrollOptions: ScrollIntoViewOptions | undefined
    const prompt = {
      scrollIntoView: (options?: ScrollIntoViewOptions) => {
        scrollOptions = options
      }
    } as unknown as HTMLElement

    scrollToElement(prompt)

    expect(scrollOptions).toEqual({ behavior: 'smooth', block: 'start' })
  })
})

describe('collapsible prompts', () => {
  it('agrega y quita el prompt del conjunto colapsado', () => {
    const collapsed = toggleId(new Set<number>(), 2)

    expect(collapsed.has(2)).toBe(true)
    expect(toggleId(collapsed, 2).has(2)).toBe(false)
  })
})

describe('prompt file actions', () => {
  it('requiere las acciones de cargar y abrir el archivo en el preload', () => {
    const target = {
      prompter: {
        loadPrompts: () => Promise.resolve(null)
      }
    } as unknown as Window

    expect(getPrompterApi(target)).toBeNull()
  })
})

describe('prompt editing', () => {
  const prompts = [
    { id: 0, title: 'Primera', content: 'Contenido {{NOMBRE}}' },
    { id: 1, title: 'Segunda', description: 'Descripción', content: 'Otro contenido' }
  ]

  it('serializa el documento editable y permite volver a leerlo', () => {
    const document = {
      prompts,
      fields: [{ name: 'NOMBRE', value: '', label: 'Nombre', type: 'text' as const }]
    }

    const markdown = serializePromptMarkdown(document)

    expect(parsePromptMarkdown(markdown)).toEqual(document)
  })

  it('duplica una prompt y conserva el contenido', () => {
    const result = duplicatePrompt(prompts, 0)

    expect(result[1]).toEqual({ id: 1, title: 'Primera — copia', content: 'Contenido {{NOMBRE}}' })
  })

  it('elimina una prompt y reindexa las restantes', () => {
    expect(removePrompt(prompts, 0)).toEqual([
      { id: 0, title: 'Segunda', description: 'Descripción', content: 'Otro contenido' }
    ])
  })

  it('mueve una prompt y mantiene el orden de ids', () => {
    expect(movePrompt(prompts, 1, -1).map(({ title, id }) => ({ title, id }))).toEqual([
      { title: 'Segunda', id: 0 },
      { title: 'Primera', id: 1 }
    ])
  })
})

describe('prompt saving', () => {
  it('requiere la acción de guardar el documento en el preload', () => {
    const target = {
      prompter: {
        loadPrompts: () => Promise.resolve(null),
        openPromptsFile: () => Promise.resolve()
      }
    } as unknown as Window

    expect(getPrompterApi(target)).toBeNull()
  })
})

describe('unused prompt fields', () => {
  it('conserva la definición de un campo aunque ninguna prompt lo use', () => {
    const result = parsePromptMarkdown(`<!--
@field PROYECTO
label: Proyecto
help: Se puede reutilizar más adelante.
type: text
-->
Prompt sin campos
`)

    expect(result.fields).toEqual([
      {
        name: 'PROYECTO',
        value: '',
        label: 'Proyecto',
        help: 'Se puede reutilizar más adelante.',
        type: 'text'
      }
    ])
  })
})

describe('prompt editor fields', () => {
  it('normaliza los nombres de inputs nuevos', () => {
    expect(normalizePromptFieldName('  proyecto actual  ')).toBe('PROYECTO_ACTUAL')
  })

  it('rechaza nombres inválidos y duplicados', () => {
    expect(validatePromptFieldName('con espacios', [])).toBe('El nombre solo puede usar letras, números y guiones bajos.')
    expect(validatePromptFieldName('PROYECTO', [{ name: 'proyecto', value: '' }])).toBe('Ya existe un input con ese nombre.')
  })

  it('inserta un placeholder en la posición del cursor', () => {
    expect(insertPromptField('Hola mundo', 'PROYECTO', 5, 10)).toEqual({
      content: 'Hola {{PROYECTO}}',
      cursor: 17
    })
  })
})

describe('prompt field modal', () => {
  it('obtiene una sola vez los inputs usados por una prompt', () => {
    const fields = getPromptFields('Hola {{NOMBRE}} {{NOMBRE}} {{TAREA}}', [
      { name: 'NOMBRE', value: 'Nicol', label: 'Nombre' },
      { name: 'TAREA', value: '', label: 'Tarea' },
      { name: 'OTRO', value: '', label: 'Otro' }
    ])

    expect(getPromptFieldNames('Hola {{NOMBRE}} {{NOMBRE}} {{TAREA}}')).toEqual(['NOMBRE', 'TAREA'])
    expect(fields).toEqual([
      { name: 'NOMBRE', value: 'Nicol', label: 'Nombre' },
      { name: 'TAREA', value: '', label: 'Tarea' }
    ])
  })

  it('cuenta campos faltantes sin contar dos veces un input repetido', () => {
    expect(getMissingPromptFieldCount('Hola {{NOMBRE}} {{NOMBRE}} {{TAREA}}', { NOMBRE: '', TAREA: 'Auditar' })).toBe(1)
  })

  it('cuenta en cuántas prompts se utiliza un input compartido', () => {
    expect(getPromptFieldUsageCount('NOMBRE', [
      { id: 0, title: 'Primera', content: '{{NOMBRE}} y {{NOMBRE}}' },
      { id: 1, title: 'Segunda', content: 'Sin ese campo' },
      { id: 2, title: 'Tercera', content: 'Otra vez {{NOMBRE}}' }
    ])).toBe(2)
  })
})
describe('metadata incompleta', () => {
  it('detecta prompts con título automático y sin descripción', () => {
    expect(isPromptMetadataIncomplete({ id: 0, title: 'Prompt 1', content: 'Contenido' })).toBe(true)
    expect(isPromptMetadataIncomplete({ id: 0, title: 'Auditar tareas', content: 'Contenido' })).toBe(false)
    expect(isPromptMetadataIncomplete({ id: 0, title: 'Prompt 1', description: 'Información', content: 'Contenido' })).toBe(false)
  })

  it('detecta inputs sin metadata visible', () => {
    expect(isPromptFieldMetadataIncomplete({ name: 'PROYECTO', value: '' })).toBe(true)
    expect(isPromptFieldMetadataIncomplete({ name: 'PROYECTO', value: '', label: 'Proyecto' })).toBe(false)
  })
})