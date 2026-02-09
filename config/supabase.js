import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://htoaldkqzdpzvuptrtnp.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_P6aWKkptAk9uSzROGV7Mqw_qEKhi6GM';

export const supabase = createClient(supabaseUrl, supabaseKey);