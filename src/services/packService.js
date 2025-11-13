import { supabase } from './supabaseClient'
import { unwrap } from './utils'
import { walletService } from './walletService'

export const packService = {
  async listActive(){
    const { data, error } = await supabase
      .from('packs')
      .select('id,name,binds_amount,price_currency,price_amount,active')
      .eq('active', true)
      .order('price_amount', { ascending: true })
    return unwrap(data, error)
  },

  // Compra inmediata: crea purchase, acredita wallet y loguea transacción
  async purchasePack(packId){
    const me = (await supabase.auth.getUser()).data.user.id

    // 1) Pack
    const { data: pack, error: e1 } = await supabase
      .from('packs').select('*').eq('id', packId).eq('active', true).single()
    if (e1) throw e1

    // 2) Purchase (completed)
    const { data: purchase, error: e2 } = await supabase
      .from('pack_purchases')
      .insert({
        user_id: me,
        pack_id: pack.id,
        status: 'completed',
        amount_paid: pack.price_amount,
        binds_credited: true
      })
      .select()
      .single()
    if (e2) throw e2

    // 3) Acreditar en wallet (crea si no existe)
    const wallet = await walletService.getOrCreateMyWallet()
    const newBalance = Number(wallet.balance_bind || 0) + Number(pack.binds_amount || 0)

    const { error: e3 } = await supabase
      .from('wallets')
      .update({ balance_bind: newBalance })
      .eq('user_id', me)
    if (e3) throw e3

    // 4) Registrar transacción
    const { error: e4 } = await supabase
      .from('bind_transactions')
      .insert({
        user_id: me,
        type: 'pack_purchase',
        amount: pack.binds_amount,
        balance_after: newBalance,
        created_at: new Date().toISOString()
      })
    if (e4) console.warn('bind_transactions insert warn', e4)

    return purchase
  }
}
