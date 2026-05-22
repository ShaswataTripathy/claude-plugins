import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getPluginStateDir } from './utils.js';

const REGISTRY_URL =
  'https://raw.githubusercontent.com/ShaswataTripathy/claude-plugins/main/registry.json';

const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour

export async function fetchRegistry() {
  const cachePath = join(getPluginStateDir(), 'registry-cache.json');

  // Use cache if fresh
  if (existsSync(cachePath)) {
    try {
      const cached = JSON.parse(readFileSync(cachePath, 'utf8'));
      if (Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
        return cached.data;
      }
    } catch {
      // fall through to fetch
    }
  }

  try {
    const { default: fetch } = await import('node-fetch');
    const res = await fetch(REGISTRY_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    writeFileSync(cachePath, JSON.stringify({ fetchedAt: Date.now(), data }, null, 2));
    return data;
  } catch {
    // Fallback: use local registry if available (dev mode)
    const localPath = join(process.cwd(), 'registry.json');
    if (existsSync(localPath)) {
      return JSON.parse(readFileSync(localPath, 'utf8'));
    }
    throw new Error('Could not fetch registry. Check your internet connection.');
  }
}

export async function getPlugin(name) {
  const registry = await fetchRegistry();
  const plugin = registry.plugins.find((p) => p.name === name);
  if (!plugin) throw new Error(`Plugin "${name}" not found in registry.`);
  return plugin;
}

export async function searchPlugins(query) {
  const registry = await fetchRegistry();
  if (!query) return registry.plugins;
  const q = query.toLowerCase();
  return registry.plugins.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}
