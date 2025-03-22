const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing SUPABASE_URL or SUPABASE_KEY in environment variables');
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;