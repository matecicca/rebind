import { supabase } from './supabaseClient'
import { unwrap } from './utils'

export const walletService = {
  /**
   * Devuelve la wallet del usuario actual. Si no existe, la crea en 0.
   */
  async getOrCreateMyWallet() {
    const me = (await supabase.auth.getUser()).data.user.id

    // 1) Intentar obtenerla sin forzar 1 fila
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', me)
      .maybeSingle()

    if (error) throw error
    if (data) return data

    // 2) Si no existe, crear en 0
    const { data: created, error: insErr } = await supabase
      .from('wallets')
      .insert({ user_id: me, balance_bind: 0 })
      .select()
      .single()

    return unwrap(created, insErr)
  },

  async listMyTransactions(limit = 50) {
    const me = (await supabase.auth.getUser()).data.user.id
    const { data, error } = await supabase
      .from('bind_transactions')
      .select('*')
      .eq('user_id', me)
      .order('created_at', { ascending: false })
      .limit(limit)

    return unwrap(data, error)
  },
}
