const xss = require('xss');

const sanitizeValue = (val) => {
  if (typeof val === 'string') return xss(val);
  if (Array.isArray(val))     return val.map(sanitizeValue);
  if (val && typeof val === 'object') return sanitizeObject(val);
  return val;
};

const sanitizeObject = (obj) => {
  const clean = {};
  for (const key of Object.keys(obj)) {
    clean[key] = sanitizeValue(obj[key]);
  }
  return clean;
};

module.exports = (req, res, next) => {
  if (req.body)   req.body   = sanitizeObject(req.body);
  if (req.query)  req.query  = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);
  next();
};
