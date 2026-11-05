import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const html=fs.readFileSync('index.html','utf8');
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
const highlights=JSON.parse(fs.readFileSync('words.json','utf8'));
const reading=JSON.parse(fs.readFileSync('reading-words.json','utf8'));
const listening=JSON.parse(fs.readFileSync('listening-words.json','utf8'));
assert.equal(highlights.length,161);assert.equal(reading.words.length,474);assert.equal(listening.length,215);
assert.equal(new Set(listening.map(w=>w.id)).size,215);
assert(listening.every(w=>w.frequency>=3&&w.memory.text.length>10));
class Element{constructor(){this.value='';this.hidden=false;this.style={};this.textContent='';this.dataset={};this.children=[];this.files=[];this.checked=false;this.classList={toggle(){}}}setAttribute(){}append(x){this.children.push(x)}set innerHTML(x){this.html=x;this.children=[]}get innerHTML(){return this.html||''}click(){}focus(){}}
const storage=new Map([['translation-active-deck','reading'],['shici-progress-v1',JSON.stringify({items:{[highlights[0].id]:{seen:true,level:2,due:0,updated:100}},days:{}})],['translation-reading-v1',JSON.stringify({items:{[reading.words[0].id]:{excluded:true,updated:100}},days:{}})]]);
export async function setup(hash='',extras={}){
 const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
 const tabs=['study','library','focus','excluded'].map(tab=>Object.assign(new Element(),{dataset:{tab},textContent:tab}));
 const ratings=['again','hard','good'].map(rate=>Object.assign(new Element(),{dataset:{rate}}));
 const env={console,Date,Math,JSON,Set,Number,Blob,URL,setTimeout(){},location:{hash},history:{replaceState(){}},
 window:{addEventListener(){}},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},
 document:{getElementById:id=>{assert(nodes[id],`Missing ${id}`);return nodes[id]},querySelectorAll:s=>s==='[data-tab]'?tabs:s==='[data-rate]'?ratings:[],createElement:()=>new Element(),addEventListener(){}},
 fetch:async file=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(file.split('?')[0],'utf8'))})};
 Object.assign(env,extras);vm.createContext(env);await vm.runInContext(fs.readFileSync('app.js','utf8'),env);
 env.window.render=()=>vm.runInContext('render()',env);env.window.validateState=s=>{env.incomingState=s;return vm.runInContext('validateState(incomingState)',env)};
 if(extras.dictation){vm.runInContext(fs.readFileSync('cambridge-sentences.js','utf8'),env);vm.runInContext(fs.readFileSync('dictation.js','utf8'),env);}
 return {nodes,tabs,ratings,env,run:s=>vm.runInContext(s,env)};
}
let s=await setup();assert.equal(s.run('deck'),'reading','Existing deck preference is preserved');
assert(!s.run(`queue.some(w=>w.id===${JSON.stringify(reading.words[0].id)})`),'Existing excluded reading word stays excluded');
s.nodes.listeningShortcut.onclick();assert.equal(s.run('deck'),'listening');assert.equal(s.run('KEY'),'translation-listening-v1');assert.equal(s.run('queue.length'),215);assert.equal(s.run('queue[0].frequency'),15);
s.nodes.listeningPart.value='1';s.nodes.listeningFrequency.value='8';s.nodes.listeningPart.onchange();
assert(s.run('queue.length>0&&queue.every(w=>w.frequency>=8&&w.parts.includes(1))'));
const first=s.run('queue[cursor].id');s.nodes.reveal.onclick();assert(s.nodes.memoryText.textContent.length>10);s.ratings[2].onclick();
const bookmark=s.run('queue[cursor].id');assert(s.run('cursor>0'));
s=await setup('#listening');assert.equal(s.run('queue[cursor].id'),bookmark,'Reload resumes current listening round');assert.equal(s.nodes.answer.hidden,true,'Answer is hidden on resume');assert.equal(s.nodes.listeningPart.value,'1');assert.equal(s.nodes.listeningFrequency.value,'8');
const excluded=s.run('queue[cursor].id');s.nodes.exclude.onclick();assert(!s.run(`queue.slice(cursor).some(w=>w.id===${JSON.stringify(excluded)})`));
s.run('tab="excluded";render()');assert(s.nodes.list.innerHTML.includes('data-restore'));s.run(`recover(${JSON.stringify(excluded)})`);assert(!s.run(`state.items[${JSON.stringify(excluded)}].excluded`));
s.run('tab="study";selectDeck("highlight")');assert.equal(s.run(`state.items[${JSON.stringify(highlights[0].id)}].level`),2);
s.run('selectDeck("reading")');assert.equal(s.run(`state.items[${JSON.stringify(reading.words[0].id)}].excluded`),true);
s.run('selectDeck("listening")');s.nodes.listeningPart.value='';s.nodes.listeningFrequency.value='';s.nodes.listeningKind.value='时间';s.nodes.listeningKind.onchange();assert.equal(s.run('queue.length'),6);
s.nodes.search.value='星期四';s.nodes.search.oninput();assert.equal(s.run('queue[0].word'),'Thursday');
const backup={type:'translation-progress',version:2,decks:{highlight:{items:{[highlights[0].id]:{seen:true,level:3,due:0,updated:200}},days:{}},reading:{items:{},days:{}}}};
await s.nodes.file.onchange({target:{files:[{size:500,text:async()=>JSON.stringify(backup)}],value:'old.json'}});
assert.equal(JSON.parse(storage.get('shici-progress-v1')).items[highlights[0].id].level,3);
assert(JSON.parse(storage.get('translation-listening-v1')).items[first].seen,'Old two-deck import does not erase listening progress');
s.run('selectDeck("listening");tab="library"');s.nodes.listeningKind.value='';s.nodes.search.value='';s.run('render()');assert.equal((s.nodes.list.innerHTML.match(/<article class="row">/g)||[]).length,60,'Pagination remains intact');
console.log('PASS: 161 highlight + 474 reading + 215 listening cards; filters, memory hints, separate storage, bookmark/reload, exclusion/recovery, pagination and old backup import.');
