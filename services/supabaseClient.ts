
import { createClient } from '@supabase/supabase-js';

// Credentials provided for production/demo connection
const SUPABASE_URL = 'https://culaepdbjawaphjdcjyt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bGFlcGRiamF3YXBoamRjanl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NzMwNzUsImV4cCI6MjA4MTI0OTA3NX0.uFOrfjR_qRVt_U0nR9BrNMsGHwSWqzXWekB9Yg0r9e4';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
