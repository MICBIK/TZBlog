# CSRF Protection Strategy

## Why CSRF Middleware Was Removed

This project uses **Bearer Token authentication** (JWT in the `Authorization` header), which is **naturally immune to CSRF attacks**.

## CSRF Attack Vector

CSRF attacks exploit the browser's automatic inclusion of cookies in cross-origin requests. The attack works like this:

1. User logs in to `https://legitimate-site.com`, receives a session cookie
2. User visits `https://evil-site.com` (while still logged in)
3. Evil site triggers a request to `https://legitimate-site.com/api/delete-account`
4. Browser **automatically includes** the session cookie
5. Server sees valid cookie and processes the request

## Why Bearer Tokens Are Safe

Our authentication uses Bearer tokens in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Key Difference

- **Cookies**: Automatically included by browser (vulnerable to CSRF)
- **Bearer Tokens**: Must be explicitly added by JavaScript (immune to CSRF)

When `https://evil-site.com` triggers a cross-origin request:
- ✅ Browser sends cookies automatically
- ❌ Browser **does NOT** send `Authorization` headers automatically
- ❌ Evil site cannot access legitimate site's JavaScript/localStorage due to Same-Origin Policy

## Implementation Details

### Authentication Flow

1. User logs in via `POST /api/v1/auth/login`
2. Server returns JWT token in response body
3. Frontend stores token in memory or localStorage
4. Frontend includes token in every request:
   ```javascript
   fetch('/api/v1/articles', {
     headers: {
       'Authorization': `Bearer ${token}`
     }
   })
   ```

### No Cookies Used

Our JWT tokens are:
- ✅ Stored client-side (localStorage/memory)
- ✅ Sent via `Authorization` header
- ❌ **NOT** stored in cookies

### CORS Protection

We still use CORS to control which origins can make requests:

```go
// Development: permissive CORS
router.Use(middleware.DevelopmentCORS())

// Production: strict whitelist
allowedOrigins := []string{cfg.Server.FrontendURL}
router.Use(middleware.CORS(allowedOrigins))
```

## Security Measures We DO Have

1. **CORS whitelist** - Prevents unauthorized origins
2. **Rate limiting** - Prevents brute force attacks
3. **Token expiry** - JWT tokens expire after 7 days
4. **Token blacklist** - Revoked tokens (logout, password change)
5. **Input validation** - All user input validated
6. **SQL injection protection** - Parameterized queries (GORM)
7. **XSS protection** - JSON responses (no HTML rendering)

## When CSRF Protection IS Needed

CSRF protection would be necessary if we:
- ❌ Used session cookies for authentication
- ❌ Used HTTP-only cookies to store JWT
- ❌ Had any cookie-based authentication

Since we use **stateless Bearer Token authentication**, CSRF middleware would be:
- ❌ **Ineffective** - Doesn't protect against real threats
- ❌ **Breaking** - All write operations would return 403
- ❌ **Unnecessary complexity** - Token distribution + frontend integration

## References

- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Why JWT tokens are immune to CSRF](https://security.stackexchange.com/questions/170388/do-i-need-csrf-token-if-im-using-bearer-jwt)

## Security Review Decision

**SEC-6-01 Resolution**: CSRF middleware removed as it provides no security benefit for Bearer Token authentication and would break all write operations without frontend integration.
