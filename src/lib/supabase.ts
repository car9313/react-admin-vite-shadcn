import { createClient } from '@supabase/supabase-js'

const config = {
  url: import.meta.env.VITE_SUPABASE_URL,
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
}

if (!config.url || !config.anonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

export const supabase = createClient(config.url, config.anonKey)
