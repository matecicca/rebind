// src/services/itemService.js
import { supabase } from './supabaseClient'
import { unwrap, pageRange } from './utils'
import { getMyProfileId} from './profileService'

async function _basePublicSelect() {
  return `
    id,
    title,
    description,
    ask_price_bind,
    main_image_path,
    owner_id,
    status,
    created_at,
    sizes:sizes!items_size_id_fkey!left ( name ),
    brands:brands!items_brand_id_fkey!left ( name ),
    owner:profiles!items_owner_id_fkey!left ( username ),
    item_styles!left(
      style_id,
      styles:styles!item_styles_style_id_fkey(id, name)
    )
  `
}


export const itemService = {
  /** ---------- CRUD ---------- */

  async searchPublicFeed(searchText, page = 1, pageSize = 24, filters = {}, { includeMine = false } = {}) {
  const [from, to] = pageRange(page, pageSize)
  const selectStr = await _basePublicSelect()

  // Si hay filtro de estilo, primero obtenemos los item_ids que tienen ese estilo
  let itemIdsWithStyle = null
  if (filters.style_id) {
    const { data: styleItems } = await supabase
      .from('item_styles')
      .select('item_id')
      .eq('style_id', filters.style_id)
    itemIdsWithStyle = styleItems?.map(si => si.item_id) || []
    // Si no hay items con ese estilo, devolver array vacío
    if (itemIdsWithStyle.length === 0) return []
  }

  let q = supabase
    .from('items')
    .select(selectStr)
    .eq('status', 'approved')
    .range(from, to)
    .order('created_at', { ascending: false })

  // Excluir mis publicaciones (opcional)
  if (!includeMine) {
    const myProfileId = await getMyProfileId()
    if (myProfileId) q = q.neq('owner_id', myProfileId)   // ← usar q aquí
  }

  // Búsqueda
  if (searchText && searchText.trim()) {
    const like = `%${searchText.trim()}%`
    q = q.or(`title.ilike.${like},description.ilike.${like}`)
  }

  // Filtros
  if (filters.size_id)      q = q.eq('size_id', filters.size_id)
  if (filters.color_id)     q = q.eq('color_id', filters.color_id)
  if (filters.brand_id)     q = q.eq('brand_id', filters.brand_id)
  if (filters.condition_id) q = q.eq('condition_id', filters.condition_id)
  if (filters.material_id)  q = q.eq('material_id', filters.material_id)
  if (filters.genre_id)     q = q.eq('genre_id', filters.genre_id)

  // Filtro de estilo usando los item_ids obtenidos
  if (itemIdsWithStyle) q = q.in('id', itemIdsWithStyle)

  const { data, error } = await q
  return unwrap(data, error)
},

  // Crear ítem
  async create(payload) {
    const { data, error } = await supabase
      .from('items')
      .insert(payload)
      .select()
      .single()
    return unwrap(data, error)
  },

  // Actualizar
  async update(itemId, patch) {
    const { data, error } = await supabase
      .from('items')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', itemId)
      .select()
      .single()
    return unwrap(data, error)
  },

  // Eliminar
  async delete(itemId) {
    const { error } = await supabase.from('items').delete().eq('id', itemId)
    if (error) throw error
  },

  /** ---------- LISTAS ---------- */

  // Feed público canónico (aprobados)
 async getPublicFeed(page = 1, pageSize = 24, filters = {}, { includeMine = false } = {}) {
  const [from, to] = pageRange(page, pageSize)

  // Si hay filtro de estilo, primero obtenemos los item_ids que tienen ese estilo
  let itemIdsWithStyle = null
  if (filters.style_id) {
    const { data: styleItems } = await supabase
      .from('item_styles')
      .select('item_id')
      .eq('style_id', filters.style_id)
    itemIdsWithStyle = styleItems?.map(si => si.item_id) || []
    // Si no hay items con ese estilo, devolver array vacío
    if (itemIdsWithStyle.length === 0) return []
  }

  let query = supabase
    .from('items')
    .select(`
      id,
      title,
      ask_price_bind,
      main_image_path,
      owner_id,
      status,
      created_at,
      sizes:sizes!items_size_id_fkey!left ( name ),
      brands:brands!items_brand_id_fkey!left ( name ),
      garment_types:garment_types!items_garment_type_id_fkey!left ( name ),
      owner:profiles!items_owner_id_fkey!left ( username ),
      item_styles!left(
        style_id,
        styles:styles!item_styles_style_id_fkey(id, name)
      )
    `)
    .eq('status', 'approved')
    .range(from, to)
    .order('created_at', { ascending: false })

  // Excluir mis publicaciones (opcional)
  if (!includeMine) {
    const myProfileId = await getMyProfileId()
    if (myProfileId) query = query.neq('owner_id', myProfileId)  // ← usar query aquí
  }

  // Filtros
  if (filters.garment_type_id) query = query.eq('garment_type_id', filters.garment_type_id)
  if (filters.size_id)         query = query.eq('size_id', filters.size_id)
  if (filters.color_id)        query = query.eq('color_id', filters.color_id)
  if (filters.brand_id)        query = query.eq('brand_id', filters.brand_id)
  if (filters.condition_id)    query = query.eq('condition_id', filters.condition_id)
  if (filters.material_id)     query = query.eq('material_id', filters.material_id)
  if (filters.genre_id)        query = query.eq('genre_id', filters.genre_id)

  // Filtro de estilo usando los item_ids obtenidos
  if (itemIdsWithStyle) query = query.in('id', itemIdsWithStyle)

  const { data, error } = await query
  return unwrap(data, error)
},

  async listApproved(page = 1, pageSize = 24, filters = {}, opts = {}) {
    return this.getPublicFeed(page, pageSize, filters, opts)
  },

  // Ítems por dueño
  async listByOwner(profileId, page = 1, limit = 24) {
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error } = await supabase
      .from('items')
      .select(`
        id,
        title,
        main_image_path,
        status,
        created_at,
        ask_price_bind,
        recommended_price_bind,
        sizes:sizes!items_size_id_fkey!left ( name ),
        brands:brands!items_brand_id_fkey!left ( name ),
        garment_types:garment_types!items_garment_type_id_fkey!left ( name ),
        owner:profiles!items_owner_id_fkey!left ( username ),
        item_styles!left(
          style_id,
          styles:styles!item_styles_style_id_fkey(id, name)
        )
      `)
      .eq('owner_id', profileId)
      .order('created_at', { ascending: false })
      .range(from, to)

    return unwrap(data, error)
  },

  /** ---------- DETALLE ---------- */

  // Detalle con opción de incluir owner
  async getById(itemId, opts = { withOwner: false }) {
    const baseSelect = `
      id,
      owner_id,
      title,
      description,
      garment_type_id,
      size_id,
      color_id,
      brand_id,
      condition_id,
      material_id,
      base_price_x,
      recommended_price_bind,
      ask_price_bind,
      status,
      rejection_reason,
      reviewed_by,
      reviewed_at,
      main_image_path,
      bg_removed,
      images_count,
      created_at,
      updated_at,
      genre_id,
      garment_types:garment_types!items_garment_type_id_fkey!left ( name ),
      brands:brands!items_brand_id_fkey!left ( name ),
      sizes:sizes!items_size_id_fkey!left ( name ),
      materials:materials!items_material_id_fkey!left ( name ),
      conditions:conditions!items_condition_id_fkey!left ( name ),
      colors:colors!items_color_id_fkey!left ( name ),
      item_styles!left(
        style_id,
        styles:styles!item_styles_style_id_fkey(id, name)
      ),
      genres:genres!items_genre_id_fkey!left ( name )
    `
    const ownerSelect = `,
      owner:profiles!items_owner_id_fkey!left (
        id,
        username,
        level,
        avatar_url
      )
    `
    const selectStr = opts.withOwner ? baseSelect + ownerSelect : baseSelect

    const { data, error } = await supabase
      .from('items')
      .select(selectStr)
      .eq('id', itemId)
      .single()
    return unwrap(data, error)
  },

  /** ---------- IMÁGENES ---------- */

  async addImageRecord(itemId, path, role, isPrimary = false) {
    const { data, error } = await supabase
      .from('item_images')
      .insert({ item_id: itemId, path, role, is_primary: isPrimary })
      .select()
      .single()
    return unwrap(data, error)
  },

  async listImages(itemId) {
    const { data, error } = await supabase
      .from('item_images')
      .select('*')
      .eq('item_id', itemId)
      .order('is_primary', { ascending: false })
    return unwrap(data, error)
  },

  /** ---------- ITEM STYLES (Pivot Table) ---------- */

  // Obtener todos los estilos de un ítem
  async getItemStyles(itemId) {
    const { data, error } = await supabase
      .from('item_styles')
      .select(`
        style_id,
        styles:styles!item_styles_style_id_fkey(id, name)
      `)
      .eq('item_id', itemId)
    return unwrap(data, error)
  },

  // Agregar estilos a un ítem (array de style_ids)
  async addItemStyles(itemId, styleIds = []) {
    if (!styleIds || styleIds.length === 0) return []

    const records = styleIds.map(styleId => ({
      item_id: itemId,
      style_id: styleId
    }))

    const { data, error } = await supabase
      .from('item_styles')
      .insert(records)
      .select()
    return unwrap(data, error)
  },

  // Eliminar todos los estilos de un ítem
  async removeItemStyles(itemId) {
    const { error } = await supabase
      .from('item_styles')
      .delete()
      .eq('item_id', itemId)
    if (error) throw error
  },

  // Actualizar estilos de un ítem (reemplaza todos)
  async updateItemStyles(itemId, styleIds = []) {
    // Primero eliminar todos los estilos existentes
    await this.removeItemStyles(itemId)

    // Luego agregar los nuevos (si hay)
    if (styleIds.length > 0) {
      return await this.addItemStyles(itemId, styleIds)
    }
    return []
  },
}