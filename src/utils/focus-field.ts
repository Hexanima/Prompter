export function focusField(input: HTMLElement): void {
  input.focus()
  input.scrollIntoView({ behavior: 'smooth', block: 'center' })
}
