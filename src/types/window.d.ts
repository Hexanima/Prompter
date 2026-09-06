import type { PromptDocument } from '../utils/prompts'

declare global {
  interface Window {
    prompter: {
      loadPrompts: () => Promise<PromptDocument>
      openPromptsFile: () => Promise<void>
      savePrompts: (document: PromptDocument) => Promise<void>
    }
  }
}

export {}

