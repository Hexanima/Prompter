/* @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

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
})
