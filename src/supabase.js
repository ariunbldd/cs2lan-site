import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const store = {
  async get(key) {
    try {
      const { data } = await supabase
        .from('cs2_storage')
        .select('value')
        .eq('key', key)
        .single()
      return data ? JSON.parse(data.value) : null
    } catch { return null }
  },
  async set(key, val) {
    try {
      await supabase.from('cs2_storage').upsert({
        key,
        value: JSON.stringify(val),
        updated_at: new Date().toISOString()
      })
    } catch {}
  }
}