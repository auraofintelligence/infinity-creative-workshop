import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=fs.readdirSync(root).filter(p=>p.endsWith('.html'));

test('all generated pages have accessible foundations and raster icons',()=>{
  assert.equal(pages.length,33);
  for(const file of pages){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/<html lang="en-AU">/,file);
    assert.match(html,/<meta name="description" content="[^"]+"/,file);
    assert.equal((html.match(/<h1>/g)||[]).length,1,file);
    assert.match(html,/href="#main"/,file);
    assert.match(html,/href="assets\/img\/favicon.ico"/,file);
    assert.match(html,/href="assets\/img\/favicon-32.png"/,file);
    assert.doesNotMatch(html,/<link[^>]+rel="icon"[^>]+\.svg/);
    for(const img of html.matchAll(/<img\b[^>]*>/g)) assert.match(img[0],/\balt="[^"]*"/,file);
  }
});

test('internal links and local page assets resolve, including fragments',()=>{
  for(const page of pages){
    const html=fs.readFileSync(path.join(root,page),'utf8');
    for(const m of html.matchAll(/(?:href|src)="([^"]+)"/g)){
      const ref=m[1]; if(/^(https?:|data:|mailto:)/.test(ref))continue;
      const url=new URL(ref,'https://local.example/'+page);
      const file=decodeURIComponent(url.pathname).slice(1),fragment=decodeURIComponent(url.hash.slice(1));
      const target=path.resolve(root,file||page);
      assert.ok(target.startsWith(root+path.sep),ref);
      assert.ok(fs.existsSync(target),`${page}: ${ref}`);
      if(fragment&&target.endsWith('.html')){
        const dest=fs.readFileSync(target,'utf8');
        assert.ok(dest.includes(`id="${fragment}"`),`${page}: missing fragment ${ref}`);
      }
    }
  }
});

test('Queen roster has unique identities and all portrait assets',()=>{
  const queens=JSON.parse(fs.readFileSync(path.join(root,'content/queens.json'),'utf8'));
  assert.equal(queens.length,24);assert.equal(new Set(queens.map(q=>q.id)).size,24);
  assert.ok(queens.some(q=>q.id==='super-queen'));
  for(const q of queens){assert.match(q.color,/^#[a-f0-9]{6}$/i);assert.ok(fs.existsSync(path.join(root,`assets/queens/${q.id}.webp`)));assert.ok(q.questions.length>0);}
});

test('pricing catalogue preserves billing units and primary source references',()=>{
  const data=JSON.parse(fs.readFileSync(path.join(root,'content/rates.json'),'utf8'));
  assert.equal(data.checkedOn,'2026-10-30');assert.equal(data.currency,'USD');
  assert.equal(new Set(data.providers.map(p=>p.id)).size,data.providers.length);
  const keys={planning:['inputPerMillion','outputPerMillion'],transcription:['perAudioMinute'],image:['perImage'],video:['perGeneratedSecond'],speech:['perThousandCharacters']};
  for(const p of data.providers){
    for(const key of keys[p.category])assert.ok(Number.isFinite(p[key])&&p[key]>=0,`${p.id} ${key}`);
    assert.match(p.source,/^https:\/\//);assert.ok(p.note.length>20);
  }
  for(const c of Object.keys(keys))assert.ok(data.providers.some(p=>p.category===c&&['local','existing'].includes(p.route)),c);
});

test('deployable site includes metadata, data, licence and actual bitmap files',()=>{
  const dist=path.join(root,'dist');
  for(const p of ['index.html','robots.txt','sitemap.xml','LICENCE.md','.nojekyll','assets/rates.json','assets/queens.json'])assert.ok(fs.existsSync(path.join(dist,p)),p);
  const png=fs.readFileSync(path.join(dist,'assets/img/favicon-32.png'));assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  const ico=fs.readFileSync(path.join(dist,'assets/img/favicon.ico'));assert.equal(ico.subarray(0,4).toString('hex'),'00000100');
  const robots=fs.readFileSync(path.join(root,'robots.txt'),'utf8');assert.match(robots,/Sitemap: https:\/\/auraofintelligence\.github\.io\/infinity-creative-workshop\/sitemap\.xml/);
  for(const file of pages){
    const html=fs.readFileSync(path.join(root,file),'utf8');
    assert.match(html,/rel="canonical" href="https:\/\/auraofintelligence\.github\.io\/infinity-creative-workshop\//,file);
    assert.doesNotMatch(html,/chatgpt\.site/,file);
  }
});
