import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import {
  readSettings,
  writeSettings,
  getCommandsDir,
  getPluginStateDir,
  readPluginState,
  writePluginState,
} from './utils.js';

const BASE_RAW_URL =
  'https://raw.githubusercontent.com/ShaswataTripathy/claude-plugins/master/plugins';

async function fetchText(url) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  return JSON.parse(await fetchText(url));
}

function getHooksDir(pluginName) {
  const dir = join(getPluginStateDir(), pluginName, 'hooks');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

async function installSkills(pluginName, skillFiles, scope) {
  const dir = join(getCommandsDir(scope), pluginName);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const installed = [];
  for (const file of skillFiles) {
    const content = await fetchText(`${BASE_RAW_URL}/${pluginName}/skills/${file}`);
    const dest = join(dir, file);
    writeFileSync(dest, content, 'utf8');
    installed.push(dest);
  }
  return installed;
}

async function installHookFiles(pluginName, hookFiles) {
  const dir = getHooksDir(pluginName);
  const installed = [];

  for (const file of hookFiles) {
    const content = await fetchText(`${BASE_RAW_URL}/${pluginName}/hooks/${file}`);
    const dest = join(dir, file);
    writeFileSync(dest, content, 'utf8');
    installed.push(dest);
  }
  return installed;
}

// Resolves {plugin_dir} placeholder in hook commands to the actual installed path
function resolveHookCommands(hooks, pluginDir) {
  const resolved = {};
  for (const [event, entries] of Object.entries(hooks)) {
    resolved[event] = entries.map((entry) => ({
      ...entry,
      hooks: entry.hooks?.map((h) => ({
        ...h,
        command: h.command?.replace(/\{plugin_dir\}/g, pluginDir.replace(/\\/g, '/')),
      })),
    }));
  }
  return resolved;
}

function installHooks(pluginName, hooks, pluginDir, scope) {
  const settings = readSettings(scope);
  if (!settings.hooks) settings.hooks = {};

  const resolved = resolveHookCommands(hooks, pluginDir);

  for (const [event, entries] of Object.entries(resolved)) {
    if (!settings.hooks[event]) settings.hooks[event] = [];
    for (const entry of entries) {
      settings.hooks[event].push({ ...entry, _plugin: pluginName });
    }
  }

  writeSettings(settings, scope);
}

function installMcp(pluginName, mcpServers, scope) {
  const settings = readSettings(scope);
  if (!settings.mcpServers) settings.mcpServers = {};
  for (const [key, value] of Object.entries(mcpServers)) {
    settings.mcpServers[key] = { ...value, _plugin: pluginName };
  }
  writeSettings(settings, scope);
}

async function fetchManifest(name) {
  try {
    return await fetchJson(`${BASE_RAW_URL}/${name}/plugin.json`);
  } catch {
    const local = join(process.cwd(), 'plugins', name, 'plugin.json');
    if (existsSync(local)) return JSON.parse(readFileSync(local, 'utf8'));
    throw new Error(`Could not load manifest for "${name}"`);
  }
}

async function fetchHookFilesLocal(pluginName, hookFiles) {
  const dir = getHooksDir(pluginName);
  const installed = [];

  for (const file of hookFiles) {
    const localSrc = join(process.cwd(), 'plugins', pluginName, 'hooks', file);
    if (existsSync(localSrc)) {
      const dest = join(dir, file);
      writeFileSync(dest, readFileSync(localSrc, 'utf8'), 'utf8');
      installed.push(dest);
    }
  }
  return installed;
}

export async function installPlugin(pluginMeta, scope = 'global') {
  const { name } = pluginMeta;
  const manifest = await fetchManifest(name);
  const pluginDir = getHooksDir(name).replace(/[/\\]hooks$/, '');

  const record = { name, version: manifest.version, scope, installedAt: Date.now(), files: [] };

  if (manifest.skills?.length) {
    const files = await installSkills(name, manifest.skills, scope);
    record.files.push(...files);
  }

  if (manifest.hookFiles?.length) {
    let hookFiles;
    try {
      hookFiles = await installHookFiles(name, manifest.hookFiles);
    } catch {
      // fall back to local copy (dev mode)
      hookFiles = await fetchHookFilesLocal(name, manifest.hookFiles);
    }
    record.files.push(...hookFiles);
  }

  if (manifest.hooks) {
    installHooks(name, manifest.hooks, pluginDir, scope);
  }

  if (manifest.mcpServers) {
    installMcp(name, manifest.mcpServers, scope);
  }

  const state = readPluginState();
  state[name] = record;
  writePluginState(state);

  return record;
}

export function uninstallPlugin(name) {
  const state = readPluginState();
  const record = state[name];
  if (!record) throw new Error(`Plugin "${name}" is not installed.`);

  for (const file of record.files || []) {
    if (existsSync(file)) rmSync(file);
  }

  const skillDir = join(getCommandsDir(record.scope || 'global'), name);
  if (existsSync(skillDir)) {
    try { rmSync(skillDir, { recursive: true }); } catch { /* non-fatal */ }
  }

  const hookDir = getHooksDir(name);
  if (existsSync(hookDir)) {
    try { rmSync(hookDir, { recursive: true, force: true }); } catch { /* non-fatal */ }
  }

  const settings = readSettings(record.scope || 'global');
  let settingsDirty = false;

  if (settings.hooks) {
    for (const event of Object.keys(settings.hooks)) {
      settings.hooks[event] = settings.hooks[event].filter((h) => h._plugin !== name);
    }
    settingsDirty = true;
  }

  if (settings.mcpServers) {
    for (const key of Object.keys(settings.mcpServers)) {
      if (settings.mcpServers[key]?._plugin === name) delete settings.mcpServers[key];
    }
    settingsDirty = true;
  }

  if (settingsDirty) writeSettings(settings, record.scope || 'global');

  delete state[name];
  writePluginState(state);
}
