import { parse } from 'yaml';

// Shared by the page and build check so configuration errors fail before release.
export function readContent(source) {
  const content = parse(source);
  const required = {
    site: ['title', 'description', 'language', 'mark', 'index', 'skipLink', 'navigationLabel'],
    hero: ['eyebrow', 'name', 'description', 'action', 'note', 'artworkLabel', 'artworkDescription', 'sideLabel'],
    about: ['label', 'heading', 'note'],
    projects: ['label', 'heading', 'note', 'openLabel'],
    contact: ['label', 'heading', 'description', 'emptyMessage'],
    footer: ['credit', 'note', 'backToTop'],
  };
  for (const [section, fields] of Object.entries(required)) {
    for (const field of fields) {
      if (typeof content?.[section]?.[field] !== 'string') {
        throw new Error(`content.yaml: ${section}.${field} must be text.`);
      }
    }
  }
  for (const key of ['about', 'projects', 'contact']) {
    if (typeof content.site.navigation?.[key] !== 'string') throw new Error(`content.yaml: site.navigation.${key} must be text.`);
  }
  for (const [section, key] of [['hero', 'lines'], ['about', 'paragraphs']]) {
    if (!Array.isArray(content[section][key]) || !content[section][key].length || !content[section][key].every(x => typeof x === 'string' && x.trim())) {
      throw new Error(`content.yaml: ${section}.${key} must be a nonempty list of text.`);
    }
  }
  for (const [section, key, fields] of [['projects', 'items', ['title', 'category', 'description']], ['contact', 'links', ['label']]]) {
    const items = content[section][key] ?? [];
    if (!Array.isArray(items)) throw new Error(`content.yaml: ${section}.${key} must be a list.`);
    for (const item of items) {
      if (!item || !fields.every(field => typeof item[field] === 'string')) throw new Error(`content.yaml: invalid entry in ${section}.${key}.`);
      if (item.url != null && typeof item.url !== 'string') throw new Error(`content.yaml: ${section} URLs must be text.`);
      if (item.url?.trim() && !safeUrl(item.url)) throw new Error(`content.yaml: ${section} links must use https://, http://, or mailto:.`);
    }
    content[section][key] = items;
  }
  return content;
}

export function safeUrl(value) {
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
