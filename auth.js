// auth.js — 统一从 client.js 导入已经创建好的 client
import supabaseClient from './client.js';

// ------- 获取 profile -------
export async function getProfile(){
  const { data:{ user } } = await supabaseClient.auth.getUser();
  if(!user) return null;

  const { data: profile, error } = await supabaseClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if(error){
    console.error('获取 Profile 失败:', error);
    return { user, profile:null };
  }
  return { user, profile };
}

// ------- 登出 -------
export async function signOut(){
  const { error } = await supabaseClient.auth.signOut();
  if(error){
    alert('登出失败:'+error.message);
  }else{
    window.location.href='login.html';
  }
}

// ------- 页面守卫 -------
export async function protectPage(allowed=[]){
  const data = await getProfile();
  if(!data?.user){
    const back = window.location.pathname + window.location.search + window.location.hash;
    window.location.href = 'login.html?redirect='+encodeURIComponent(back);
    throw new Error('not logged in');
  }
  const role = data.profile?.role || 'free_user';
  if(!allowed.includes(role)){
    alert('此内容为付费专属，请升级您的账户。');
    window.location.href='index.html';
    throw new Error('no permission');
  }
}

// ------- 登录页：已登录则跳走 -------
export async function redirectIfLoggedIn(){
  const { data:{ user } } = await supabaseClient.auth.getUser();
  if(user){
    const raw = new URLSearchParams(location.search).get('redirect');
    location.href = raw || 'index.html';
  }
}

// ------- 登录 / 注册 -------
export const signIn = (email,password)=>
  supabaseClient.auth.signInWithPassword({email,password});

export const signUp = (email,password)=>
  supabaseClient.auth.signUp({email,password});
