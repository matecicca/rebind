// src/services/recommendationService.js
import { supabase } from '@/services/supabaseClient'
import { preferencesService } from '@/services/preferencesService'
import { getMyProfileId } from '@/services/profileService'

export const recommendationService = {
  /**
   * Reglas:
   *  - Mostrar SOLO prendas que cumplan: talle ∈ mis preferencias Y género ∈ mis preferencias.
   *  - Excluir mis propias prendas.
   *  - Ordenar:
   *      a) estilo (match primero)
   *      b) score: talle +2 (siempre true por filtro), estado +1 / -1
   *      c) created_at desc
   *  - Si score < 0 => descartar.
   */
  async getRecommended(page = 1, pageSize = 24, q = null) {
    // Sesión y perfil
    const { data: auth } = await supabase.auth.getUser()
    const uid = auth?.user?.id
    if (!uid) return []

    const myProfileId = await getMyProfileId()

    // Preferencias del usuario (IDs crudos desde pivots)
    const { sizes: sizeIds, conditions: condIds, styles: styleIds, genres: genreIds } =
      await preferencesService._getCurrentIds(uid)

    // Condiciones obligatorias: SIEMPRE deben existir talle y género en preferencias
    // Si no hay alguna, devolvemos vacío (no podemos cumplir "coincidan Talle y Género").
    if (!sizeIds?.length || !genreIds?.length) {
      return []
    }

    // Pool base: aprobados, no míos, que cumplan talle y género obligatorios
    let query = supabase
      .from('items')
      .select(`
        id, title, description, ask_price_bind, main_image_path,
        owner_id, status, created_at,
        size_id, condition_id, genre_id,
        sizes:sizes!items_size_id_fkey!left ( name ),
        brands:brands!items_brand_id_fkey!left ( name ),
        owner:profiles!items_owner_id_fkey!left ( username ),
        item_styles!left(
          style_id,
          styles:styles!item_styles_style_id_fkey(id, name)
        )
      `)
      .eq('status', 'approved')
      .in('size_id', sizeIds)
      .in('genre_id', genreIds)

    if (myProfileId) {
      query = query.neq('owner_id', myProfileId)
    }

    // Búsqueda textual opcional (no altera el filtro duro)
    if (q && q.trim()) {
      const like = `%${q.trim()}%`
      query = query.or(`title.ilike.${like},description.ilike.${like}`)
    }

    // Traemos un pool generoso y luego ordenamos en memoria por las nuevas reglas
    query = query.order('created_at', { ascending: false }).limit(400)

    const { data, error } = await query
    if (error) {
      console.error('recommendationService error:', error)
      return []
    }

    const pool = data || []
    if (!pool.length) return []

    // Conjuntos para lookups rápidos
    const sets = {
      styles: new Set(styleIds || []),
      conditions: new Set(condIds || []),
    }

    // Etiquetas de coincidencia
    const withFlags = pool.map(it => {
      // Verificar si alguno de los estilos del item está en las preferencias del usuario
      const itemStyleIds = it.item_styles?.map(is => is.style_id) || []
      const styleMatch = itemStyleIds.some(sid => sets.styles.has(sid))

      const condMatch  = it.condition_id ? sets.conditions.has(it.condition_id) : false

      // Puntaje según tabla pedida
      let score = 0
      // Talle coincide sí o sí por filtro; lo explicitamos:
      score += 2
      score += condMatch ? 1 : -1

      return {
        ...it,
        _styleMatch: styleMatch ? 1 : 0,  // para ordenar estilo primero
        _score: score
      }
    })

    // Descartar los puntajes negativos
    const filtered = withFlags.filter(x => x._score >= 0)

    // Orden: 1) estilo match primero, 2) score desc, 3) created_at desc
    const ordered = filtered.sort((a, b) => {
      if (b._styleMatch !== a._styleMatch) return b._styleMatch - a._styleMatch
      if (b._score !== a._score) return b._score - a._score
      return a.created_at < b.created_at ? 1 : -1
    })

    // Paginación final
    const start = (page - 1) * pageSize
    return ordered.slice(start, start + pageSize)
  }
}