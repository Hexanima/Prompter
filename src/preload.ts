import { contextBridge, ipcRenderer } from 'electron'
import type { PromptDocument } from './utils/prompts'

contextBridge.exposeInMainWorld('prompter', {
  loadPrompts: (): Promise<PromptDocument> => ipcRenderer.invoke('prompts:load'),
  openPromptsFile: (): Promise<void> => ipcRenderer.invoke('prompts:open'),
  savePrompts: (document: PromptDocument): Promise<void> => ipcRenderer.invoke('prompts:save', document)
})

