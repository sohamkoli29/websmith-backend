import { verifyToken, AuthError } from '../utils/authUtils.js';
import { supabase } from '../config/supabase.js';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw new AuthError('Access token required', 401);
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check token type
    if (decoded.type !== 'access') {
      throw new AuthError('Invalid token type', 401);
    }

    // Verify user still exists and is active
    const { data: user, error } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', decoded.sub)
      .single();

    if (error || !user) {
      throw new AuthError('User not found or inactive', 401);
    }

    // Check role if needed
    if (decoded.role !== user.role) {
      throw new AuthError('Role mismatch', 401);
    }

    // Attach user info to request
    req.user = {
      sub: decoded.sub,
      role: decoded.role,
      token: token
    };

    next();
  } catch (error) {
    next(error);
  }
};

// Middleware to require admin role
export const requireAdmin = (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      throw new AuthError('Admin access required', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware for optional authentication
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = verifyToken(token);
        
        if (decoded.type === 'access') {
          const { data: user } = await supabase
            .from('users')
            .select('id, role')
            .eq('id', decoded.sub)
            .single();

          if (user) {
            req.user = {
              sub: decoded.sub,
              role: decoded.role,
              token: token
            };
          }
        }
      } catch (error) {
        // Token is invalid, but we don't throw error for optional auth
        console.log('Optional auth - invalid token:', error.message);
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Rate limiting middleware (simple version)
export const rateLimit = (options = {}) => {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100; // limit each IP to 100 requests per windowMs
  const skipFailedRequests = options.skipFailedRequests || false;

  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}_${req.path}`;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const timestamps = requests.get(key);
    const windowStart = now - windowMs;

    // Remove old timestamps
    while (timestamps.length && timestamps[0] < windowStart) {
      timestamps.shift();
    }

    // Check if rate limit exceeded
    if (timestamps.length >= max) {
      const retryAfter = Math.ceil((timestamps[0] + windowMs - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        retryAfter
      });
    }

    // Add current timestamp
    timestamps.push(now);
    requests.set(key, timestamps);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', max - timestamps.length);
    res.setHeader('X-RateLimit-Reset', Math.ceil((timestamps[0] + windowMs) / 1000));

    next();
  };
};