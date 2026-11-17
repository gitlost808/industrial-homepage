import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stringify, parse } from 'yaml';
import { readContent, safeUrl } from '../src/content.js';

const source = readFileSync(new URL('../content.yaml', import.meta.url), 'utf8');

test('sample content is valid, with intentionally empty links', () => {
  const content = readContent(source);
  assert.equal(content.site.language, 'en');
  assert.equal(content.projects.items.length, 3);
  assert.ok(content.projects.items.every(item => !item.url));
});

test('missing and empty optional lists are accepted', () => {
  const content = parse(source);
  delete content.projects.items;
  content.contact.links = [];
  const result = readContent(stringify(content));
  assert.deepEqual(result.projects.items, []);
  assert.deepEqual(result.contact.links, []);
});

test('missing text and malformed lists produce useful configuration errors', () => {
  const content = parse(source);
  delete content.hero.name;
  assert.throws(() => readContent(stringify(content)), /hero.name/);
  content.hero.name = 'A name';
  content.hero.lines = 'A name';
  assert.throws(() => readContent(stringify(content)), /hero.lines/);
});

test('links permit web and email protocols and reject executable protocols', () => {
  assert.equal(safeUrl('https://example.com/project'), 'https://example.com/project');
  assert.equal(safeUrl('mailto:hello@example.com'), 'mailto:hello@example.com');
  for (const value of ['', 'not a url', 'javascript:alert(1)', 'data:text/html,test', 'file:///etc/passwd']) {
    assert.equal(safeUrl(value), null);
  }
  const content = parse(source);
  content.contact.links[0].url = 'javascript:alert(1)';
  assert.throws(() => readContent(stringify(content)), /links must use/);
});

test('project URLs must be strings', () => {
  const content = parse(source);
  content.projects.items[0].url = 123;
  assert.throws(() => readContent(stringify(content)), /URLs must be text/);
});
