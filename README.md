# Personal index

A responsive industrial homepage, built with Vite, vanilla JavaScript, and CSS.

## Run locally

Requires Node.js 20.19+ or 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` for production and `npm run preview` to inspect the built site. Deploy the resulting `dist/` directory to any static host; no server or secrets are needed. For subdirectory hosting, set Vite's `base` before building.

## Deploy via SFTP

The site is served at **https://portfolio.example.com/**. Its SFTP destination is `sftp://deploy@sftp.example.com:22/portfolio.example.com`.

After editing content, rebuild and upload using your configured SSH key or agent:

```sh
npm test && npm run build
sftp -oBatchMode=yes -oStrictHostKeyChecking=yes -P 22 -b - deploy@sftp.example.com <<'SFTP'
put -r dist/assets /portfolio.example.com/
put dist/concrete.webp /portfolio.example.com/concrete.webp
put dist/favicon.svg /portfolio.example.com/favicon.svg
put dist/index.html /portfolio.example.com/.index-next.html
rename /portfolio.example.com/.index-next.html /portfolio.example.com/index.html
SFTP
```

The server's SSH host key must already be trusted locally. Assets upload before the HTML is switched into place. Existing files are preserved, including older hashed assets, so already-open pages can still load them. Only the built `dist/` files are uploaded; source files and credentials stay local. Content changes need another build and upload to appear online.

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
