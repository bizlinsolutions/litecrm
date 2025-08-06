# LiteCRM Authentication & Customer Validation Fixes

## Issues Fixed:

### 1. ✅ Customer Email Validation Issue
**Problem**: When adding a customer with only a name, the API was throwing validation error for email field even though it's optional.

**Fix**: Updated `api/routes/customers.js` to properly handle optional email validation:
```javascript
email: z.union([
    z.string().email('Invalid email format'),
    z.string().length(0),
    z.undefined()
]).optional(),
```

### 2. ✅ Added Refresh Token Mechanism
**Problem**: No refresh token mechanism existed, causing users to be logged out on server restart.

**Fixes**:
- Updated `api/lib/auth.js` to include refresh token generation and verification
- Modified `api/models/User.js` to store refresh tokens
- Updated login/register endpoints in `api/routes/auth.js` to return refresh tokens
- Added `/api/auth/refresh` and `/api/auth/logout` endpoints

### 3. ✅ Added Global Authentication Context
**Problem**: No centralized authentication handling on frontend.

**Fix**: Created `src/context/AuthContext.tsx` with:
- Automatic token refresh every 10 minutes
- Global authentication state management
- Automatic logout on authentication failure

### 4. ✅ Added Authenticated Fetch Hook
**Problem**: No automatic 401 handling and token refresh on API calls.

**Fix**: Created `src/hooks/useAuthenticatedFetch.ts` with:
- Automatic 401 detection and token refresh
- Centralized API calls with authentication
- Automatic logout on refresh failure

### 5. ✅ Updated Core Pages
- Updated `src/app/layout.tsx` to include AuthProvider
- Updated `src/app/login/page.tsx` to use new auth context
- Updated `src/app/dashboard/page.tsx` to use new auth context
- Added user profile endpoint `/api/users/me`

## How to Use:

### Frontend Authentication:
```typescript
// In any component
import { useAuth } from '@/context/AuthContext';

const { user, logout, isAuthenticated, isLoading } = useAuth();

// For API calls
import { useApi } from '@/hooks/useAuthenticatedFetch';

const api = useApi();
const data = await api.get('/api/customers'); // Automatic 401 handling
```

### Backend Refresh Token Flow:
1. Login returns both `token` (15min) and `refreshToken` (7 days)
2. Frontend automatically refreshes access token every 10 minutes
3. On 401, frontend attempts token refresh before logging out
4. Logout removes all refresh tokens from database

## Environment Variables to Add:
```
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

## Next Steps:

1. **Update other pages** to use the new auth hooks (customers, tickets, etc.)
2. **Clean up old localStorage.getItem('token')** calls throughout the codebase
3. **Test the refresh token flow** by setting shorter token expiry times
4. **Add token blacklisting** for extra security (optional)

## Testing:

1. **Customer Creation**: Now works with just name field
2. **Auto-logout on 401**: Try making requests with invalid token
3. **Token Refresh**: Set JWT_EXPIRES_IN=1m to test automatic refresh
4. **Server Restart**: Users should stay logged in after server restart

## Migration for Existing Pages:

Replace:
```typescript
const token = localStorage.getItem('token');
const response = await fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

With:
```typescript
const api = useApi();
const data = await api.get('/api/endpoint');
```

This will automatically handle authentication, token refresh, and logout on 401 errors.
