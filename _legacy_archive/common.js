// common.js — 通用登录/权限 & 局部“按段落收费”
// 仅依赖 client.js
import supabaseClient from './client.js';

// ------- 登录辅助：未登录先去登录（带 redirect） -------
export async function requireLoginAndGo(targetUrl) {
  const { data, error } = await supabaseClient.auth.getUser();
  const user = data?.user;
  if (!user) {
    const redirect = encodeURIComponent(targetUrl || '/index.html');
    window.location.href = `login.html?redirect=${redirect}`;
  } else {
    window.location.href = targetUrl || '/index.html';
  }
}

// 自动给 <a data-require-login> 套登录拦截
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-require-login]');
  if (!a) return;
  e.preventDefault();
  requireLoginAndGo(a.getAttribute('href'));
});

// ------- 页面级与局部级“可见性” -------
// 页面级策略：<meta name="required-role" content="free_user|paid_user|admin">
const roleMap = {
  free_user: ['free_user','paid_user','admin'],
  paid_user: ['paid_user','admin'],
  admin: ['admin']
};
function getPageRequiredRole(){
  const meta = document.querySelector('meta[name="required-role"]');
  const v = (meta?.content || 'free_user').trim();
  return (v in roleMap) ? v : 'free_user';
}
function isAllowed(required, userRole){
  const allowed = roleMap[required] || roleMap.free_user;
  return allowed.includes(userRole);
}
function lockNode(el, text){
  const msg = text || '该内容为付费专属，升级后可查看';
  const box = document.createElement('div');
  box.style.cssText = 'border:1px dashed #cbd5e0;background:#f8fafc;padding:14px;border-radius:10px;color:#2d3748;';
  box.innerHTML = `🔒 ${msg} <a href="upgrade.html" style="color:#2563eb;margin-left:6px">去升级 →</a>`;
  el.replaceWith(box);
}

// 拉取当前用户及 profile（若表不存在也不报错）
async function getUserAndProfile(){
  const { data } = await supabaseClient.auth.getUser();
  const user = data?.user || null;
  let profile = null;
  if (user) {
    const res = await supabaseClient.from('profiles')
      .select('role, membership_expires_at').eq('id', user.id).maybeSingle();
    profile = res?.data || null;
  }
  return { user, profile };
}

async function main(){
  // 页面级：如果你确实要强制登录，可把 <meta name="required-role"> 设为 paid_user/admin
  const need = getPageRequiredRole();
  // 仅当需要 paid_user/admin 时才做强制校验；free_user 不拦住未登录
  const auth = await getUserAndProfile();
  const role = auth.profile?.role || 'free_user';
  if (!isAllowed(need, role)) {
    if (need === 'paid_user' || need === 'admin') {
      // 未登录或权限不足：引导到登录/升级
      if (!auth.user) {
        const redirect = encodeURIComponent(location.pathname + location.search);
        location.href = `login.html?redirect=${redirect}`;
        return;
      } else {
        location.href = 'upgrade.html';
        return;
      }
    }
  }

  // 局部段落收费：data-required-role="paid_user" data-locked-text="自定义提示"
  document.querySelectorAll('[data-required-role]').forEach(el=>{
    const need = (el.getAttribute('data-required-role')||'').trim();
    const text = el.getAttribute('data-locked-text')||'';
    if (!need) return;
    if (!isAllowed(need, role)) lockNode(el, text);
  });

  // 页脚欢迎语（可选）：#welcome-user
  const welcome = document.querySelector('#welcome-user, #who');
  if (welcome) {
    if (auth.user?.email) {
      const paid = auth.profile?.role === 'admin' ||
                  (auth.profile?.role === 'paid_user' && auth.profile?.membership_expires_at && new Date(auth.profile.membership_expires_at) > new Date());
      const roleCN = auth.profile?.role === 'admin' ? '管理员' : (paid ? '付费会员' : '免费用户');
      welcome.textContent = `${auth.user.email}（角色：${roleCN}）`;
    } else {
      welcome.textContent = '未登录';
    }
  }

  // 顶部“登录/退出”切换（#auth-actions）
  const box = document.getElementById('auth-actions');
  if (box) {
    if (auth.user) {
      box.innerHTML = `<button id="btn-logout" class="btn-link">退出登录</button>`;
      box.querySelector('#btn-logout').addEventListener('click', async ()=>{
        await supabaseClient.auth.signOut();
        location.href = 'index.html';
      });
    } else {
      box.innerHTML = `<a href="login.html?redirect=${encodeURIComponent(location.pathname)}" class="btn-link">登录</a>`;
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main().catch(console.error); });
} else {
  main().catch(console.error);
}
