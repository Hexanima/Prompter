import { describe, expect, it } from 'vitest'

import { focusField } from './focus-field'
import { getPrompterApi } from './renderer-api'
import { getPromptSegments, parsePromptMarkdown, resolvePrompt } from './prompts'

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
