
import { createClient } from '@supabase/supabase-js';

// Prioritize Environment Variables, fall back to Demo Project if not set
// Trim to prevent issues with quotes/whitespace from env vars
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://culaepdbjawaphjdcjyt.supabase.co').trim();
const SUPABASE_ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bGFlcGRiamF3YXBoamRjanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzMwNzUsImV4cCI6MjA4MTI0OTA3NX0.uFOrfjR_qRVt_U0nR9BrNMsGHwSWqzXWekB9Yg0r9e4').trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
