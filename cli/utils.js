import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export function getClaudeDir(scope = 'global') {
  if (scope === 'project') return join(process.cwd(), '.claude');
  return join(homedir(), '.claude');
}

export function getCommandsDir(scope = 'global') {
  return join(getClaudeDir(scope), 'commands');
}

export function getSettingsPath(scope = 'global') {
  return join(getClaudeDir(scope), 'settings.json');
}

export function readSettings(scope = 'global') {
  const path = getSettingsPath(scope);
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

export function writeSettings(settings, scope = 'global') {
  const dir = getClaudeDir(scope);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  writeFileSync(getSettingsPath(scope), JSON.stringify(settings, null, 2), 'utf8');
}

export function getPluginStateDir() {
  const dir = join(getClaudeDir('global'), 'plugins');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

export function readPluginState() {
  const path = join(getPluginStateDir(), 'installed.json');
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
}

export function writePluginState(state) {
  const path = join(getPluginStateDir(), 'installed.json');
  writeFileSync(path, JSON.stringify(state, null, 2), 'utf8');
}
