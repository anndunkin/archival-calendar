import * as fs from 'fs';
import * as path from 'path';

/**
 * Electron hardening regression guard. The main-process BrowserWindow must keep
 * its security boundary intact so a future edit can't silently re-enable
 * remote-code-execution vectors. We parse the source rather than launch Electron
 * (unavailable in the Jest node env) and assert the webPreferences flags.
 */
describe('BrowserWindow webPreferences hardening', () => {
  const source = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'main', 'index.ts'),
    'utf-8'
  );

  it('keeps contextIsolation enabled', () => {
    expect(source).toMatch(/contextIsolation:\s*true/);
    expect(source).not.toMatch(/contextIsolation:\s*false/);
  });

  it('keeps nodeIntegration disabled', () => {
    expect(source).toMatch(/nodeIntegration:\s*false/);
    expect(source).not.toMatch(/nodeIntegration:\s*true/);
  });

  it('keeps the renderer sandbox enabled', () => {
    expect(source).toMatch(/sandbox:\s*true/);
    expect(source).not.toMatch(/sandbox:\s*false/);
  });

  it('loads the renderer from a local file, not a remote URL', () => {
    expect(source).toMatch(/loadFile\(/);
    expect(source).not.toMatch(/loadURL\(\s*['"`]https?:/);
  });
});
