const BIRTH = new Date(2025,8,15,10,0,0);
const CONTACT_EMAIL = 'lordnewtguillemot@gmail.com';
const UPDATES_KEY = 'newt_updates_v1';
const SKILLS_KEY = 'newt_skills_v1';
const FAQ_KEY = 'newt_faq_v1';
const NICKNAMES_KEY = 'newt_nicknames_v1';
const NICKNAME_SEED = { value: 'Mr. Pee Pee Man', t: Date.now() }; // edit this in code
const GUESTBOOK_KEY = 'newt_guestbook_v1';

// Firebase dynamic loader and initializer (optional). If you want cloud persistence,
// create a Firebase Web app and paste the config object into a small file that sets
// `window.FIREBASE_CONFIG` (see FIREBASE_SETUP.md). This loader uses the compat SDK
// so it can initialize at runtime without changing the rest of the code.
window._firestore = null;
async function ensureFirebase(){
  if(window._firestore) return window._firestore;
  const cfg = window.FIREBASE_CONFIG;
  if(!cfg) return null;
  if(window.firebase && window.firebase.firestore){
    try{ if(!window.firebase.apps.length) window.firebase.initializeApp(cfg); window._firestore = window.firebase.firestore(); return window._firestore; }catch(e){ console.error('Firebase init error', e); return null; }
  }
  // Dynamically load compat SDKs
  await new Promise((res, rej)=>{
    const s1 = document.createElement('script');
    s1.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js';
    s1.onload = ()=>{
      const s2 = document.createElement('script');
      s2.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js';
      s2.onload = ()=>res();
      s2.onerror = rej;
      document.head.appendChild(s2);
    };
    s1.onerror = rej;
    document.head.appendChild(s1);
  }).catch((e)=>{ console.warn('Failed to load Firebase SDKs', e); return null; });
  try{
    if(!window.firebase.apps.length) window.firebase.initializeApp(cfg);
    window._firestore = window.firebase.firestore();
    return window._firestore;
  }catch(e){ console.error('Firebase init error', e); return null; }
}

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

// Updates (JSON file)
let _updatesCache = null;
async function loadUpdates(){
  if(_updatesCache) return _updatesCache;
  try{
    const resp = await fetch('updates.json?_=' + Date.now());
    if(!resp.ok) return [];
    _updatesCache = await resp.json();
    return _updatesCache;
  }catch(e){
    console.error('Failed to load updates:', e);
    return [];
  }
}
function renderUpdates(){
  loadUpdates().then(list => {
    const container = document.getElementById('updates-list');
    if(!container) return;
    container.innerHTML = '';
    list.slice().reverse().forEach(u=>{
      const el = document.createElement('div'); el.className='update-block'; el.innerHTML = `<time>${new Date(u.t).toLocaleString()}</time><p>${u.text}</p>`; container.appendChild(el);
    });
  });
}
function initUpdates(){
  const form = document.getElementById('update-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const text = (form.querySelector('textarea[name=update]')||{}).value||'';
      if(!text.trim()) return;
      
      // Generate the new update object
      const newUpdate = {t: Date.now(), text: text.trim()};
      
      // Show instructions for manual editing
      const instructions = `To add this update, edit the updates.json file in VS Code:\n\nAdd this entry at the end of the array (before the closing bracket):\n\n,\n${JSON.stringify(newUpdate, null, 2)}\n\nThen refresh the page.`;
      alert(instructions);
      
      // Copy to clipboard if available
      if(navigator.clipboard){
        const copyText = `,\n${JSON.stringify(newUpdate, null, 2)}`;
        navigator.clipboard.writeText(copyText).then(()=>{
          alert('Update JSON copied to clipboard! Paste it into updates.json in VS Code.');
        }).catch(()=>{});
      }
    });
  }
  renderUpdates();
}

// Skill tree (localStorage)
function loadSkills(){ try{ return JSON.parse(localStorage.getItem(SKILLS_KEY)||'{}'); }catch{return {}} }
function saveSkills(obj){ localStorage.setItem(SKILLS_KEY, JSON.stringify(obj)); }
function initSkillTree(){
  const state = loadSkills();
  // Make skill checkboxes display-only for visitors. Certain skills should be shown as completed.
  const completed = new Set([
    'sit','down','wait','look at me','potty','up','brush teeth','spin','place','bed','crate','outside'
  ]);
  document.querySelectorAll('#skill-tree input[type=checkbox][data-skill]').forEach(cb=>{
    const key = cb.dataset.skill;
    // respect persisted state but ensure required ones are checked
    cb.checked = !!state[key] || completed.has(key);
    cb.disabled = true; // prevent user interaction
    cb.setAttribute('aria-disabled', 'true');
    // Keep state in localStorage so admin edits still persist if desired
    if(cb.checked) { state[key] = true; }
  });
  saveSkills(state);
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
  // make weigh-ins data-driven; order newest-first
  const weighIns = [
    { date: '12/18/25', lbs: 4.5, note: '' },
    { date: '12/12/25', lbs: 4.2, note: '' },
    { date: '12/2/25',  lbs: 3.7, note: 'at the vet' },
    { date: '11/28/25', lbs: 3.3, note: '' },
    { date: '11/21/25', lbs: 2.7, note: '' }
  ];

  renderWeight(false);
  function renderWeight(inKg){
    const latest = weighIns[0];
    if(!latest) return;
    if(inKg){
      weightText.innerHTML = `Latest: <strong>${lbsToKg(latest.lbs)} kg</strong>`;
      toggle.textContent = 'Show in lbs';
      list.innerHTML = weighIns.map(w => `<li>${w.date}: ${lbsToKg(w.lbs)} kg${w.note ? ' ('+w.note+')' : ''}</li>`).join('');
    } else {
      weightText.innerHTML = `Latest: <strong>${latest.lbs} lbs</strong>`;
      toggle.textContent = 'Show in kg';
      list.innerHTML = weighIns.map(w => `<li>${w.date}: ${w.lbs} lbs${w.note ? ' ('+w.note+')' : ''}</li>`).join('');
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
  initVisitCounter();
});

// Visit counter: display and optionally call Cloud Function to increment
async function initVisitCounter(){
  const container = document.createElement('div');
  container.id = 'visit-counter';
  container.style = 'position:fixed;right:12px;bottom:12px;background:rgba(255,255,255,0.9);padding:8px 10px;border-radius:8px;border:1px solid var(--border);font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,0.06);z-index:1000';
  container.textContent = 'Visits: …';
  document.body.appendChild(container);
  // If a functions URL is provided, call increment endpoint; otherwise read Firestore doc for count
  try{
    if(window.FIREBASE_FUNCTIONS_URL){
      const resp = await fetch((window.FIREBASE_FUNCTIONS_URL.replace(/\/$/,'')) + '/incrementVisit', { method: 'POST' });
      const json = await resp.json();
      if(json && typeof json.count !== 'undefined') container.textContent = `Visits: ${json.count}`;
      return;
    }
    const db = await ensureFirebase();
    if(db){
      // try to increment atomically from the client using FieldValue.increment
      try{
        const ref = db.doc('metrics/visits');
        await db.runTransaction(async (tx)=>{
          const snap = await tx.get(ref);
          const adminField = db.FieldValue ? db.FieldValue.increment(1) : window.firebase.firestore.FieldValue.increment(1);
          if(!snap.exists){
            tx.set(ref, { count: 1, last: Date.now() });
          } else {
            tx.update(ref, { count: adminField, last: Date.now() });
          }
        });
      }catch(e){
        // fallback: simple get/set
        try{
          const doc = await db.doc('metrics/visits').get();
          const count = (doc.exists && doc.data().count) ? doc.data().count : 0;
          await db.doc('metrics/visits').set({ count: count + 1, last: Date.now() }, { merge: true });
        }catch(err){ console.warn('Visit counter write failed', err); }
      }
      const final = await db.doc('metrics/visits').get();
      const finalCount = (final.exists && final.data().count) ? final.data().count : 0;
      container.textContent = `Visits: ${finalCount}`;
    }
  }catch(e){ console.warn('Visit counter error', e); }
}

// FAQ (localStorage-backed public list on this device)
function loadFAQ(){ try{ return JSON.parse(localStorage.getItem(FAQ_KEY)||'[]'); }catch{return []} }
function saveFAQ(list){ localStorage.setItem(FAQ_KEY, JSON.stringify(list)); }
function formatDate(ts){ try{ return new Date(ts).toLocaleString(undefined,{year:'numeric',month:'short',day:'2-digit',hour:'numeric',minute:'2-digit'}); }catch{return ''} }
async function renderFAQ(remoteList){
  const container = document.getElementById('faq-list');
  if(!container) return;
  container.innerHTML = '';
  let list = remoteList;
  if(!list){
    const db = await ensureFirebase();
    if(db){
      try{
        const snap = await db.collection('faq').orderBy('t','desc').get();
        list = snap.docs.map(d=>Object.assign({ _id: d.id }, d.data()));
      }catch(e){ console.warn('Fetching FAQ from cloud failed, falling back to local', e); list = loadFAQ(); }
    } else {
      list = loadFAQ();
    }
  }
  // admin detection
  const adminMode = (location.search||'').includes('admin=1') || !!window.FIREBASE_ADMIN_TOKEN;
  console.log('FAQ Debug - adminMode:', adminMode);
  console.log('FAQ Debug - total items:', list.length);
  console.log('FAQ Debug - items:', list);
  const visible = list.filter(e=> adminMode ? true : (e.approved === undefined ? true : e.approved === true));
  console.log('FAQ Debug - visible items:', visible.length);
  console.log('FAQ Debug - visible:', visible);
  if(!visible || !visible.length){ container.innerHTML = '<p>No community questions yet. Be the first!</p>'; return; }
  visible.forEach((q, idx)=>{
    const el = document.createElement('div');
    el.className = 'update-block';
    const answered = q.a && q.a.trim().length>0;
    const askedOn = q.t ? formatDate(q.t) : '';
    const answeredOn = q.aT ? formatDate(q.aT) : '';
    // Use _id from object if available, otherwise use index
    const idAttr = q._id ? `data-id="${q._id}"` : `data-answer="${idx}"`;
    let inner = `
      <p><strong>Q:</strong> ${q.q}</p>
      ${askedOn ? `<p class="meta">Asked ${askedOn}</p>` : ''}
      ${answered ? `<p><strong>A:</strong> ${q.a}</p>${answeredOn ? `<p class="meta">Answered ${answeredOn}</p>` : ''}` : `<p><em>Unanswered</em></p>`}
    `;
    if(adminMode){
      const status = (q.approved===true) ? '<em style="color:green">Approved</em>' : '<em style="color:orange">Pending</em>';
      inner += `<p>${status} <button class="btn" ${idAttr} style="margin-left:12px">Answer</button> <button class="btn" data-approve-id="${q._id||''}">Approve</button> <button class="btn" data-delete-id="${q._id||''}">Delete</button></p>`;
    } else {
      inner += `<p><button class="btn" ${idAttr}>Answer</button></p>`;
    }
    el.innerHTML = inner;
    container.appendChild(el);
  });
  container.onclick = async (e)=>{
    const btnId = e.target.closest('button[data-id]')?.getAttribute('data-id');
    const btnIdx = e.target.closest('button[data-answer]')?.getAttribute('data-answer');
    if(!btnId && !btnIdx) return;
    const a = prompt('Enter an answer for this question:','');
    if(a===null) return;
    if(btnId){
      // cloud update
      const db = await ensureFirebase();
      if(db){
        try{ await db.collection('faq').doc(btnId).update({ a, aT: Date.now() }); return; }catch(e){ console.warn('Cloud update failed', e); }
      }
    }
    // local fallback
    const i = parseInt(btnIdx,10);
    const data = loadFAQ(); const item = data[data.length-1 - i]; if(!item) return;
    item.a = a; item.aT = Date.now(); saveFAQ(data); renderFAQ();
  };
  // Admin approve/delete handlers
  container.addEventListener('click', async (e)=>{
    const approveId = e.target.closest('button[data-approve-id]')?.getAttribute('data-approve-id');
    const deleteId = e.target.closest('button[data-delete-id]')?.getAttribute('data-delete-id');
    if(!approveId && !deleteId) return;
    const db = await ensureFirebase();
    if(approveId && db){ try{ await db.collection('faq').doc(approveId).update({ approved: true }); return; }catch(err){ console.warn('Approve failed', err); } }
    if(deleteId && db){ try{ await db.collection('faq').doc(deleteId).delete(); return; }catch(err){ console.warn('Delete failed', err); } }
  });
}

async function initFAQ(){
  const form = document.getElementById('faq-form');
  if(form){
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const q = (form.querySelector('textarea[name=question]')||{}).value||'';
      if(!q.trim()) return;
      (async ()=>{
        const db = await ensureFirebase();
        if(db){
          try{ await db.collection('faq').add({ t: Date.now(), q, a: '', aT: null, approved: false }); form.reset(); return; }catch(e){ console.warn('Cloud write failed, saving locally', e); }
        }
        const list = loadFAQ(); list.push({ t: Date.now(), q, a: '', aT: null }); saveFAQ(list); form.reset(); renderFAQ();
      })();
    });
  }
  // If cloud available, subscribe to realtime; otherwise render local
  const db = await ensureFirebase();
  if(db){
    try{
      db.collection('faq').orderBy('t','desc').onSnapshot(snap=>{
        const list = snap.docs.map(d=>Object.assign({ _id: d.id }, d.data()));
        renderFAQ(list);
      });
      return;
    }catch(e){ console.warn('Realtime subscription for FAQ failed', e); }
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
    'assets/Newt1.jpeg',
    'assets/Newt2.jpeg',
    'assets/Newt3.jpeg',
    'assets/Newt4.jpeg',
    'assets/Newt5.jpeg',
    'assets/Newt6.jpeg',
    'assets/Newt7.jpeg',
    'assets/Newt8.jpeg',
    'assets/Newt9.jpeg'
  ];
  const daysSinceEpoch = Math.floor(Date.now() / (1000*60*60*24));
  const photoIndex = daysSinceEpoch % photoUrls.length;
  el.src = photoUrls[photoIndex];
}

// Guestbook (localStorage-backed entries with optional drawings)
function loadGuestbook(){ try{ return JSON.parse(localStorage.getItem(GUESTBOOK_KEY)||'[]'); }catch{return []} }
function saveGuestbook(list){ localStorage.setItem(GUESTBOOK_KEY, JSON.stringify(list)); }
async function renderGuestbook(remoteList){
  const container = document.getElementById('guestbook-list');
  if(!container) return;
  container.innerHTML = '';
  let list = remoteList;
  if(!list){
    const db = await ensureFirebase();
    if(db){
      try{
        const snap = await db.collection('guestbook').orderBy('t','desc').get();
        // keep ids alongside data for admin actions
        list = snap.docs.map(d=>Object.assign({ _id: d.id }, d.data()));
      }catch(e){ console.warn('Fetching guestbook from cloud failed, falling back to local', e); list = loadGuestbook(); }
    } else {
      list = loadGuestbook();
    }
  }
  // Detect admin mode (admin=1 query or FIREBASE_ADMIN_TOKEN present)
  const adminMode = (location.search||'').includes('admin=1') || !!window.FIREBASE_ADMIN_TOKEN;
  // For backwards compatibility, local entries without `approved` are considered approved
  const visible = list.filter(e=> adminMode ? true : (e.approved === undefined ? true : e.approved === true));
  if(!visible || !visible.length){ container.innerHTML = '<p>No messages yet. Be the first to sign!</p>'; return; }
  visible.forEach(entry=>{
    const el = document.createElement('div');
    el.className = 'update-block';
    const ts = entry.t ? new Date(entry.t).toLocaleString() : new Date().toLocaleString();
    let html = `<p><strong>${entry.name}</strong> <span class="meta">${ts}</span></p>`;
    html += `<p style="margin-top:6px;">${entry.message}</p>`;
    if(entry.drawing){
      html += `<img src="${entry.drawing}" alt="Drawing by ${entry.name}" style="max-width:100%;border-radius:8px;margin-top:8px;border:1px solid var(--border);">`;
    }
    // If admin, add approve/delete controls and show approval status
    if(adminMode){
      const status = (entry.approved===true) ? '<em style="color:green">Approved</em>' : '<em style="color:orange">Pending</em>';
      html = `<div style="display:flex;justify-content:space-between;align-items:center;">${html}<span style="margin-left:12px">${status}</span></div>`;
      html += `<p style="margin-top:8px;"><button class="btn" data-approve-id="${entry._id||''}">Approve</button> <button class="btn" data-delete-id="${entry._id||''}">Delete</button></p>`;
    }
    el.innerHTML = html;
    container.appendChild(el);
  });
  // Admin actions
  if(adminMode){
    container.addEventListener('click', async (e)=>{
      const approveId = e.target.closest('button[data-approve-id]')?.getAttribute('data-approve-id');
      const deleteId = e.target.closest('button[data-delete-id]')?.getAttribute('data-delete-id');
      const db = await ensureFirebase();
      if(approveId && db){
        try{ await db.collection('guestbook').doc(approveId).update({ approved: true }); return; }catch(err){ console.warn('Approve failed', err); }
      }
      if(deleteId && db){
        try{ await db.collection('guestbook').doc(deleteId).delete(); return; }catch(err){ console.warn('Delete failed', err); }
      }
      // local fallback actions (index by timestamp) — rebuild local list
      if(approveId==='' || deleteId===''){
        const key = GUESTBOOK_KEY;
        const data = loadGuestbook();
        // nothing to do without id mapping; just refresh
        renderGuestbook(data);
      }
    });
  }
}

async function initGuestbook(){
  const canvas = document.getElementById('drawing-canvas');
  const form = document.getElementById('guestbook-form');
  if(!canvas || !form) return;
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let currentColor = '#000';
  let currentSize = 4;
  
  // Set canvas size to match display
  const rect = canvas.getBoundingClientRect();
  // Match the larger canvas in HTML: 800x400
  canvas.width = 800;
  canvas.height = 400;
  
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
    
    (async ()=>{
      const db = await ensureFirebase();
      if(db){
        try{
          // mark cloud submissions as unapproved until you approve them
          await db.collection('guestbook').add({ t: Date.now(), name, message, drawing, approved: false });
          form.reset(); ctx.clearRect(0,0,canvas.width,canvas.height);
          return; // onSnapshot listener or subsequent fetch will update UI
        }catch(e){ console.warn('Cloud write failed, saving locally', e); }
      }
      const list = loadGuestbook();
      // local saves are considered approved so existing behavior remains
      list.push({ t: Date.now(), name, message, drawing, approved: true });
      saveGuestbook(list);
      form.reset(); ctx.clearRect(0,0,canvas.width,canvas.height);
      renderGuestbook();
    })();
  });
  // If cloud available, subscribe to realtime updates; otherwise render local
  const db = await ensureFirebase();
  if(db){
    try{
      db.collection('guestbook').orderBy('t','desc').onSnapshot(snap=>{
        const list = snap.docs.map(d=>Object.assign({ _id: d.id }, d.data()));
        renderGuestbook(list);
      });
      return;
    }catch(e){ console.warn('Realtime subscription failed', e); }
  }
  renderGuestbook();
}