import * as fs from 'fs';
import * as path from 'path';

/**
 * Path-traversal regression guard for the main process. All import/export/db
 * file locations come from Electron's native file dialogs (which the OS
 * constrains) or from `path.join(documentsDir(), <constant filename>)`. This
 * test asserts the code never builds a filesystem path by blindly string-
 * concatenating an untrusted fragment (e.g. an event field or filename) into a
 * base directory, which is how `../../etc/passwd`-style escapes slip in.
 */
describe('main-process filesystem paths are not built from untrusted concatenation', () => {
  const read = (rel: string) =>
    fs.readFileSync(path.join(__dirname, '..', 'src', 'main', rel), 'utf-8');

  const ipc = read('ipc-handlers.ts');
  const index = read('index.ts');

  it('uses path.join for all constructed default paths', () => {
    // Default save/open paths are composed with path.join + a literal filename.
    expect(ipc).toMatch(/path\.join\(documentsDir\(\)/);
    expect(index).toMatch(/path\.join\(/);
  });

  it('never concatenates a directory with a raw "+" into an fs path', () => {
    // Catch patterns like  fs.writeFileSync(dir + userValue, ...)  or
    // path building via string addition of untrusted fragments.
    const forbidden = /(documentsDir\(\)|resourcesPath|__dirname)\s*\+/;
    expect(forbidden.test(ipc)).toBe(false);
    expect(forbidden.test(index)).toBe(false);
  });

  it('writes exports only to dialog-provided file paths', () => {
    // Every fs.writeFileSync in the IPC layer targets result.filePath returned
    // by dialog.showSaveDialog, not an interpolated/user-derived string.
    const writes = ipc.match(/fs\.writeFileSync\(([^,]+),/g) ?? [];
    expect(writes.length).toBeGreaterThan(0);
    for (const w of writes) {
      expect(w).toMatch(/result\.filePath/);
    }
  });

  it('reads imports only from dialog-provided file paths', () => {
    const reads = ipc.match(/fs\.readFileSync\(([^,)]+)/g) ?? [];
    for (const r of reads) {
      expect(r).toMatch(/filePath/);
    }
  });
});
