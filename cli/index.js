#!/usr/bin/env node
import { program } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { fetchRegistry, searchPlugins, getPlugin } from './registry.js';
import { installPlugin, uninstallPlugin } from './installer.js';
import { readPluginState } from './utils.js';

const pkg = JSON.parse(
  (await import('fs')).readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);

program
  .name('claude-code-guard')
  .description('Community plugin manager for Claude Code CLI')
  .version(pkg.version);

// ── install ──────────────────────────────────────────────────────────────────
program
  .command('install <name>')
  .description('Install a plugin from the registry')
  .option('-p, --project', 'Install into project scope (.claude/) instead of global (~/.claude/)')
  .action(async (name, opts) => {
    const scope = opts.project ? 'project' : 'global';
    const spinner = ora(`Installing ${chalk.cyan(name)}...`).start();
    try {
      const meta = await getPlugin(name);
      const record = await installPlugin(meta, scope);
      spinner.succeed(
        chalk.green(`Installed ${chalk.bold(name)} v${record.version}`) +
          chalk.gray(` (${scope})`)
      );
      if (meta.postInstall) {
        console.log(chalk.yellow('\n  Note: ') + meta.postInstall);
      }
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
      process.exit(1);
    }
  });

// ── uninstall ─────────────────────────────────────────────────────────────────
program
  .command('uninstall <name>')
  .description('Remove an installed plugin')
  .action(async (name) => {
    const spinner = ora(`Removing ${chalk.cyan(name)}...`).start();
    try {
      uninstallPlugin(name);
      spinner.succeed(chalk.green(`Removed ${chalk.bold(name)}`));
    } catch (err) {
      spinner.fail(chalk.red(`Failed: ${err.message}`));
      process.exit(1);
    }
  });

// ── list ──────────────────────────────────────────────────────────────────────
program
  .command('list')
  .description('List installed plugins')
  .action(() => {
    const state = readPluginState();
    const plugins = Object.values(state);
    if (plugins.length === 0) {
      console.log(chalk.gray('No plugins installed. Run `claude-code-guard search` to browse.'));
      return;
    }
    console.log(chalk.bold('\n  Installed plugins:\n'));
    for (const p of plugins) {
      const date = new Date(p.installedAt).toLocaleDateString();
      console.log(
        `  ${chalk.cyan(p.name.padEnd(22))} ${chalk.white('v' + p.version)}  ${chalk.gray(p.scope + ' · ' + date)}`
      );
    }
    console.log();
  });

// ── search ────────────────────────────────────────────────────────────────────
program
  .command('search [query]')
  .description('Search the plugin registry')
  .action(async (query) => {
    const spinner = ora('Fetching registry...').start();
    try {
      const results = await searchPlugins(query);
      spinner.stop();
      const state = readPluginState();

      if (results.length === 0) {
        console.log(chalk.gray(`No plugins found for "${query}".`));
        return;
      }

      console.log(chalk.bold(`\n  ${results.length} plugin(s) available:\n`));
      for (const p of results) {
        const installed = state[p.name] ? chalk.green(' ✓ installed') : '';
        console.log(`  ${chalk.cyan(p.name.padEnd(22))} ${chalk.white(p.description)}${installed}`);
        if (p.tags?.length) {
          console.log(`  ${''.padEnd(22)} ${chalk.gray(p.tags.join(', '))}`);
        }
        console.log();
      }
    } catch (err) {
      spinner.fail(chalk.red(err.message));
      process.exit(1);
    }
  });

// ── info ──────────────────────────────────────────────────────────────────────
program
  .command('info <name>')
  .description('Show details about a plugin')
  .action(async (name) => {
    try {
      const plugin = await getPlugin(name);
      const state = readPluginState();
      const installed = state[name];

      console.log(`\n  ${chalk.bold(plugin.name)}  ${chalk.gray('v' + plugin.version)}`);
      console.log(`  ${plugin.description}\n`);
      console.log(`  Author:     ${plugin.author}`);
      console.log(`  Components: ${plugin.components?.join(', ') || 'skill'}`);
      if (plugin.tags?.length) console.log(`  Tags:       ${plugin.tags.join(', ')}`);
      if (installed) {
        console.log(chalk.green(`\n  Installed at: ${new Date(installed.installedAt).toLocaleString()}`));
      } else {
        console.log(chalk.gray(`\n  Not installed. Run: claude-code-guard install ${name}`));
      }
      console.log();
    } catch (err) {
      console.error(chalk.red(err.message));
      process.exit(1);
    }
  });

// ── update ────────────────────────────────────────────────────────────────────
program
  .command('update [name]')
  .description('Update one or all installed plugins')
  .action(async (name) => {
    const state = readPluginState();
    const targets = name ? [name] : Object.keys(state);

    if (targets.length === 0) {
      console.log(chalk.gray('Nothing to update.'));
      return;
    }

    for (const n of targets) {
      const spinner = ora(`Updating ${chalk.cyan(n)}...`).start();
      try {
        uninstallPlugin(n);
        const meta = await getPlugin(n);
        const record = await installPlugin(meta, state[n]?.scope || 'global');
        spinner.succeed(chalk.green(`Updated ${chalk.bold(n)} → v${record.version}`));
      } catch (err) {
        spinner.fail(chalk.red(`${n}: ${err.message}`));
      }
    }
  });

program.parse();
