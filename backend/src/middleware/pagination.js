// Simple server-side pagination middleware
// TODO: extend to validate max limit and add allowed query whitelist
module.exports = (req, res, next) => {
  const page = Math.max(1, parseInt(req.query.page || '1'))
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '10')))
  const skip = (page - 1) * limit
  const take = limit

  req.pagination = { page, limit, skip, take }
  next()
}
