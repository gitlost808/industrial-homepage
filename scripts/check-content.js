import { readFileSync } from 'node:fs';
import { readContent } from '../src/content.js';
readContent(readFileSync(new URL('../content.yaml', import.meta.url), 'utf8'));
console.log('content.yaml is valid.');
