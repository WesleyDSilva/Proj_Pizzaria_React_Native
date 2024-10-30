// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jzlpwyuqtdfsdbiufigl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6bHB3eXVxdGRmc2RiaXVmaWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkyMTUzODQsImV4cCI6MjA0NDc5MTM4NH0.73UgUM8eFeZ3W5iGP2X3jzvc4I0r-CIK3i61e70BKoE';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export default supabase; // exportação padrão
