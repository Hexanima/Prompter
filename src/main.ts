import { app, BrowserWindow, ipcMain, shell } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import started from 'electron-squirrel-startup'

import { ensureEditablePromptsFile, getPromptPaths } from './utils/prompts-storage'
import { parsePromptMarkdown } from './utils/prompts'

if (started) {
  app.quit()
}

const getPromptPathsForApp = () =>
  getPromptPaths({
    isPackaged: app.isPackaged,
    appPath: app.getAppPath(),
    resourcesPath: process.resourcesPath,
    userDataPath: app.getPath('userData')
  })

let editablePromptsPath: Promise<string> | undefined

const getEditablePromptsPath = () => {
  editablePromptsPath ??= ensureEditablePromptsFile(getPromptPathsForApp(), {
    access: (filePath) => fs.access(filePath).then(() => undefined),
    mkdir: (directoryPath, options) => fs.mkdir(directoryPath, options).then(() => undefined),
    copyFile: (source, destination) => fs.copyFile(source, destination)
  })
  return editablePromptsPath
}

ipcMain.handle('prompts:load', async () => {
  const markdown = await fs.readFile(await getEditablePromptsPath(), 'utf8')
  return parsePromptMarkdown(markdown)
})

ipcMain.handle('prompts:open', async () => {
  const error = await shell.openPath(await getEditablePromptsPath())
  if (error) {
    throw new Error(error)
  }
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


