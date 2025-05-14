// supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'your db';
const supabaseKey = 'your key'; // ⚠️ Keep this safe
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
