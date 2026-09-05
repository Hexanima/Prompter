import { contextBridge, ipcRenderer } from 'electron'
import type { PromptDocument } from './utils/prompts'

contextBridge.exposeInMainWorld('prompter', {
  loadPrompts: (): Promise<PromptDocument> => ipcRenderer.invoke('prompts:load')
})
