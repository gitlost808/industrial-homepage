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

Copy the example destination to an ignored local file and edit it for your server:

```sh
cp deploy.example.yaml deploy.yaml
```

Set `host`, `user`, `directory` (an existing absolute remote path), and optionally `port` (defaults to 22). `deploy.yaml` is ignored by Git. Authentication uses your SSH key or agent; keep passwords and private keys out of both configuration files.

```sh
npm run deploy -- --dry-run
npm run deploy
```

Both commands run the configuration tests and build the current content. Dry run prints the upload plan without connecting to the server. Deploy uploads every production asset, then uploads the new HTML under a unique temporary name and renames it to `index.html` last. A failed test, build, or SFTP command stops deployment. No remote files are deleted; older hashed assets remain available to already-open pages.

The local `sftp` command is required for uploading. The server's SSH host key must already be trusted locally, and key or agent authentication must work without a password prompt. Only built files from `dist/` are uploaded. The optional responsive browser checks are separate; use `npm run test:mobile` with a running preview before deploying layout changes.

## Make it yours

The repository contains only **content.example.yaml**, with anonymous sample copy. A fresh checkout uses it automatically. To personalize your site, copy it to **content.yaml** before starting the dev server:

```sh
cp content.example.yaml content.yaml
```

`content.yaml` is ignored by Git and overrides the example for development and production builds. Keep your real biography, contact details, and project information in that local file. Restart the dev server when creating or removing the override; edits to an existing file refresh normally. Tests always use the example.

Both files contain navigation labels, page metadata, name, biography, projects, contact links, and footer copy. `hero.name` is the accessible full name; `hero.lines` controls the displayed line breaks. For long names, add a line break using another list entry.

Project and contact URLs accept `https://`, `http://`, and `mailto:`. Blank URLs produce no links. Remove all entries with `projects.items: []` to hide the work section and its navigation link, or `contact.links: []` to show the configurable contact placeholder. Optional lists can also be omitted. Quote text containing a colon followed by a space. Run `npm run check` to catch invalid configuration; production builds run this check automatically. Content is inserted as text, never as HTML.

The AI-generated monochrome apartment-block image is in **public/concrete.webp**. Colors, spacing, responsive breakpoints, and textures live in **src/style.css**. All imagery and fonts are bundled locally. Fonts use Barlow Condensed, IBM Plex Mono, and Inter via Fontsource, with system fallbacks. No analytics or backend services are included.

## Verify

```sh
npm test
npm run build
```

Configuration tests cover YAML parsing, optional entries, malformed configuration, and safe URL protocols. Check the page at mobile and desktop widths, tab through its links, and enable reduced motion when changing the layout.

For the responsive browser checks, install Chromium once with `npx playwright install chromium --only-shell`. Start `npm run preview -- --port 4173` after building, then run `npm run test:mobile` in another terminal. To check a deployed site, run `npm run test:mobile -- https://portfolio.example.com/`.

The browser check covers six phone portrait sizes, four phone landscape sizes, two tablet sizes, and desktop. It checks text clipping, horizontal overflow, name fitting, image captions, section boundaries, touch target sizes, anchor navigation, orientation changes, keyboard access, and reduced motion. It uses Chromium emulation; physical-device Safari behavior still needs a real-device check.
