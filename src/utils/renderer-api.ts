export function getPrompterApi(target: Window): Window['prompter'] | null {
  const prompter = (target as Window & { prompter?: Window['prompter'] }).prompter
  if (!prompter || typeof prompter.loadPrompts !== 'function' || typeof prompter.openPromptsFile !== 'function') {
    return null
  }

  return prompter
}
