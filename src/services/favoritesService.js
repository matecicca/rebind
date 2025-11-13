// src/services/favoritesService.js
import { supabase } from '@/services/supabaseClient'

export const favoritesService = {
  async _meId() {
    const { data, error } = await supabase.auth.getUser()
    if (error) throw error
    const me = data?.user?.id
    if (!me) throw new Error('No hay sesión activa')
    return me
  },

  async isFavorite(itemId) {
    const me = await this._meId()
    const { data, error } = await supabase
      .from('favorites')
      .select('item_id')
      .eq('user_id', me)
      .eq('item_id', itemId)
      .limit(1)
    if (error) throw error
    return (data?.length ?? 0) > 0
  },

  async add(itemId) {
    const me = await this._meId()
    const { error } = await supabase
      .from('favorites')
      .insert({ user_id: me, item_id: itemId })
    // Evitar romper por PK duplicada
    if (error && !String(error.message || '').toLowerCase().includes('duplicate')) {
      throw error
    }
    return true
  },

  async remove(itemId) {
    const me = await this._meId()
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', me)
      .eq('item_id', itemId)
    if (error) throw error
    return true
  },

  async toggle(itemId) {
    const fav = await this.isFavorite(itemId)
    if (fav) {
      await this.remove(itemId)
      return false
    } else {
      await this.add(itemId)
      return true
    }
  },

  /**
   * Lista de items guardados por usuario.
   * Devuelve un array de items con campos mínimos para ItemCard.
   * Si necesitás más relaciones, agregalas en el select anidado.
   */
  async listByUser(userId, { page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error } = await supabase
    .from('favorites')
    .select(`
      item_id,
      items:item_id (
        id,
        title,
        main_image_path,
        owner_id,
        status,
        created_at,
        ask_price_bind,
        brands(name),
        sizes(name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // Aplanar estructura (devuelve los items directamente)
  return (data || [])
    .map(r => r.items)
    .filter(Boolean)
}
}
