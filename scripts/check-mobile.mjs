import assert from 'node:assert/strict';
import { chromium } from 'playwright';

// Start a local preview on port 4173, or pass the deployed URL as an argument.
const url = process.argv[2] ?? 'http://127.0.0.1:4173/';
const browser = await chromium.launch();
const viewports = [
  [320, 568], [360, 640], [375, 667], [390, 844], [414, 896], [430, 932],
  [568, 320], [667, 375], [844, 390], [932, 430],
  [768, 1024], [1024, 768], [1440, 900],
];

async function inspect(page, phoneLayout, touch) {
  await page.evaluate(() => document.fonts.ready);
  // Allow resize-driven name fitting to finish before measuring text.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  return page.evaluate(({ phoneLayout, touch }) => {
    const failures = [];
    const box = selector => document.querySelector(selector).getBoundingClientRect();
    if (document.documentElement.scrollWidth > innerWidth + 1) failures.push('horizontal page overflow');
    const heading = box('h1');
    for (const line of document.querySelectorAll('.name-line')) {
      if (line.getBoundingClientRect().right > heading.right + 1 || getComputedStyle(line).whiteSpace !== 'nowrap') failures.push(`name line overflows: ${line.textContent}`);
    }
    // Inspect actual text fragments, including content clipped by overflow:hidden.
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (!node.textContent.trim() || parent.closest('script, style, .skip-link')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (!rect.width || !rect.height) continue;
        if (rect.left < -1 || rect.right > innerWidth + 1) failures.push(`text outside viewport: ${node.textContent.trim().slice(0, 55)}`);
        for (let ancestor = parent; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);
          const bounds = ancestor.getBoundingClientRect();
          if (['hidden', 'clip'].includes(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) failures.push(`clipped text: ${node.textContent.trim().slice(0, 55)}`);
          if (['hidden', 'clip'].includes(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) failures.push(`vertically clipped text: ${node.textContent.trim().slice(0, 55)}`);
        }
      }
    }
    for (const image of document.images) if (!image.complete || !image.naturalWidth) failures.push('image failed to load');
    for (const link of document.querySelectorAll('a[href^="#"]')) {
      if (!document.querySelector(link.getAttribute('href'))) failures.push(`missing anchor: ${link.getAttribute('href')}`);
    }
    if (touch) {
      for (const link of document.querySelectorAll('a:not(.skip-link)')) {
        const rect = link.getBoundingClientRect();
        if (rect.width && rect.height && (rect.height < 43.5 || rect.width < 43.5)) failures.push(`small tap target: ${link.textContent.trim()}`);
      }
    }
    if (phoneLayout) {
      const caption = box('figcaption');
      const image = box('.architecture img');
      if (Math.abs(caption.left - image.left) > 1 || Math.abs(caption.width - image.width) > 1) failures.push('caption not aligned to image');
      if (caption.top < image.bottom + 10) failures.push('caption overlaps image');
      if (box('.hero-bottom').top < caption.bottom + 16) failures.push('hero metadata crowds caption');
      if (image.top < box('.explore').bottom + 24) failures.push('image crowds introduction');
      for (const selector of ['.hero-description', '.about-paragraphs', '.project-description', '.contact-description']) {
        if (parseFloat(getComputedStyle(document.querySelector(selector)).fontSize) < 14) failures.push(`body text too small: ${selector}`);
      }
    }
    const sections = [...document.querySelectorAll('main > section')].filter(section => !section.hidden);
    for (let i = 1; i < sections.length; i++) {
      if (sections[i].getBoundingClientRect().top < sections[i - 1].getBoundingClientRect().bottom - 1) failures.push('sections overlap');
    }
    return [...new Set(failures)];
  }, { phoneLayout, touch });
}

try {
  for (const [width, height] of viewports) {
    const touch = width !== 1440;
    const phoneLayout = width <= 640 || (width <= 1000 && height <= 500 && touch);
    const context = await browser.newContext({ viewport: { width, height }, isMobile: touch, hasTouch: touch, reducedMotion: 'reduce' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()}: ${response.url()}`); });
    try {
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      assert.deepEqual(await inspect(page, phoneLayout, touch), [], `${width}×${height}`);
      // Touch navigation must reach its target without a fixed layer intercepting it.
      await page.locator('.navigation a[href="#about"]')[touch ? 'tap' : 'click']();
      assert.equal(new URL(page.url()).hash, '#about');
      assert.ok(await page.locator('#about').evaluate(el => Math.abs(el.getBoundingClientRect().top - 24) < 3));
      await page.locator('.back-to-top')[touch ? 'tap' : 'click']();
      assert.ok(await page.evaluate(() => scrollY < 2));
      if (width === 390) {
        await page.setViewportSize({ width: 844, height: 390 });
        assert.deepEqual(await inspect(page, true, true), [], 'orientation change to landscape');
        await page.setViewportSize({ width, height });
        assert.deepEqual(await inspect(page, true, true), [], 'orientation change to portrait');
        await page.keyboard.press('Tab');
        // Verify keyboard focus directly as touch interaction may retain anchor focus.
        await page.locator('.skip-link').focus();
        await page.keyboard.press('Enter');
        assert.equal(await page.evaluate(() => document.activeElement.id), 'main');
        assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior), 'auto');
      }
      assert.deepEqual(errors, [], 'browser or resource errors');
      console.log(`PASS ${width}×${height}: text, caption, sections, links, and navigation`);
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
