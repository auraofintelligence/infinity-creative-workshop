# Infinity Creative Workshop

A training website for the Queens Council, Infinity Engine, music videos, educational films, shorts, Blender and DaVinci Resolve. Created by Luke Nathan Hayes / Strange But True / Aura of Intelligence.

The workshop offers design choices, practical exercises, provider comparisons, a dated cost calculator and a completion test lab. It does not run production software or call paid APIs.

## Develop

No package installation is required. With Node 20 or newer:

```text
npm run build
npm test
npm run preview
```

Open the printed local address. Root HTML pages are generated from content/pages.mjs. The dist folder is the deployable static website. It can also be hosted under a GitHub Pages project path because internal links and assets are relative. Set SITE_URL before building for a different canonical origin.

## Maintain

- content/pages.mjs: teaching content and page layouts.
- content/queens.json: the 24 original archetypes, drawn from the existing 500 Queens project.
- content/rates.json: USD API rates with units, sources and checked date.
- assets/js/calculator.mjs: calculation logic without API calls.
- assets/js/site.mjs: learning routes, panel selection, browser-local notes and cost interface.
- assets/img/generation-notes.json: original generated imagery and prompts.
- scripts/build.mjs: static pages, metadata, sitemap and deployment copy.
- tests/: calculator and site integrity checks.

One training repository keeps navigation, lessons, costs and visual identity together. Independent production software remains in its linked source repositories. Add runtime integrations there or in a dedicated adapter repository when their deployment, access or maintenance requirements justify it.

## Privacy

Optional learning and test notes stay in this browser's local storage. Clearing browser storage removes them; exported files are the learner's copy. The workshop does not request API keys or transmit lesson content to a model.

## Licence

See LICENCE.md. Original site material uses the Strange But True Public Source Licence. Linked tools, sources and third-party materials retain their own terms.
