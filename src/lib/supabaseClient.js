import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://idivdegwxgwudgxcuaso.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlkaXZkZWd3eGd3dWRneGN1YXNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNTkwMjYsImV4cCI6MjA5NjczNTAyNn0.bxyYJo0oyNa18J0wfBu8w4byLAosnggM5u2XvkPObco';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
