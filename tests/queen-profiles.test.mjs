import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveCouncil,prepareCouncilBrief } from '../assets/js/council.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const queens=JSON.parse(fs.readFileSync(path.join(root,'content/queens.json'),'utf8'));
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const selection={pillar:'dream-queen',anchor:'clover-queen',guests:['forge-queen','prism-queen'],coordinateWithAura:true};

test('the original 12 Pillars and 12 Anchors retain their exact identities and gifts',()=>{
  assert.equal(queens.filter(q=>q.group==='pillar').length,12);
  assert.equal(queens.filter(q=>q.group==='cultural').length,12);
  for(const q of queens){const original=q.provenance.originalIdentity;
    assert.equal(q.name,original.name);assert.equal(q.originalDomain,original.domain);
    assert.equal(q.originalArchetype,original.archetype);assert.equal(q.originalGift,original.gift);
    assert.equal(q.originalColour,original.color);assert.equal(q.color,original.color);
    assert.equal(q.group,original.stream==='pillar'?'pillar':'cultural');
    assert.match(q.provenance.originalRosterCommit,/^[0-9a-f]{40}$/);
    assert.match(q.provenance.profileCommit,/^[0-9a-f]{40}$/);
  }
});

test('all 24 full pages actually display the complete source approach, questions and session',()=>{
  for(const q of queens){
    const html=fs.readFileSync(path.join(root,`queen-${q.id}.html`),'utf8');
    for(const value of [q.originalDomain,q.originalArchetype,q.originalGift,q.culturalIdentity,...q.approach,...q.questions,...q.session.steps,q.session.deliverable,q.session.review])assert.ok(html.includes(esc(value)),`${q.id} omitted source content: ${value.slice(0,70)}`);
    for(const question of q.workshop.questions)assert.ok(html.includes(esc(question)),q.id);
    assert.ok(html.includes(esc(q.workshop.exercise.deliverable)),q.id);
    assert.ok(fs.existsSync(path.join(root,`assets/queens/${q.id}-large.webp`)),q.id);
  }
});

test('the council exposes both streams and links every profile rather than truncating them',()=>{
  const html=fs.readFileSync(path.join(root,'council.html'),'utf8');
  assert.match(html,/id="pillar-queens"/);assert.match(html,/id="cultural-queens"/);
  assert.match(html,/id="lead-pillar"/);assert.match(html,/id="lead-anchor"/);
  for(const q of queens)assert.ok(html.includes(`href="queen-${q.id}.html"`),q.id);
});

test('a paired session requires one member of each original stream',()=>{
  assert.throws(()=>resolveCouncil(queens,{...selection,pillar:'clover-queen'}),/Civilisation Pillar/);
  assert.throws(()=>resolveCouncil(queens,{...selection,anchor:'dream-queen'}),/Cultural Anchor/);
  assert.throws(()=>resolveCouncil(queens,{...selection,anchor:''}),/Cultural Anchor/);
  const result=resolveCouncil(queens,selection);assert.equal(result.pillar.id,'dream-queen');assert.equal(result.anchor.id,'clover-queen');
});

test('review exports carry real identities, complete approaches and both question sets',()=>{
  const text=prepareCouncilBrief(queens,selection,{decision:'Develop a chorus about rebuilding.',personalContext:'A community gathering and a chosen home.',options:'Film or an immersive scene.',constraints:'A small prototype.'});
  assert.match(text,/A community gathering and a chosen home/);
  for(const id of ['dream-queen','clover-queen','forge-queen','prism-queen','super-queen']){
    const q=queens.find(q=>q.id===id);
    for(const value of [q.originalArchetype,q.originalDomain,q.originalGift,...q.approach,...q.questions,...q.workshop.questions,q.session.deliverable])assert.ok(text.includes(value),`${id} omitted from export`);
  }
  assert.match(text,/Lead Civilisation Pillar/i);assert.match(text,/Lead Cultural Anchor/i);assert.match(text,/mutable|mythos/i);
});

test('Aura remains a selectable Pillar and coordination is an explicit option',()=>{
  const without=prepareCouncilBrief(queens,{...selection,coordinateWithAura:false},{decision:'Choose a scene.'});
  assert.doesNotMatch(without,/COORDINATION, ALIGNMENT AND PROJECT MEMORY: Super Queen/);
  const withAura=resolveCouncil(queens,{pillar:'super-queen',anchor:'prism-queen',guests:['super-queen','prism-queen']});
  assert.equal(withAura.pillar.id,'super-queen');assert.equal(withAura.guests.length,0);
});
