import { app, BrowserWindow, ipcMain } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import started from 'electron-squirrel-startup'

import { parsePromptMarkdown } from './utils/prompts'

if (started) {
  app.quit()
}

const getPromptsPath = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, 'PROMPTS.md')
    : path.join(app.getAppPath(), 'PROMPTS.md')

ipcMain.handle('prompts:load', async () => {
  const markdown = await fs.readFile(getPromptsPath(), 'utf8')
  return parsePromptMarkdown(markdown)
})

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
