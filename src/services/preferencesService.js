// services/preferencesService.js
import { supabase } from '@/services/supabaseClient'

export const preferencesService = {
  // Trae arrays con nombres (sizes, garment_types, conditions, styles, genres)
  async getMyPreferences() {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) throw new Error('No auth user')

    // Si existe la vista, la usamos; si no, devolvemos objeto vacío por compatibilidad
    const { data, error } = await supabase
      .from('profile_preferences_view')
      .select('*')
      .eq('profile_id', uid)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || { profile_id: uid, sizes: [], conditions: [], styles: [], genres: [] }
  },

  // Helpers para cuando quieras editar desde UI (no usados aún en Me.vue)
  async addSize(size_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_sizes').insert({ profile_id: uid, size_id })
  },
  async removeSize(size_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_sizes').delete().eq('profile_id', uid).eq('size_id', size_id)
  },

  async addCondition(condition_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_conditions').insert({ profile_id: uid, condition_id })
  },
  async removeCondition(condition_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_conditions').delete().eq('profile_id', uid).eq('condition_id', condition_id)
  },

  async addStyle(style_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_styles').insert({ profile_id: uid, style_id })
  },
  async removeStyle(style_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_styles').delete().eq('profile_id', uid).eq('style_id', style_id)
  },

  async addGenre(genre_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_genres').insert({ profile_id: uid, genre_id })
  },
  async removeGenre(genre_id) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth.user.id
    return supabase.from('profile_pref_genres').delete().eq('profile_id', uid).eq('genre_id', genre_id)
  },

  async getOptions() {
    const [sizes, conditions, styles, genres] = await Promise.all([
      supabase.from('sizes').select('id, name').order('name', { ascending: true }),
      supabase.from('conditions').select('id, name').order('name', { ascending: true }),
      supabase.from('styles').select('id, name').order('name', { ascending: true }),
      supabase.from('genres').select('id, name').order('name', { ascending: true }),
    ])
    const pick = (r) => r.data || []
    return {
      sizes: pick(sizes),
      conditions: pick(conditions),
      styles: pick(styles),
      genres: pick(genres),
    }
  },
  // ===== ESCRITURA (bulk “set”) =====
  // expected: { sizes: [uuid], garment_types: [uuid], conditions: [uuid], styles: [uuid], genres:[uuid] }
  async setPreferences(next) {
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) throw new Error('No auth user')

    const current = await this._getCurrentIds(uid)
    const plan = [
      ['sizes',      'profile_pref_sizes',      'size_id'],
      ['conditions', 'profile_pref_conditions', 'condition_id'],
      ['styles',     'profile_pref_styles',     'style_id'],
      ['genres',     'profile_pref_genres',     'genre_id'],
    ]

    for (const [key, table, col] of plan) {
      const prev = new Set(current[key] || [])
      const nextSet = new Set(next[key] || [])

      // inserts
      const toAdd = [...nextSet].filter(id => !prev.has(id))
      if (toAdd.length) {
        const rows = toAdd.map(id => ({ profile_id: uid, [col]: id }))
        const { error } = await supabase.from(table).insert(rows)
        if (error) throw error
      }

      // deletes
      const toDel = [...prev].filter(id => !nextSet.has(id))
      if (toDel.length) {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('profile_id', uid)
          .in(col, toDel)
        if (error) throw error
      }
    }

    return true
  },

  // ids actuales (no nombres)
   async _getCurrentIds(uid) {
    const plan = [
      ['sizes',      'profile_pref_sizes',      'size_id'],
      ['conditions', 'profile_pref_conditions', 'condition_id'],
      ['styles',     'profile_pref_styles',     'style_id'],
      ['genres',     'profile_pref_genres',     'genre_id'],
    ]
    const result = { sizes: [], conditions: [], styles: [], genres: [] }
    await Promise.all(plan.map(async ([key, table, col]) => {
      const { data, error } = await supabase.from(table).select(col).eq('profile_id', uid)
      if (error) throw error
      result[key] = (data || []).map(r => r[col])
    }))
    return result
  },
}
