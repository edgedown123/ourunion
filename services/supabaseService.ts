import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Upload image to Supabase Storage and return public URL
 * Images are stored in 'site-assets' bucket
 */
export const uploadSiteImage = async (file: File, pathPrefix: string) => {
  const ext = file.name.split('.').pop() || 'png';
  const safeName = `${Date.now()}_${Math.random().toString(16).slice(2)}.${ext}`;
  const path = `${pathPrefix}/${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from('site-assets')
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from('site-assets').getPublicUrl(path);
  return data.publicUrl;
};
