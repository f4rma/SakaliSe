const { createClient } = require('@supabase/supabase-js');

//Membuat klien Supabase 
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY 
);

module.exports = supabase;
