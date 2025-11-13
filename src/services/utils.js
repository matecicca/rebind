export function unwrap(data, error) {
  if (error) throw error
  if (!data) throw new Error('No data found')
  return data
}

export function withCount() {
  return { count: 'exact', head: true }
}

export function pageRange(page = 1, pageSize = 20) {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return [from, to]
}
