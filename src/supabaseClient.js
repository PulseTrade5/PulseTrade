import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://okxbdzepfzysbnxmmysx.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9reGJkemVwZnp5c2JueG1teXN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNDQxMjQsImV4cCI6MjA5NzYyMDEyNH0.I5uOJhT-7aquna2fLrCLDtpsRHGMXOygWaVQn5AkIaI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    detectSessionInUrl: true,
    persistSession: true,
    autoRefreshToken: true,
  },
});
