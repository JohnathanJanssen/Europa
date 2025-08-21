export type RenameResult = {
  ok: boolean;
  reason?: string;
  path?: string;
  newPath?: string;
};

export async function renameFile(path: string, newName: string): Promise<RenameResult> {
  console.warn('[preview-stub] renameFile called', { path, newName });
  // Preview lacks the real backend. Pretend success and let UI continue.
  return { ok: true, path, newPath: newName };
}

// Future stubs can live here too if other globals show up (listFiles, deleteFile, etc.)