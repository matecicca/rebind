import { supabase } from './supabaseClient'
import { unwrap } from './utils'

export const lookupService = {
  /**
   * Busca por 'name' en una tabla dada (ilike %q%) y devuelve id + name.
   * Si tu tabla usa otro label, pásalo por 'labelField'.
   */
  async search( table, q, { labelField = 'name', valueField = 'id', limit = 20 } = {}) {
  const query = supabase
    .from(table)
    .select(`${valueField}, ${labelField}`)
    .order(labelField, { ascending: true }) // ← orden alfabético asegurado

  if (q && q.trim()) {
    query.ilike(labelField, `%${q.trim()}%`)
  }

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  return unwrap(
    data?.map(r => ({ id: r[valueField], label: r[labelField] })),
    error
  )
},

  /** Obtiene un registro por id para mostrar el label inicial en el input */
  async getById(table, id, { labelField = 'name', valueField = 'id' } = {}) {
    if (!id) return null
    const { data, error } = await supabase
      .from(table)
      .select(`${valueField}, ${labelField}`)
      .eq(valueField, id)
      .single()
    const item = data ? { id: data[valueField], label: data[labelField] } : null
    return unwrap(item, error)
  }
}
