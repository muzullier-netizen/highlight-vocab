const $=id=>document.getElementById(id);let deck='highlight',KEY='shici-progress-v1',decks={},meta={},page=0;let words=[],state={items:{},days:{}},tab='study',queue=[],cursor=0,shown=false,session=0;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const day=()=>new Date().toLocaleDateString('sv-SE');function toast(s){$('toast').textContent=s;$('toast').style.display='block';setTimeout(()=>$('toast').style.display='none',2800)}function save(){try{localStorage.setItem(KEY,JSON.stringify(state));window.CloudSync?.changed()}catch{toast('无法保存到浏览器，请导出进度备份')}}const st=w=>state.items[w.id]||{};const starred=w=>st(w).star??(deck==='highlight'&&w.count>1);const eligible=w=>!st(w).due||st(w).due<=Date.now();
// Keep the current round separately from each word's learning history.
function checkpoint(){
 if(tab!=='study')return;
 state.round={ids:queue.map(w=>w.id),cursor,session,shown,article:$('article').value,mode:$('mode').value,search:$('search').value,frequency:$('frequency').value,kind:$('kind').value,part:$('listeningPart').value,listeningFrequency:$('listeningFrequency').value,listeningKind:$('listeningKind').value,updated:Date.now()};
 save();
}
function resumeRound(persist=true){
 const r=state.round;
 if(!r||!Array.isArray(r.ids)||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>r.ids.length||!Number.isInteger(r.session)||r.session<0||!['all','focus','new','every'].includes(r.mode)||typeof r.article!=='string'||typeof r.search!=='string')return false;
 const byId=new Map(words.filter(w=>!st(w).excluded).map(w=>[w.id,w]));
 if(!r.ids.every(id=>typeof id==='string'))return false;
 // A future vocabulary update can remove entries without moving the bookmark backwards.
 const before=r.ids.slice(0,r.cursor).filter(id=>byId.has(id));
 const after=r.ids.slice(r.cursor).filter(id=>byId.has(id));
 queue=[...before,...after].map(id=>byId.get(id));cursor=before.length;session=r.session;
 $('article').value=r.article;$('mode').value=r.mode;$('search').value=r.search;$('frequency').value=r.frequency||'';$('kind').value=r.kind||'';$('listeningPart').value=r.part||'';$('listeningFrequency').value=r.listeningFrequency||'';$('listeningKind').value=r.listeningKind||'';
 render();if(persist)checkpoint();
 return true;
}
window.addEventListener('pagehide',checkpoint);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')checkpoint()});
function filtered(){let a=$('article').value,q=$('search').value.trim().toLowerCase(),f=$('frequency').value,k=$('kind').value;return words.filter(w=>(tab==='excluded'?!!st(w).excluded:!st(w).excluded)&&(!a||w.articles.includes(a))&&(!f||w.levels?.[f])&&(!k||w.tags?.includes(k))&&(deck!=='listening'||((!$('listeningPart').value||($('listeningPart').value==='unknown'?w.frequency!==null&&!w.parts.length:w.parts.includes(+$('listeningPart').value)))&&(!$('listeningFrequency').value||w.frequency>=+$('listeningFrequency').value)&&(!$('listeningKind').value||(w.category===$('listeningKind').value||w.calendar===$('listeningKind').value))))&&(!q||[w.word,w.meaning,w.synonyms||'',w.memory?.text||'',...w.forms].join(' ').toLowerCase().includes(q))&&(tab!=='focus'||starred(w)))}
const labels={answer:'答案词（含组成词）',judgment:'判断题题干词',book:'词汇书样章参考'};
const partText=w=>w.parts?.length?'Part '+w.parts.join(' / '):'Part 未完整显示';
function record(w){return deck==='listening'&&w.frequency===null?'基础日期词汇补充 · '+w.calendar:deck==='listening'?`题库出现 ${w.frequency} 篇 · ${partText(w)} · ${w.category}`:deck==='reading'?`${w.articleCount} 篇文章 · ${w.count} 次出现 · ${w.tags.map(t=>labels[t]).join(' / ')}`:`${w.count} 条记录`}
function exclude(){const w=queue[cursor];if(!w||tab!=='study')return;state.items[w.id]={...st(w),excluded:true,updated:Date.now()};queue=queue.filter((x,i)=>i<cursor||x.id!==w.id);render();checkpoint();toast('已排除，可在“已排除”中恢复')}
function recover(id){const w=words.find(w=>w.id===id);if(!w)return;state.items[id]={...st(w),excluded:false,updated:Date.now()};save();render();toast('已恢复到当前词本')}
function stats(){$('due').textContent=words.filter(w=>!st(w).excluded&&st(w).seen&&eligible(w)).length;$('known').textContent=words.filter(w=>!st(w).excluded&&st(w).level>=2).length;$('today').textContent=state.days[day()]||0}
function build(options={}){if(!Array.isArray(words)||!words.length)return;page=0;let mode=$('mode').value;queue=filtered().filter(w=>mode==='every'||mode==='focus'&&starred(w)||mode==='new'&&!st(w).seen||mode==='all'&&eligible(w));queue.sort((a,b)=>(st(b).seen?1:0)-(st(a).seen?1:0)||(starred(b)?1:0)-(starred(a)?1:0)||(deck==='listening'?b.frequency-a.frequency:0));cursor=0;session=0;render();if(options.persist!==false)checkpoint()}
function render(){renderCards();window.Dictation?.render()}
function renderCards(){stats();$('study').hidden=tab!=='study';$('list').hidden=tab==='study';$('mode').hidden=tab!=='study';$('shuffle').hidden=tab!=='study';$('sectionTitle').textContent=tab==='study'?'今天，从这里开始':tab==='focus'?'反复遇见，值得多记一次':tab==='excluded'?'已排除的词，随时可恢复':deck==='listening'?'你的听力高频词汇':'你的阅读词汇收藏';$('sessionCount').textContent=tab==='study'?`本轮已复习 ${session} 次`:`${filtered().length} 张词卡`;
if(tab!=='study'){let list=filtered();if(deck==='listening')list.sort((a,b)=>b.frequency-a.frequency);page=Math.min(page,Math.max(0,Math.ceil(list.length/60)-1));$('list').innerHTML=list.length?list.slice(page*60,(page+1)*60).map(w=>`<article class="row"><div><strong>${esc(w.word)}</strong><p>${esc(w.forms.join(' / '))}</p><small>${esc(record(w))} · ${st(w).seen?(st(w).level>=2?'已熟悉':'复习中'):'未学习'}</small></div><div class="definition"><p>${esc(w.meaning)}</p><p class="memory-preview">${esc(w.memory?.type||'记忆提示')} · ${esc(w.memory?.text||'结合原句记忆')}</p><p>${esc(w.synonyms||'')}</p><small>${esc(w.articles.slice(0,4).join('；'))}${w.articles.length>4?' 等':''}</small></div>${tab==='excluded'?`<button data-restore="${esc(w.id)}">恢复</button>`:`<button data-star="${esc(w.id)}" aria-label="调整重点">${starred(w)?'★':'☆'}</button>`}</article>`).join('')+`<div class="pager"><button data-page="-1" ${page===0?'disabled':''}>上一页</button><span>${page+1} / ${Math.ceil(list.length/60)}</span><button data-page="1" ${(page+1)*60>=list.length?'disabled':''}>下一页</button></div>`:'<p class="empty-list">这里暂时没有匹配的词，试试其他筛选条件。</p>';return}
const w=queue[cursor];$('card').hidden=!w;$('empty').hidden=!!w;$('ratings').hidden=true;shown=false;$('answer').hidden=true;for(const id of ['meaning','memoryType','memoryText','source','synonyms'])$(id).textContent='';$('exclude').hidden=!w;if(!w)return;$('word').textContent=w.word;$('phonetic').textContent=w.phonetic?`/ ${w.phonetic} /`:'';$('forms').textContent=w.forms.length>1?'已合并：'+w.forms.join(' / '):'';$('star').textContent=starred(w)?'★':'☆';$('wordTag').textContent=deck==='listening'&&w.frequency===null?w.calendar+' · 基础日期':deck==='listening'?`听力高频 · ${w.frequency} 篇`:deck==='reading'?w.tags.map(t=>labels[t]).join(' / '):w.count>1?`重复记录 · ${w.count} 条`:st(w).seen?'正在复习':'首次学习';$('answer').hidden=true;$('reveal').hidden=false;$('position').textContent=`${cursor+1} / ${queue.length}`}
function flip(){const w=queue[cursor];if(!w||tab!=='study')return;$('sourceLabel').textContent=deck==='listening'?'听力来源与考频':'阅读来源';$('meaning').textContent=w.meaning;$('memoryType').textContent=w.memory?.type||'联想记忆';$('memoryText').textContent=w.memory?.text||'结合原句和常用搭配记忆。';$('source').textContent=record(w)+'。'+w.articles.slice(0,5).join('；')+(w.articles.length>5?`；另 ${w.articles.length-5} 篇`:'')+(deck==='listening'&&w.sourceDate?`。核对于 ${w.sourceDate}${w.meaningSupplemented?'；中文释义为补充常用义':''}`:'');$('synonyms').textContent=w.synonyms?'常见近义表达（非逐题验证）：'+w.synonyms:'';shown=true;$('answer').hidden=false;$('reveal').hidden=true;$('ratings').hidden=false;checkpoint()}
function rate(r){if(!shown||!queue[cursor])return;let w=queue[cursor],p=st(w),level=r==='good'?Math.min((p.level||0)+1,6):0,delay=r==='again'?0:r==='hard'?1:[0,3,7,14,30,60,90][level];state.items[w.id]={...p,seen:true,level,due:Date.now()+delay*86400000,updated:Date.now()};state.days[day()]=(state.days[day()]||0)+1;if(r==='again')queue.push(w);cursor++;session++;render();checkpoint()}
function star(id){let w=words.find(x=>x.id===id);if(!w)return;state.items[id]={...st(w),star:!starred(w),updated:Date.now()};save();render();checkpoint()}
document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{checkpoint();tab=b.dataset.tab;page=0;document.querySelectorAll('[data-tab]').forEach(n=>n.classList.toggle('active',n===b));$('tabLabel').textContent=b.textContent.trim().replace('161','');if(tab==='study'){if(!resumeRound())build()}else render()});['article','mode','frequency','kind','listeningPart','listeningFrequency','listeningKind'].forEach(id=>$(id).onchange=build);$('search').oninput=build;$('reveal').onclick=flip;$('star').onclick=()=>star(queue[cursor]?.id);$('list').onclick=e=>{let b=e.target.closest('[data-star]');if(b)star(b.dataset.star);let r=e.target.closest('[data-restore]');if(r)recover(r.dataset.restore);let p=e.target.closest('[data-page]');if(p){page+=Number(p.dataset.page);render()}};document.querySelectorAll('[data-rate]').forEach(b=>b.onclick=()=>rate(b.dataset.rate));$('shuffle').onclick=()=>{let rest=queue.slice(cursor);for(let i=rest.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[rest[i],rest[j]]=[rest[j],rest[i]]}queue=[...queue.slice(0,cursor),...rest];render();checkpoint()};$('browseAll').onclick=()=>{$('mode').value='every';build()};$('speak').onclick=()=>{if(!('speechSynthesis'in window)){toast('此浏览器不支持语音朗读');return}if(!queue[cursor])return;let u=new SpeechSynthesisUtterance(queue[cursor].spoken||queue[cursor].word);u.lang='en-GB';u.rate=.85;u.onerror=()=>toast('朗读暂不可用，请检查设备语音服务');speechSynthesis.cancel();speechSynthesis.speak(u)};
const typing=e=>['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)||e.target.isContentEditable;
let advancingWithSpace=false;
document.addEventListener('keydown',e=>{
  const dictation=window.Dictation;
  const spellingField=e.target===$('spellingInput');
  const practiceShortcut=!e.defaultPrevented&&!e.isComposing&&
    !e.ctrlKey&&!e.altKey&&!e.metaKey&&!e.shiftKey&&(!typing(e)||spellingField);
  if(e.code==='Space'){
    if(!e.repeat)advancingWithSpace=false;
    if(advancingWithSpace){e.preventDefault();return}
    if(practiceShortcut&&!e.repeat&&dictation?.advanceAfterSubmit()){
      advancingWithSpace=true;
      e.preventDefault();
      return;
    }
  }
  if(deck==='listening'&&tab==='study'&&e.key==='5'&&practiceShortcut){
    if(dictation?.active()&&!$('playDictation').disabled){
      e.preventDefault();
      if(!e.repeat){dictation.play();$('spellingInput').focus()}
    }else if(!dictation?.active()&&!typing(e)&&queue[cursor]){
      e.preventDefault();
      if(!e.repeat)$('speak').onclick();
    }
    return;
  }
  if(typing(e)||tab!=='study'||dictation?.active())return;if(e.code==='Space'){e.preventDefault();if(!e.repeat)flip();return}if(e.repeat)return;if(e.key==='4'){e.preventDefault();exclude();return}if(shown&&['1','2','3'].includes(e.key)){e.preventDefault();rate(['again','hard','good'][+e.key-1])}});
// A handled Space press must not also activate a focused button on release.
document.addEventListener('keyup',e=>{
  if(e.code!=='Space')return;
  if(advancingWithSpace||(!typing(e)&&tab==='study'&&!window.Dictation?.active()))e.preventDefault();
  advancingWithSpace=false;
});
$('backup').onclick=()=>{let data=JSON.stringify({type:'translation-progress',version:2,decks:{...Object.fromEntries(Object.keys(decks).map(k=>[k,readState(k)])),[deck]:state}},null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download=`translation-progress-${day()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};$('restore').onclick=()=>$('file').click();function keyFor(d){return d==='highlight'?'shici-progress-v1':d==='listening'?'translation-listening-v1':'translation-reading-v1'}
function readState(d){if(d===deck)return state;try{let s=JSON.parse(localStorage.getItem(keyFor(d)));if(s?.items&&s?.days)return s}catch{}return {items:{},days:{}}}
function validateState(s){window.Dictation?.validateState(s);if(!s||typeof s.items!=='object'||!s.items||Array.isArray(s.items)||!s.days||typeof s.days!=='object'||Array.isArray(s.days))throw Error();for(const [id,p]of Object.entries(s.items)){if(!p||typeof p!=='object'||!Number.isFinite(p.updated)||p.level!==undefined&&(!Number.isInteger(p.level)||p.level<0||p.level>6)||p.due!==undefined&&!Number.isFinite(p.due)||['star','seen','excluded'].some(k=>p[k]!==undefined&&typeof p[k]!=='boolean'))throw Error()}for(const [n,v]of Object.entries(s.days))if(!/^\d{4}-\d{2}-\d{2}$/.test(n)||!Number.isSafeInteger(v)||v<0)throw Error()}
$('file').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{if(f.size>5e6)throw Error();let d=JSON.parse(await f.text()),incoming=d.type==='shici-progress'&&d.version===1?{highlight:d.state}:d.type==='translation-progress'&&d.version===2?d.decks:null;if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw Error();for(const [k,s]of Object.entries(incoming)){if(!decks[k])throw Error();validateState(s)}for(const[k,s]of Object.entries(incoming)){const target=readState(k),valid=new Set(decks[k].map(w=>w.id));for(const[id,p]of Object.entries(s.items))if(valid.has(id)&&p.updated>(target.items[id]?.updated||0))target.items[id]={...p};for(const[n,v]of Object.entries(s.days))target.days[n]=Math.max(target.days[n]||0,v);window.Dictation?.mergeState(target,s);if(s.round&&(!target.round||Number(s.round.updated)>Number(target.round.updated)))target.round=s.round;localStorage.setItem(keyFor(k),JSON.stringify(target));if(k===deck)state=target}if(tab==='study'){if(!resumeRound())build()}else render();window.CloudSync?.changed();toast('学习进度已合并，三个词本仍独立保存')}catch{toast('导入失败，请选择本网站导出的有效进度文件')}e.target.value=''};
function selectDeck(next){
 window.Dictation?.stop();
 if(!decks[next]){$('deck').value=deck;toast('词库加载中，请稍候');return}
 if(words.length){checkpoint();save()}
 deck=next;KEY=keyFor(deck);try{localStorage.setItem('translation-active-deck',deck)}catch{}
 words=decks[deck];state=readStored(KEY);$('deck').value=deck;
 $('article').innerHTML='<option value="">全部来源文章</option>';
 [...new Set(words.flatMap(w=>w.articles))].forEach(a=>{let o=document.createElement('option');o.value=a;o.textContent=a;$('article').append(o)});
 for(const id of ['article','search','frequency','kind','listeningPart','listeningFrequency','listeningKind'])$(id).value='';
 $('mode').value='all';$('frequency').hidden=$('kind').hidden=deck!=='reading';
 for(const id of ['listeningPart','listeningFrequency','listeningKind','listeningInfo'])$(id).hidden=deck!=='listening';
 $('listeningShortcut').classList.toggle('active',deck==='listening');$('total').textContent=words.length;
 $('heading').textContent=deck==='listening'?'让听见，变成记得。':deck==='reading'?'把重复遇见，变成得分。':'让高亮，变成记得。';
 $('subtitle').textContent=deck==='listening'?'215 项听力高频词 + 15 项日期词汇补充 · 听音拼写':deck==='reading'?    `${meta.articles} 篇高 / 中 / 低频文章 · 基础词已过滤 · 答案词优先`:'从你读过的 15 篇文章开始，一次记住一个词。';
 $('corpusInfo').textContent=deck==='listening'?'九分学长听力填空词表 · 215 项高频词汇 + 15 项基础日期词汇':deck==='reading'?    `${meta.cards} 张词卡 · 高频 ${meta.levels.high} / 中频 ${meta.levels.medium} / 低频 ${meta.levels.low} 篇`:'163 条原始记录 · 161 张合并词卡';
 page=0;if(tab==='study'){if(!resumeRound())build()}else render()
}
function readStored(k){try{const x=JSON.parse(localStorage.getItem(k));if(x?.items&&x?.days)return x}catch{}return {items:{},days:{}}}
$('deck').onchange=()=>{selectDeck($('deck').value);history.replaceState(null,'','#'+deck)};$('listeningShortcut').onclick=()=>{selectDeck('listening');window.Dictation?.startWord();history.replaceState(null,'','#listening')};window.addEventListener('hashchange',()=>{const d=location.hash.slice(1);if(decks[d]&&d!==deck)selectDeck(d)});$('exclude').onclick=exclude;
(async()=>{try{const [r,t,l]=await Promise.all([fetch('words.json',{cache:'no-store'}),fetch('reading-words.json',{cache:'no-store'}),fetch('listening-words.json?v=calendar1',{cache:'no-store'})]);if(!r.ok||!t.ok||!l.ok)throw Error();const reading=await t.json();decks={highlight:await r.json(),reading:reading.words,listening:await l.json()};meta=reading.meta;state=readStored(KEY);$('readingAbout').innerHTML=`<p>阅读重复词：固定题库快照（2026-11-04），共 ${meta.articles} 篇。只收录正文至少出现在 2 篇中的词；按词形规则近似归并，非人工逐句词性分析。高/中/低频是文章标签，词卡另列覆盖篇数和出现次数。剔除人工基础词表、ECDICT Oxford 常用词标记和 Collins 4–5 星常见词，共过滤 ${meta.basicExcluded} 个重复候选词；基础程度仍因人而异，可按 4 自行排除。</p><p>优先项：${meta.tags.answer} 个实际答案词（包括多词答案的组成词）；${meta.tags.judgment} 个判断题题干词，不等于每个词都是判题关键。标签可重叠；未发布题目答案对应表。only/all 表范围，may/must 表可能性或必要性；判断须比对原文，不能只凭这些词判定正误。</p><p>补充依据：<a href="${esc(meta.bookUrl)}" target="_blank" rel="noopener">${esc(meta.book)}</a>，仅核对官方样章，不声称涵盖整本书。中文常用义与音标来自 <a href="https://github.com/skywind3000/ECDICT" target="_blank" rel="noopener">ECDICT（MIT）</a>，释义不代替原句义。近义备注为常见用法说明，未逐题验证同义替换。</p><p>题库来源：<a href="https://github.com/sallowayma-git/IELTS-practice/tree/${esc(meta.commit.trim())}" target="_blank" rel="noopener">公开阅读题库快照</a>。三个词本独立保存词卡状态和本轮位置，排除后所有学习模式均不再出现，恢复时保留旧熟悉度。导出包含三个词本，兼容旧版高亮词进度导入。</p>`;$('date').textContent=new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});let preferred;try{preferred=localStorage.getItem('translation-active-deck')}catch{}const fromHash=location.hash.slice(1);selectDeck(decks[fromHash]?fromHash:decks[preferred]?preferred:'highlight');window.VocabState={
 snapshot:()=>JSON.parse(JSON.stringify(Object.fromEntries(Object.keys(decks).map(k=>[k,readState(k)])))),
 validate:incoming=>{if(!incoming||typeof incoming!=='object'||Array.isArray(incoming))throw Error('同步词本格式不正确');for(const[k,value]of Object.entries(incoming)){if(!decks[k])throw Error('未知词本');validateState(value)}},
 apply:incoming=>{window.VocabState.validate(incoming);for(const[k,value]of Object.entries(incoming))localStorage.setItem(keyFor(k),JSON.stringify(value));if(incoming[deck]){state=JSON.parse(JSON.stringify(incoming[deck]));window.Dictation?.resetView();if(tab==='study'){if(!resumeRound(false))build({persist:false})}else render();localStorage.setItem(KEY,JSON.stringify(state))}}
};window.dispatchEvent?.(new Event('vocab:ready'))}catch{$('word').textContent='词库加载失败';$('reveal').hidden=true;toast('请刷新页面重试')}})();

