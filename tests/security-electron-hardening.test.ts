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

  it('points the sandboxed preload at a CommonJS build, not an ES module', () => {
    // Regression guard for a real incident: Electron's sandboxed preload
    // (sandbox: true, asserted above) cannot load an ES module preload
    // script. Building preload.ts to .mjs alongside an ESM main process
    // silently breaks contextBridge -- window.archivalCalendar never gets
    // exposed, so the renderer throws on mount and the window stays blank
    // with a dead menu. The preload path here must stay '.js' even though
    // the main entry point itself is legitimately ESM ('.mjs').
    expect(source).toMatch(/preload\.js['"`]/);
    expect(source).not.toMatch(/preload\.mjs['"`]/);
  });

  it('builds preload as CommonJS in the webpack main config', () => {
    const webpackConfig = fs.readFileSync(
      path.join(__dirname, '..', 'webpack.main.config.cjs'),
      'utf-8'
    );
    // The preload entry's own output config must not set module:true /
    // outputModule -- only the main-process ('index') entry may be ESM.
    const preloadConfigMatch = webpackConfig.match(
      /preloadConfig\s*=\s*\{[\s\S]*?\n\};/
    );
    expect(preloadConfigMatch).not.toBeNull();
    const preloadConfigSource = preloadConfigMatch![0];
    expect(preloadConfigSource).toMatch(/module:\s*false/);
    expect(preloadConfigSource).not.toMatch(/outputModule/);
  });
});
