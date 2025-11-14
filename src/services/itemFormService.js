// ItemFormService

import { supabase } from './supabaseClient'
import { itemService } from './itemService'
import { storageService } from './storageService'
import { unwrap } from './utils'

export const itemFormService = {
  /**
   * Paso 1: Guardar los datos iniciales del formulario (sin imágenes aún)
   * Crea el item en estado 'draft'
   */
  async saveFormDraft(formData) {
    const { data: session } = await supabase.auth.getSession()
    const user = session?.session?.user
    if (!user) throw new Error('No hay sesión activa')

    // Extraer style_ids del formData (ahora es un array)
    const { style_ids, ...itemData } = formData

    const payload = {
      ...itemData,
      owner_id: user.id,               // profiles.id === auth.users.id
      status: 'draft',                 // <<< antes: 'revision'
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { data, error } = await supabase.from('items').insert(payload).select().single()
    if (error) throw error

    // Guardar estilos en la tabla pivot si se proporcionaron
    if (style_ids && style_ids.length > 0) {
      await itemService.addItemStyles(data.id, style_ids)
    }

    return data
  },

  /**
   * Paso 2: Calcular precio recomendado
   * Guarda base_price_x y recommended_price_bind, pero NO cambia el status.
   */
  async calculateRecommendedPrice(itemId) {
    const { data: baseItem, error: itemErr } = await supabase
      .from('items')
      .select('garment_type_id, brand_id, condition_id, material_id')
      .eq('id', itemId)
      .single()
    if (itemErr) throw itemErr

    const { garment_type_id, brand_id, condition_id, material_id } = baseItem

    const [gtRes, brandRes, condRes, matRes] = await Promise.all([
      supabase.from('garment_types').select('base_price_x').eq('id', garment_type_id).single(),
      supabase.from('brands').select('qualities:qualities(multiplier)').eq('id', brand_id).single(),
      supabase.from('conditions').select('multiplier').eq('id', condition_id).single(),
      supabase.from('materials').select('multiplier').eq('id', material_id).single(),
    ])

    if (gtRes.error) throw gtRes.error
    if (brandRes.error) throw brandRes.error
    if (condRes.error) throw condRes.error
    if (matRes.error) throw matRes.error

    const base = gtRes.data?.base_price_x ?? 0
    const qualityMult = brandRes.data?.qualities?.multiplier ?? 1
    const conditionMult = condRes.data?.multiplier ?? 1
    const materialMult = matRes.data?.multiplier ?? 1

    const recommended = Math.round(base * qualityMult * conditionMult * materialMult)
    const minRange = Math.round(recommended * 0.9)
    const maxRange = Math.round(recommended * 1.1)

    const updated = await itemService.update(itemId, {
      base_price_x: base,
      recommended_price_bind: recommended,
      updated_at: new Date().toISOString(),
      // NOTA: no tocamos status aquí; sigue 'draft' hasta publicar
    })

    return {
      ...updated,
      price_range: { min: minRange, max: maxRange },
    }
  },

  /**
   * Paso 3: Subir imágenes al Storage
   * Acepta:
   *  - Array<File> [front, back, tag, ...others]
   *  - Objeto { front?:File, back?:File, tag?:File, others?:File[] }
   * Crea registros en item_images y sincroniza main_image_path + images_count.
   */
  async uploadImages(itemId, files = []) {
    const { data: session } = await supabase.auth.getSession()
    const user = session?.session?.user
    if (!user) throw new Error('No hay sesión activa')

    const ownerId = user.id
    const toInsert = []

    const uploadOne = async (role, file, isPrimary = false) => {
      if (!file) return null
      const fileName = `${Date.now()}-${file.name || `${role}.jpg`}`
      const path = await storageService.uploadItemImage(ownerId, itemId, file, fileName)
      toInsert.push({ item_id: itemId, path, role, is_primary: isPrimary })
      return path
    }

    let frontPath = null

    if (Array.isArray(files)) {
      // Modo array: 0=front, 1=back, 2=tag, resto=others
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const role = i === 0 ? 'front' : i === 1 ? 'back' : i === 2 ? 'tag' : 'other'
        const p = await uploadOne(role, file, i === 0)
        if (i === 0) frontPath = p
      }
    } else if (files && typeof files === 'object') {
      // Modo objeto por roles
      if (files.front) frontPath = await uploadOne('front', files.front, true)
      if (files.back) await uploadOne('back', files.back)
      if (files.tag) await uploadOne('tag', files.tag)
      if (Array.isArray(files.others)) {
        for (const f of files.others) await uploadOne('other', f)
      }
    }

    if (toInsert.length) {
      const { error } = await supabase.from('item_images').insert(toInsert)
      if (error) throw error
    }

    // Sincronizar main_image_path + images_count
    const { count, error: cntErr } = await supabase
      .from('item_images')
      .select('*', { count: 'exact', head: true })
      .eq('item_id', itemId)
    if (cntErr) throw cntErr

    await itemService.update(itemId, {
      main_image_path: frontPath || null,
      images_count: count || 0,
      updated_at: new Date().toISOString(),
    })

    return toInsert
  },

  /**
   * Paso 3b (opcional): Reemplazar imágenes por roles (parcial)
   * Sólo borra/sustituye los roles provistos en filesByRole
   */
  async replaceImages(itemId, filesByRole = {}) {
    const incomingRoles = [
      filesByRole.front && 'front',
      filesByRole.back && 'back',
      filesByRole.tag && 'tag',
      Array.isArray(filesByRole.others) && 'other',
    ].filter(Boolean)

    if (incomingRoles.length) {
      const { data: existing } = await supabase
        .from('item_images')
        .select('*')
        .eq('item_id', itemId)
        .in('role', incomingRoles)

      if (existing?.length) {
        const paths = existing.map((e) => e.path)
        if (paths.length) await supabase.storage.from('item-images').remove(paths)
        await supabase.from('item_images').delete().eq('item_id', itemId).in('role', incomingRoles)
      }
    }

    // Subir nuevas del/los rol(es) provistos
    await this.uploadImages(itemId, filesByRole)
  },

  /**
   * Paso 3c: Actualizar campos del draft (parcial)
   */
  async updateDraft(itemId, patch) {
    // Extraer style_ids si está presente
    const { style_ids, ...itemPatch } = patch

    itemPatch.updated_at = new Date().toISOString()
    const updated = await itemService.update(itemId, itemPatch)

    // Actualizar estilos si se proporcionaron
    if (style_ids !== undefined) {
      await itemService.updateItemStyles(itemId, style_ids)
    }

    return updated
  },

  /**
   * Paso 4: Procesar imagen principal (Background Remover con ClipDrop)
   * Se recomienda llamar antes de pasar a pending_review.
   */
  async processMainImage(itemId, mainImagePath) {
    try {
      // 1️⃣ URL pública
      const { data, error } = await supabase.storage.from('item-images').getPublicUrl(mainImagePath)
      if (error) throw error

      // 2️⃣ Descargar binario
      const imageResponse = await fetch(data.publicUrl)
      const blob = await imageResponse.blob()

      // 3️⃣ Enviar a ClipDrop
      const formData = new FormData()
      formData.append('image_file', blob, 'input.jpg')

      const clipKey = import.meta.env.VITE_CLIPDROP_API_KEY
      const res = await fetch('https://clipdrop-api.co/remove-background/v1', {
        method: 'POST',
        headers: { 'x-api-key': clipKey },
        body: formData,
      })

      if (!res.ok) throw new Error('Error al procesar la imagen en ClipDrop')

      // 4️⃣ Subir resultado
      const bgRemoved = await res.blob()
      const outPath = `${itemId}/front-bg-removed-${Date.now()}.png`

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(outPath, bgRemoved, { contentType: 'image/png' })
      if (uploadError) throw uploadError

      // 5️⃣ Actualizar item e imagen
      await itemService.update(itemId, {
        main_image_path: outPath,
        bg_removed: true,
        updated_at: new Date().toISOString(),
      })

      await supabase
        .from('item_images')
        .update({ bg_removed_path: outPath })
        .eq('item_id', itemId)
        .eq('role', 'front')

      return outPath
    } catch (err) {
      console.error('Error procesando background con ClipDrop:', err)
      throw err
    }
  },

  /**
   * Paso 5: Enviar a revisión (usado al publicar desde PreUpload)
   * Si usás processMainImage antes, este método sólo cambia el estado.
   */
  async submitForReview(itemId) {
    const updated = await itemService.update(itemId, {
      status: 'pending_review',
      updated_at: new Date().toISOString(),
    })
    return updated
  },

  /**
   * Paso 6: Eliminar borrador (borra imágenes + carpeta y luego el item)
   */
  async deleteDraft(itemId) {
    // Traer imágenes para conocer el prefijo (ownerId/itemId)
    const { data: imgs } = await supabase.from('item_images').select('*').eq('item_id', itemId)
    if (imgs?.length) {
      const firstPath = imgs[0].path // ej: ownerId/itemId/filename
      const [ownerId, itemFolder] = firstPath.split('/').slice(0, 2)
      const prefix = `${ownerId}/${itemFolder}`
      await storageService.removeFolderRecursive('item-images', prefix)
      await supabase.from('item_images').delete().eq('item_id', itemId)
    }

    await supabase.from('items').delete().eq('id', itemId)
  },
}
