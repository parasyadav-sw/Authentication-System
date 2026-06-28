import jwt from 'jsonwebtoken';

/**
 * Middleware to protect routes that require authentication.
 * It reads the token from the HttpOnly cookie and verifies it.
 */
export function authenticateToken(req, res, next) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please log in.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // If verification fails (e.g. token expired, invalid signature), clear cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    return res.status(401).json({ error: 'Session expired or invalid. Please login again.' });
  }
}
