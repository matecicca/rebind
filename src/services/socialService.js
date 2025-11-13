// services/socialService.js
import { supabase } from '@/services/supabaseClient'

export const socialService = {
  async follow(userIdToFollow) {
    const { data: auth } = await supabase.auth.getUser()
    const me = auth.user.id
    if (me === userIdToFollow) throw new Error('No puedes seguirte a ti mismo')
    const { error } = await supabase.from('follows').insert({ follower_id: me, following_id: userIdToFollow })
    if (error && !error.message?.includes('duplicate key')) throw error
    return true
  },

  async unfollow(userIdToUnfollow) {
    const { data: auth } = await supabase.auth.getUser()
    const me = auth.user.id
    const { error } = await supabase.from('follows')
      .delete()
      .eq('follower_id', me)
      .eq('following_id', userIdToUnfollow)
    if (error) throw error
    return true
  },

  async isFollowing(targetUserId) {
    const { data: auth } = await supabase.auth.getUser()
    const me = auth.user.id
    const { data, error } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact', head: true })
      .eq('follower_id', me)
      .eq('following_id', targetUserId)
    if (error) throw error
    return data?.length > 0
  },

  async followersCount(userId) {
    const { count, error } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId)
    if (error) throw error
    return count ?? 0
  },

  // Lista de usuarios a los que sigo (para poblar el carrusel más adelante)
  async followingList(userId, limit = 20, page = 1) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error } = await supabase
      .from('follows')
      .select('following_id, profiles:following_id (id, username, first_name, last_name, avatar_url)')
      .eq('follower_id', userId)
      .range(from, to)

    if (error) throw error
    return (data || []).map(r => r.profiles)
  },
}
