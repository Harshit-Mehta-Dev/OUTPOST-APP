const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
  // Create a single supabase client for interacting with your database
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase Client Initialized for Backup Sync');
} else {
  console.warn('⚠️ WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing. Supabase backup sync is disabled.');
}

module.exports = supabase;
