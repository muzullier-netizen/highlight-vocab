import {setup} from './validate-listening.mjs';
import assert from 'node:assert/strict';
const voiceGB={voiceURI:'test-GB',name:'Test British',lang:'en-GB'};
const voiceUS={voiceURI:'test-US',name:'Test American',lang:'en-US'};
let voices=[{voiceURI:'test-ZH',name:'Test Chinese',lang:'zh-CN'},voiceUS,voiceGB],last,voiceChanged;
const speech={cancel(){},getVoices:()=>voices,speak(u){last=u},addEventListener(name,handler){if(name==='voiceschanged')voiceChanged=handler}};
const extras={dictation:true,structuredClone,SpeechSynthesisUtterance:class{constructor(text){this.text=text}},speechSynthesis:speech,window:{speechSynthesis:speech,addEventListener(){}}};
let s=await setup('#listening',extras);await new Promise(r=>setTimeout(r,0));
function clearFilters(){for(const id of ['article','search','listeningPart','listeningFrequency','listeningKind'])s.nodes[id].value='';s.nodes.mode.value='every';s.nodes.search.oninput()}
clearFilters();s.nodes.practiceMode.value='synthetic';s.nodes.practiceMode.onchange();
assert.equal(s.nodes.dictationPanel.hidden,false);
assert.equal(s.nodes.voiceSettings.hidden,false);
const built=s.env.window.Dictation.builtInSentences();
assert.equal(built.length,19);assert.equal(new Set(built.map(c=>c.wordId)).size,19);
assert(s.nodes.syntheticCoverage.textContent.includes('19 / 230'));
const totals=new Map();for(const row of s.env.window.CambridgeSentences){totals.set(row.book,(totals.get(row.book)||0)+row.text.split(/\s+/).length);assert(row.url.startsWith('https://'))}
assert.equal(totals.size,11);assert([...totals.values()].every(n=>n<=25),'Keep each book excerpt brief');
for(const c of built){s.env.window.Dictation.checkText(c);assert(c.source.includes('Test 1'));assert(c.url.startsWith('https://'));}
const current=()=>s.run('window.Dictation.round().item');
let item=current();const expected=s.env.window.Dictation.markedSentence(item.c.sentence);
assert(s.nodes.dictationSolution.hidden);assert(!s.nodes.dictationPrompt.textContent.toLowerCase().includes(expected.answer.toLowerCase()));
await s.nodes.playDictation.onclick();assert.equal(last.text,expected.full,'Speak the full authentic sentence, including the answer');assert.equal(last.voice,voiceGB);assert.equal(last.lang,'en-GB');
s.nodes.voiceSelect.value='test-US';s.nodes.voiceSelect.onchange();await s.nodes.playDictation.onclick();assert.equal(last.voice,voiceUS);
voices=[voiceGB];voiceChanged();await s.nodes.playDictation.onclick();assert.equal(last.voice,voiceGB,'Missing voice on another device falls back to an available English voice');
const prev=last;voices=[{name:'Chinese',lang:'zh-CN'}];await s.nodes.playDictation.onclick();assert.equal(last,prev);assert(s.nodes.audioStatus.textContent.includes('未提供英语'));
voices=[voiceUS,voiceGB];
s.nodes.spellingInput.value='incorrect fixture';s.nodes.dictationForm.onsubmit({preventDefault(){}});
assert.equal(s.run(`state.dictation.stats.synthetic[${JSON.stringify(item.w.id)}].wrong`),1);
assert.equal(s.run(`state.dictation.stats.sentence[${JSON.stringify(item.w.id)}]`),undefined,'Synthetic and original audio scores are separate');
assert.equal(s.nodes.dictationTranscript.textContent,expected.full);assert(s.nodes.dictationMeaning.textContent.includes('合成语音'));
assert.equal(s.nodes.sentenceSourceLink.href,item.c.url);assert.equal(s.nodes.sentenceSourceLink.hidden,false);
s.nodes.nextSpelling.onclick();item=current();s.nodes.spellingInput.value='unfinished fixture';s.nodes.spellingInput.oninput();const bookmark=item.id;
s=await setup('#listening',extras);await new Promise(r=>setTimeout(r,0));assert.equal(current().id,bookmark);assert.equal(s.nodes.spellingInput.value,'unfinished fixture');assert(s.nodes.dictationSolution.hidden);
s.run(`state.items[${JSON.stringify(current().w.id)}]={excluded:true,updated:Date.now()};render()`);assert.notEqual(current()?.id,bookmark,'Excluded target leaves the sentence round');
clearFilters();s.nodes.search.value='water';s.nodes.search.oninput();assert(s.nodes.playDictation.disabled);assert(s.nodes.dictationHeading.textContent.includes('暂无'));
// User-supplied local text fixture only; never presented as Cambridge material.
s.nodes.ttsWord.value='listening:water';s.nodes.ttsSource.value='UNIT TEST USER TEXT';s.nodes.ttsSentence.value='Please bring [water] with you.';s.nodes.confirmText.checked=true;s.nodes.ttsForm.onsubmit({preventDefault(){}});
assert(s.nodes.ttsMaterialStatus.textContent.includes('已保存'));assert(!s.nodes.playDictation.disabled);
assert.equal(s.run('state.dictation.materials.length'),1);s.nodes.ttsForm.onsubmit({preventDefault(){}});assert.equal(s.run('state.dictation.materials.length'),1,'Duplicate form submission is rejected');
const state=JSON.parse(s.run('JSON.stringify(state)'));s.env.window.Dictation.validateState(state);
const merged={items:{},days:{}};s.env.window.Dictation.mergeState(merged,state);assert.equal(merged.dictation.materials.length,1);
const invalid=structuredClone(state);invalid.dictation.materials[0].sentence='Please bring [sand] with you.';assert.throws(()=>s.env.window.Dictation.validateState(invalid));
const older=structuredClone(state);older.dictation.materials[0].updated=1;older.dictation.materials[0].source='OLDER';s.env.window.Dictation.mergeState(merged,older);assert.equal(merged.dictation.materials[0].source,'UNIT TEST USER TEXT');
// Verify the normal progress import preserves text and the new practice mode.
await s.nodes.file.onchange({target:{files:[{size:5000,text:async()=>JSON.stringify({type:'translation-progress',version:2,decks:{listening:state}})}],value:'fixture.json'}});
assert.equal(s.run('state.dictation.mode'),'synthetic');assert.equal(s.run('state.dictation.materials.length'),1);
s=await setup('#listening',{...extras,location:{hash:'#listening',search:'?practice=synthetic'}});assert.equal(s.nodes.practiceMode.value,'synthetic');
console.log('PASS: 18 sourced short sentences, 19 vocabulary exercises, full-sentence synthesis, UK voice selection/fallback, no-English feedback, hidden answers, independent stats, resume, exclusions, empty filters, local text validation and backup merge.');
