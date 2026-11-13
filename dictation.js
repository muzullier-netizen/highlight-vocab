/* Original audio and labelled synthetic sentences use separate practice modes. */
(() => {
  const LIMIT=25*1024*1024, PACK_LIMIT=110*1024*1024;
  const recordedWords={
    "listening:water": "audio/uk-ready/water.mp3",
    "listening:transport": "audio/uk-ready/transport.mp3",
    "listening:fire": "audio/uk-ready/fire.mp3",
    "listening:training": "audio/uk-ready/training.mp3",
    "listening:garden": "audio/uk-ready/garden.mp3",
    "listening:glass": "audio/uk-ready/glass.mp3",
    "listening:insects": "audio/uk-ready/insects.mp3",
    "listening:insurance": "audio/uk-ready/insurance.mp3",
    "listening:park": "audio/uk-ready/park.mp3",
    "listening:plastic": "audio/uk-ready/plastic.mp3",
    "listening:thursday": "audio/uk-ready/thursday.mp3",
    "listening:wood": "audio/uk-ready/wood.mp3",
    "listening:birds": "audio/uk-ready/birds.mp3",
    "listening:climate": "audio/uk-ready/climate.mp3",
    "listening:environment": "audio/uk-ready/environment.mp3",
    "listening:farm": "audio/uk-ready/farm.mp3",
    "listening:garage": "audio/uk-ready/garage.mp3",
    "listening:good map": "audio/uk-ready/good-map.mp3",
    "listening:light": "audio/uk-ready/light.mp3",
    "listening:plants": "audio/uk-ready/plants.mp3",
    "listening:temperature": "audio/uk-ready/temperature.mp3",
    "listening:time": "audio/uk-ready/time.mp3",
    "listening:forests": "audio/uk-ready/forests.mp3",
    "listening:furniture": "audio/uk-ready/furniture.mp3",
    "listening:health": "audio/uk-ready/health.mp3",
    "listening:helicopter": "audio/uk-ready/helicopter.mp3",
    "listening:library": "audio/uk-ready/library.mp3",
    "listening:migration": "audio/uk-ready/migration.mp3",
    "listening:river": "audio/uk-ready/river.mp3",
    "listening:smell": "audio/uk-ready/smell.mp3",
    "listening:station": "audio/uk-ready/station.mp3",
    "listening:stress": "audio/uk-ready/stress.mp3",
    "listening:tourism": "audio/uk-ready/tourism.mp3",
    "listening:40": "audio/uk-ready/40.mp3",
    "listening:agriculture": "audio/uk-ready/agriculture.mp3",
    "listening:bacteria": "audio/uk-ready/bacteria.mp3",
    "listening:clean": "audio/uk-ready/clean.mp3",
    "listening:confidence": "audio/uk-ready/confidence.mp3",
    "listening:desert": "audio/uk-ready/desert.mp3",
    "listening:family": "audio/uk-ready/family.mp3",
    "listening:flexible": "audio/uk-ready/flexible.mp3",
    "listening:flowers": "audio/uk-ready/flowers.mp3",
    "listening:food": "audio/uk-ready/food.mp3",
    "listening:government": "audio/uk-ready/government.mp3",
    "listening:hospital": "audio/uk-ready/hospital.mp3",
    "listening:hunting": "audio/uk-ready/hunting.mp3",
    "listening:manager": "audio/uk-ready/manager.mp3",
    "listening:money": "audio/uk-ready/money.mp3",
    "listening:museum": "audio/uk-ready/museum.mp3",
    "listening:noise": "audio/uk-ready/noise.mp3",
    "listening:parking": "audio/uk-ready/parking.mp3",
    "listening:photographs": "audio/uk-ready/photographs.mp3",
    "listening:roof": "audio/uk-ready/roof.mp3",
    "listening:safety": "audio/uk-ready/safety.mp3",
    "listening:salt": "audio/uk-ready/salt.mp3",
    "listening:school": "audio/uk-ready/school.mp3",
    "listening:soil": "audio/uk-ready/soil.mp3",
    "listening:stone": "audio/uk-ready/stone.mp3",
    "listening:storm": "audio/uk-ready/storm.mp3",
    "listening:tennis": "audio/uk-ready/tennis.mp3",
    "listening:tools": "audio/uk-ready/tools.mp3",
    "listening:weight": "audio/uk-ready/weight.mp3",
    "listening:8": "audio/uk-ready/8.mp3",
    "listening:amazing weather": "audio/uk-ready/amazing-weather.mp3",
    "listening:animals": "audio/uk-ready/animals.mp3",
    "listening:august": "audio/uk-ready/august.mp3",
    "listening:back": "audio/uk-ready/back.mp3",
    "listening:bones": "audio/uk-ready/bones.mp3",
    "listening:car": "audio/uk-ready/car.mp3",
    "listening:cave": "audio/uk-ready/cave.mp3",
    "listening:chocolate": "audio/uk-ready/chocolate.mp3",
    "listening:color": "audio/uk-ready/color.mp3",
    "listening:corn": "audio/uk-ready/corn.mp3",
    "listening:disease": "audio/uk-ready/disease.mp3",
    "listening:diseases": "audio/uk-ready/diseases.mp3",
    "listening:diving": "audio/uk-ready/diving.mp3",
    "listening:dry": "audio/uk-ready/dry.mp3",
    "listening:energy": "audio/uk-ready/energy.mp3",
    "listening:face": "audio/uk-ready/face.mp3",
    "listening:farming": "audio/uk-ready/farming.mp3",
    "listening:fear": "audio/uk-ready/fear.mp3",
    "listening:flooding": "audio/uk-ready/flooding.mp3",
    "listening:gold": "audio/uk-ready/gold.mp3",
    "listening:golf": "audio/uk-ready/golf.mp3",
    "listening:grass": "audio/uk-ready/grass.mp3",
    "listening:history": "audio/uk-ready/history.mp3",
    "listening:kitchen": "audio/uk-ready/kitchen.mp3",
    "listening:lock": "audio/uk-ready/lock.mp3",
    "listening:market": "audio/uk-ready/market.mp3",
    "listening:maths": "audio/uk-ready/maths.mp3",
    "listening:medicine": "audio/uk-ready/medicine.mp3",
    "listening:metal": "audio/uk-ready/metal.mp3",
    "listening:newspapers": "audio/uk-ready/newspapers.mp3",
    "listening:night": "audio/uk-ready/night.mp3",
    "listening:open": "audio/uk-ready/open.mp3",
    "listening:photos": "audio/uk-ready/photos.mp3",
    "listening:piano": "audio/uk-ready/piano.mp3",
    "listening:pollution": "audio/uk-ready/pollution.mp3",
    "listening:powder": "audio/uk-ready/powder.mp3",
    "listening:public": "audio/uk-ready/public.mp3",
    "listening:quality": "audio/uk-ready/quality.mp3",
    "listening:radio": "audio/uk-ready/radio.mp3",
    "listening:science": "audio/uk-ready/science.mp3",
    "listening:security": "audio/uk-ready/security.mp3",
    "listening:silver": "audio/uk-ready/silver.mp3",
    "listening:sleep": "audio/uk-ready/sleep.mp3",
    "listening:smoke": "audio/uk-ready/smoke.mp3",
    "listening:social": "audio/uk-ready/social.mp3",
    "listening:space": "audio/uk-ready/space.mp3",
    "listening:studio": "audio/uk-ready/studio.mp3",
    "listening:sun": "audio/uk-ready/sun.mp3",
    "listening:supermarket": "audio/uk-ready/supermarket.mp3",
    "listening:swimming": "audio/uk-ready/swimming.mp3",
    "listening:the cost": "audio/uk-ready/the-cost.mp3",
    "listening:trade": "audio/uk-ready/trade.mp3",
    "listening:triangle": "audio/uk-ready/triangle.mp3",
    "listening:waiter": "audio/uk-ready/waiter.mp3",
    "listening:wind": "audio/uk-ready/wind.mp3",
    "listening:10,000": "audio/uk-ready/10-000.mp3",
    "listening:12": "audio/uk-ready/12.mp3",
    "listening:19": "audio/uk-ready/19.mp3",
    "listening:2": "audio/uk-ready/2.mp3",
    "listening:advertising": "audio/uk-ready/advertising.mp3",
    "listening:age": "audio/uk-ready/age.mp3",
    "listening:air": "audio/uk-ready/air.mp3",
    "listening:balcony": "audio/uk-ready/balcony.mp3",
    "listening:basement": "audio/uk-ready/basement.mp3",
    "listening:beach": "audio/uk-ready/beach.mp3",
    "listening:bicycle": "audio/uk-ready/bicycle.mp3",
    "listening:books": "audio/uk-ready/books.mp3",
    "listening:business": "audio/uk-ready/business.mp3",
    "listening:cafe": "audio/uk-ready/cafe.mp3",
    "listening:carbon": "audio/uk-ready/carbon.mp3",
    "listening:carpet": "audio/uk-ready/carpet.mp3",
    "listening:cheese": "audio/uk-ready/cheese.mp3",
    "listening:city": "audio/uk-ready/city.mp3",
    "listening:clay": "audio/uk-ready/clay.mp3",
    "listening:communication": "audio/uk-ready/communication.mp3",
    "listening:competition": "audio/uk-ready/competition.mp3",
    "listening:culture": "audio/uk-ready/culture.mp3",
    "listening:dance": "audio/uk-ready/dance.mp3",
    "listening:danger": "audio/uk-ready/danger.mp3",
    "listening:deposit": "audio/uk-ready/deposit.mp3",
    "listening:depth": "audio/uk-ready/depth.mp3",
    "listening:deserts": "audio/uk-ready/deserts.mp3",
    "listening:diary": "audio/uk-ready/diary.mp3",
    "listening:diet": "audio/uk-ready/diet.mp3",
    "listening:dinner": "audio/uk-ready/dinner.mp3",
    "listening:discount": "audio/uk-ready/discount.mp3",
    "listening:drive": "audio/uk-ready/drive.mp3",
    "listening:driver": "audio/uk-ready/driver.mp3",
    "listening:emotion": "audio/uk-ready/emotion.mp3",
    "listening:expensive": "audio/uk-ready/expensive.mp3",
    "listening:film": "audio/uk-ready/film.mp3",
    "listening:fireworks": "audio/uk-ready/fireworks.mp3",
    "listening:fishing": "audio/uk-ready/fishing.mp3",
    "listening:forest": "audio/uk-ready/forest.mp3",
    "listening:frozen": "audio/uk-ready/frozen.mp3",
    "listening:gender": "audio/uk-ready/gender.mp3",
    "listening:genetic": "audio/uk-ready/genetic.mp3",
    "listening:guide": "audio/uk-ready/guide.mp3",
    "listening:hair": "audio/uk-ready/hair.mp3",
    "listening:headaches": "audio/uk-ready/headaches.mp3",
    "listening:humans": "audio/uk-ready/humans.mp3",
    "listening:ice": "audio/uk-ready/ice.mp3",
    "listening:income": "audio/uk-ready/income.mp3",
    "listening:information": "audio/uk-ready/information.mp3",
    "listening:internet": "audio/uk-ready/internet.mp3",
    "listening:july": "audio/uk-ready/july.mp3",
    "listening:lake": "audio/uk-ready/lake.mp3",
    "listening:language": "audio/uk-ready/language.mp3",
    "listening:learning": "audio/uk-ready/learning.mp3",
    "listening:meat": "audio/uk-ready/meat.mp3",
    "listening:milk": "audio/uk-ready/milk.mp3",
    "listening:mountains": "audio/uk-ready/mountains.mp3",
    "listening:movement": "audio/uk-ready/movement.mp3",
    "listening:mud": "audio/uk-ready/mud.mp3",
    "listening:museums": "audio/uk-ready/museums.mp3",
    "listening:natural": "audio/uk-ready/natural.mp3",
    "listening:number": "audio/uk-ready/number.mp3",
    "listening:nurse": "audio/uk-ready/nurse.mp3",
    "listening:ocean": "audio/uk-ready/ocean.mp3",
    "listening:oil": "audio/uk-ready/oil.mp3",
    "listening:outside": "audio/uk-ready/outside.mp3",
    "listening:photo": "audio/uk-ready/photo.mp3",
    "listening:post office": "audio/uk-ready/post-office.mp3",
    "listening:rats": "audio/uk-ready/rats.mp3",
    "listening:reading": "audio/uk-ready/reading.mp3",
    "listening:reasons": "audio/uk-ready/reasons.mp3",
    "listening:rivers": "audio/uk-ready/rivers.mp3",
    "listening:rocks": "audio/uk-ready/rocks.mp3",
    "listening:sailing": "audio/uk-ready/sailing.mp3",
    "listening:sales": "audio/uk-ready/sales.mp3",
    "listening:saturday": "audio/uk-ready/saturday.mp3",
    "listening:shipping": "audio/uk-ready/shipping.mp3",
    "listening:shower": "audio/uk-ready/shower.mp3",
    "listening:size": "audio/uk-ready/size.mp3",
    "listening:spices": "audio/uk-ready/spices.mp3",
    "listening:spring": "audio/uk-ready/spring.mp3",
    "listening:square": "audio/uk-ready/square.mp3",
    "listening:storage": "audio/uk-ready/storage.mp3",
    "listening:storms": "audio/uk-ready/storms.mp3",
    "listening:support": "audio/uk-ready/support.mp3",
    "listening:taste": "audio/uk-ready/taste.mp3",
    "listening:teeth": "audio/uk-ready/teeth.mp3",
    "listening:theater": "audio/uk-ready/theater.mp3",
    "listening:top": "audio/uk-ready/top.mp3",
    "listening:traditional": "audio/uk-ready/traditional.mp3",
    "listening:traffic": "audio/uk-ready/traffic.mp3",
    "listening:transportation": "audio/uk-ready/transportation.mp3",
    "listening:travel": "audio/uk-ready/travel.mp3",
    "listening:trust": "audio/uk-ready/trust.mp3",
    "listening:uniform": "audio/uk-ready/uniform.mp3",
    "listening:variety": "audio/uk-ready/variety.mp3",
    "listening:walking": "audio/uk-ready/walking.mp3",
    "listening:january": "audio/uk-ready/january.mp3",
    "listening:february": "audio/uk-ready/february.mp3",
    "listening:march": "audio/uk-ready/march.mp3",
    "listening:april": "audio/uk-ready/april.mp3",
    "listening:may": "audio/uk-ready/may.mp3",
    "listening:june": "audio/uk-ready/june.mp3",
    "listening:september": "audio/uk-ready/september.mp3",
    "listening:october": "audio/uk-ready/october.mp3",
    "listening:november": "audio/uk-ready/november.mp3",
    "listening:december": "audio/uk-ready/december.mp3",
    "listening:monday": "audio/uk-ready/monday.mp3",
    "listening:tuesday": "audio/uk-ready/tuesday.mp3",
    "listening:wednesday": "audio/uk-ready/wednesday.mp3",
    "listening:friday": "audio/uk-ready/friday.mp3",
    "listening:sunday": "audio/uk-ready/sunday.mp3"
  };
  const normalize=s=>String(s).normalize('NFKC').trim().replace(/\s+/g,' ').toLowerCase();
  let clips=[],clipsReady=false,dbPromise=null,lastCard='',previewUrl='',playUrl='',audio=null,playSerial=0,linkApplied=false;
  const data=()=>state.dictation||(state.dictation={version:1,mode:'word',rate:1,wrongOnly:false,stats:{word:{},sentence:{}},rounds:{}});
  const active=()=>deck==='listening'&&tab==='study'&&['word','sentence','synthetic'].includes(data().mode);
  const mode=()=>data().mode;
  const entries=()=>data().stats[mode()]||(data().stats[mode()]={});
  const metric=id=>entries()[id]||{};
  const bookmarkKey=(type,r)=>JSON.stringify([type,r.signature]);
  function rememberRound(type,r){const d=data();d.bookmarks||={};d.bookmarks[bookmarkKey(type,r)]=structuredClone(r);d.bookmarks=Object.fromEntries(Object.entries(d.bookmarks).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0)).slice(0,40))}
  const persist=()=>{const d=data();d.updated=Date.now();for(const[type,r]of Object.entries(d.rounds))rememberRound(type,r);save()};
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
    if(!r||r.signature!==signature){
      if(r)rememberRound(mode(),r);
      const saved=d.bookmarks?.[bookmarkKey(mode(),{signature})];
      r=d.rounds[mode()]=saved?structuredClone(saved):{signature,ids:list.map(x=>x.id),cursor:0,submitted:false,assisted:false,first:true,draft:'',updated:Date.now()};
    }
    // Add newly introduced dates to older rounds without moving the saved cursor.
    if(mode()==='word'&&!r.calendarVersion){
      const existing=new Set(r.ids);
      const added=list.filter(({id,w})=>w.frequency===null&&w.calendar&&!existing.has(id));
      if(added.length){r.ids.push(...added.map(({id})=>id));r.updated=Date.now()}
      r.calendarVersion=1;
    }
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
    window.updateStudyStats?.();
    const values=Object.values(entries());
    const attempts=values.reduce((n,s)=>n+(s.firstAttempts||0),0),correct=values.reduce((n,s)=>n+(s.firstCorrect||0),0),wrong=values.filter(s=>s.needsReview).length;
    $('dictationStats').textContent=`累计首次作答 ${attempts} 次 · 首次答对 ${correct} 次${attempts?' · 首次正确率 '+Math.round(correct/attempts*100)+'%':''} · 待重练 ${wrong} 词 · 进度自动保存，跨天继续`;
  }
  function reveal(item){$('dictationSolution').hidden=false;$('spellingExpected').textContent='正确答案：'+expected(item);$('dictationTranscript').textContent=item.c?markedSentence(item.c.sentence).full:'';$('dictationMeaning').textContent=item.w.meaning+(item.c?' · 原句来源：'+item.c.source+(item.c.tts?' · 合成语音；设空用于词汇练习':' · '+item.c.start+'–'+item.c.end+' 秒'):'');const link=$('sentenceSourceLink');link.hidden=!item.c?.url;if(item.c?.url)link.href=item.c.url;}
  function render(){
    const isListening=deck==='listening'&&tab==='study';$('practiceSettings').hidden=!isListening;
    if(!isListening){$('dictationPanel').hidden=true;$('studyKeyboard').hidden=false;if(lastCard)stop();lastCard='';return}
    if(!linkApplied){
      linkApplied=true;
      const requestedMode=location.search?.match(/(?:^|[?&])practice=(word|synthetic)(?=&|$)/)?.[1];
      if(requestedMode&&data().mode!==requestedMode){data().mode=requestedMode;persist()}
    }
    if(data().mode==='cards'&&data().updated===undefined)data().mode='word';
    $('dictationPanel').hidden=!active();
    $('studyKeyboard').hidden=active();
    const d=data();$('practiceMode').value=d.mode;$('playbackRate').value=String(d.rate||1);$('wrongOnly').checked=!!d.wrongOnly;$('clipCount').textContent=clips.length+' 个原题片段';
    const texts=syntheticSentences(),covered=new Set(texts.map(c=>c.wordId)).size;
    $('syntheticCoverage').textContent=`原句合成音：${texts.length} 个练习 · 覆盖 ${covered} / ${decks.listening.length} 个听力词。未覆盖的词可先练单词拼写。`;
    $('voiceSettings').hidden=mode()==='sentence'||mode()==='cards';populateVoices();
    if(!$('clipWord').children.length){for(const id of ['clipWord','ttsWord'])for(const w of decks.listening){const o=document.createElement('option');o.value=w.id;o.textContent=w.word;$(id).append(o)}}
    if(!active()){lastCard='';stop();return}
    for(const id of ['card','ratings','empty','exclude'])$(id).hidden=true;
    if(mode()==='sentence'&&!clipsReady){$('dictationHeading').textContent='正在读取原音资料…';$('dictationForm').hidden=true;$('playDictation').disabled=true;$('nextSpelling').disabled=true;return}
    const {r,item}=round(),key=mode()+':'+(item?.id||'empty')+':'+r.cursor+':'+r.signature;
    $('dictationTag').textContent=mode()==='word'?(recordedWords[item?.w.id]?'单词拼写 · 英式真人发音':'单词拼写 · 设备合成发音'):mode()==='synthetic'?'剑雅原句 · 合成语音':'原句听写 · 原录音';
    $('dictationPosition').textContent=item?`${r.cursor+1} / ${r.ids.length}`:`${r.ids.length} / ${r.ids.length}`;
    $('dictationHeading').textContent=item?'听音，写下答案':mode()==='sentence'&&!clips.length?'尚未导入原题录音':mode()==='synthetic'&&!r.ids.length?'当前筛选暂无原句练习':'本轮已完成';
    $('dictationPrompt').textContent=item?(item.c?markedSentence(item.c.sentence).masked:item.w.category==='数值'?'请将听到的数字写成英文单词。':'先播放发音，再输入单词或短语。'):mode()==='sentence'&&!clips.length?'请展开上方“原题资料与换设备续学”，导入九分学长原录音、原句和时间段。':d.wrongOnly?'当前筛选中没有待重练的词。':mode()==='synthetic'&&!r.ids.length?'请放宽 Part、考频或搜索条件，也可添加已核对的原句。':'可调整筛选，或切换其他练习方式。';
    $('playDictation').disabled=!item;$('dictationForm').hidden=!item;$('showSpellingAnswer').disabled=!item;$('nextSpelling').disabled=!item;$('restartDictation').hidden=!!item;
    if(key!==lastCard){stop();lastCard=key;$('spellingInput').value=r.draft||'';$('spellingFeedback').textContent=r.submitted?'此词已作答，可重听、重新输入或进入下一词。':'';$('audioStatus').textContent='';$('dictationSolution').hidden=true;for(const id of ['spellingExpected','dictationTranscript','dictationMeaning'])$(id).textContent=''}
    $('checkSpelling').disabled=!!r.submitted;$('retrySpelling').hidden=!r.submitted;if(!r.submitted)$('nextSpelling').textContent='跳过此词';
    else if(r.retryOnAdvance)$('nextSpelling').textContent='重拼一次（空格）';
    else $('nextSpelling').textContent='下一词（空格） →';
    stats();
  }
  function record(item,correct,assisted=false){
    const {r}=round(),old=metric(item.w.id),now=Date.now();
    entries()[item.w.id]={...old,attempts:(old.attempts||0)+(assisted?0:1),correct:(old.correct||0)+(correct?1:0),wrong:(old.wrong||0)+(!correct&&!assisted?1:0),reveals:(old.reveals||0)+(assisted?1:0),firstAttempts:(old.firstAttempts||0)+(r.first?1:0),firstCorrect:(old.firstCorrect||0)+(r.first&&correct&&!r.assisted&&!assisted?1:0),needsReview:!correct||r.assisted||assisted,updated:now};
    r.retryOnAdvance=r.first&&!correct&&!assisted;
    r.first=false;r.submitted=true;r.updated=now;persist();
  }
  function submit(e){e?.preventDefault();if(!active())return;const {r,item}=round();if(!item||r.submitted)return;const answer=$('spellingInput').value;if(!answer.trim()){ $('spellingFeedback').textContent='请先输入答案。';return }
    const correct=acceptable(item).some(x=>normalize(x)===normalize(answer));r.draft=answer;record(item,correct);
    $('spellingFeedback').textContent=correct?(r.assisted?'拼写正确。本题已查看过答案，不计为首次答对。':'拼写正确。'): `还差一点。你输入的是“${answer}”；正确答案是“${expected(item)}”。请注意字母、空格和单复数。`;
    $('spellingFeedback').dataset.result=correct?'correct':'wrong';reveal(item);render();
  }
  function playRecordedWord(word,rate,report){
    const src=recordedWords[word?.id];
    if(!src)return false;
    stop();
    const serial=playSerial;
    report?.('');
    function start(url,attempt){
      if(serial!==playSerial)return;
      const player=new Audio(url);
      audio=player;
      player.preload='auto';
      player.playbackRate=rate;
      const failed=error=>{
        if(serial!==playSerial||audio!==player)return;
        player.onerror=null;
        if(error?.name==='NotAllowedError'){
          (report||toast)('请再按 5 或点击播放。');
          return;
        }
        player.pause();
        if(attempt===0){
          start(src+'?retry='+Date.now(),1);
          return;
        }
        (report||toast)('录音加载失败，请检查网络后按 5 重试。');
      };
      player.onerror=failed;
      player.play().catch(failed);
    }
    start(src,0);
    return true;
  }
  async function play(){
    if(!active())return;const {item}=round();if(!item)return;
    if(!item.c&&playRecordedWord(item.w,data().rate||1,message=>{$('audioStatus').textContent=message}))return;
    stop();const serial=playSerial;
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
    const rounds=Object.entries(d.rounds);
    if(d.bookmarks!==undefined){if(!plain(d.bookmarks)||Object.keys(d.bookmarks).length>40)throw Error('听写筛选书签格式不正确');for(const[key,r]of Object.entries(d.bookmarks)){let pair;try{pair=JSON.parse(key)}catch{throw Error('听写筛选书签格式不正确')}if(!Array.isArray(pair)||pair.length!==2||pair[1]!==r?.signature)throw Error('听写筛选书签格式不正确');rounds.push([pair[0],r])}}
    for(const[type,r]of rounds)if(!['word','sentence','synthetic'].includes(type)||!plain(r)||!Array.isArray(r.ids)||r.ids.some(id=>typeof id!=='string')||!Number.isInteger(r.cursor)||r.cursor<0||r.cursor>r.ids.length||typeof r.signature!=='string'||r.updated!==undefined&&!Number.isFinite(r.updated)||r.draft!==undefined&&(typeof r.draft!=='string'||r.draft.length>500)||['submitted','assisted','first','retryOnAdvance'].some(k=>r[k]!==undefined&&typeof r[k]!=='boolean'))throw Error('听写续学位置格式不正确');
  }
  function mergeState(target,incoming){if(!incoming.dictation)return;validateState(incoming);if(!target.dictation){target.dictation=structuredClone(incoming.dictation);return}const a=target.dictation,b=incoming.dictation;a.bookmarks||={};for(const[key,r]of Object.entries(b.bookmarks||{}))if((r.updated||0)>(a.bookmarks[key]?.updated||0))a.bookmarks[key]=structuredClone(r);a.bookmarks=Object.fromEntries(Object.entries(a.bookmarks).sort((a,b)=>(b[1].updated||0)-(a[1].updated||0)).slice(0,40));const materials=new Map((a.materials||[]).map(c=>[c.id,c]));for(const c of b.materials||[])if(c.updated>(materials.get(c.id)?.updated||0))materials.set(c.id,checkText(c));if(materials.size>500)throw Error('合并后的原句超过 500 条。');a.materials=[...materials.values()];for(const type of ['word','sentence','synthetic']){a.stats[type]||={};for(const[id,v]of Object.entries(b.stats[type]||{}))if(v.updated>(a.stats[type][id]?.updated||0))a.stats[type][id]={...v}}for(const[type,r]of Object.entries(b.rounds))if((r.updated||0)>(a.rounds[type]?.updated||0))a.rounds[type]=structuredClone(r);if((b.updated||0)>(a.updated||0)){a.mode=b.mode;a.rate=b.rate;a.voiceURI=b.voiceURI||'';a.wrongOnly=b.wrongOnly;a.updated=b.updated}}
  function fileData(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)})}
  async function exportPack(){const status=$('materialStatus');try{stop();status.textContent='正在打包原音与进度…';const all=await allClips();if(all.reduce((n,c)=>n+c.blob.size,0)>75*1024*1024)throw Error('原音总量超过 75 MB，请分批整理资料。');const packed=[];for(const c of all){const{blob,...fields}=c;packed.push({...fields,audio:await fileData(blob)})}const payload={type:'translation-listening-package',version:1,exported:Date.now(),state:readState('listening'),clips:packed};const blob=new Blob([JSON.stringify(payload)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='listening-package-'+day()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status.textContent='学习包已导出，包含原音、句子、拼写记录与续学位置。'}catch(error){status.textContent=error.message}}
  async function importPack(file){if(!file)return;const status=$('materialStatus');try{if(file.size>PACK_LIMIT)throw Error('学习包超过 110 MB。');const p=JSON.parse(await file.text());if(p.type!=='translation-listening-package'||p.version!==1||!Array.isArray(p.clips)||p.clips.length>1000)throw Error('请选择本网站导出的学习包。');window.validateState?.(p.state);validateState(p.state);const incoming=[];for(const c of p.clips){if(typeof c.audio!=='string'||!/^data:audio\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+$/i.test(c.audio))throw Error('原音资料格式不正确。');const[type,base64]=c.audio.split(';base64,'),binary=atob(base64),bytes=Uint8Array.from(binary,x=>x.charCodeAt(0));const{audio:unused,...fields}=c;incoming.push(checkClip({...fields,blob:new Blob([bytes],{type:type.slice(5)})}))}const existing=await allClips(),updated=incoming.filter(c=>c.updated>(existing.find(x=>x.id===c.id)?.updated||0));await storeClips(updated);const target=readState('listening');mergeState(target,p.state);for(const[id,v]of Object.entries(p.state.items||{}))if(decks.listening.some(w=>w.id===id)&&v.updated>(target.items[id]?.updated||0))target.items[id]={...v};for(const[d,n]of Object.entries(p.state.days||{}))target.days[d]=Math.max(target.days[d]||0,n);if(p.state.round&&p.state.round.updated>(target.round?.updated||0))target.round=p.state.round;localStorage.setItem(keyFor('listening'),JSON.stringify(target));if(deck==='listening')state=target;await refreshClips();window.CloudSync?.changed();status.textContent='原音与较新的进度已合并。请切换到原句听写继续。'}catch(error){status.textContent='导入失败：'+error.message}}
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
  function setMode(next){
    if(deck!=='listening'||data().mode===next)return;
    stop();data().mode=next;lastCard='';persist();window.render?.();
  }
  $('practiceMode').onchange=()=>setMode($('practiceMode').value);
  $('playbackRate').onchange=()=>{data().rate=+$('playbackRate').value;persist();stop()};
  $('wrongOnly').onchange=()=>{data().wrongOnly=$('wrongOnly').checked;lastCard='';render();persist()};
  $('dictationForm').onsubmit=submit;$('playDictation').onclick=play;$('stopDictation').onclick=stop;
  $('spellingInput').oninput=()=>{if(!active())return;const {r}=round();r.draft=$('spellingInput').value.slice(0,500);r.updated=Date.now();persist()};
  $('showSpellingAnswer').onclick=()=>{const{r,item}=round();if(!item)return;const peek=!r.submitted;if(peek){r.assisted=true;record(item,false,true)}reveal(item);$('spellingFeedback').textContent=peek?'已查看答案，本题不计为首次答对。':'已展开正确答案。';render()};
  function retrySpelling(){
    const {r}=round();
    r.submitted=false;
    r.retryOnAdvance=false;
    r.draft='';
    r.updated=Date.now();
    lastCard='';
    persist();
    render();
    $('spellingInput').focus();
  }
  $('retrySpelling').onclick=retrySpelling;
  function nextSpelling(){
    const {r,item}=round();
    if(!item)return;
    if(r.submitted&&r.retryOnAdvance){retrySpelling();return}
    stop();
    r.cursor++;
    r.retryOnAdvance=false;
    r.submitted=false;
    r.assisted=false;
    r.first=true;
    r.draft='';
    r.updated=Date.now();
    lastCard='';
    persist();
    render();
    if(!$('dictationForm').hidden)$('spellingInput').focus();
  }
  function handleSpace(fromSpellingField){
    if(!active()||$('nextSpelling').disabled)return false;
    const {r,item}=round();
    if(!item)return false;
    if(r.submitted){
      nextSpelling();
      return true;
    }
    if(!fromSpellingField)return false;

    const input=$('spellingInput');
    const answer=normalize(input.value);
    if(!answer||input.selectionStart!==input.value.length||input.selectionEnd!==input.value.length){
      return false;
    }
    // Allow ordinary spaces between the words of a phrase.
    if(answer.split(' ').length<normalize(expected(item)).split(' ').length)return false;
    submit();
    return true;
  }
  $('nextSpelling').onclick=nextSpelling;
  $('restartDictation').onclick=()=>{const d=data(),r=d.rounds[mode()];if(r&&d.bookmarks)delete d.bookmarks[bookmarkKey(mode(),r)];delete d.rounds[mode()];lastCard='';render();persist()};
  $('clipAudio').onchange=()=>{if(previewUrl)URL.revokeObjectURL(previewUrl);const file=$('clipAudio').files[0];if(!file)return;previewUrl=URL.createObjectURL(file);$('clipPreview').src=previewUrl};
  $('useStartTime').onclick=()=>{$('clipStart').value=$('clipPreview').currentTime.toFixed(2)};$('useEndTime').onclick=()=>{$('clipEnd').value=$('clipPreview').currentTime.toFixed(2)};
  $('clipForm').onsubmit=async e=>{e.preventDefault();const status=$('materialStatus');try{if(!$('confirmOriginal').checked)throw Error('请先核对原题来源。');const file=$('clipAudio').files[0];if(!file)throw Error('请选择原录音文件。');const wordId=$('clipWord').value,start=+$('clipStart').value,end=+$('clipEnd').value;if(!$('clipEnd').value)throw Error('请填写句子结束时间。');if(!Number.isFinite($('clipPreview').duration))throw Error('请等待原音载入，再核对时间。');if(end>$('clipPreview').duration+.1)throw Error('结束时间超过录音长度。');const blob=new Blob([file],{type:file.type||'audio/mpeg'}),c=checkClip({id:wordId+':'+start+':'+end,wordId,source:$('clipSource').value.trim(),sentence:$('clipSentence').value.trim(),start,end,blob,updated:Date.now()});await storeClips([c]);await refreshClips();status.textContent='原题片段已保存在本浏览器。导出学习包后可带到另一台电脑。'}catch(error){status.textContent=error.message}};
  $('exportListeningPack').onclick=exportPack;$('importListeningPack').onclick=()=>$('listeningPackFile').click();$('listeningPackFile').onchange=async e=>{await importPack(e.target.files[0]);e.target.value=''};
  window.addEventListener('pagehide',stop);window.Dictation={render,active,play,playRecordedWord,handleSpace,startWord:()=>setMode('word'),stop,normalize,markedSentence,validateState,mergeState,checkClip,checkText,builtInSentences,round,submit,importPack,allClips,storeClips,refreshClips,resetView:()=>{lastCard='';stop()}};
  render();refreshClips().catch(error=>{clipsReady=true;$('materialStatus').textContent=error.message;render()});
})();
