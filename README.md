# Personal index

A responsive industrial homepage, built with Vite, vanilla JavaScript, and CSS.

## Run locally

Requires Node.js 20.19+ or 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` for production and `npm run preview` to inspect the built site. Deploy the resulting `dist/` directory to any static host; no server or secrets are needed. For subdirectory hosting, set Vite's `base` before building.

## Make it yours

Edit **content.yaml**. It contains navigation labels, page metadata, name, biography, projects, contact links, and footer copy. The initial entries are explicitly sample content. `hero.name` is the accessible full name; `hero.lines` controls the displayed line breaks. For long names, add a line break using another list entry.

Project and contact URLs accept `https://`, `http://`, and `mailto:`. Blank URLs produce no links. Remove all entries with `projects.items: []` to hide the work section and its navigation link, or `contact.links: []` to show the configurable contact placeholder. Optional lists can also be omitted. Quote text containing a colon followed by a space. Run `npm run check` to catch invalid configuration; production builds run this check automatically. Content is inserted as text, never as HTML.

The AI-generated monochrome apartment-block image is in **public/concrete.webp**. Colors, spacing, responsive breakpoints, and textures live in **src/style.css**. All imagery and fonts are bundled locally. Fonts use Barlow Condensed, IBM Plex Mono, and Inter via Fontsource, with system fallbacks. No analytics or backend services are included.

## Verify

```sh
npm test
npm run build
```

Configuration tests cover YAML parsing, optional entries, malformed configuration, and safe URL protocols. Check the page at mobile and desktop widths, tab through its links, and enable reduced motion when changing the layout.
