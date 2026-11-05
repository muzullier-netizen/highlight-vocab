/* Original audio and labelled synthetic sentences use separate practice modes. */
(() => {
  const LIMIT=25*1024*1024, PACK_LIMIT=110*1024*1024;
  const normalize=s=>String(s).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  let clips=[],clipsReady=false,dbPromise=null,lastCard='',previewUrl='',playUrl='',audio=null,playSerial=0,linkApplied=false;
  const current=()=>queue[cursor];
  const data=()=>state.dictation||(state.dictation={version:1,mode:'cards',rate:1,wrongOnly:false,stats:{word:{},sentence:{}},rounds:{}});
  const active=()=>deck==='listening'&&tab==='study'&&['word','sentence','synthetic'].includes(data().mode);
  const mode=()=>data().mode;
  const entries=()=>data().stats[mode()]||(data().stats[mode()]={});
  const metric=id=>entries()[id]||{};
  const persist=()=>{data().updated=Date.now();save()};
  function stop(){playSerial++;if('speechSynthesis'in window)speechSynthesis.cancel();if(audio){audio.pause();audio=null}if(playUrl){URL.revokeObjectURL(playUrl);playUrl=''}}
  function database(){
    if(!('indexedDB'in window))return Promise.reject(Error('此浏览器不能保存原音资料，单词拼写仍可使用。'));
    if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const r=indexedDB.open('translation-original-listening-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('clips',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('无法打开原音资料库。'))});
    return dbPromise;
  }
  async function allClips(){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('clips','readonly'),r=tx.objectStore('clips').getAll();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error('读取原音失败。'))})}
  async function storeClips(list){const db=await database();return new Promise((resolve,reject)=>{const tx=db.transaction('clips','readwrite');for(const c of list)tx.objectStore('clips').put(c);tx.oncomplete=resolve;tx.onerror=()=>reject(Error('保存原音失败，请检查浏览器可用空间。'));tx.onabort=()=>reject(Error('原音保存未完成。'))})}
  async function refreshClips(){clips=await allClips();clipsReady=true;lastCard='';render()}
  function markedSentence(s){const matches=[...String(s).matchAll(/\[([^\[\]]+)\]/g)];if(matches.length!==1)throw Error('请只用一对英文 [ ] 标出答案。');const m=matches[0],answer=m[1].trim();if(!answer)throw Error('答案不能为空。');const escaped=answer.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),pattern=new RegExp('\\b'+escaped+'\\b','gi');return {answer,masked:s.slice(0,m.index).replace(pattern,'______')+' ______ '+s.slice(m.index+m[0].length).replace(pattern,'______'),full:s.replace(m[0],m[1])}}
  function builtInSentences(){
    const list=[];
    for(const s of window.CambridgeSentences||[])for(const target of s.targets){
      const w=decks.listening?.find(w=>normalize(w.word)===normalize(target));if(!w)continue;
      const escaped=target.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),sentence=s.text.replace(new RegExp('\\b'+escaped+'\\b','i'),m=>'['+m+']');
      list.push({id:'cambridge:'+s.id+':'+normalize(target),wordId:w.id,source:`剑雅 ${s.book} · Test ${s.test} · Part ${s.part}${s.question?' · '+s.question:''}`,sentence,url:s.url,updated:1793836800000,tts:true});
    }
    return list;
  }
  function syntheticSentences(){return [...builtInSentences(),...(data().materials||[]).map(c=>({...c,tts:true}))]}
  const sentencePool=()=>mode()==='synthetic'?syntheticSentences():clips;
  function checkText(c){
    const w=decks.listening?.find(w=>w.id===c.wordId);
    if(!w||typeof c.id!=='string'||c.id.length>200||typeof c.source!=='string'||!c.source.trim()||c.source.length>200||typeof c.sentence!=='string'||c.sentence.length>2000||!Number.isFinite(c.updated))throw Error('合成音原句资料格式不正确。');
    const answer=markedSentence(c.sentence).answer;
    if(![w.word,w.spoken||w.word].some(x=>normalize(x)===normalize(answer)))throw Error('[ ] 内的答案必须与所选词卡一致。');
    return {id:c.id,wordId:c.wordId,source:c.source.trim(),sentence:c.sentence,updated:c.updated};
  }
  function populateVoices(){
    const selected=data().voiceURI||'',select=$('voiceSelect');select.innerHTML='';
    const add=(value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o)};
    add('','自动选择 · 英音优先');
    for(const v of (window.speechSynthesis?.getVoices?.()||[]).filter(v=>/^en[-_]/i.test(v.lang)).sort((a,b)=>Number(/^en[-_]GB/i.test(b.lang))-Number(/^en[-_]GB/i.test(a.lang))))add(v.voiceURI||v.name,v.name+' · '+v.lang);
    select.value=[...select.children].some(o=>o.value===selected)?selected:'';
  }
  function checkClip(c){
    const w=decks.listening?.find(w=>w.id===c.wordId);
    if(!w||typeof c.id!=='string'||c.id.length>200||typeof c.source!=='string'||!c.source.trim()||c.source.length>200||typeof c.sentence!=='string'||c.sentence.length>2000||!Number.isFinite(c.start)||!Number.isFinite(c.end)||c.start<0||c.end<=c.start||c.end-c.start>180||!Number.isFinite(c.updated))throw Error('原题片段资料格式不正确。');
    const marked=markedSentence(c.sentence);
    if(![w.word,w.spoken||w.word].some(x=>normalize(x)===normalize(marked.answer)))throw Error('原句中 [ ] 内的答案必须与所选词卡一致。');
    if(!(c.blob instanceof Blob)||!c.blob.size||c.blob.size>LIMIT||!c.blob.type.startsWith('audio/'))throw Error('请提供不超过 25 MB 的原录音文件。');
    return c;
  }
  function filteredCandidates(){
    let list=filtered().filter(w=>!st(w).excluded);
    if($('mode').value==='focus')list=list.filter(starred);
    if($('mode').value==='new')list=list.filter(w=>!(metric(w.id).firstAttempts));
    if(data().wrongOnly)list=list.filter(w=>metric(w.id).needsReview);
    list.sort((a,b)=>b.frequency-a.frequency);
    if(mode()!=='word')return list.flatMap(w=>sentencePool().filter(c=>c.wordId===w.id).map(c=>({id:c.id,w,c})));
    return list.map(w=>({id:w.id,w}));
  }
  function round(){
    const d=data(),list=filteredCandidates(),byId=new Map(list.map(x=>[x.id,x]));
    const signature=JSON.stringify([$('article').value,$('search').value,$('mode').value,$('listeningPart').value,$('listeningFrequency').value,$('listeningKind').value,d.wrongOnly,mode()!=='word'?sentencePool().map(c=>c.id+':'+c.updated).sort():null]);
    let r=d.rounds[mode()];
    if(!r||r.signature!==signature){r=d.rounds[mode()]={signature,ids:list.map(x=>x.id),cursor:0,submitted:false,assisted:false,first:true,draft:'',updated:Date.now()}}
    // Keep completed positions; live exclusions and missing audio cannot re-enter practice.
    const wordMap=new Map(decks.listening.map(w=>[w.id,w]));
    const valid=id=>mode()==='word'?wordMap.has(id)&&!st(wordMap.get(id)).excluded:sentencePool().some(c=>c.id===id&&wordMap.has(c.wordId)&&!st(wordMap.get(c.wordId)).excluded);
    const before=r.ids.slice(0,r.cursor).filter(valid),after=r.ids.slice(r.cursor).filter(valid);
    r.ids=[...before,...after];r.cursor=before.length;
    const id=r.ids[r.cursor];
    let item=byId.get(id);
    if(!item&&id){if(mode()==='word'){const w=wordMap.get(id);if(w)item={id,w}}else{const c=sentencePool().find(c=>c.id===id),w=c&&wordMap.get(c.wordId);if(c&&w)item={id,w,c}}}
    return {r,item};
  }
  function expected(item){return item.c?markedSentence(item.c.sentence).answer:item.w.category==='数值'?item.w.spoken:item.w.word}
  function acceptable(item){const target=expected(item),map={color:'colour',theater:'theatre'};return [target,...(map[normalize(target)]?[map[normalize(target)]]:[])]}
  function stats(){
    const values=Object.values(entries());
    const attempts=values.reduce((n,s)=>n+(s.firstAttempts||0),0),correct=values.reduce((n,s)=>n+(s.firstCorrect||0),0),wrong=values.filter(s=>s.needsReview).length;
    $('dictationStats').textContent=`本模式首次作答 ${attempts} 次 · 首次答对 ${correct} 次${attempts?' · 首次正确率 '+Math.round(correct/attempts*100)+'%':''} · 待重练 ${wrong} 词`;
  }
  function reveal(item){$('dictationSolution').hidden=false;$('spellingExpected').textContent='正确答案：'+expected(item);$('dictationTranscript').textContent=item.c?markedSentence(item.c.sentence).full:'';$('dictationMeaning').textContent=item.w.meaning+(item.c?' · 原句来源：'+item.c.source+(item.c.tts?' · 合成语音；设空用于词汇练习':' · '+item.c.start+'–'+item.c.end+' 秒'):'');const link=$('sentenceSourceLink');link.hidden=!item.c?.url;if(item.c?.url)link.href=item.c.url;}
  function render(){
    const isListening=deck==='listening'&&tab==='study';$('practiceSettings').hidden=!isListening;$('dictationPanel').hidden=!active();
    if(!isListening){if(lastCard)stop();lastCard='';return}
    if(!linkApplied){linkApplied=true;if(location.search?.includes('practice=synthetic')){data().mode='synthetic';persist()}}
    const d=data();$('practiceMode').value=d.mode;$('playbackRate').value=String(d.rate||1);$('wrongOnly').checked=!!d.wrongOnly;$('clipCount').textContent=clips.length+' 个原题片段';
    const texts=syntheticSentences(),covered=new Set(texts.map(c=>c.wordId)).size;
    $('syntheticCoverage').textContent=`原句合成音：${texts.length} 个练习 · 覆盖 ${covered} / ${decks.listening.length} 个高频词。未覆盖的词可先练单词拼写。`;
    $('voiceSettings').hidden=mode()==='sentence'||mode()==='cards';populateVoices();
    if(!$('clipWord').children.length){for(const id of ['clipWord','ttsWord'])for(const w of decks.listening){const o=document.createElement('option');o.value=w.id;o.textContent=w.word;$(id).append(o)}}
    if(!active()){lastCard='';stop();return}
    for(const id of ['card','ratings','empty','exclude'])$(id).hidden=true;
    if(mode()==='sentence'&&!clipsReady){$('dictationHeading').textContent='正在读取原音资料…';$('dictationForm').hidden=true;$('playDictation').disabled=true;$('nextSpelling').disabled=true;return}
    const {r,item}=round(),key=mode()+':'+(item?.id||'empty')+':'+r.cursor+':'+r.signature;
    $('dictationTag').textContent=mode()==='word'?'单词拼写 · 设备合成发音':mode()==='synthetic'?'剑雅原句 · 合成语音':'原句听写 · 原录音';
    $('dictationPosition').textContent=item?`${r.cursor+1} / ${r.ids.length}`:`${r.ids.length} / ${r.ids.length}`;
    $('dictationHeading').textContent=item?'听音，写下答案':mode()==='sentence'&&!clips.length?'尚未导入原题录音':mode()==='synthetic'&&!r.ids.length?'当前筛选暂无原句练习':'本轮已完成';
    $('dictationPrompt').textContent=item?(item.c?markedSentence(item.c.sentence).masked:item.w.category==='数值'?'请将听到的数字写成英文单词。':'先播放发音，再输入单词或短语。'):mode()==='sentence'&&!clips.length?'请展开上方“原题资料与换设备续学”，导入九分学长原录音、原句和时间段。':d.wrongOnly?'当前筛选中没有待重练的词。':mode()==='synthetic'&&!r.ids.length?'请放宽 Part、考频或搜索条件，也可添加已核对的原句。':'可调整筛选，或切换其他练习方式。';
    $('playDictation').disabled=!item;$('dictationForm').hidden=!item;$('showSpellingAnswer').disabled=!item;$('nextSpelling').disabled=!item;$('restartDictation').hidden=!!item;
    if(key!==lastCard){stop();lastCard=key;$('spellingInput').value=r.draft||'';$('spellingFeedback').textContent=r.submitted?'此词已作答，可重听、重新输入或进入下一词。':'';$('audioStatus').textContent='';$('dictationSolution').hidden=true;for(const id of ['spellingExpected','dictationTranscript','dictationMeaning'])$(id).textContent=''}
    $('checkSpelling').disabled=!!r.submitted;$('retrySpelling').hidden=!r.submitted;$('nextSpelling').textContent=r.submitted?'下一词 →':'跳过此词';stats();
  }
  function record(item,correct,assisted=false){
    const {r}=round(),old=metric(item.w.id),now=Date.now();
    entries()[item.w.id]={...old,attempts:(old.attempts||0)+(assisted?0:1),correct:(old.correct||0)+(correct?1:0),wrong:(old.wrong||0)+(!correct&&!assisted?1:0),reveals:(old.reveals||0)+(assisted?1:0),firstAttempts:(old.firstAttempts||0)+(r.first?1:0),firstCorrect:(old.firstCorrect||0)+(r.first&&correct&&!r.assisted&&!assisted?1:0),needsReview:!correct||r.assisted||assisted,updated:now};
    r.first=false;r.submitted=true;r.updated=now;persist();
  }
  function submit(e){e?.preventDefault();if(!active())return;const {r,item}=round();if(!item||r.submitted)return;const answer=$('spellingInput').value;if(!answer.trim()){ $('spellingFeedback').textContent='请先输入答案。';return }
    const correct=acceptable(item).some(x=>normalize(x)===normalize(answer));r.draft=answer;record(item,correct);
    $('spellingFeedback').textContent=correct?(r.assisted?'拼写正确。本题已查看过答案，不计为首次答对。':'拼写正确。'): `还差一点。你输入的是“${answer}”；正确答案是“${expected(item)}”。请注意字母、空格和单复数。`;
    $('spellingFeedback').dataset.result=correct?'correct':'wrong';reveal(item);render();
  }
  async function play(){
    if(!active())return;const {item}=round();if(!item)return;stop();const serial=playSerial;
    if(item.c&&!item.c.tts){
      playUrl=URL.createObjectURL(item.c.blob);audio=new Audio(playUrl);const player=audio;player.preload='auto';player.playbackRate=data().rate||1;
      player.onloadedmetadata=async()=>{if(serial!==playSerial)return;if(item.c.end>player.duration+.1){$('audioStatus').textContent='片段结束时间超过录音长度，请重新核对资料。';stop();return}player.currentTime=item.c.start;try{await player.play();if(serial===playSerial)$('audioStatus').textContent='正在播放导入的原题片段'}catch{if(serial===playSerial)$('audioStatus').textContent='播放未开始，请再次点击播放。'}};
      player.ontimeupdate=()=>{if(player.currentTime>=item.c.end){player.pause();if(serial===playSerial)$('audioStatus').textContent='原题片段播放结束，可点击重听。'}};
      player.onerror=()=>{if(serial===playSerial)$('audioStatus').textContent='此浏览器无法播放该原音格式，请导入 MP3 或其他受支持的原录音。'};
      return;
    }
    if(!('speechSynthesis'in window)){$('audioStatus').textContent='此浏览器不支持设备朗读，请换用支持语音的浏览器。';return}
    const utterance=new SpeechSynthesisUtterance(item.c?markedSentence(item.c.sentence).full:item.w.spoken||item.w.word);
    const voices=window.speechSynthesis?.getVoices?.()||[],english=voices.filter(v=>/^en[-_]/i.test(v.lang));
    if(voices.length&&!english.length){$('audioStatus').textContent='设备未提供英语语音，请在系统中添加英语语音后重试。';return}
    const voice=english.find(v=>(v.voiceURI||v.name)===data().voiceURI)||english.find(v=>/^en[-_]GB/i.test(v.lang))||english[0];
    if(voice)utterance.voice=voice;utterance.lang=voice?.lang||'en-GB';utterance.rate=data().rate||1;
    utterance.onend=()=>{if(serial===playSerial)$('audioStatus').textContent='发音播放结束，可点击重听。'};
    utterance.onerror=()=>{if(serial===playSerial)$('audioStatus').textContent='设备语音暂不可用；请检查系统语音与音量后重试。'};
    $('audioStatus').textContent=(item.c?'正在播放原句合成语音':'正在播放设备合成发音')+(voice?' · '+voice.name+' · '+voice.lang:' · 英音优先，取决于设备可用语音');speechSynthesis.speak(utterance);
  }
  function validateState(s){
    if(!s?.dictation)return;const d=s.dictation,plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
    if(d.version!==1||!['cards','word','sentence','synthetic'].includes(d.mode)||!plain(d.stats)||!plain(d.rounds)||d.rate!==undefined&&![1,.85,.7].includes(d.rate)||d.wrongOnly!==undefined&&typeof d.wrongOnly!=='boolean'||d.updated!==undefined&&!Number.isFinite(d.updated))throw Error('听写进度格式不正确');
    if(d.voiceURI!==undefined&&(typeof d.voiceURI!=='string'||d.voiceURI.length>500))throw Error('语音选择格式不正确。');
    if(d.materials!==undefined){if(!Array.isArray(d.materials)||d.materials.length>500)throw Error('原句数量超过限制。');const seen=new Set();for(const c of d.materials){checkText(c);if(!c.id.startsWith('custom:')||seen.has(c.id))throw Error('原句编号不正确。');seen.add(c.id)}}
    for(const type of Object.keys(d.stats))if(!['word','sentence','synthetic'].includes(type)||!plain(d.stats[type]))throw Error('听写统计类型不正确');
    const ids=new Set((decks.listening||[]).map(w=>w.id));
    for(const type of ['word','sentence','synthetic'])for(const[id,v]of Object.entries(d.stats[type]||{})){
      if(!ids.has(id)||!plain(v)||!Number.isFinite(v.updated))throw Error('听写词卡统计不正确');
      for(const key of ['attempts','correct','wrong','reveals','firstAttempts','firstCorrect'])if(v[key]!==undefined&&(!Number.isSafeInteger(v[key])||v[key]<0))throw Error('听写次数不正确');
      if(v.needsReview!==undefined&&typeof v.needsReview!=='boolean'||(v.firstCorrect||0)>(v.firstAttempts||0)||(v.correct||0)>(v.attempts||0))throw Error('听写统计不正确');
    }
    for(const[type,r]of Object.entries(d.rounds))if(!['word','sentence','synthetic'].includes(type)||!plain(r)||!Array.isArray(r.ids)||r.ids.some(id=>typeof id!=='string')||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>r.ids.length||typeof r.signature!=='string'||r.updated!==undefined&&!Number.isFinite(r.updated)||r.draft!==undefined&&(typeof r.draft!=='string'||r.draft.length>500)||['submitted','assisted','first'].some(k=>r[k]!==undefined&&typeof r[k]!=='boolean'))throw Error('听写续学位置格式不正确');
  }
  function mergeState(target,incoming){if(!incoming.dictation)return;validateState(incoming);if(!target.dictation){target.dictation=structuredClone(incoming.dictation);return}const a=target.dictation,b=incoming.dictation;const materials=new Map((a.materials||[]).map(c=>[c.id,c]));for(const c of b.materials||[])if(c.updated>(materials.get(c.id)?.updated||0))materials.set(c.id,checkText(c));if(materials.size>500)throw Error('合并后的原句超过 500 条。');a.materials=[...materials.values()];for(const type of ['word','sentence','synthetic']){a.stats[type]||={};for(const[id,v]of Object.entries(b.stats[type]||{}))if(v.updated>(a.stats[type][id]?.updated||0))a.stats[type][id]={...v}}for(const[type,r]of Object.entries(b.rounds))if((r.updated||0)>(a.rounds[type]?.updated||0))a.rounds[type]=structuredClone(r);if((b.updated||0)>(a.updated||0)){a.mode=b.mode;a.rate=b.rate;a.voiceURI=b.voiceURI||'';a.wrongOnly=b.wrongOnly;a.updated=b.updated}}
  function fileData(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
  async function exportPack(){const status=$('materialStatus');try{stop();status.textContent='正在打包原音与进度…';const all=await allClips();if(all.reduce((n,c)=>n+c.blob.size,0)>75*1024*1024)throw Error('原音总量超过 75 MB，请分批整理资料。');const packed=[];for(const c of all){const{blob,...fields}=c;packed.push({...fields,audio:await fileData(blob)})}const payload={type:'translation-listening-package',version:1,exported:Date.now(),state:readState('listening'),clips:packed};const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='listening-package-'+day()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='学习包已导出，包含原音、句子、拼写记录与续学位置。'}catch(error){status.textContent=error.message}}
  async function importPack(file){if(!file)return;const status=$('materialStatus');try{if(file.size>PACK_LIMIT)throw Error('学习包超过 110 MB。');const p=JSON.parse(await file.text());if(p.type!=='translation-listening-package'||p.version!==1||!Array.isArray(p.clips)||p.clips.length>1000)throw Error('请选择本网站导出的学习包。');window.validateState?.(p.state);validateState(p.state);const incoming=[];for(const c of p.clips){if(typeof c.audio!=='string'||!/^data:audio\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(c.audio))throw Error('原音资料格式不正确。');const[type,base64]=c.audio.split(';base64,'),binary=atob(base64),bytes=Uint8Array.from(binary,x=>x.charCodeAt(0));const{audio:unused,...fields}=c;incoming.push(checkClip({...fields,blob:new Blob([bytes],{type:type.slice(5)})}))}const existing=await allClips(),updated=incoming.filter(c=>c.updated>(existing.find(x=>x.id===c.id)?.updated||0));await storeClips(updated);const target=readState('listening');mergeState(target,p.state);for(const[id,v]of Object.entries(p.state.items||{}))if(decks.listening.some(w=>w.id===id)&&v.updated>(target.items[id]?.updated||0))target.items[id]={...v};for(const[d,n]of Object.entries(p.state.days||{}))target.days[d]=Math.max(target.days[d]||0,n);if(p.state.round&&p.state.round.updated>(target.round?.updated||0))target.round=p.state.round;localStorage.setItem(keyFor('listening'),JSON.stringify(target));if(deck==='listening')state=target;await refreshClips();status.textContent='原音与较新的进度已合并。请切换到原句听写继续。'}catch(error){status.textContent='导入失败：'+error.message}}
  $('voiceSelect').onchange=()=>{data().voiceURI=$('voiceSelect').value;persist();stop()};
  window.speechSynthesis?.addEventListener?.('voiceschanged',()=>{if(deck==='listening')populateVoices()});
  $('ttsForm').onsubmit=e=>{e.preventDefault();const status=$('ttsMaterialStatus');try{
    if(!$('confirmText').checked)throw Error('请先核对原句与来源。');
    const source=$('ttsSource').value.trim(),sentence=$('ttsSentence').value.trim(),wordId=$('ttsWord').value;
    const existing=(data().materials||[]).find(c=>c.wordId===wordId&&c.source===source&&c.sentence===sentence);
    const c=checkText({id:existing?.id||'custom:'+Date.now()+':'+Math.random().toString(36).slice(2),wordId,source,sentence,updated:Date.now()});
    if(existing)throw Error('此原句已保存，无需重复添加。');
    if((data().materials||[]).length>=500)throw Error('本地原句已达到 500 条。');
    data().materials||=[];data().materials.push(c);lastCard='';persist();render();status.textContent='原句已保存，可切换到原句合成音练习。导出进度或学习包可带到另一台设备。';
  }catch(error){status.textContent=error.message}};
  $('practiceMode').onchange=()=>{stop();data().mode=$('practiceMode').value;lastCard='';persist();window.render?.();render()};
  $('playbackRate').onchange=()=>{data().rate=+$('playbackRate').value;persist();stop()};
  $('wrongOnly').onchange=()=>{data().wrongOnly=$('wrongOnly').checked;delete data().rounds[mode()];lastCard='';persist();render()};
  $('dictationForm').onsubmit=submit;$('playDictation').onclick=play;$('stopDictation').onclick=stop;
  $('spellingInput').oninput=()=>{if(!active())return;const {r}=round();r.draft=$('spellingInput').value.slice(0,500);r.updated=Date.now();persist()};
  $('showSpellingAnswer').onclick=()=>{const{r,item}=round();if(!item)return;const peek=!r.submitted;if(peek){r.assisted=true;record(item,false,true)}reveal(item);$('spellingFeedback').textContent=peek?'已查看答案，本题不计为首次答对。':'已展开正确答案。';render()};
  $('retrySpelling').onclick=()=>{const {r}=round();r.submitted=false;r.draft='';lastCard='';persist();render();$('spellingInput').focus()};
  $('nextSpelling').onclick=()=>{const{r}=round();stop();r.cursor++;r.submitted=false;r.assisted=false;r.first=true;r.draft='';r.updated=Date.now();lastCard='';persist();render()};
  $('restartDictation').onclick=()=>{delete data().rounds[mode()];lastCard='';persist();render()};
  $('clipAudio').onchange=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);const file=$('clipAudio').files[0];if(!file)return;previewUrl=URL.createObjectURL(file);$('clipPreview').src=previewUrl};
  $('useStartTime').onclick=()=>{$('clipStart').value=$('clipPreview').currentTime.toFixed(2)};$('useEndTime').onclick=()=>{$('clipEnd').value=$('clipPreview').currentTime.toFixed(2)};
  $('clipForm').onsubmit=async e=>{e.preventDefault();const status=$('materialStatus');try{if(!$('confirmOriginal').checked)throw Error('请先核对原题来源。');const file=$('clipAudio').files[0];if(!file)throw Error('请选择原录音文件。');const wordId=$('clipWord').value,start=+$('clipStart').value,end=+$('clipEnd').value;if(!$('clipEnd').value)throw Error('请填写句子结束时间。');if(!Number.isFinite($('clipPreview').duration))throw Error('请等待原音载入，再核对时间。');if(end>$('clipPreview').duration+.1)throw Error('结束时间超过录音长度。');const blob=new Blob([file],{type:file.type||'audio/mpeg'}),c=checkClip({id:wordId+':'+start+':'+end,wordId,source:$('clipSource').value.trim(),sentence:$('clipSentence').value.trim(),start,end,blob,updated:Date.now()});await storeClips([c]);await refreshClips();status.textContent='原题片段已保存在本浏览器。导出学习包后可带到另一台电脑。'}catch(error){status.textContent=error.message}};
  $('exportListeningPack').onclick=exportPack;$('importListeningPack').onclick=()=>$('listeningPackFile').click();$('listeningPackFile').onchange=async e=>{await importPack(e.target.files[0]);e.target.value=''};
  window.addEventListener('pagehide',stop);window.Dictation={render,active,stop,normalize,markedSentence,validateState,mergeState,checkClip,checkText,builtInSentences,round,submit,importPack};
  render();refreshClips().catch(error=>{clipsReady=true;$('materialStatus').textContent=error.message;render()});
})();
