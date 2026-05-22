import { spawn } from 'child_process';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function hook(hookPath, input, opts = {}) {
  return new Promise((resolve) => {
    const proc = spawn('node', [hookPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: opts.cwd ?? process.cwd(),
      env: { ...process.env, ...(opts.env ?? {}) },
    });

    let stderr = '';
    proc.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    proc.on('close', (code) => resolve({ code, stderr: stderr.trim() }));
    proc.stdin.write(JSON.stringify(input));
    proc.stdin.end();
  });
}

export function tempDir(files = {}) {
  const dir = join(tmpdir(), `cp-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  mkdirSync(dir, { recursive: true });

  for (const [rel, content] of Object.entries(files)) {
    const dest = join(dir, rel);
    mkdirSync(join(dest, '..'), { recursive: true });
    writeFileSync(dest, content, 'utf8');
  }

  return {
    path: dir,
    cleanup: () => { if (existsSync(dir)) rmSync(dir, { recursive: true, force: true }); },
  };
}

export const bash = (command) => ({ tool_name: 'Bash', tool_input: { command } });
export const write = (file_path, content = '') => ({ tool_name: 'Write', tool_input: { file_path, content } });
export const edit = (file_path, content = '') => ({ tool_name: 'Edit', tool_input: { file_path, content } });
