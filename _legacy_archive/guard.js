// guard.js - 页面守卫
(async function() {
    // 检查当前用户的登录状态
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        // 如果没有 session (即用户未登录)，则跳转到登录页面
        alert("请先登录才能访问此页面！");
        window.location.href = `/login.html?redirect=${window.location.pathname}`;
    }
})(); // 立即执行