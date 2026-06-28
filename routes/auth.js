import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Password validation regex
// Requires: 8+ characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-\[\]/\\`~;:'"<=]).{8,}$/;
// Standard email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// User Registration Route
router.post('/register', async (req, res) => {
  let { username, email, password } = req.body;

  // 1. Basic Presence Validation
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'All fields (username, email, password) are required.' });
  }

  username = username.trim();
  email = email.trim().toLowerCase();

  // 2. Username Validation
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: 'Username must be between 3 and 20 characters.' });
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({ error: 'Username can only contain alphanumeric characters and underscores.' });
  }

  // 3. Email Format Validation
  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  // 4. Password Strength Validation
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(400).json({
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  try {
    // 5. Check Duplicate Username or Email
    const checkStmt = db.prepare('SELECT username, email FROM users WHERE username = ? OR email = ?');
    const existingUsers = checkStmt.all(username, email);

    if (existingUsers.length > 0) {
      const emailExists = existingUsers.some(u => u.email.toLowerCase() === email);
      const usernameExists = existingUsers.some(u => u.username.toLowerCase() === username.toLowerCase());

      if (emailExists) {
        return res.status(409).json({ error: 'Email is already registered.' });
      }
      if (usernameExists) {
        return res.status(409).json({ error: 'Username is already taken.' });
      }
    }

    // 6. Hash Password using bcryptjs
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 7. Store User in DB
    const insertStmt = db.prepare('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)');
    insertStmt.run(username, email, passwordHash);

    return res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    console.error('Registration API Error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

// User Login Route
router.post('/login', async (req, res) => {
  let { email, password } = req.body;

  // 1. Basic Presence Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  email = email.trim().toLowerCase();

  try {
    // 2. Retrieve User
    const selectStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = selectStmt.get(email);

    if (!user) {
      // Use generic error for credential security to prevent email enumeration
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 3. Compare Passwords
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    // 5. Store JWT in HttpOnly Cookie
    res.cookie('auth_token', token, {
      httpOnly: true, // Prevents Javascript from accessing cookie
      secure: process.env.NODE_ENV === 'production', // Serve over HTTPS only in production
      sameSite: 'strict', // Mitigates CSRF vulnerability
      maxAge: 2 * 60 * 60 * 1000, // 2 hours
    });

    return res.status(200).json({
      message: 'Login successful!',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      }
    });
  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

// User Logout Route
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ message: 'Logout successful.' });
});

// Session Verification Route
router.get('/me', authenticateToken, (req, res) => {
  return res.status(200).json({
    user: {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
    }
  });
});

export default router;
