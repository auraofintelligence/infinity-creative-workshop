import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createPages } from '../content/pages.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = (process.env.SITE_URL || 'https://auraofintelligence.github.io/infinity-creative-workshop').replace(/\/$/, '');
const read = p => JSON.parse(fs.readFileSync(path.join(root, p), 'utf8'));
const queens = read('content/queens.json');
const rates = read('content/rates.json');
const architecture = read('content/council-architecture.json');
const contentVersion=createHash('sha256').update(JSON.stringify({queens,rates})).digest('hex').slice(0,12);
const assetHash=createHash('sha256').update(contentVersion);
for(const asset of ['assets/css/styles.css','assets/js/site.mjs','assets/js/council.mjs','assets/js/calculator.mjs'])assetHash.update(fs.readFileSync(path.join(root,asset),'utf8').replace(/\r\n/g,'\n'));
const assetVersion=assetHash.digest('hex').slice(0,12);
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nav = [['index.html','Home'],['learn.html','Learn'],['council.html','Council'],['production.html','Make'],['costs.html','Costs'],['test-lab.html','Test lab'],['repositories.html','Connections']];
const footer = [['https://auraofintelligence.github.io/infinity-engine/','Infinity Engine'],['https://auraofintelligence.github.io/500-Queens-VC-2026/','500 Queens'],['https://auraofintelligence.github.io/davinci-resolve-automations/','Resolve Automations'],['https://auraofintelligence.github.io/i-C-infinity-music-universe/','i C. infinity'],['https://github.com/nateherkai/herk-edit-kit','Herk Edit Kit'],['https://github.com/nateherkai/roast-room','Roast Room'],['https://github.com/auraofintelligence/infinity-creative-workshop','Website source'],['about.html','About and licence'],['repositories.html','All source repositories']];
const pages = createPages(queens, rates, architecture);
for (const p of pages) {
  const html = `<!doctype html>
<html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(p.title)} | Infinity Creative Workshop</title><meta name="description" content="${esc(p.description)}"><meta name="theme-color" content="#080c0e"><link rel="canonical" href="${base}/${p.file}"><meta property="og:title" content="${esc(p.title)} | Infinity Creative Workshop"><meta property="og:description" content="${esc(p.description)}"><meta property="og:type" content="website"><meta property="og:url" content="${base}/${p.file}"><meta property="og:image" content="${base}/${p.ogImage||'assets/img/hero-workshop.webp'}"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="assets/img/favicon.ico" sizes="any"><link rel="icon" type="image/png" sizes="32x32" href="assets/img/favicon-32.png"><link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png"><link rel="stylesheet" href="assets/css/styles.css?v=${assetVersion}"></head>
<body data-content-version="${contentVersion}"><a class="skip-link" href="#main">Skip to content</a><div class="scroll-progress" aria-hidden="true"></div>
<header class="site-header"><a class="brand" href="index.html"><img src="assets/img/favicon-64.png" alt="" width="42" height="42"><span><strong>Infinity<br>Creative Workshop</strong><small>Joyful responsible abundance</small></span></a><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav">Explore <span aria-hidden="true">+</span></button><nav class="primary-nav" id="main-nav" aria-label="Main navigation">${nav.map(([href,label])=>`<a href="${href}"${href===(p.nav||p.file)?' aria-current="page"':''}>${label}</a>`).join('')}</nav></header>
<main id="main">${p.body}</main>
<footer class="site-footer"><div><p class="eyebrow aqua">Joyful responsible abundance</p><h2>More room<br>for making.</h2><p>Share useful tools. Keep your own voice. Let each small experiment help you choose the next one.</p></div><nav class="footer-links" aria-label="Connected projects">${footer.map(([href,label])=>`<a href="${href}">${label} <span aria-hidden="true">↗</span></a>`).join('')}</nav><div class="footer-base"><span>© 2026 Luke Nathan Hayes / Strange But True / Aura of Intelligence</span><span><a href="about.html#licence">Public source licence</a> · <a href="about.html#privacy">Your notes stay in your browser</a></span></div></footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div><script type="module" src="assets/js/site.mjs?v=${assetVersion}"></script></body></html>\n`;
  fs.writeFileSync(path.join(root,p.file),html);
}
fs.writeFileSync(path.join(root,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
fs.writeFileSync(path.join(root,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.filter(p=>p.file!=='404.html').map(p=>`  <url><loc>${base}/${p.file}</loc><lastmod>2026-10-30</lastmod></url>`).join('\n')}\n</urlset>\n`);
fs.mkdirSync(path.join(root,'dist'),{recursive:true});
for(const p of pages) fs.copyFileSync(path.join(root,p.file),path.join(root,'dist',p.file));
for(const p of ['robots.txt','sitemap.xml','LICENCE.md','.nojekyll']) fs.copyFileSync(path.join(root,p),path.join(root,'dist',p));
fs.cpSync(path.join(root,'assets'),path.join(root,'dist/assets'),{recursive:true,filter:p=>!p.endsWith('.png') || /favicon-|apple-touch-icon/.test(p)});
fs.cpSync(path.join(root,'content/rates.json'),path.join(root,'dist/assets/rates.json'));
fs.cpSync(path.join(root,'content/queens.json'),path.join(root,'dist/assets/queens.json'));
// Keep browser-fetchable data beside assets for both root previews and dist hosting.
fs.copyFileSync(path.join(root,'content/rates.json'),path.join(root,'assets/rates.json'));
fs.copyFileSync(path.join(root,'content/queens.json'),path.join(root,'assets/queens.json'));
console.log(`Built ${pages.length} static pages with local assets. Canonical base: ${base}`);
