import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { queenWorkshop } from '../content/queen-workshop.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=path.resolve(root,'../500-Queens-VC-2026');
const original=path.resolve(root,'../Queens_Venture');
const sourceCommit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const originalCommit=execFileSync('git',['-C',original,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const queens=JSON.parse(fs.readFileSync(path.join(source,'data/queens.json'),'utf8')).queens;
const originalHtml=fs.readFileSync(path.join(original,'index.html'),'utf8');
const pattern=/\{ name: "([^"]+)", domain: "([^"]+)", archetype: "([^"]+)", gift: "([^"]+)", color: "([^"]+)", stream: "([^"]+)" \}/g;
const roster=[...originalHtml.matchAll(pattern)].map(m=>({name:m[1],domain:m[2],archetype:m[3],gift:m[4],color:m[5],stream:m[6]}));
if(roster.length!==24||queens.length!==24)throw Error('The original and current sources must contain 24 Queens.');
const profiles=queens.map(q=>{
  const r=roster.find(r=>r.name===q.name);
  if(!r||!queenWorkshop[q.id])throw Error('Missing original identity or workshop development: '+q.id);
  const expectedGroup=r.stream==='anchor'?'cultural':'pillar';
  if(q.group!==expectedGroup||q.originalDomain!==r.domain||q.originalArchetype!==r.archetype||q.originalGift!==r.gift||q.originalColour!==r.color)throw Error('Original architecture mismatch: '+q.id);
  return {...q,color:r.color,source:`https://github.com/auraofintelligence/500-Queens-VC-2026/blob/${sourceCommit}/data/queens.json`,profileSource:`https://auraofintelligence.github.io/500-Queens-VC-2026/queen-${q.id}.html`,sourceLinks:q.sourceLinks.map(s=>({...s,href:new URL(s.href,'https://auraofintelligence.github.io/500-Queens-VC-2026/').href})),workshop:queenWorkshop[q.id],provenance:{originalRosterCommit:originalCommit,profileCommit:sourceCommit,originalStream:r.stream,originalIdentity:r,workshopStatus:'Proposed creative-workshop development'}};
});
fs.writeFileSync(path.join(root,'content/queens.json'),JSON.stringify(profiles,null,2)+'\n');
console.log('Imported 12 Civilisation Pillars and 12 Cultural Anchors, preserving full source profiles and original identities.');
