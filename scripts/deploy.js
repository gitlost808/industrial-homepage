import { readFileSync, readdirSync } from 'node:fs';
import { resolve, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { parse } from 'yaml';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

export function readDeployConfig(source) {
  const config = parse(source);
  if (!config || typeof config !== 'object') throw new Error('deploy.yaml must contain an SFTP destination.');
  if (typeof config.host !== 'string' || !/^[a-z\d][a-z\d._-]*$/i.test(config.host)) throw new Error('deploy.yaml: host must be a hostname, IPv4 address, or SSH alias.');
  if (typeof config.user !== 'string' || !/^[a-z_][a-z\d._-]*$/i.test(config.user)) throw new Error('deploy.yaml: user must be an SSH username.');
  const port = config.port ?? 22;
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('deploy.yaml: port must be an integer from 1 to 65535.');
  if (typeof config.directory !== 'string' || !config.directory.startsWith('/') || /[\x00-\x1f\x7f*?\[\]]/.test(config.directory) || config.directory.split('/').includes('..')) {
    throw new Error('deploy.yaml: directory must be an absolute path without wildcards, parent traversal, or control characters.');
  }
  return { host: config.host, user: config.user, port, directory: config.directory.replace(/\/+$/, '') || '/' };
}

function quotePath(path) {
  if (/[\x00-\x1f\x7f*?\[\]]/.test(path)) throw new Error('SFTP paths must not contain control characters or wildcards.');
  return `"${path.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

export function createUploadBatch(config, distDirectory) {
  const dist = resolve(distDirectory);
  let entries;
  try {
    entries = readdirSync(dist, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    throw new Error('Production output is missing; build the site first.');
  }
  const index = entries.find(entry => entry.name === 'index.html' && entry.isFile());
  if (!index) throw new Error('Production output must contain a regular index.html file.');

  // Refuse symlinks anywhere in the upload tree, including inside asset folders.
  function checkEntry(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      quotePath(entry.name);
      if (entry.isSymbolicLink()) throw new Error('Production output must not contain symbolic links.');
      if (entry.isDirectory()) checkEntry(resolve(path, entry.name));
      else if (!entry.isFile()) throw new Error('Production output contains an unsupported file type.');
    }
  }
  checkEntry(dist);

  const commands = [];
  for (const entry of entries) {
    if (entry.name === 'index.html') continue;
    const local = quotePath(resolve(dist, entry.name));
    if (entry.isDirectory()) {
      commands.push(`put -r ${local} ${quotePath(config.directory === '/' ? '/' : `${config.directory}/`)}`);
    } else {
      commands.push(`put ${local} ${quotePath(posix.join(config.directory, entry.name))}`);
    }
  }
  const stagedIndex = posix.join(config.directory, `.index-${randomUUID()}.html`);
  commands.push(`put ${quotePath(resolve(dist, 'index.html'))} ${quotePath(stagedIndex)}`);
  commands.push(`rename ${quotePath(stagedIndex)} ${quotePath(posix.join(config.directory, 'index.html'))}`);
  return `${commands.join('\n')}\n`;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: projectRoot, stdio: 'inherit', ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed${result.signal ? ` (${result.signal})` : ` with exit code ${result.status}`}; deployment stopped.`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== '--dry-run')) throw new Error('Usage: npm run deploy -- [--dry-run]');
  let source;
  try { source = readFileSync(resolve(projectRoot, 'deploy.yaml'), 'utf8'); }
  catch (error) {
    if (error.code === 'ENOENT') throw new Error('Missing deploy.yaml. Copy deploy.example.yaml to deploy.yaml and set your destination.');
    throw error;
  }
  const config = readDeployConfig(source);
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  run(npm, ['test']);
  run(npm, ['run', 'build']);
  const batch = createUploadBatch(config, resolve(projectRoot, 'dist'));
  const destination = `${config.user}@${config.host}`;
  if (args.includes('--dry-run')) {
    console.log(`Dry run: ${destination}:${config.port}${config.directory}\n${batch}No SFTP connection was made.`);
    return;
  }
  console.log(`Uploading to ${destination}:${config.port}${config.directory}`);
  run('sftp', [
    '-oBatchMode=yes', '-oStrictHostKeyChecking=yes', '-oConnectTimeout=15',
    '-P', String(config.port), '-b', '-', destination,
  ], { input: batch, stdio: ['pipe', 'inherit', 'inherit'] });
  console.log('Deployment complete.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
