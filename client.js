// client.js - unified supabase client
const sdk = (typeof window !== 'undefined' && window.supabase)
  ? window.supabase
  : (typeof supabase !== 'undefined' ? supabase : null);

if (!sdk || typeof sdk.createClient !== 'function') {
  throw new Error('[client.js] Supabase SDK 未加载，请先引入 CDN：@supabase/supabase-js@2');
}

const { createClient } = sdk;

// TODO: replace with your actual anon key and url
const SUPABASE_URL = 'https://cjsipcanyugnvrikcinx.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqc2lwY2FueXVnbnZyaWtjaW54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE3NDkxNTIsImV4cCI6MjA3NzMyNTE1Mn0.5gIeW0BHpVUytUwY_8xeRybUMlkPHMau9ursezkHeJM'; 


export const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
export default supabaseClient;
