import { supabase } from './supabaseClient'


export const storageService = {
    async uploadItemImage(ownerId, itemId, file, fileName) {
    const path = `${ownerId}/${itemId}/${fileName}`
    const { data, error } = await supabase.storage
      .from('item-images')
      .upload(path, file, { upsert: true })
    if (error) throw error
    return data.path
},


getPublicUrl(bucket, path) {
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
},


async listFiles(bucket, prefix) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'name', order: 'asc' },
    })
  if (error) throw error
  return (data || []).map((f) => `${prefix}/${f.name}`)
},


async removeFolderRecursive(bucket, prefix) {
// Lista archivos en ese prefijo (carpeta del item) y los elimina
const files = await this.listFiles(bucket, prefix)
    if (files.length === 0) return
      const { error } = await supabase.storage.from(bucket).remove(files)
    if (error) throw error
},


async removeFile(bucket, path) {
  const { error } = await supabase.storage.from(bucket).remove([path])
  if (error) throw error
},


async uploadAvatar(userId, file) {
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const path = `${userId}/avatar-${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true })
  if (error) throw error
  return data.path
},
}