import { supabase } from './supabaseClient'

export const realtimeService = {
  onNewMessage(conversationId, callback) {
    return supabase
      .channel(`messages:conversation:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe()
  },

  onItemApproved(callback) {
    return supabase
      .channel('items-approved')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'items',
          filter: 'status=eq.approved',
        },
        callback
      )
      .subscribe()
  },
}
