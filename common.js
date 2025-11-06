// common.js — 页面通用权限控制 + 局部内容“按段落收费”
// 依赖：auth.js（封装了 protectPage / getProfile）
// 用法：
//  1) 整页收费/免费：在 <head> 写 <meta name="required-role" content="paid_user">
//     (可选值: free_user / paid_user / admin；默认 free_user)
//     然后 <script type="module" src="common.js"></script>
//  2) 局部收费：任意元素加 data-required-role="paid_user"
//     可配 data-locked-text="这段内容为付费专属，前往升级 → upgrade.html"
//
// 注意：真正的访问控制仍以 protectPage 为准；
//       局部收费只是增强体验（同页里部分内容对免费用户隐藏）。

import { protectPage, getProfile } from './auth.js';

const roleMap = {
  free_user: ['free_user','paid_user','admin'],
  paid_user: ['paid_user','admin'],
  admin: ['admin']
};

// 获取页面级 required-role（默认为 free_user）
function getPageRequiredRole(){
  const meta = document.querySelector('meta[name="required-role"]');
  const v = (meta?.content || 'free_user').trim();
  return (v in roleMap) ? v : 'free_user';
}

// 简易权限判断（基于上面的 roleMap）
function isAllowed(required, userRole){
  if (!userRole) return false;
  const allowed = roleMap[required] || roleMap.free_user;
  return allowed.includes(userRole);
}

// 把一个节点替换为“已锁定”占位提示
function lockNode(el, text){
  const msg = text || '该内容为付费专属，升级后可查看（点击前往升级）';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'border:1px dashed #cbd5e0;background:#f8fafc;padding:14px;border-radius:10px;color:#2d3748;';
  wrapper.innerHTML = `🔒 ${msg.replace(/\n/g, '<br>')}`;
  // 如包含链接，优先保留用户自定义；否则给一个默认升级入口
  if (!wrapper.querySelector('a')) {
    const a = document.createElement('a');
    a.href = 'upgrade.html';
    a.textContent = ' 去升级 →';
    a.style.marginLeft = '6px';
    a.style.color = '#2b6cb0';
    wrapper.appendChild(a);
  }
  el.replaceWith(wrapper);
}

// 处理页面级与局部级权限
async function main(){
  // 1) 页面级守卫：未登录/权限不足会被重定向（由 protectPage 处理）
  const pageRequired = getPageRequiredRole();
  await protectPage(roleMap[pageRequired]);

  // 2) 局部收费：仅当页面通过守卫后才会走到这里
  //    例如：页面对 free_user 开放，但其中部分段落要求 paid_user
  const profile = await getProfile();
  const userRole = profile?.profile?.role || 'free_user';

  const gated = document.querySelectorAll('[data-required-role]');
  gated.forEach(el => {
    const need = (el.getAttribute('data-required-role') || '').trim();
    const msg = el.getAttribute('data-locked-text') || '';
    if (!need || isAllowed(need, userRole)) return;
    lockNode(el, msg);
  });
}

// 等 DOMReady 再执行，避免早于元素挂载
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { main().catch(console.error); });
} else {
  main().catch(console.error);
}
