# Secure User Authentication System

## Technical Documentation & Submission Guide (Week 2)

This documentation provides a comprehensive, production-grade guide to the architecture, security mechanisms, and source code of the **Secure User Authentication System**. It is designed to satisfy your Week 2 submission requirements and prepare you to excel in your live code walkthrough.

---

## 📂 Project Architecture & File Hierarchy

The application features a modern, single-process, full-stack design. The Express backend serves both the secure REST API endpoints and the static HTML5 client interface.

```text
Authentication System/
├── Run_App.bat             # Startup script running backend and initializing env configs
├── db.js                   # Database connector initializing the native SQLite DB schema
├── database.db             # Persisted SQLite binary database file
├── server.js               # Express application bootstrap & static assets server
├── package.json            # Node.js project packages configuration
├── middleware/
│   └── auth.js             # JWT token authentication and cookie validation middleware
├── routes/
│   └── auth.js             # Registration, login, logout, and session verification routes
└── public/                 # Static frontend client files
    ├── index.html          # Dynamic loading page (handles initial session router check)
    ├── login.html          # Clean card UI for user login
    ├── register.html       # Clean card UI for registration with pass-strength checker
    ├── dashboard.html      # Secure panel visible only to authenticated sessions
    ├── css/
    │   └── style.css       # Glassmorphic layout styles, CSS variables, dark mode
    └── js/
        ├── auth.js         # REST client for login, register, and inputs checking
        ├── dashboard.js    # Session verified panel loader and logout trigger
        └── toast.js        # Dynamic toast notification helper (success, error, info)
```

---

## 🔒 Security & Implementation Highlights

### 1. Modern Native SQLite Database

- **Mechanism**: Implemented via Node.js's new native `node:sqlite` module (specifically `DatabaseSync`), introduced in Node 22.
- **Benefits**:
  - No external compilation processes or native dependencies (unlike legacy `sqlite3` or `better-sqlite3` bindings).
  - Executes synchronously during initialization to guarantee the `users` table is created before routing requests.
  - Provides simple, parameterized queries (`db.prepare(...)`) to prevent SQL Injection out-of-the-box.
- **Code Reference**: [db.js](file:///c:/Users/Abhijeet/Desktop/WeIntern/Authentication%20System/db.js).

### 2. Industry-Standard Password Security & Cryptography

- **Validation**: The registration route validates password complexity using a rigorous regex:
  ```javascript
  const PASSWORD_REGEX =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_+\-\[\]/\\`~;:'"<=]).{8,}$/;
  ```
  _This requires 8+ characters, at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special symbol._
- **Hashing**: Passwords are never stored in plain text. They are hashed using `bcryptjs` with `10` salt rounds, protecting against dictionary and rainbow table attacks.
- **Credential Enumeration Protection**: The login route responds with a generic error message (`"Invalid email or password."`) if a login fails. This prevents attackers from guessing whether a specific email is registered on the platform.
- **Code Reference**: [routes/auth.js](file:///c:/Users/Abhijeet/Desktop/WeIntern/Authentication%20System/routes/auth.js).

### 3. JWT Token Session Management via HttpOnly Cookies

- **Mechanism**: Upon successful login, the server generates a JSON Web Token (JWT) signed with the user profile context and a secret key.
- **Cookie Storage**: The JWT is sent to the client as an **HttpOnly** cookie:
  ```javascript
  res.cookie("auth_token", token, {
    httpOnly: true, // Blocks client-side Javascript (preventing XSS access)
    secure: process.env.NODE_ENV === "production", // Only served over HTTPS
    sameSite: "strict", // Mitigates Cross-Site Request Forgery (CSRF)
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
  });
  ```
- **Cookie Cleanup**: To close sessions, the logout endpoint clears the cookie client-side. The auth middleware also clears the cookie if a token is determined to be expired or tampered with.
- **Code Reference**: `login` and `logout` in [routes/auth.js](file:///c:/Users/Abhijeet/Desktop/WeIntern/Authentication%20System/routes/auth.js).

### 4. Dynamic Route Authorization Middleware

- **Mechanism**: The `authenticateToken` middleware acts as a gatekeeper for protected endpoints.
- **Logic**:
  - Extracts the token from `req.cookies.auth_token`.
  - Verifies the token signature using `jwt.verify`.
  - If valid, appends the decoded user object to the request (`req.user`) and passes control to the next handler.
  - If invalid or expired, it automatically clears the cookie and returns a `401 Unauthorized` response.
- **Code Reference**: [middleware/auth.js](file:///c:/Users/Abhijeet/Desktop/WeIntern/Authentication%20System/middleware/auth.js).

---

## 📸 Screenshots Blueprint

Capture the following screenshots to fulfill the submission requirements:

1.  **`01_login_page.png`**: The Login page displaying the form card in Light Mode.
    ![Login Page](screenshots/01_login_page.png)

2.  **`02_registration_password_strength.png`**: The Registration form displaying real-time password strength indicators (red for weak, green for strong).
    ![Password Strength](screenshots/02_registration_password_strength.png)

3.  **`03_registration_error.png`**: Registration page showing an error warning (e.g., duplicate username or email exists).
    ![Registration Error](screenshots/03_registration_error.png)

4.  **`04_jwt_cookie_devtools.png`**: DevTools -> Application -> Cookies showing the `auth_token` cookie with the `HttpOnly` and `SameSite=Strict` checkboxes active.
    ![JWT Cookie](screenshots/04_jwt_cookie_devtools.png)

5.  **`05_dashboard_protected.png`**: The logged-in dashboard screen showing the welcome message, user details, and active logout button.
    ![Dashboard](screenshots/05_dashboard_protected.png)

6.  **`06_access_denied.png`**: Access denied response toast when attempting to visit `dashboard.html` directly in an incognito window.
    ![Access Denied](screenshots/06_access_denied.png)

---
