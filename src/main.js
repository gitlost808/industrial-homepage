import rawContent from 'site-content?raw';
import { readContent, safeUrl } from './content.js';
import '@fontsource/barlow-condensed/latin-600.css';
import '@fontsource/barlow-condensed/latin-700.css';
import '@fontsource/ibm-plex-mono/latin-400.css';
import '@fontsource/inter/latin-400.css';
import '@fontsource/inter/latin-500.css';
import './style.css';

const c = readContent(rawContent);
const find = selector => document.querySelector(selector);
const set = (selector, text) => { find(selector).textContent = text; };
const element = (tag, className, text) => {
  const node = document.createElement(tag);
  node.className = className;
  if (text) node.textContent = text;
  return node;
};

document.documentElement.lang = c.site.language;
document.title = c.site.title;
find('meta[name="description"]').content = c.site.description;
set('#skip-link', c.site.skipLink);
set('.mark', c.site.mark);
set('.index-label', c.site.index);
find('.identity').setAttribute('aria-label', c.site.title);
find('.navigation').setAttribute('aria-label', c.site.navigationLabel);
for (const id of ['about', 'projects', 'contact']) {
  const link = element('a', '', c.site.navigation[id]);
  link.href = `#${id}`;
  find('.navigation').append(link);
}
set('.hero-eyebrow > span:last-child', c.hero.eyebrow);
find('h1').setAttribute('aria-label', c.hero.name);
for (const line of c.hero.lines) {
  const span = element('span', 'name-line', line);
  span.setAttribute('aria-hidden', 'true');
  find('h1').append(span);
}

// Keep the configured name lines intact, sharing a size set by the longest one.
// Measure again when the local font finishes loading or the viewport changes.
const nameHeading = find('h1');
const nameLines = [...nameHeading.children];
function fitName() {
  nameHeading.style.setProperty('--name-scale', '1');
  const available = nameHeading.clientWidth - 4;
  const longest = Math.max(...nameLines.map(line => line.getBoundingClientRect().width));
  if (available > 0 && longest > available) {
    nameHeading.style.setProperty('--name-scale', String(available / longest));
  }
}
fitName();
document.fonts.ready.then(fitName);
let nameResizeFrame;
window.addEventListener('resize', () => {
  cancelAnimationFrame(nameResizeFrame);
  nameResizeFrame = requestAnimationFrame(fitName);
});

set('.hero-description', c.hero.description);
set('.explore > span:first-child', c.hero.action);
set('.hero-note', c.hero.note);
set('figcaption > span:first-child', c.hero.artworkLabel);
find('.architecture img').alt = c.hero.artworkDescription;
set('.side-label', c.hero.sideLabel);
for (const section of ['about', 'projects', 'contact']) {
  set(`.${section}-label`, c[section].label);
  set(`#${section}-heading`, c[section].heading);
}
for (const paragraph of c.about.paragraphs) find('.about-paragraphs').append(element('p', '', paragraph));
set('.about-note', c.about.note);
set('.projects-note', c.projects.note);
c.projects.items.forEach((project, i) => {
  const row = element('article', 'project');
  row.append(element('span', 'project-number', String(i + 1).padStart(2, '0')));
  const details = element('div', 'project-details');
  details.append(element('p', 'project-category', project.category));
  const heading = element('h3', '');
  const url = project.url?.trim() && safeUrl(project.url);
  if (url) {
    const link = element('a', 'project-link', project.title);
    link.href = url;
    const arrow = element('span', 'project-arrow', '↗');
    arrow.setAttribute('aria-hidden', 'true');
    link.append(arrow);
    heading.append(link);
  } else heading.textContent = project.title;
  details.append(heading, element('p', 'project-description', project.description));
  row.append(details);
  if (url) {
    const link = element('a', 'project-open', c.projects.openLabel);
    link.href = url;
    link.setAttribute('aria-label', `${c.projects.openLabel}: ${project.title}`);
    row.append(link);
  }
  find('.project-list').append(row);
});
if (!c.projects.items.length) find('.projects').hidden = true;
if (!c.projects.items.length) find('.navigation a[href="#projects"]').hidden = true;
if (!c.projects.items.length) find('.explore').href = '#about';
set('.contact-description', c.contact.description);
for (const item of c.contact.links) {
  const url = item.url?.trim() && safeUrl(item.url);
  if (!url) continue;
  const link = element('a', 'contact-link', item.label);
  link.href = url;
  const arrow = element('span', '', '↗');
  arrow.setAttribute('aria-hidden', 'true');
  link.append(arrow);
  find('.contact-links').append(link);
}
if (!find('.contact-links').childElementCount) find('.contact-links').append(element('p', 'editor-note', c.contact.emptyMessage));
set('.footer-credit', c.footer.credit);
set('.footer-note', c.footer.note);
set('.back-to-top', `${c.footer.backToTop} ↑`);
