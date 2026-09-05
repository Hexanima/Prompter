import type { PromptDocument } from '../utils/prompts'

declare global {
  interface Window {
    prompter: {
      loadPrompts: () => Promise<PromptDocument>
    }
  }
}

export {}
