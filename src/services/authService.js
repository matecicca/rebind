// services/authService.js (opcionalmente robusto)
import { supabase } from './supabaseClient'

export const authService = {
  async signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    // Fallback por si el trigger no corriera (normalmente NO se ejecuta este bloque)
    const user = data?.user
    if (user) {
      await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email?.toLowerCase() ?? email.toLowerCase(),
        username: (email.split('@')[0] || user.id.slice(0,8)).toLowerCase(),
        admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
    }
    return data
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  },

  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  getSession() {
    return supabase.auth.getSession()
  },

  onAuthStateChange(cb) {
    return supabase.auth.onAuthStateChange(cb)
  },
}
