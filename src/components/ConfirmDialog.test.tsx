/* @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

afterEach(cleanup)

import ConfirmDialog from './ConfirmDialog'

describe('ConfirmDialog', () => {
  it('renderiza el diálogo fuera del contenedor scrolleable', () => {
    const container = document.createElement('div')
    document.body.appendChild(container)

    render(
      <div data-testid="scroll-container">
        <ConfirmDialog
          open
          title="Eliminar input"
          message="Confirmación"
          onCancel={() => {}}
          onConfirm={() => {}}
        />
      </div>,
      { container }
    )

    try {
      expect(screen.getByRole('dialog').parentElement).toBe(document.body)
    } finally {
      cleanup()
      container.remove()
    }
  })
  it('solo confirma la eliminación cuando se pulsa confirmar', () => {
    let confirmCount = 0
    let cancelCount = 0

    render(
      <ConfirmDialog
        open
        title="Eliminar prompt"
        message="¿Querés eliminar Auditar tareas?"
        onCancel={() => { cancelCount += 1 }}
        onConfirm={() => { confirmCount += 1 }}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(cancelCount).toBe(1)
    expect(confirmCount).toBe(0)

    fireEvent.click(screen.getByRole('button', { name: 'Eliminar prompt' }))
    expect(confirmCount).toBe(1)
  })
})
