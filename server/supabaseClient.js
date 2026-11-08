const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  // Create a single supabase client for interacting with your database
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Client Initialized for Backup Sync');

  // Active Keep-Alive Query Loop: Executes real PostgreSQL read every 4 hours
  // Prevents Supabase 7-day inactivity pause
  setInterval(async () => {
    try {
      const { data, error } = await supabase.from('messages').select('id').limit(1);
      if (!error) {
        console.log(`[Supabase Heartbeat] Active DB query verified (${new Date().toISOString()}). Project activity renewed.`);
      }
    } catch (err) {
      console.warn('[Supabase Heartbeat] DB query failed:', err.message);
    }
  }, 4 * 60 * 60 * 1000); // Every 4 hours

  // Immediate initial ping on server boot
  setTimeout(async () => {
    try {
      await supabase.from('messages').select('id').limit(1);
      console.log('⚡ [Supabase Heartbeat] Initial boot DB ping dispatched.');
    } catch {}
  }, 5000);
} else {
  console.warn('⚠️ WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Supabase backup sync is disabled.');
}

module.exports = supabase;
