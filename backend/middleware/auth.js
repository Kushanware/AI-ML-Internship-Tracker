const jwt = require('jsonwebtoken');

/**
 * Authentication middleware that verifies JWT tokens
 * and attaches the user data to the request object
 */
module.exports = function authMiddleware(req, res, next) {
  // Check for token in various places
  const authHeader = req.headers.authorization || '';
  const token = 
    authHeader.startsWith('Bearer ') ? authHeader.slice(7) : // Bearer token
    req.query.token || // Query parameter
    req.cookies?.token; // Cookie

  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required',
      message: 'No authentication token provided'
    });
  }

  try {
    // Verify the token
    const payload = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'dev_jwt_secret',
      { algorithms: ['HS256'] }
    );

    // Check token expiration explicitly
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Your session has expired. Please login again.'
      });
    }

    // Attach user data to request
    req.user = { 
      id: payload.id,
      email: payload.email,
      roles: payload.roles || []
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] JWT verification failed:', {
      error: err.message,
      token: token.slice(0, 10) + '...' // Log partial token for debugging
    });

    return res.status(401).json({ 
      error: 'Invalid token',
      message: 'Your authentication token is invalid. Please login again.'
    });
  }
}
