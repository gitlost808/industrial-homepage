import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readDeployConfig, createUploadBatch } from './deploy.js';

const source = 'host: sftp.example.com\nuser: deploy\ndirectory: /portfolio\n';

test('SFTP config defaults to port 22 and rejects invalid destinations', () => {
  assert.equal(readDeployConfig(source).port, 22);
  for (const extra of ['port: 0', 'port: 65536', 'port: "22"']) {
    assert.throws(() => readDeployConfig(`${source}${extra}\n`), /port/);
  }
  for (const directory of ['relative', '/site/../other', '/site/*', '/site\nrename /a /b']) {
    assert.throws(() => readDeployConfig(`host: sftp.example.com\nuser: deploy\ndirectory: ${JSON.stringify(directory)}\n`), /directory/);
  }
  assert.throws(() => readDeployConfig(source.replace('sftp.example.com', '-bad-host')), /host/);
});

test('all assets upload before a uniquely staged index is switched into place', () => {
  const dist = mkdtempSync(join(tmpdir(), 'homepage deploy '));
  try {
    mkdirSync(join(dist, 'assets'));
    writeFileSync(join(dist, 'assets', 'app.js'), '');
    writeFileSync(join(dist, 'index.html'), '<html></html>');
    writeFileSync(join(dist, 'a new image.webp'), '');
    const config = readDeployConfig(source.replace('/portfolio', '/my portfolio/'));
    const batch = createUploadBatch(config, dist);
    const lines = batch.trim().split('\n');
    assert.equal(lines.length, 4);
    assert.ok(lines[0].includes('a new image.webp" "/my portfolio/a new image.webp"'));
    assert.ok(lines[1].startsWith('put -r '));
    assert.match(lines[2], /index\.html" "\/my portfolio\/\.index-[a-f\d-]+\.html"$/);
    assert.match(lines[3], /^rename "\/my portfolio\/\.index-[a-f\d-]+\.html" "\/my portfolio\/index\.html"$/);
    assert.ok(!batch.includes('rm '));
  } finally { rmSync(dist, { recursive: true, force: true }); }
});

test('upload planning refuses missing entry points and nested symlinks', () => {
  const dist = mkdtempSync(join(tmpdir(), 'homepage-deploy-'));
  try {
    const config = readDeployConfig(source);
    assert.throws(() => createUploadBatch(config, dist), /index.html/);
    writeFileSync(join(dist, 'index.html'), '');
    mkdirSync(join(dist, 'assets'));
    symlinkSync(join(dist, 'index.html'), join(dist, 'assets', 'link.html'));
    assert.throws(() => createUploadBatch(config, dist), /symbolic links/);
  } finally { rmSync(dist, { recursive: true, force: true }); }
});
