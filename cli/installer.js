import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import { join, basename } from 'path';
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
  'https://raw.githubusercontent.com/ShaswataTripathy/claude-plugins/main/plugins';

async function fetchText(url) {
  const { default: fetch } = await import('node-fetch');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const text = await fetchText(url);
  return JSON.parse(text);
}

// Install skill files (.md) into ~/.claude/commands/<plugin-name>/
async function installSkills(pluginName, skillFiles, scope) {
  const dir = join(getCommandsDir(scope), pluginName);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

  const installed = [];
  for (const file of skillFiles) {
    const url = `${BASE_RAW_URL}/${pluginName}/skills/${file}`;
    const content = await fetchText(url);
    const dest = join(dir, file);
    writeFileSync(dest, content, 'utf8');
    installed.push(dest);
  }
  return installed;
}

// Patch hooks into settings.json
function installHooks(pluginName, hooks, scope) {
  const settings = readSettings(scope);
  if (!settings.hooks) settings.hooks = {};

  const tagged = [];
  for (const [event, entries] of Object.entries(hooks)) {
    if (!settings.hooks[event]) settings.hooks[event] = [];
    for (const entry of entries) {
      const taggedEntry = { ...entry, _plugin: pluginName };
      settings.hooks[event].push(taggedEntry);
      tagged.push({ event, entry: taggedEntry });
    }
  }

  writeSettings(settings, scope);
  return tagged;
}

// Patch MCP servers into settings.json
function installMcp(pluginName, mcpServers, scope) {
  const settings = readSettings(scope);
  if (!settings.mcpServers) settings.mcpServers = {};

  for (const [key, value] of Object.entries(mcpServers)) {
    settings.mcpServers[key] = { ...value, _plugin: pluginName };
  }

  writeSettings(settings, scope);
  return Object.keys(mcpServers);
}

export async function installPlugin(pluginMeta, scope = 'global') {
  const { name } = pluginMeta;

  // Fetch full manifest from repo
  let manifest;
  try {
    manifest = await fetchJson(`${BASE_RAW_URL}/${name}/plugin.json`);
  } catch {
    // Dev/local fallback
    const localPath = join(process.cwd(), 'plugins', name, 'plugin.json');
    if (existsSync(localPath)) {
      manifest = JSON.parse(readFileSync(localPath, 'utf8'));
    } else {
      throw new Error(`Could not fetch manifest for "${name}"`);
    }
  }

  const record = { name, version: manifest.version, scope, installedAt: Date.now(), files: [] };

  if (manifest.skills?.length) {
    const files = await installSkills(name, manifest.skills, scope);
    record.files.push(...files);
  }

  if (manifest.hooks) {
    installHooks(name, manifest.hooks, scope);
  }

  if (manifest.mcpServers) {
    installMcp(name, manifest.mcpServers, scope);
  }

  // Save install record
  const state = readPluginState();
  state[name] = record;
  writePluginState(state);

  return record;
}

export function uninstallPlugin(name) {
  const state = readPluginState();
  const record = state[name];
  if (!record) throw new Error(`Plugin "${name}" is not installed.`);

  // Remove skill files
  for (const file of record.files || []) {
    if (existsSync(file)) rmSync(file);
  }
  // Remove skill dir if empty
  const skillDir = join(getCommandsDir(record.scope || 'global'), name);
  if (existsSync(skillDir)) {
    try { rmSync(skillDir, { recursive: true }); } catch { /* non-fatal */ }
  }

  // Remove hooks from settings
  const settings = readSettings(record.scope || 'global');
  if (settings.hooks) {
    for (const event of Object.keys(settings.hooks)) {
      settings.hooks[event] = settings.hooks[event].filter((h) => h._plugin !== name);
    }
    writeSettings(settings, record.scope || 'global');
  }

  // Remove MCP servers
  if (settings.mcpServers) {
    for (const key of Object.keys(settings.mcpServers)) {
      if (settings.mcpServers[key]._plugin === name) {
        delete settings.mcpServers[key];
      }
    }
    writeSettings(settings, record.scope || 'global');
  }

  delete state[name];
  writePluginState(state);
}
