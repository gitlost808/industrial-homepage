import { readFileSync } from 'node:fs';
import { readContent } from '../src/content.js';
import { resolveContentPath } from './content-source.js';
import { basename } from 'node:path';
const path = resolveContentPath();
readContent(readFileSync(path, 'utf8'));
console.log(`${basename(path)} is valid.`);
