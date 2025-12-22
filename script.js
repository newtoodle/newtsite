const BIRTH = new Date(2025,8,15,10,0,0);
const CONTACT_EMAIL = 'lordnewtguillemot@gmail.com';
const UPDATES_KEY = 'newt_updates_v1';
const SKILLS_KEY = 'newt_skills_v1';
const FAQ_KEY = 'newt_faq_v1';
const NICKNAMES_KEY = 'newt_nicknames_v1';
const NICKNAME_SEED = { value: 'Mr. Pee Pee Man', t: Date.now() }; // edit this in code
const GUESTBOOK_KEY = 'newt_guestbook_v1';

function updateAge(){
  const now = new Date();
  let diff = Math.max(0, now - BIRTH);
  const msInSecond = 1000, msInMinute = msInSecond*60, msInHour = msInMinute*60, msInDay = msInHour*24;
  const totalDays = Math.floor(diff / msInDay); diff -= totalDays*msInDay;
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  const hours = Math.floor(diff / msInHour); diff -= hours*msInHour;
  const minutes = Math.floor(diff / msInMinute);
  const display = `${weeks} weeks, ${days} days, ${hours}h ${minutes}m`;
  const el = document.getElementById('age-text'); if(el) el.textContent = display;
}

function initNav(){
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');
  if(!btn||!nav) return;
  btn.addEventListener('click', ()=>{
    const open = nav.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    if(open){overlay.hidden=false;overlay.addEventListener('click', close);document.body.style.overflow='hidden'} else {close()}
  });
  function close(){nav.classList.remove('open');btn.setAttribute('aria-expanded','false');overlay.hidden=true;document.body.style.overflow=''}
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });
}

function initContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    // Netlify forms will handle when hosted. Provide mailto fallback.
    const netlify = form.hasAttribute('data-netlify');
    if(netlify){ return; }
    e.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent('Newt site message from '+(data.get('name')||'visitor'));
    const body = encodeURIComponent(`Email: ${data.get('email')||''}\n\n${data.get('message')||''}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

// Updates (localStorage)
function loadUpdates(){
  try{ return JSON.parse(localStorage.getItem(UPDATES_KEY)||'[]'); }catch{return []}
}
function saveUpdates(list){ localStorage.setItem(UPDATES_KEY, JSON.stringify(list)); }
function renderUpdates(){
  const list = loadUpdates();
  const container = document.getElementById('updates-list');
  if(!container) return;
  container.innerHTML = '';
  list.slice().reverse().forEach(u=>{
    const el = document.createElement('div'); el.className='update-block'; el.innerHTML = `<time>${new Date(u.t).toLocaleString()}</time><p>${u.text}</p>`; container.appendChild(el);
  });
}
function initUpdates(){
  const form = document.getElementById('update-form');
  if(form){
    form.addEventListener('submit', (e)=>{
    e.preventDefault();
      const text = (form.querySelector('textarea[name=update]')||{}).value||'';
      if(!text.trim()) return;
      const list = loadUpdates(); list.push({t:Date.now(), text}); saveUpdates(list); form.reset(); renderUpdates();
    });
  }
  renderUpdates();
}

// Skill tree (localStorage)
function loadSkills(){ try{ return JSON.parse(localStorage.getItem(SKILLS_KEY)||'{}'); }catch{return {}} }
function saveSkills(obj){ localStorage.setItem(SKILLS_KEY, JSON.stringify(obj)); }
function initSkillTree(){
  const state = loadSkills();
  document.querySelectorAll('#skill-tree input[type=checkbox][data-skill]').forEach(cb=>{
    const key = cb.dataset.skill; cb.checked = !!state[key];
    cb.addEventListener('change', ()=>{
      if(cb.checked){
        state[key]=true; saveSkills(state);
      } else {
        cb.checked = true;
      }
    });
  });
  // Add toggle for carets
  document.querySelectorAll('.caret').forEach(caret=>{
    caret.addEventListener('click', ()=>{
      caret.classList.toggle('caret-down');
      const nested = caret.nextElementSibling;
      if(nested) nested.classList.toggle('active');
    });
  });
}

// Weight and unit conversion
function lbsToKg(lbs){ return (lbs * 0.453592).toFixed(2); }
function initWeightConverter(){
  const toggle = document.getElementById('convert-toggle');
  const weightText = document.getElementById('weight-text');
  const list = document.getElementById('weigh-ins-list');
  if(!toggle || !weightText || !list) return;
  let showKg = false;
  toggle.addEventListener('click', (e)=>{
    e.preventDefault();
    showKg = !showKg;
    renderWeight(showKg);
  });
  renderWeight(false);
  function renderWeight(inKg){
    if(inKg){
      const kg = lbsToKg(4.5);
      weightText.innerHTML = `Latest: <strong>${kg} kg</strong>`;
      toggle.textContent = 'Show in lbs';
      list.innerHTML = `
        <li>11/21/25: ${lbsToKg(2.7)} kg</li>
        <li>11/28/25: ${lbsToKg(3.3)} kg</li>
        <li>12/2/25: ${lbsToKg(3.7)} kg (at the vet)</li>
        <li>12/12/25: ${lbsToKg(4.2)} kg</li>
        <li>12/18/25: ${lbsToKg(4.5)} kg</li>
      `;
    } else {
      weightText.innerHTML = `Latest: <strong>4.5 lbs</strong>`;
      toggle.textContent = 'Show in kg';
      list.innerHTML = `
        <li>11/21/25: 2.7 lbs</li>
        <li>11/28/25: 3.3 lbs</li>
        <li>12/2/25: 3.7 lbs (at the vet)</li>
        <li>12/12/25: 4.2 lbs</li>
        <li>12/18/25: 4.5 lbs</li>
      `;
    }
  }
}

// Treats counter (random, changes per refresh)
function initTreatsCounter(){
  const el = document.getElementById('treats-count');
  if(!el) return;
  const count = Math.floor(Math.random()*(100000-1+1)) + 1;
  el.textContent = count.toLocaleString();
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateAge(); setInterval(updateAge, 60*1000);
  initNav(); initContactForm(); initUpdates(); initSkillTree(); initFAQ(); initWeightConverter(); initTreatsCounter(); initStatusWidget(); initPhotoOfDay(); initNicknames(); initGuestbook();
});

// FAQ (localStorage-backed public list on this device)
function loadFAQ(){ try{ return JSON.parse(localStorage.getItem(FAQ_KEY)||'[]'); }catch{return []} }
function saveFAQ(list){ localStorage.setItem(FAQ_KEY, JSON.stringify(list)); }
function formatDate(ts){ try{ return new Date(ts).toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'numeric',minute:'2-digit'}); }catch{return ''} }
function renderFAQ(){
  const list = loadFAQ();
  const container = document.getElementById('faq-list');
  if(!container) return;
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<p>No community questions yet. Be the first!</p>'; return; }
  list.slice().reverse().forEach((q, idx)=>{
    const el = document.createElement('div');
    el.className = 'update-block';
    const answered = q.a && q.a.trim().length>0;
    const askedOn = q.t ? formatDate(q.t) : '';
    const answeredOn = q.aT ? formatDate(q.aT) : '';
    el.innerHTML = `
      <p><strong>Q:</strong> ${q.q}</p>
      ${askedOn ? `<p class="meta">Asked ${askedOn}</p>` : ''}
      ${answered ? `<p><strong>A:</strong> ${q.a}</p>${answeredOn ? `<p class="meta">Answered ${answeredOn}</p>` : ''}` : `<p><em>Unanswered</em></p>`}
      <p><button class="btn" data-answer="${idx}">Answer</button></p>
    `;
    container.appendChild(el);
  });
  container.onclick = (e)=>{
    const btn = e.target.closest('button[data-answer]'); if(!btn) return;
    const i = parseInt(btn.getAttribute('data-answer'),10);
    const data = loadFAQ(); const item = data[data.length-1 - i]; if(!item) return;
    const a = prompt('Enter an answer for this question:', item.a||'');
    if(a!==null){ item.a = a; item.aT = Date.now(); saveFAQ(data); renderFAQ(); }
  };
}
function initFAQ(){
  const form = document.getElementById('faq-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const q = (form.querySelector('textarea[name=question]')||{}).value||'';
      if(!q.trim()) return;
      const list = loadFAQ(); list.push({ t: Date.now(), q, a: '', aT: null }); saveFAQ(list);
      form.reset(); renderFAQ();
    });
  }
  renderFAQ();
}

// Nicknames (code-edited only; public sees latest value + timestamp)
function loadNickname(){
  try{ return JSON.parse(localStorage.getItem(NICKNAMES_KEY)||'null'); }catch{return null}
}
function saveNickname(entry){ localStorage.setItem(NICKNAMES_KEY, JSON.stringify(entry)); }
function formatNickTs(ts){ try{ return new Date(ts).toLocaleString(); }catch{return ''} }
function renderNickname(){
  const display = document.getElementById('nicknames-display');
  const tsEl = document.getElementById('nickname-timestamp');
  if(!display) return;
  const entry = loadNickname();
  display.textContent = entry?.value ? entry.value : 'None yet.';
  if(tsEl){ tsEl.textContent = entry?.t ? `Updated ${formatNickTs(entry.t)}` : ''; }
}
function initNicknames(){
  // Seed once (code-edited default) if nothing exists
  if(!loadNickname()) saveNickname(NICKNAME_SEED);
  renderNickname();
}
// Console helper to reset nickname from code seed
window.resetNickname = function(){ saveNickname(NICKNAME_SEED); renderNickname(); console.log('Nickname reset to:', NICKNAME_SEED.value); };
// Console helper to add a manual update
window.addUpdate = function(text){
  if(!text||!text.trim()){ console.error('Provide update text: addUpdate("my text")'); return; }
  const list = loadUpdates(); list.push({t:Date.now(), text}); saveUpdates(list); renderUpdates();
  console.log('Update added:', text);
};

// Status widget (random activity on homepage)
function initStatusWidget(){
  const statuses = [
    'napping', 'being wicked', 'shark mode', 'finding dirty socks', 'eating', 'humping',
    'playing fetch', 'playing tug of war', 'pooping', 'peeing', 'peeing on the floor',
    'running around', 'hiding under the bed to scare my owners', 'licking', 'learning new tricks',
    'barking', 'bath time', 'being brushed', 'walking', 'eating dust bunnies', 'zooming',
    'sleeping on mama\'s lap', 'ignoring any and all commands', 'digging', 'being crazy', 'chewing on a bone'
  ];
  const el = document.getElementById('newt-status');
  if(el) el.textContent = statuses[Math.floor(Math.random() * statuses.length)];
}

// Photo of the day (rotates every 24 hours)
function initPhotoOfDay(){
  const el = document.getElementById('photo-of-day');
  if(!el) return;
  const photoUrls = [
    'assets/og-image.svg',
    'assets/og-image.svg',
    'assets/og-image.svg',
    'assets/og-image.svg',
    'assets/og-image.svg',
    'assets/og-image.svg'
  ];
  const daysSinceEpoch = Math.floor(Date.now() / (1000*60*60*24));
  const photoIndex = daysSinceEpoch % photoUrls.length;
  el.src = photoUrls[photoIndex];
}

// Guestbook (localStorage-backed entries with optional drawings)
function loadGuestbook(){ try{ return JSON.parse(localStorage.getItem(GUESTBOOK_KEY)||'[]'); }catch{return []} }
function saveGuestbook(list){ localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(list)); }
function renderGuestbook(){
  const list = loadGuestbook();
  const container = document.getElementById('guestbook-list');
  if(!container) return;
  container.innerHTML = '';
  if(!list.length){ container.innerHTML = '<p>No messages yet. Be the first to sign!</p>'; return; }
  list.slice().reverse().forEach(entry=>{
    const el = document.createElement('div');
    el.className = 'update-block';
    const ts = entry.t ? new Date(entry.t).toLocaleString() : new Date().toLocaleString();
    let html = `<p><strong>${entry.name}</strong> <span class="meta">${ts}</span></p>`;
    html += `<p style="margin-top:6px;">${entry.message}</p>`;
    if(entry.drawing){
      html += `<img src="${entry.drawing}" alt="Drawing by ${entry.name}" style="max-width:100%;border-radius:8px;margin-top:8px;border:1px solid var(--border);">`;
    }
    el.innerHTML = html;
    container.appendChild(el);
  });
}
function initGuestbook(){
  const canvas = document.getElementById('drawing-canvas');
  const form = document.getElementById('guestbook-form');
  if(!canvas || !form) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let currentColor = '#000';
  let currentSize = 4;
  
  // Set canvas size to match display
  const rect = canvas.getBoundingClientRect();
  canvas.width = 400;
  canvas.height = 200;
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Color and size controls
  const colorPicker = document.getElementById('color-picker');
  const penSize = document.getElementById('pen-size');
  
  function updateColor(color){
    if(/^#[0-9A-Fa-f]{6}$/.test(color)){
      currentColor = color;
      if(colorPicker) colorPicker.value = color;
    }
  }
  
  // Pen color buttons
  document.getElementById('pen-black')?.addEventListener('click', ()=>updateColor('#000000'));
  document.getElementById('pen-red')?.addEventListener('click', ()=>updateColor('#c0392b'));
  document.getElementById('pen-blue')?.addEventListener('click', ()=>updateColor('#2980b9'));
  
  // Color picker
  colorPicker?.addEventListener('input', (e)=>updateColor(e.target.value));
  
  // Pen size
  penSize?.addEventListener('change', (e)=>{
    currentSize = parseInt(e.target.value, 10) || 4;
  });
  
  document.getElementById('clear-canvas')?.addEventListener('click', ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); });
  
  // Drawing handlers
  function startDraw(e){
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentSize;
  }
  function draw(e){
    if(!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }
  function endDraw(){ drawing = false; }
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }
  
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseout', endDraw);
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', endDraw);
  
  // Form submit
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = (form.querySelector('input[name=name]')||{}).value||'';
    const message = (form.querySelector('textarea[name=message]')||{}).value||'';
    if(!name.trim()||!message.trim()) return;
    
    // Check if canvas has drawing
    const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
    const hasDrawing = imageData.data.some((v,i)=>i%4===3 && v>0);
    const drawing = hasDrawing ? canvas.toDataURL('image/png') : null;
    
    const list = loadGuestbook();
    list.push({ t: Date.now(), name, message, drawing });
    saveGuestbook(list);
    form.reset();
    ctx.clearRect(0,0,canvas.width,canvas.height);
    renderGuestbook();
  });
  
  renderGuestbook();
}let updates = JSON.parse(localStorage.getItem('newt_updates_v1') || '[]');
updates = updates.filter(u => u.text !== 'newt');
localStorage.setItem('newt_updates_v1', JSON.stringify(updates));
location.reload();