import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

// Personal copy stays local; a fresh checkout runs with the public example.
export function resolveContentPath(root = projectRoot) {
  const personal = resolve(root, 'content.yaml');
  return existsSync(personal) ? personal : resolve(root, 'content.example.yaml');
}
