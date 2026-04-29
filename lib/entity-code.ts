export const normalizeEntityCode = (value: string) =>
  value.trim().replace(/\s+/g, ' ')

export const looksLikeEntityCode = (value: string) => {
  const normalized = normalizeEntityCode(value)

  if (!normalized) {
    return false
  }

  return /\d|\//.test(normalized)
}
