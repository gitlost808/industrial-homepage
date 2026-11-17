import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { readContent } from './src/content.js';

const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

export default defineConfig({
  plugins: [{
    name: 'content-metadata',
    transformIndexHtml(html) {
      const { site } = readContent(readFileSync(new URL('./content.yaml', import.meta.url), 'utf8'));
      return html
        .replace('<html lang="en">', `<html lang="${escape(site.language)}">`)
        .replace(/<title>.*?<\/title>/, `<title>${escape(site.title)}</title>`)
        .replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${escape(site.description)}" />`);
    },
  }],
});
