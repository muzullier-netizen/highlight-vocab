/* Supabase auth, private assets and revision-checked, idempotent progress sync. */
(() => {
  const $=id=>document.getElementById(id),M=globalThis.SyncModel,C=window.VOCAB_CLOUD_CONFIG||{};
  const OWNER='translation-sync-owner-v1',META='translation-cloud-meta-v1:';
  let client=null,user=null,meta=null,busy=false,applying=false,timer,again=false,stopped=false,epoch=0;
  const status=(s,error=false)=>{$('cloudStatus').textContent=s;$('cloudStatus').dataset.error=String(error)};
  const metadataKey=()=>META+user.id;
  const readMeta=()=>{const raw=localStorage.getItem(metadataKey());if(!raw)return {base:null,revision:0,pending:null};const d=JSON.parse(raw);if(!d||d.version!==1)throw Error('同步记录格式不正确，请导出本机进度后联系维护者。');return d};
  const writeMeta=()=>localStorage.setItem(metadataKey(),JSON.stringify({...meta,version:1}));
  const alive=token=>user&&token===epoch&&!stopped;
  function friendly(error){
    const message=String(error?.message||error||'未知错误');
    if(/Failed to fetch|network|NetworkError|fetch failed/i.test(message))return '暂时无法连接云端，本机学习记录仍保留；联网后点击“立即同步”。';
    if(/vocab_sync|schema cache|PGRST202|function.*not.*exist/i.test(message))return '云端同步表尚未配置，请先完成 Supabase 项目初始化。';
    if(/email.*not.*authorized|SMTP|Email address.*not authorized|email.*rate|rate.*limit/i.test(message))return '登录邮件发送受限，请检查邮箱拼写，稍后重试或检查 Supabase 邮件配置。';
    return '同步未完成：'+message.slice(0,180);
  }
  function validPayload(payload){
    if(!payload||payload.version!==1||!payload.decks||Array.isArray(payload.decks)||!payload.clips||Array.isArray(payload.clips))throw Error('云端数据格式不正确。');
    window.VocabState.validate(payload.decks);
    for(const c of Object.values(payload.clips)){
      if(!c||typeof c.id!=='string'||typeof c.key!=='string'||!c.key.startsWith(user.id+'/')||!Number.isFinite(c.updated)||!Number.isSafeInteger(c.size)||c.size<=0||c.size>25*1024*1024||typeof c.mime!=='string'||!c.mime.startsWith('audio/'))throw Error('云端原音资料格式不正确。');
      window.Dictation.checkClip({...c,blob:new Blob(['validation'],{type:c.mime})});
    }
    return payload;
  }
  async function rpc(name,params){const {data,error}=await client.rpc(name,params);if(error)throw error;return data}
  async function localSnapshot(token){
    const result={version:1,decks:window.VocabState.snapshot(),clips:M.clone(meta.base?.clips||{})};
    let local;
    try{local=await window.Dictation.allClips()}catch{return result}
    if(!alive(token))throw Error('同步账号已变化。');
    for(const c of local){
      const old=result.clips[c.id];if(old&&old.updated>=c.updated)continue;
      const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',await c.blob.arrayBuffer()))].map(x=>x.toString(16).padStart(2,'0')).join('');
      const key=user.id+'/'+hash;
      const {error}=await client.storage.from(C.bucket).upload(key,c.blob,{upsert:false,contentType:c.blob.type,cacheControl:'3600'});
      if(error&&String(error.statusCode||error.status)!=='409'&&!/already exists|duplicate/i.test(error.message||''))throw error;
      if(!alive(token))throw Error('同步账号已变化。');
      const {blob,...fields}=c;result.clips[c.id]={...fields,key,mime:blob.type,size:blob.size};
    }
    // Include practice changes made while audio uploads were in flight.
    result.decks=window.VocabState.snapshot();return result;
  }
  async function downloadClips(payload,token){
    const manifests=Object.values(payload.clips);if(!manifests.length)return;
    const local=await window.Dictation.allClips(),incoming=[];
    for(const c of manifests){
      if(local.some(x=>x.id===c.id&&x.updated>=c.updated))continue;
      const {data:blob,error}=await client.storage.from(C.bucket).download(c.key);if(error)throw error;
      if(!alive(token))throw Error('同步账号已变化。');
      if(blob.size!==c.size)throw Error('下载的录音大小与记录不符，请重试。');
      const {key,mime,size,...fields}=c;incoming.push(window.Dictation.checkClip({...fields,blob:new Blob([blob],{type:mime})}));
    }
    if(incoming.length){await window.Dictation.storeClips(incoming);if(alive(token))await window.Dictation.refreshClips()}
  }
  function applyRecovery(){
    if(!meta.recovery)return;
    applying=true;
    try{if(!M.equal(window.VocabState.snapshot(),meta.recovery.decks))window.VocabState.apply(meta.recovery.decks);meta.recovery=null;writeMeta()}finally{applying=false}
  }
  async function acknowledge(reply,pending,token){
    validPayload(reply.payload);
    const live={version:1,decks:window.VocabState.snapshot(),clips:pending.local.clips};
    const merged=M.merge(live,pending.local,reply.payload);validPayload(merged);
    // Durable recovery marker precedes the multi-key local write. Replays cannot add counts twice.
    meta={version:1,base:reply.payload,revision:reply.revision,pending:null,recovery:merged,lastSyncedAt:reply.updated_at};writeMeta();applyRecovery();
    if(alive(token)){
      try{await downloadClips(reply.payload,token)}catch(error){status('进度已同步；原音下载待重试。'+friendly(error),true);throw error}
    }
  }
  async function sync(){
    if(!client||!user||stopped||!window.VocabState)return;
    if(busy){again=true;return}
    busy=true;again=false;const token=epoch;
    try{
      if(navigator.onLine===false){status('离线学习中 · 联网后自动补传');return}
      status('正在合并云端与本机记录…');applyRecovery();
      for(let attempt=0;attempt<6&&alive(token);attempt++){
        if(meta.pending){
          const pending=meta.pending;
          const reply=await rpc('vocab_sync_push',{p_expected_revision:pending.revision,p_request_id:pending.id,p_payload:pending.payload});
          if(!alive(token))return;
          if(reply.conflict){meta.pending=null;writeMeta();continue}
          await acknowledge(reply,pending,token);break;
        }
        const remote=await rpc('vocab_sync_pull');if(!alive(token))return;validPayload(remote.payload);
        const local=await localSnapshot(token);if(!alive(token))return;
        const merged=M.merge(local,meta.base,remote.payload);validPayload(merged);
        if(M.equal(merged,remote.payload)){
          // No write is necessary; use the same recovery path for a remote-only change.
          await acknowledge(remote,{local},token);break;
        }
        if(new Blob([JSON.stringify(merged)]).size>1900000)throw Error('同步资料超过大小限制，请导出备份后精简自定义原句。');
        meta.pending={id:crypto.randomUUID(),revision:remote.revision,payload:merged,local};writeMeta();
        if(attempt===5){again=true;break}
      }
      if(!alive(token))return;
      const current={version:1,decks:window.VocabState.snapshot(),clips:meta.base?.clips||{}};
      if(!M.equal(current,meta.base))again=true;
      status(meta.lastSyncedAt?'已同步 · '+new Date(meta.lastSyncedAt).toLocaleString('zh-CN'):'已连接 · 暂无学习记录');
    }catch(error){if(alive(token))status(friendly(error),true)}finally{busy=false;if(again&&user&&!stopped){again=false;schedule(1500)}}
  }
  function schedule(delay=1500){clearTimeout(timer);if(user&&!stopped)timer=setTimeout(sync,delay)}
  function changed(){if(!applying&&user&&!stopped){status(navigator.onLine===false?'离线学习中 · 本机已保存':'本机已保存 · 等待同步…');schedule()}}
  async function setSession(session){
    if(user&&session?.user?.id===user.id&&meta){schedule(0);return}
    epoch++;clearTimeout(timer);user=session?.user||null;stopped=false;
    $('cloudLogin').hidden=!!user;$('cloudAccount').hidden=!user;
    if(!user){status('未登录 · 进度保存在本机');return}
    $('cloudEmailLabel').textContent=user.email||'已登录账号';
    const owner=localStorage.getItem(OWNER);
    if(owner&&owner!==user.id){stopped=true;status('此浏览器保留了另一账号的本机记录。请换用独立浏览器配置登录，避免混合进度。',true);return}
    localStorage.setItem(OWNER,user.id);meta=readMeta();applyRecovery();schedule(0);
  }
  async function init(){
    if(!window.VocabState)return;
    if(!C.url||!C.publishableKey){status('云同步待配置 · 当前仍为本机保存');$('cloudSendLink').disabled=true;return}
    if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(C.url)||!C.publishableKey.startsWith('sb_publishable_')&&!C.publishableKey.startsWith('eyJ')){status('云同步公开配置不正确。',true);return}
    if(C.publishableKey.startsWith('eyJ')){try{if(JSON.parse(atob(C.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/'))).role!=='anon')throw Error()}catch{status('请配置公开 anon / publishable key，不能使用管理密钥。',true);return}}
    if(!window.supabase){status('云同步组件未载入，请刷新；本机学习不受影响。',true);return}
    client=window.supabase.createClient(C.url,C.publishableKey,{auth:{storageKey:'translation-supabase-auth-v1',flowType:'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
    client.auth.onAuthStateChange((event,session)=>{
      // Keep async sync work outside Supabase's auth lock; token refresh doesn't reset pending work.
      if(event==='TOKEN_REFRESHED')return;
      setTimeout(()=>setSession(session).catch(error=>status(friendly(error),true)),0);
    });
    const {data,error}=await client.auth.getSession();if(error)throw error;await setSession(data.session);
    setInterval(()=>{if(document.visibilityState!=='hidden')schedule(0)},30000);
  }
  $('cloudLogin').onsubmit=async e=>{e.preventDefault();if(!client)return;const button=$('cloudSendLink');button.disabled=true;
    try{const callback=new URL(location.href);callback.search='';callback.hash='';const {error}=await client.auth.signInWithOtp({email:$('cloudEmail').value.trim(),options:{emailRedirectTo:callback.href,shouldCreateUser:true}});if(error)throw error;status('登录链接已发送。请在当前这台电脑的同一浏览器打开邮件链接，完成后会自动合并记录。')}catch(error){status(friendly(error),true)}finally{button.disabled=false}
  };
  $('cloudSyncNow').onclick=()=>schedule(0);
  $('cloudSignOut').onclick=async()=>{
    stopped=true;epoch++;clearTimeout(timer);try{const {error}=await client.auth.signOut({scope:'local'});if(error)throw error;user=null;$('cloudLogin').hidden=false;$('cloudAccount').hidden=true;status('已退出同步账号 · 本机学习记录仍保留')}catch(error){status(friendly(error),true)}
  };
  window.addEventListener('online',()=>schedule(0));window.addEventListener('focus',()=>schedule(0));
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule(0);else{clearTimeout(timer);void sync()}});
  window.CloudSync={changed,sync};
  const start=()=>init().catch(error=>status(friendly(error),true));
  if(window.VocabState)start();else window.addEventListener('vocab:ready',start,{once:true});
})();
