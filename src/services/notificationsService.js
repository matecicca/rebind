import { supabase } from './supabaseClient'
import { unwrap } from './utils'

export const notificationsService = {
  /**
   * 📬 Obtener las notificaciones del usuario actual
   */
  async listMy(limit = 50) {
    const me = (await supabase.auth.getUser()).data.user.id

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false })
      .limit(limit)

    return unwrap(data, error)
  },

  /**
   * 🟢 Crear una notificación manualmente
   * Ideal para probar el sistema o generar notificaciones desde el frontend
   */
  async create(userId, type, title, message, relatedTable = null, relatedId = null) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_table: relatedTable,
        related_id: relatedId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * 👁️ Marcar una notificación como leída
   */
  async markRead(notificationId) {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select()
      .single()

    return unwrap(data, error)
  },

  /**
   * 🗑️ (Opcional) Eliminar una notificación
   */
  async remove(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) throw error
    return true
  },

  /**
   * 🧠 Obtener el conteo de notificaciones no leídas
   * (Ideal para mostrar el número en la campanita del header)
   */
  async unreadCount() {
    const me = (await supabase.auth.getUser()).data.user.id

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', me)
      .eq('read', false)

    if (error) throw error
    return count || 0
  },
}
