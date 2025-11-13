// services/profileService.js
import { supabase } from './supabaseClient'

export const profileService = {
  async getMyProfile() {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) throw new Error('No auth user')

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, first_name, last_name, city, neighborhood, avatar_url, level, xp, reputation')
      .eq('id', uid)
      .single()

    if (error) throw error
    return data
  },

  async updateMyProfile(payload) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) throw new Error('No auth user')

    const updates = { ...payload, updated_at: new Date().toISOString() }
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', uid)
      .select('id, username, first_name, last_name, city, neighborhood, avatar_url, level, xp, reputation')
      .single()

    if (error) throw error
    return data
  },

  
}

export async function getMyProfileId() {
  const { data: authRes, error: authErr } = await supabase.auth.getUser()
  const uid = authRes?.user?.id
  if (authErr || !uid) return null

  // 1) Intentar por user_id (lo más común)
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', uid)
      .limit(1)
    if (!error && data?.length) return data[0].id
  }

  // 2) Fallback por id (por si tu esquema usa el mismo uuid en id)
  {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', uid)
      .limit(1)
    if (!error && data?.length) return data[0].id
  }

  return null
}

