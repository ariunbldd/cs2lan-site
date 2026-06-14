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

export const uploadAvatar = async (file, playerName) => {
  try {
    const ext = file.name.split('.').pop()
    const fileName = `${playerName.replace(/\s+/g, '_')}_${Date.now()}.${ext}`
    const { error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })
    if (error) throw error
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName)
    return urlData.publicUrl
  } catch (err) {
    console.error('Upload алдаа:', err)
    return null
  }
}