/* @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)

import FieldsManagerDialog from './FieldsManagerDialog'

describe('FieldsManagerDialog', () => {
  it('muestra los títulos de las prompts que bloquean la eliminación de un input', () => {
    render(
      <FieldsManagerDialog
        initialFields={[{ name: 'PROYECTO', value: '', label: 'Proyecto' }]}
        prompts={[
          { id: 0, title: 'Auditar tareas', content: '{{PROYECTO}}' },
          { id: 1, title: 'Preparar plan', content: 'Plan para {{PROYECTO}}' }
        ]}
        isSaving={false}
        error={null}
        onCancel={() => {}}
        onSave={() => {}}
      />
    )

    expect(screen.getByRole('tooltip').textContent).toContain('No se puede eliminar porque se usa en estas prompts:')
    expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Auditar tareas', 'Preparar plan'])
  })

  it('renderiza el editor de metadata fuera del contenedor scrolleable', () => {
    render(
      <FieldsManagerDialog
        initialFields={[{ name: 'PROYECTO', value: '', label: 'Proyecto' }]}
        prompts={[]}
        isSaving={false}
        error={null}
        onCancel={() => {}}
        onSave={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))

    const editor = screen.getByRole('dialog', { name: 'Editar input' })
    expect(editor.parentElement).toBe(document.body)
    expect(editor.className).toContain('fixed')
  })

  it('abre el editor del input al hacer clic en completar información', () => {
    render(
      <FieldsManagerDialog
        initialFields={[{ name: 'PROYECTO', value: '' }]}
        prompts={[]}
        isSaving={false}
        error={null}
        onCancel={() => {}}
        onSave={() => {}}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Completar información' }))

    expect(screen.getByRole('dialog', { name: 'Editar input' })).toBeTruthy()
  })})
