(() => {
  const $ = id => document.getElementById(id);
  const key = 'translation-writing-drafts-v1';
  const limits = {1:150,2:250};
  const state = Object.create(null);
  const topics = window.WritingTopics;
  const selected = {1:topics[1][0][0],2:topics[2][0][0]};
  const topic = () => topics[task].find(entry => entry[0] === selected[task]);
  const draftKey = () => topic()?.[0] || String(task);
  let task = 1;
  let chartUrl = '';

  try {
    const saved = JSON.parse(localStorage.getItem(key));
    for (const id of ['1','2',...Object.values(topics).flat().map(entry => entry[0])]) {
      const draft = saved?.[id];
      if (typeof draft?.prompt === 'string' && typeof draft.essay === 'string') state[id] = draft;
    }
  } catch {
    $('saveStatus').textContent = '无法读取本机草稿。';
  }

  function words() {
    return $('writingDraft').value.match(/[A-Za-z0-9]+(?:[’'-][A-Za-z0-9]+)*/g)?.length || 0;
  }

  function updateCount() {
    $('wordCount').textContent = words()+' 词 · 至少 '+limits[task]+' 词';
  }

  function clearCopy() {
    $('copyStatus').textContent = '';
    $('reviewFallback').hidden = true;
    $('reviewFallbackLabel').hidden = true;
    $('reviewFallback').value = '';
  }

  function select(id) {
    task = id;
    document.querySelectorAll('[data-task]').forEach(button => {
      button.setAttribute('aria-pressed', String(Number(button.dataset.task) === id));
    });
    $('topic').replaceChildren(...topics[id].map(([key,type,name]) => new Option(type+' · '+name,key)),new Option('自带题目','custom'));
    $('topic').value = selected[id];
    $('chartControls').hidden = id !== 1;
    loadDraft();
  }

  function loadDraft() {
    const entry = topic();
    const draft = state[draftKey()];
    $('writingPrompt').readOnly = !!entry;
    $('writingPrompt').value = entry ? entry[3]+(task === 1 ? '\n\nSummarise the main features and make comparisons where relevant.' : '') : draft?.prompt || '';
    $('writingDraft').value = draft?.essay || '';
    if (chartUrl) URL.revokeObjectURL(chartUrl);
    chartUrl = '';
    $('writingChart').value = '';
    $('chartPreview').removeAttribute('src');
    $('chartPreview').hidden = true;
    clearCopy();
    updateCount();
  }

  function save() {
    state[draftKey()] = {prompt:topic()?'':$('writingPrompt').value,essay:$('writingDraft').value};
    try {
      localStorage.setItem(key,JSON.stringify(state));
      $('saveStatus').textContent = '已保存在当前浏览器。';
    } catch {
      $('saveStatus').textContent = '浏览器无法保存草稿。请在离开前复制作文。';
    }
    clearCopy();
    updateCount();
  }

  function reviewPacket(prompt, essay) {
    const criterion = task === 1 ? 'Task Achievement' : 'Task Response';
    const chartNote = task === 1 ? '如有题图，我会另行上传。若没有题图，请标明哪些信息无法核对，避免推测数据。' : '';
    return [
      '请批改我的 IELTS Academic Writing Task '+task+' 作文。',
      '请按 '+criterion+'、Coherence and Cohesion、Lexical Resource、Grammatical Range and Accuracy 分项估分，引用我的原句解释主要扣分点，指出优先修改的三处并给出示范。',
      chartNote,
      '题目\n'+prompt,
      '作文（约 '+words()+' 词）\n'+essay
    ].filter(Boolean).join('\n\n');
  }

  document.querySelectorAll('[data-task]').forEach(button => {
    button.addEventListener('click',()=>select(Number(button.dataset.task)));
  });
  $('topic').addEventListener('change',()=>{
    selected[task] = $('topic').value;
    loadDraft();
  });
  $('writingPrompt').addEventListener('input',save);
  $('writingDraft').addEventListener('input',save);
  $('writingChart').addEventListener('change',()=>{
    if(chartUrl)URL.revokeObjectURL(chartUrl);
    const file = $('writingChart').files[0];
    chartUrl = file ? URL.createObjectURL(file) : '';
    if(chartUrl)$('chartPreview').src = chartUrl;
    else $('chartPreview').removeAttribute('src');
    $('chartPreview').hidden = !chartUrl;
  });
  $('copyReview').addEventListener('click',async()=>{
    const prompt = $('writingPrompt').value.trim();
    const essay = $('writingDraft').value.trim();
    if(!prompt || !essay){
      $('copyStatus').textContent = '请先填写题干和作文。';
      $(prompt?'writingDraft':'writingPrompt').focus();
      return;
    }
    const packet = reviewPacket(prompt,essay);
    try {
      await navigator.clipboard.writeText(packet);
      $('copyStatus').textContent = task === 1 ? '已复制。请粘贴到当前聊天，并附上题图。' : '已复制。请粘贴到当前聊天。';
    } catch {
      $('reviewFallback').value = packet;
      $('reviewFallback').hidden = false;
      $('reviewFallbackLabel').hidden = false;
      $('reviewFallback').select();
      $('copyStatus').textContent = '请按 Ctrl+C 复制已选中的批改材料。';
    }
  });

  select(1);
})();
