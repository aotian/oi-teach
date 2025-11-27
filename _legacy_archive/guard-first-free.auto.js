// guard-first-free.auto.js (v6)
import supabaseClient from './client.js';

const SECTION_CANDIDATES = ['[data-section]','.tcw-section','.left .card','.knowledge .card','.panel.section','.chapter'];
const ITEM_LINK_SELECTOR = 'a[href]:not([data-ignore])';

const BADGE_FREE  = '<span style="margin-left:8px;padding:2px 6px;border-radius:999px;font-size:12px;background:#e6fffb;border:1px solid #87e8de;color:#08979c;">首节免费</span>';
const BADGE_PAID  = '<span style="margin-left:8px;padding:2px 6px;border-radius:999px;font-size:12px;background:#fff7ed;border:1px solid #fed7aa;color:#d97706;">付费</span>';
const BADGE_UNLOCKED  = '<span style="margin-left:8px;padding:2px 6px;border-radius:999px;font-size:12px;background:#d1fae5;border:1px solid #6ee7b7;color:#10b981;">已解锁</span>';

const nextTick = () => new Promise(r => setTimeout(r, 0));
async function ready(){ await nextTick(); await nextTick(); }

async function getAuthStatus(){
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user || null;
  let paid=false, role='guest';
  if(user){
    const { data: prof } = await supabaseClient.from('profiles').select('role, membership_expires_at').eq('id', user.id).maybeSingle();
    if (prof){
      role = prof.role || 'user';
      if (prof.role === 'admin') paid = true;
      else if (prof.role === 'paid_user' && prof.membership_expires_at){
        paid = new Date(prof.membership_expires_at).getTime() > Date.now();
      }
    }
  }
  return { user, paid, role };
}

function updateWelcome(auth){
  const el = document.querySelector('#welcome-user');
  if (!el) return;
  if (auth.user){
    const email = auth.user.email || '已登录';
    const roleCN = auth.paid ? '付费会员' : (auth.role === 'admin' ? '管理员' : '免费用户');
    el.textContent = `欢迎，${email}（角色：${roleCN}）`;
  } else {
    el.textContent = '欢迎，（未登录）';
  }
}

function pickSections(root=document){
  for(const sel of SECTION_CANDIDATES){
    const list = root.querySelectorAll(sel);
    if(list.length) return Array.from(list);
  }
  return [];
}

function decorateSection(section, auth){
  const links = Array.from(section.querySelectorAll(ITEM_LINK_SELECTOR)).filter(a => a.getAttribute('href') && a.getAttribute('href') !== '#');
  if(!links.length) return;

  if (auth.paid){
    links.forEach(a=>{ if(a.__tcwTagged) return; a.insertAdjacentHTML('beforeend', BADGE_UNLOCKED); a.__tcwTagged=true; });
    return;
  }

  links.forEach((a, idx)=>{
    if(a.__tcwTagged) return;
    if(idx===0){ a.insertAdjacentHTML('beforeend', BADGE_FREE); a.dataset.tcwAccess='free'; }
    else { a.insertAdjacentHTML('beforeend', BADGE_PAID); a.dataset.tcwAccess='paid'; }
    a.__tcwTagged=true;

    a.addEventListener('click', (e)=>{
      if(!auth.user){
        e.preventDefault();
        const target=a.getAttribute('href'); const redirect=encodeURIComponent(target||'/index.html');
        window.location.href=`login.html?redirect=${redirect}`; return;
      }
      if(a.dataset.tcwAccess==='paid'){
        e.preventDefault();
        if(confirm('该内容为付费专属，是否前往“升级/续费”页面？')) window.location.href='upgrade.html';
      }
    }, { capture:true });
  });
}

let authState = { user:null, paid:false, role:'guest' };
let timer=null;

async function run(){
  await ready();
  try { authState = await getAuthStatus(); } catch { authState = { user:null, paid:false, role:'guest' }; }
  updateWelcome(authState);
  const sections = pickSections(document);
  sections.forEach(sec=>decorateSection(sec, authState));
}

run();
const obs=new MutationObserver(()=>{ clearTimeout(timer); timer=setTimeout(run,60); });
obs.observe(document.body,{childList:true,subtree:true});
supabaseClient.auth.onAuthStateChange(()=>{ run(); });
