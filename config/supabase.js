import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://uaenlkqvnaavithpelvs.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Y9T_Rp0-YaFUadM5EX0_0g_1t6Rb-lg';

export const supabase = createClient(supabaseUrl, supabaseKey);