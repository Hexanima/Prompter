import path from 'node:path'

export interface PromptPaths {
  bundledPath: string
  editablePath: string
}

export interface PromptPathOptions {
  isPackaged: boolean
  appPath: string
  resourcesPath: string
  userDataPath: string
}

export interface PromptsFileSystem {
  access(filePath: string): Promise<void>
  mkdir(directoryPath: string, options: { recursive: boolean }): Promise<void>
  copyFile(source: string, destination: string): Promise<void>
}

export function getPromptPaths(options: PromptPathOptions): PromptPaths {
  const bundledRoot = options.isPackaged ? options.resourcesPath : options.appPath
  const bundledPath = path.join(bundledRoot, 'PROMPTS.md')
  const editablePath = options.isPackaged
    ? path.join(options.userDataPath, 'PROMPTS.md')
    : bundledPath

  return { bundledPath, editablePath }
}

export async function ensureEditablePromptsFile(
  paths: PromptPaths,
  fileSystem: PromptsFileSystem
): Promise<string> {
  try {
    await fileSystem.access(paths.editablePath)
  } catch {
    await fileSystem.mkdir(path.dirname(paths.editablePath), { recursive: true })
    await fileSystem.copyFile(paths.bundledPath, paths.editablePath)
  }

  return paths.editablePath
}
