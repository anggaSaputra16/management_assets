// Simple server-side pagination middleware
// TODO: extend to validate max limit and add allowed query whitelist
module.exports = (req, res, next) => {
  // Defensive parsing: handle empty string or non-numeric values
  const rawPage = req.query.page
  const rawLimit = req.query.limit

  let parsedPage = parseInt(String(rawPage ?? '1'), 10)
  if (Number.isNaN(parsedPage) || parsedPage < 1) parsedPage = 1

  let parsedLimit = parseInt(String(rawLimit ?? '10'), 10)
  if (Number.isNaN(parsedLimit) || parsedLimit < 1) parsedLimit = 10
  parsedLimit = Math.min(100, parsedLimit)

  const page = parsedPage
  const limit = parsedLimit
  const skip = (page - 1) * limit
  const take = limit

  req.pagination = { page, limit, skip, take }
  next()
}
