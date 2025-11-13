import { supabase } from './supabaseClient'
import { unwrap } from './utils'

export const adminService = {
  async listPendingItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true })
    return unwrap(data, error)
  },

  async listApprovedItems() {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    return unwrap(data, error)
  },

  async approveItem(itemId, reviewerId) {
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'approved',
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single()
    return unwrap(data, error)
  },

  async rejectItem(itemId, reviewerId, reason) {
    const { data, error } = await supabase
      .from('items')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        reviewed_by: reviewerId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', itemId)
      .select()
      .single()
    return unwrap(data, error)
  },
}
