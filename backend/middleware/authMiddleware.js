const { verifyToken } = require('../utils/jwt');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.log('[authMiddleware] No token provided.');
    return res.status(401).json({ error: 'No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verifyToken(token);
    console.log('[authMiddleware] Valid token for user:', decoded.id);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('[authMiddleware] Invalid token:', error.message);
    return res.status(403).json({ error: 'Invalid token.' });
  }
}

module.exports = { verifyToken: authMiddleware };
