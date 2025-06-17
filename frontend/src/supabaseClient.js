import { createClient } from '@supabase/supabase-js';
<<<<<<< HEAD
// Temporary hardcoded values for testing
const supabaseUrl = 'https://iszmsaayxpdrovealrrp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlzem1zYWF5eHBkcm92ZWFscnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNjYwMTMsImV4cCI6MjA2Mzk0MjAxM30.5bE_fPBOgkNtEyjCieW328oxyDHWGpf2OTDWssJ_Npk';
let supabase;
try {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
        },
        db: {
            schema: 'public'
        }
    });
}
catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
}
export { supabase };
=======
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables:', {
        url: supabaseUrl ? 'present' : 'missing',
        key: supabaseAnonKey ? 'present' : 'missing'
    });
    throw new Error('Missing Supabase environment variables');
}
console.log('Initializing Supabase client with URL:', supabaseUrl);
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});
>>>>>>> 771bf45572abf3e65b9e1abda6e4f1021226bdb0
