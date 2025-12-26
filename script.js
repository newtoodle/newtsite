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
    try{ 
      if(!window.firebase.apps.length) {
        window.firebase.initializeApp(cfg);
      }
      window._firestore = window.firebase.firestore(); 
      return window._firestore; 
    }catch(e){ 
      console.error('Firebase init error', e); 
      return null; 
    }
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
    if(!window.firebase.apps.length) {
      window.firebase.initializeApp(cfg);
    }
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
  const minutes = Math.floor(diff / msInMinute); diff -= minutes*msInMinute;
  const seconds = Math.floor(diff / msInSecond);
  const display = `${weeks} weeks, ${days} days, ${hours}h ${minutes}m ${seconds}s`;
  const el = document.getElementById('age-text'); if(el) el.textContent = display;
}

function initNav(){
  const btn = document.getElementById('nav-toggle');
  const nav = document.getElementById('main-nav');
  const overlay = document.getElementById('nav-overlay');
  if(!btn||!nav) return;
  btn.addEventListener('click', ()=>{
    const isHidden = nav.getAttribute('aria-hidden') === 'true';
    nav.setAttribute('aria-hidden', String(!isHidden));
    btn.setAttribute('aria-expanded', String(isHidden));
    if(isHidden){
      overlay.hidden=false;
      overlay.addEventListener('click', close);
      document.body.style.overflow='hidden';
    } else {
      close();
    }
  });
  function close(){
    nav.setAttribute('aria-hidden','true');
    btn.setAttribute('aria-expanded','false');
    overlay.hidden=true;
    document.body.style.overflow='';
  }
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
  loadUpdates().then(async list => {
    const container = document.getElementById('updates-list');
    if(!container) return;
    container.innerHTML = '';
    
    // Update post count
    const postCountEl = document.getElementById('post-count-number');
    if(postCountEl) postCountEl.textContent = list.length;
    
    // Get Firebase for global lick counts
    const db = await ensureFirebase();
    
    for(const u of list.slice().reverse()){
      const postId = `newt-${u.t}`;
      const userLickKey = `newtter_licks_${postId}_user`;
      const hasLicked = localStorage.getItem(userLickKey) === 'true';
      
      // Try to get lick count from Firebase
      let lickCount = 0;
      if(db){
        try{
          const doc = await db.collection('licks').doc(postId).get();
          lickCount = doc.exists ? (doc.data().count || 0) : 0;
        }catch(e){ console.warn('Failed to load lick count', e); }
      }
      
      const el = document.createElement('div'); 
      el.className='update-block newtter-post'; 
      el.dataset.postId = postId;
      el.innerHTML = `
        <div class="newtter-header">
          <img src="assets/pfp.jpeg" alt="Newt" class="newtter-avatar">
          <div class="newtter-user-info">
            <div class="newtter-display-name">Newt <span class="newtter-handle">@lordnewt</span></div>
            <div class="newtter-nickname">Mr. Pee Pee Man</div>
          </div>
        </div>
        <p style="margin:12px 0;">${u.text}</p>
        ${u.photo ? `<img src="${u.photo}" alt="Newtter post image" class="newtter-photo" style="max-width:100%;border-radius:12px;margin:10px 0;">` : ''}
        <time class="meta" style="font-size:0.8rem;display:block;margin-top:8px;">${new Date(u.t).toLocaleString()}</time>
        <div class="newtter-actions">
          <button class="newtter-btn renewt-btn" data-post-id="${postId}" title="Re-Newt (Share)">
            <span class="renewt-icon">〇</span> Re-Newt
          </button>
          <button class="newtter-btn lick-btn ${hasLicked ? 'licked' : ''}" data-post-id="${postId}" title="Lick">
            <span class="lick-icon">${hasLicked ? '-`♡´-' : '♡'}</span> Lick <span class="lick-count">${lickCount}</span>
          </button>
          <button class="newtter-btn bark-btn" data-post-id="${postId}" title="Bark (Reply)">
            <span class="bark-icon">.ᐟ</span> Bark
          </button>
        </div>
        <div class="bark-replies-list-container"></div>
      `;
      container.appendChild(el);
      
      // Load existing barks immediately and show them
      const repliesContainer = el.querySelector('.bark-replies-list-container');
      loadBarksPublic(postId, repliesContainer);
    }
    attachNewtterListeners();
  });
}

function attachNewtterListeners(){
  // Lick buttons
  document.querySelectorAll('.lick-btn').forEach(btn => {
    btn.addEventListener('click', async function(){
      const postId = this.dataset.postId;
      const userLickKey = `newtter_licks_${postId}_user`;
      const hasLicked = localStorage.getItem(userLickKey) === 'true';
      const iconSpan = this.querySelector('.lick-icon');
      const countSpan = this.querySelector('.lick-count');
      
      // Try Firebase for global count
      const db = await ensureFirebase();
      
      if(db){
        try{
          const docRef = db.collection('licks').doc(postId);
          
          if(hasLicked){
            // Unlike - decrement but never go below 0
            const currentDoc = await docRef.get();
            const currentCount = currentDoc.exists ? (currentDoc.data().count || 0) : 0;
            
            if(currentCount > 0){
              await docRef.set({ 
                count: window.firebase.firestore.FieldValue.increment(-1) 
              }, { merge: true });
            } else {
              // Already at 0, just set to 0
              await docRef.set({ count: 0 }, { merge: true });
            }
            
            localStorage.removeItem(userLickKey);
            this.classList.remove('licked');
            if(iconSpan) iconSpan.textContent = '♡';
          } else {
            // Like - increment
            await docRef.set({ 
              count: window.firebase.firestore.FieldValue.increment(1) 
            }, { merge: true });
            localStorage.setItem(userLickKey, 'true');
            this.classList.add('licked');
            if(iconSpan) iconSpan.textContent = '-`♡´-';
          }
          
          // Get updated count from Firebase
          const doc = await docRef.get();
          const newCount = doc.exists ? (doc.data().count || 0) : 0;
          console.log('Lick count updated:', postId, 'new count:', newCount);
          countSpan.textContent = Math.max(0, newCount);
        }catch(e){ 
          console.warn('Failed to update lick count in Firebase', e);
          // Fallback to local count if Firebase fails
          let newCount = parseInt(countSpan.textContent, 10) || 0;
          if(hasLicked){
            newCount = Math.max(0, newCount - 1);
            localStorage.removeItem(userLickKey);
            this.classList.remove('licked');
            if(iconSpan) iconSpan.textContent = '♡';
          } else {
            newCount++;
            localStorage.setItem(userLickKey, 'true');
            this.classList.add('licked');
            if(iconSpan) iconSpan.textContent = '-`♡´-';
          }
          countSpan.textContent = newCount;
        }
      } else {
        // No Firebase - use local counting only
        let newCount = parseInt(countSpan.textContent, 10) || 0;
        if(hasLicked){
          newCount = Math.max(0, newCount - 1);
          localStorage.removeItem(userLickKey);
          this.classList.remove('licked');
          if(iconSpan) iconSpan.textContent = '♡';
        } else {
          newCount++;
          localStorage.setItem(userLickKey, 'true');
          this.classList.add('licked');
          if(iconSpan) iconSpan.textContent = '-`♡´-';
        }
        countSpan.textContent = newCount;
      }
    });
  });
  
  // Bark buttons (replies)
  document.querySelectorAll('.bark-btn').forEach(btn => {
    btn.addEventListener('click', function(){
      const postId = this.dataset.postId;
      const postBlock = this.closest('.newtter-post');
      let replySection = postBlock.querySelector('.bark-reply-section');
      const barkIcon = this.querySelector('.bark-icon');
      
      // Toggle reply section
      if(replySection){
        replySection.remove();
        if(barkIcon) barkIcon.textContent = '.ᐟ';
      } else {
        if(barkIcon) barkIcon.textContent = '.ᐟ.ᐟ';
        replySection = document.createElement('div');
        replySection.className = 'bark-reply-section';
        replySection.innerHTML = `
          <div class="bark-reply-form">
            <textarea placeholder="Bark back at Newt... (max 750 chars)" rows="3" class="bark-textarea" maxlength="750"></textarea>
            <div style="display:flex;gap:8px;margin-top:8px;">
              <input type="text" placeholder="Your name" class="bark-name" style="flex:1;">
              <button class="btn bark-submit-btn">Send Bark</button>
              <button class="btn bark-cancel-btn">Cancel</button>
            </div>
          </div>
          <div class="bark-replies-list"></div>
        `;
        postBlock.appendChild(replySection);
        
        // Load existing replies
        loadBarks(postId, replySection.querySelector('.bark-replies-list'));
        
        // Submit handler
        replySection.querySelector('.bark-submit-btn').addEventListener('click', async () => {
          const message = replySection.querySelector('.bark-textarea').value.trim();
          const name = replySection.querySelector('.bark-name').value.trim() || 'Anonymous';
          if(!message) return;
          if(message.length > 750){ alert('Bark too long (max 750 characters)'); return; }
          
          const bark = { postId, name, message, t: Date.now() };
          
          // Try Firebase first
          const db = await ensureFirebase();
          if(db){
            try{
              await db.collection('barks').add(bark);
              replySection.querySelector('.bark-textarea').value = '';
              replySection.querySelector('.bark-name').value = '';
              // Reload barks to show the new one
              loadBarks(postId, replySection.querySelector('.bark-replies-list'));
              // Also update the public display
              const publicContainer = postBlock.querySelector('.bark-replies-list-container');
              if(publicContainer) loadBarksPublic(postId, publicContainer);
              return;
            }catch(e){ console.warn('Cloud write failed', e); }
          }
          
          // Fallback to localStorage
          const key = `barks_${postId}`;
          const list = JSON.parse(localStorage.getItem(key) || '[]');
          list.push(bark);
          localStorage.setItem(key, JSON.stringify(list));
          loadBarks(postId, replySection.querySelector('.bark-replies-list'));
          // Also update the public display
          const publicContainer = postBlock.querySelector('.bark-replies-list-container');
          if(publicContainer) loadBarksPublic(postId, publicContainer);
          replySection.querySelector('.bark-textarea').value = '';
          replySection.querySelector('.bark-name').value = '';
        });
        
        // Cancel handler
        replySection.querySelector('.bark-cancel-btn').addEventListener('click', () => {
          replySection.remove();
        });
      }
    });
  });
  
  // Re-Newt buttons (share)
  document.querySelectorAll('.renewt-btn').forEach(btn => {
    btn.addEventListener('click', function(){
      const postId = this.dataset.postId;
      const postUrl = `${window.location.origin}${window.location.pathname}#${postId}`;
      const text = 'Check out this Newtter post from Lord Newt!';
      const iconSpan = this.querySelector('.renewt-icon');
      
      // Add animation class and change icon
      this.classList.add('renewt-active');
      if(iconSpan) iconSpan.textContent = '⬤';
      setTimeout(() => {
        this.classList.remove('renewt-active');
        if(iconSpan) iconSpan.textContent = '〇';
      }, 600);
      
      // Try native share API first (best for mobile - includes Instagram, etc.)
      if(navigator.share){
        navigator.share({
          title: 'Newtter Post',
          text: text,
          url: postUrl
        }).catch(()=>{});
      } else {
        // Desktop fallback - show share options
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(postUrl)}`;
        const shareMenu = `
Share this post:

1. Twitter
2. Copy link

Choose option (1-2):`;
        const choice = prompt(shareMenu);
        
        if(choice === '1'){
          window.open(twitterUrl, '_blank', 'width=550,height=420');
        } else if(choice === '2' || !choice){
          if(navigator.clipboard){
            navigator.clipboard.writeText(postUrl).then(()=>{
              alert('Link copied! Share it on Instagram or anywhere else.');
            }).catch(()=>{
              prompt('Copy this link to share:', postUrl);
            });
          } else {
            prompt('Copy this link to share:', postUrl);
          }
        }
      }
    });
  });
}

async function loadBarks(postId, container){
  if(!container) return;
  
  // Try Firebase first
  const db = await ensureFirebase();
  let barks = [];
  
  if(db){
    try{
      const snap = await db.collection('barks').where('postId','==',postId).orderBy('t','asc').get();
      barks = snap.docs.map(d => ({...d.data(), id: d.id}));
    }catch(e){
      console.warn('Loading barks from cloud failed', e);
    }
  }
  
  // Fallback to localStorage
  if(!barks.length){
    const key = `barks_${postId}`;
    barks = JSON.parse(localStorage.getItem(key) || '[]');
  }
  
  container.innerHTML = '';
  if(barks.length === 0){
    container.innerHTML = '<p style="color:var(--muted);font-size:0.85rem;margin-top:12px;">No barks yet. Be the first!</p>';
    return;
  }
  
  barks.forEach(bark => {
    const barkEl = document.createElement('div');
    barkEl.className = 'bark-item';
    barkEl.innerHTML = `
      <div class="bark-item-header">
        <div class="bark-item-avatar">🐾</div>
        <div class="bark-item-user-info">
          <span class="bark-item-name">${bark.name}</span>
          <span class="bark-item-meta">${new Date(bark.t).toLocaleString()}</span>
        </div>
      </div>
      <p class="bark-item-message">${bark.message}</p>
    `;
    if(bark.id){
      barkEl.dataset.barkId = bark.id;
    }
    container.appendChild(barkEl);
  });
}

// Load barks publicly (always visible under posts)
async function loadBarksPublic(postId, container){
  if(!container) return;
  
  // Try Firebase first
  const db = await ensureFirebase();
  let barks = [];
  
  if(db){
    try{
      const snap = await db.collection('barks').where('postId','==',postId).orderBy('t','asc').get();
      barks = snap.docs.map(d => ({...d.data(), id: d.id}));
    }catch(e){
      console.warn('Loading barks from cloud failed', e);
    }
  }
  
  // Fallback to localStorage
  if(!barks.length){
    const key = `barks_${postId}`;
    barks = JSON.parse(localStorage.getItem(key) || '[]');
  }
  
  if(barks.length === 0){
    return; // Don't show anything if no barks
  }
  
  // Create a visible replies section
  container.innerHTML = `
    <div class="bark-replies-public">
      <div class="bark-replies-list"></div>
    </div>
  `;
  
  const repliesList = container.querySelector('.bark-replies-list');
  barks.forEach(bark => {
    const barkEl = document.createElement('div');
    barkEl.className = 'bark-item';
    barkEl.innerHTML = `
      <div class="bark-item-header">
        <div class="bark-item-avatar">🐾</div>
        <div class="bark-item-user-info">
          <span class="bark-item-name">${bark.name}</span>
          <span class="bark-item-meta">${new Date(bark.t).toLocaleString()}</span>
        </div>
      </div>
      <p class="bark-item-message">${bark.message}</p>
    `;
    if(bark.id){
      barkEl.dataset.barkId = bark.id;
    }
    repliesList.appendChild(barkEl);
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

// Chaos Button Easter Egg
function initChaosButton(){
  const chaosBtn = document.getElementById('chaos-button');
  if(!chaosBtn) return;
  chaosBtn.addEventListener('click', function(){
    const audio = new Audio('assets/Chaos1.mp3');
    audio.volume = 1.0;
    audio.play().catch(err=>console.log('Audio play failed:',err));
    const newtImages = ['assets/chaos 1.PNG','assets/Chaos2.PNG','assets/Chaos3.PNG','assets/Chaos4.PNG','assets/Chaos5.PNG','assets/logo.PNG'];
    const newtCount = Math.floor(Math.random()*11)+20;
    for(let i=0; i<newtCount; i++){
      setTimeout(()=>{
        const img = document.createElement('img');
        img.src = newtImages[Math.floor(Math.random()*newtImages.length)];
        img.className = 'chaos-newt';
        const startX = Math.random()*window.innerWidth;
        const startY = Math.random()*window.innerHeight;
        img.style.left = startX+'px';
        img.style.top = startY+'px';
        const moveX = (Math.random()-0.5)*1000;
        const moveY = (Math.random()-0.5)*1000;
        const rotate = (Math.random()-0.5)*720;
        img.style.setProperty('--chaos-x',moveX+'px');
        img.style.setProperty('--chaos-y',moveY+'px');
        img.style.setProperty('--chaos-rotate',rotate+'deg');
        document.body.appendChild(img);
        setTimeout(()=>img.remove(),4000);
      }, i*120);
    }
  });
}

// Treat Button
function initTreatButton(){
  const treatBtn = document.getElementById('treat-button');
  if(!treatBtn) return;
  treatBtn.addEventListener('click', function(){
    setTimeout(()=>{
      const audio = new Audio('assets/chomp.mp3');
      audio.play().catch(err=>console.log('Audio play failed:',err));
    },100);
    const treatCount = Math.floor(Math.random()*20)+1;
    for(let i=0; i<treatCount; i++){
      setTimeout(()=>{
        const img = document.createElement('img');
        img.src = 'assets/treat.png';
        img.className = 'treat-toss';
        const startX = Math.random()*window.innerWidth;
        const startY = Math.random()*window.innerHeight;
        img.style.left = startX+'px';
        img.style.top = startY+'px';
        const moveX = (Math.random()-0.5)*800;
        const moveY = (Math.random()-0.5)*800;
        const rotate = (Math.random()-0.5)*1080;
        img.style.setProperty('--treat-x',moveX+'px');
        img.style.setProperty('--treat-y',moveY+'px');
        img.style.setProperty('--treat-rotate',rotate+'deg');
        document.body.appendChild(img);
        setTimeout(()=>img.remove(),2500);
      }, i*100);
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateAge(); setInterval(updateAge, 1000);
  initNav(); initContactForm(); initUpdates(); initSkillTree(); initFAQ(); initWeightConverter(); initTreatsCounter(); initStatusWidget(); initPhotoOfDay(); initNicknames(); initGuestbook(); initChaosButton(); initTreatButton(); initStinkLevel();
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

// Stink Level (randomized daily)
function initStinkLevel(){
  const elem = document.getElementById('stink-level');
  if(!elem) return;
  
  const stinkLevels = [
    { level: 'S-0', desc: 'Minor' },
    { level: 'S-1', desc: 'Moderate' },
    { level: 'S-2', desc: 'Significant' },
    { level: 'S-3', desc: 'Severe' },
    { level: 'S-4', desc: 'Devastating' },
    { level: 'S-5', desc: 'Incredible' }
  ];
  
  const today = new Date().toDateString();
  const stored = localStorage.getItem('stink-level-data');
  let stinkData;
  
  try{
    stinkData = stored ? JSON.parse(stored) : null;
  }catch(e){
    stinkData = null;
  }
  
  // If no data or date changed, generate new random level
  if(!stinkData || stinkData.date !== today){
    const randomIndex = Math.floor(Math.random() * stinkLevels.length);
    stinkData = {
      date: today,
      level: randomIndex
    };
    localStorage.setItem('stink-level-data', JSON.stringify(stinkData));
  }
  
  const current = stinkLevels[stinkData.level];
  elem.innerHTML = `<strong>${current.level}</strong> (${current.desc})`;
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
  const profileBio = document.getElementById('profile-nickname');
  const tsEl = document.getElementById('nickname-timestamp');
  const entry = loadNickname();
  const nickname = entry?.value ? entry.value : 'None yet.';
  
  // Update both locations (old nickname box if exists, and new profile bio)
  if(display) display.textContent = nickname;
  if(profileBio) profileBio.textContent = nickname;
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
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  // MS Paint State
  let drawing = false;
  let currentTool = 'pencil';
  let primaryColor = '#000000';
  let secondaryColor = '#ffffff';
  let currentSize = 5;
  let currentOpacity = 1;
  let fillShape = false;
  let spraySettings = { density: 20, radius: 15 };
  let undoStack = [];
  let redoStack = [];
  let startPos = null;
  let tempCanvas = null;
  let tempCtx = null;
  
  // Set canvas size
  canvas.width = 800;
  canvas.height = 400;
  
  // Fill with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  saveState();
  
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  // Create temporary canvas for shape previews
  tempCanvas = document.createElement('canvas');
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx = tempCanvas.getContext('2d');
  
  // Tool selection
  document.querySelectorAll('.paint-tool').forEach(btn => {
    btn.addEventListener('click', function(){
      document.querySelectorAll('.paint-tool').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      currentTool = this.dataset.tool;
      updateCursor();
    });
  });
  
  // Undo/Redo
  document.getElementById('undo-btn')?.addEventListener('click', undo);
  document.getElementById('redo-btn')?.addEventListener('click', redo);
  
  // Clear canvas
  document.getElementById('clear-canvas')?.addEventListener('click', ()=>{
    if(confirm('Clear entire canvas?')){
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      saveState();
    }
  });
  
  // Size selector
  document.getElementById('pen-size')?.addEventListener('change', (e)=>{
    currentSize = parseInt(e.target.value, 10) || 5;
  });
  
  // Opacity selector
  document.getElementById('pen-opacity')?.addEventListener('change', (e)=>{
    currentOpacity = parseFloat(e.target.value) || 1;
  });
  
  // Spray settings
  document.getElementById('spray-settings')?.addEventListener('change', (e)=>{
    const setting = e.target.value;
    switch(setting){
      case 'fine': spraySettings = { density: 10, radius: 8 }; break;
      case 'normal': spraySettings = { density: 20, radius: 15 }; break;
      case 'wide': spraySettings = { density: 30, radius: 25 }; break;
      case 'fuzzy': spraySettings = { density: 50, radius: 20 }; break;
      case 'dense': spraySettings = { density: 40, radius: 12 }; break;
    }
  });
  
  // Fill checkbox
  document.getElementById('fill-shape')?.addEventListener('change', (e)=>{
    fillShape = e.target.checked;
  });
  
  // Color swatches
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', function(e){
      const color = this.dataset.color;
      if(e.button === 2 || e.ctrlKey){
        secondaryColor = color;
        document.getElementById('secondary-color-display').style.background = color;
      } else {
        primaryColor = color;
        document.getElementById('primary-color-display').style.background = color;
        document.getElementById('color-picker').value = color;
      }
    });
    swatch.addEventListener('contextmenu', function(e){
      e.preventDefault();
      const color = this.dataset.color;
      secondaryColor = color;
      document.getElementById('secondary-color-display').style.background = color;
    });
  });
  
  // Custom color picker
  document.getElementById('color-picker')?.addEventListener('input', (e)=>{
    primaryColor = e.target.value;
    document.getElementById('primary-color-display').style.background = primaryColor;
  });
  
  // Save/restore state for undo/redo
  function saveState(){
    if(undoStack.length >= 50) undoStack.shift();
    undoStack.push(canvas.toDataURL());
    redoStack = [];
  }
  
  function undo(){
    if(undoStack.length > 1){
      redoStack.push(undoStack.pop());
      const img = new Image();
      img.onload = ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
      img.src = undoStack[undoStack.length-1];
    }
  }
  
  function redo(){
    if(redoStack.length > 0){
      const state = redoStack.pop();
      undoStack.push(state);
      const img = new Image();
      img.onload = ()=>{ ctx.clearRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0); };
      img.src = state;
    }
  }
  
  function updateCursor(){
    const cursors = {
      pencil: 'crosshair', brush: 'crosshair', eraser: 'cell',
      fill: 'pointer', line: 'crosshair',
      rectangle: 'crosshair', circle: 'crosshair', spray: 'crosshair'
    };
    canvas.style.cursor = cursors[currentTool] || 'crosshair';
  }
  
  // Get mouse/touch position
  function getPos(e){
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: Math.floor((clientX - rect.left) * scaleX),
      y: Math.floor((clientY - rect.top) * scaleY)
    };
  }
  
  // Flood fill algorithm
  function floodFill(x, y, fillColor){
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    const targetColor = getPixelColor(pixels, x, y);
    const fillRGB = hexToRgb(fillColor);
    
    if(colorsMatch(targetColor, fillRGB)) return;
    
    const stack = [[x, y]];
    while(stack.length){
      const [cx, cy] = stack.pop();
      if(cx < 0 || cx >= canvas.width || cy < 0 || cy >= canvas.height) continue;
      
      const currentColor = getPixelColor(pixels, cx, cy);
      if(!colorsMatch(currentColor, targetColor)) continue;
      
      setPixelColor(pixels, cx, cy, fillRGB);
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
    
    ctx.putImageData(imageData, 0, 0);
  }
  
  function getPixelColor(pixels, x, y){
    const i = (y * canvas.width + x) * 4;
    return [pixels[i], pixels[i+1], pixels[i+2], pixels[i+3]];
  }
  
  function setPixelColor(pixels, x, y, rgb){
    const i = (y * canvas.width + x) * 4;
    pixels[i] = rgb[0];
    pixels[i+1] = rgb[1];
    pixels[i+2] = rgb[2];
    pixels[i+3] = 255;
  }
  
  function colorsMatch(c1, c2){
    return c1[0]===c2[0] && c1[1]===c2[1] && c1[2]===c2[2] && c1[3]===c2[3];
  }
  
  function hexToRgb(hex){
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return [r, g, b, 255];
  }
  
  function rgbToHex(r, g, b){
    return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
  }
  
  // Drawing functions
  function startDraw(e){
    const pos = getPos(e);
    startPos = pos;
    drawing = true;
    
    if(currentTool === 'fill'){
      floodFill(pos.x, pos.y, primaryColor);
      saveState();
      drawing = false;
      return;
    }
    
    if(currentTool === 'pencil' || currentTool === 'brush'){
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = currentOpacity;
      ctx.strokeStyle = e.button === 2 || e.ctrlKey ? secondaryColor : primaryColor;
      ctx.lineWidth = currentTool === 'brush' ? currentSize * 1.5 : currentSize;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    
    if(currentTool === 'eraser'){
      ctx.globalCompositeOperation = 'destination-out';
      ctx.globalAlpha = currentOpacity;
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = currentSize * 2;
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
    
    if(currentTool === 'spray'){
      ctx.globalAlpha = currentOpacity;
      sprayPaint(pos.x, pos.y);
    }
    
    // For shapes, save current canvas to temp
    if(['line', 'rectangle', 'circle'].includes(currentTool)){
      tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
      tempCtx.drawImage(canvas, 0, 0);
    }
  }
  
  function draw(e){
    if(!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    
    if(currentTool === 'pencil' || currentTool === 'brush'){
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    
    if(currentTool === 'eraser'){
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    
    if(currentTool === 'spray'){
      sprayPaint(pos.x, pos.y);
    }
    
    // Shape preview
    if(['line', 'rectangle', 'circle'].includes(currentTool)){
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, 0, 0);
      
      ctx.globalAlpha = currentOpacity;
      ctx.strokeStyle = primaryColor;
      ctx.fillStyle = primaryColor;
      ctx.lineWidth = currentSize;
      ctx.globalCompositeOperation = 'source-over';
      
      if(currentTool === 'line'){
        ctx.beginPath();
        ctx.moveTo(startPos.x, startPos.y);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
      }
      
      if(currentTool === 'rectangle'){
        const w = pos.x - startPos.x;
        const h = pos.y - startPos.y;
        if(fillShape){
          ctx.fillRect(startPos.x, startPos.y, w, h);
        } else {
          ctx.strokeRect(startPos.x, startPos.y, w, h);
        }
      }
      
      if(currentTool === 'circle'){
        const rx = Math.abs(pos.x - startPos.x);
        const ry = Math.abs(pos.y - startPos.y);
        const cx = startPos.x + (pos.x - startPos.x) / 2;
        const cy = startPos.y + (pos.y - startPos.y) / 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx/2, ry/2, 0, 0, Math.PI * 2);
        if(fillShape){
          ctx.fill();
        } else {
          ctx.stroke();
        }
      }
    }
  }
  
  function endDraw(){
    if(drawing){
      drawing = false;
      ctx.globalAlpha = 1; // Reset opacity
      if(['pencil', 'brush', 'eraser', 'spray', 'line', 'rectangle', 'circle'].includes(currentTool)){
        saveState();
      }
    }
  }
  
  function sprayPaint(x, y){
    const density = spraySettings.density;
    const radius = spraySettings.radius;
    for(let i = 0; i < density; i++){
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      ctx.fillStyle = primaryColor;
      ctx.fillRect(px, py, 1, 1);
    }
  }
  
  // Event listeners
  canvas.addEventListener('mousedown', startDraw);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', endDraw);
  canvas.addEventListener('mouseout', endDraw);
  canvas.addEventListener('touchstart', startDraw);
  canvas.addEventListener('touchmove', draw);
  canvas.addEventListener('touchend', endDraw);
  canvas.addEventListener('contextmenu', (e)=>e.preventDefault());
  
  updateCursor();
  
  // Form submit
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const name = (form.querySelector('input[name=name]')||{}).value||'';
    const message = (form.querySelector('textarea[name=message]')||{}).value||'';
    if(!name.trim()||!message.trim()) return;
    if(message.length > 750){ alert('Message too long (max 750 characters)'); return; }
    
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
          form.reset();
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0,0,canvas.width,canvas.height);
          undoStack = [];
          redoStack = [];
          saveState();
          return; // onSnapshot listener or subsequent fetch will update UI
        }catch(e){ console.warn('Cloud write failed, saving locally', e); }
      }
      const list = loadGuestbook();
      // local saves are considered approved so existing behavior remains
      list.push({ t: Date.now(), name, message, drawing, approved: true });
      saveGuestbook(list);
      form.reset();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      undoStack = [];
      redoStack = [];
      saveState();
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