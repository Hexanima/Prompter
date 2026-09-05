export function scrollToElement(element: HTMLElement): void {
  element.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
