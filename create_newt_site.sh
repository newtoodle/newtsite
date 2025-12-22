#!/usr/bin/env bash
# Creates the Newt Site files (in case you prefer a script)
set -e
root="$PWD"
mkdir -p "assets" 
cat > index.html <<'HTML'
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Newt — Apricot Toy Poodle</title>
  <meta name="description" content="Newt's cozy puppy site — vlog, gallery, updates, and live age clock.">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Spectral:wght@300;400;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header class="site-header">
    <div class="brand">
      <a href="index.html"><img src="assets/logo.svg" alt="Newt logo" class="logo"></a>
      <h1>Newt</h1>
    </div>
    <button id="nav-toggle" aria-expanded="false" aria-controls="main-nav">☰</button>
    <nav id="main-nav" class="main-nav" aria-hidden="true">
      <a href="index.html">Home</a>
      <a href="vlog.html">Vlog</a>
      <a href="gallery.html">Gallery</a>
      <a href="updates.html">Daily Updates</a>
      <a href="skills.html">Skill Tree</a>
      <a href="#contact">Contact</a>
    </nav>
    <div id="nav-overlay" class="nav-overlay" hidden></div>
  </header>

  <main>
    <section class="hero">
      <h2>Welcome to Newt's Cozy Corner</h2>
      <p class="subtitle">Apricot toy poodle — regal, curious, and full of mischief.</p>
      <div class="age-clock">Newt is <span id="age-text">—</span> old.</div>
      <p class="cta"><a href="vlog.html" class="btn">Watch the Vlog</a></p>
    </section>

    <section class="cards">
      <article class="card">
        <h3>Latest Vlog</h3>
        <p>Peek at Newt's latest adventures and training snippets.</p>
        <p><a href="vlog.html">See Vlog →</a></p>
      </article>
      <article class="card">
        <h3>Gallery</h3>
        <p>Cozy photos of Newt being adorable.</p>
        <p><a href="gallery.html">View Photos →</a></p>
      </article>
      <article class="card">
        <h3>Daily Updates</h3>
        <p>Short notes and milestones we log every day.</p>
        <p><a href="updates.html">Read Updates →</a></p>
      </article>
    </section>

    <section id="contact" class="contact card">
      <h3>Contact</h3>
      <form id="contact-form" action="#" method="POST" data-netlify="true" name="contact">
        <input type="hidden" name="form-name" value="contact">
        <label>Name<br><input name="name" required></label>
        <label>Email<br><input name="email" type="email" required></label>
        <label>Message<br><textarea name="message" rows="4" required></textarea></label>
        <p><button type="submit" class="btn">Send</button></p>
      </form>
      <p class="fallback">Or email: <a href="mailto:lordnewtguillemot@gmail.com">lordnewtguillemot@gmail.com</a></p>
    </section>
  </main>

  <footer class="site-footer">
    <small>© 2025 Newt. Built with love.</small>
  </footer>

  <script src="script.js"></script>
</body>
</html>
HTML

cat > style.css <<'CSS'
:root{--bg:#f7efe6;--card:#fff9f2;--accent:#6a8a5a;--accent-2:#8b5a3c;--muted:#6b5b4a;--glass:rgba(255,255,255,0.6);}*{box-sizing:border-box}body{font-family:Spectral,serif;margin:0;background:linear-gradient(180deg,var(--bg),#fff);color:var(--muted);line-height:1.4}a{color:var(--accent-2)}.site-header{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;background:transparent} .brand{display:flex;align-items:center;gap:12px} .logo{height:44px} h1{font-family:Cinzel,serif;margin:0;font-size:1.2rem;color:var(--accent-2)}#nav-toggle{display:none;border:0;background:transparent;font-size:1.4rem} .main-nav{display:flex;gap:12px} .main-nav a{padding:8px 10px;border-radius:8px;text-decoration:none;background:transparent} .hero{padding:36px 18px;text-align:center} .hero h2{font-family:Cinzel,serif;margin:0 0 8px;font-size:2rem;color:var(--accent-2)} .subtitle{margin:0 0 18px;color:#5b4d3f} .age-clock{font-weight:600;background:var(--card);display:inline-block;padding:10px 14px;border-radius:12px;box-shadow:0 6px 18px rgba(85,60,45,0.06)} .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;padding:18px} .card{background:var(--card);padding:14px;border-radius:12px;box-shadow:0 6px 18px rgba(85,60,45,0.06)} .btn{background:var(--accent);color:#fff;padding:10px 14px;border-radius:10px;text-decoration:none;display:inline-block} .contact{max-width:720px;margin:18px auto} label{display:block;margin-bottom:8px} input,textarea{width:100%;padding:8px;border-radius:8px;border:1px solid #e6dcd0;background:var(--glass)} .site-footer{text-align:center;padding:18px;color:#918476} .nav-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.35);z-index:40} @media(max-width:800px){#nav-toggle{display:inline-block} .main-nav{position:fixed;right:12px;top:68px;background:var(--card);padding:12px;border-radius:10px;flex-direction:column;gap:8px;box-shadow:0 10px 30px rgba(0,0,0,0.12);z-index:50;display:none} .main-nav.open{display:flex}}
CSS

cat > script.js <<'JS'
const BIRTH = new Date(2025,8,15,10,0,0);
const CONTACT_EMAIL = 'lordnewtguillemot@gmail.com';
const UPDATES_KEY = 'newt_updates_v1';
const SKILLS_KEY = 'newt_skills_v1';

function updateAge(){
  const now = new Date();
  let diff = Math.max(0, now - BIRTH);
  const msInSecond = 1000, msInMinute = msInSecond*60, msInHour = msInMinute*60, msInDay = msInHour*24;
  const days = Math.floor(diff / msInDay); diff -= days*msInDay;
  const hours = Math.floor(diff / msInHour); diff -= hours*msInHour;
  const minutes = Math.floor(diff / msInMinute);
  const display = `${days} days, ${hours}h ${minutes}m`;
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
    const netlify = form.hasAttribute('data-netlify');
    if(netlify){ return; }
    e.preventDefault();
    const data = new FormData(form);
    const subject = encodeURIComponent('Newt site message from '+(data.get('name')||'visitor'));
    const body = encodeURIComponent(`Email: ${data.get('email')||''}\n\n${data.get('message')||''}`);
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  });
}

function loadUpdates(){ try{ return JSON.parse(localStorage.getItem(UPDATES_KEY)||'[]'); }catch{return []} }
function saveUpdates(list){ localStorage.setItem(UPDATES_KEY, JSON.stringify(list)); }
function renderUpdates(){
  const list = loadUpdates();
  const container = document.getElementById('updates-list');
  if(!container) return;
  container.innerHTML = '';
  list.slice().reverse().forEach(u=>{
    const el = document.createElement('div'); el.className='update'; el.innerHTML = `<time>${new Date(u.t).toLocaleString()}</time><p>${u.text}</p>`; container.appendChild(el);
  });
}
function initUpdates(){
  const form = document.getElementById('update-form');
  if(!form) return;
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = (form.querySelector('textarea[name=update]')||{}).value||'';
    if(!text.trim()) return;
    const list = loadUpdates(); list.push({t:Date.now(), text}); saveUpdates(list); form.reset(); renderUpdates();
  });
  renderUpdates();
}

function loadSkills(){ try{ return JSON.parse(localStorage.getItem(SKILLS_KEY)||'{}'); }catch{return {}} }
function saveSkills(obj){ localStorage.setItem(SKILLS_KEY, JSON.stringify(obj)); }
function initSkillTree(){
  const area = document.getElementById('skill-tree'); if(!area) return;
  const state = loadSkills();
  area.querySelectorAll('input[type=checkbox][data-skill]').forEach(cb=>{
    const key = cb.dataset.skill; cb.checked = !!state[key];
    cb.addEventListener('change', ()=>{ state[key]=cb.checked; saveSkills(state); });
  });
  const exp = document.getElementById('export-skills'); if(exp) exp.addEventListener('click', ()=>{ navigator.clipboard.writeText(JSON.stringify(loadSkills())); alert('Skill data copied to clipboard'); });
  const imp = document.getElementById('import-skills'); if(imp) imp.addEventListener('click', ()=>{ const v=prompt('Paste exported skill data'); try{ const obj=JSON.parse(v||'{}'); saveSkills(obj); location.reload(); }catch{alert('Invalid data')} });
  const reset = document.getElementById('reset-skills'); if(reset) reset.addEventListener('click', ()=>{ if(confirm('Reset skills?')){ localStorage.removeItem(SKILLS_KEY); location.reload(); }});
}

document.addEventListener('DOMContentLoaded', ()=>{
  updateAge(); setInterval(updateAge, 60*1000);
  initNav(); initContactForm(); initUpdates(); initSkillTree();
});
JS

echo 'Created site files.'
chmod +x create_newt_site.sh
