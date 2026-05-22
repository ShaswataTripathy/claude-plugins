#!/usr/bin/env node
import { readFileSync, statSync, existsSync } from 'fs';
import { join, resolve, extname } from 'path';
import { homedir } from 'os';

const input = JSON.parse(readFileSync(0, 'utf8'));
const filePath = input?.tool_input?.file_path ?? input?.tool_input?.path ?? '';

if (!filePath) process.exit(0);

const abs = resolve(filePath);
const isContextFile =
  abs.endsWith('CLAUDE.md') ||
  abs.includes(`${join('.claude', 'commands')}`) ||
  abs.includes(`${join('.claude', 'skills')}`) ||
  abs.includes(`${join('.claude', 'memory')}`);

if (!isContextFile) process.exit(0);

// Give the write a moment to land before we stat it
if (!existsSync(abs)) process.exit(0);

const lines = readFileSync(abs, 'utf8').split('\n').length;
const bytes = statSync(abs).size;
const kb = (bytes / 1024).toFixed(1);

// Every line in CLAUDE.md costs tokens on every single message.
// 200 lines is roughly the threshold where Claude starts losing track of later instructions.
if (lines > 250) {
  process.stderr.write(
    `\n  context-doctor: ${abs.split(/[/\\]/).pop()} is ${lines} lines (${kb}KB).\n` +
    `  Instructions past line 200 are often ignored. Run /context-doctor to prune it.\n\n`
  );
} else if (lines > 150) {
  process.stderr.write(
    `\n  context-doctor: ${abs.split(/[/\\]/).pop()} is ${lines} lines — getting large.\n` +
    `  Consider moving rarely-used instructions into skills.\n\n`
  );
}

process.exit(0);
