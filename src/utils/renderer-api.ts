export function getPrompterApi(target: Window): Window['prompter'] | null {
  return (target as Window & { prompter?: Window['prompter'] }).prompter ?? null
}
