# Security Features Documentation

## Overview
This document outlines the security features implemented in the Sigmora backend API.

## Security Features Implemented

### 1. Password Hashing
- **Technology**: bcryptjs with salt rounds of 10
- **Location**: `models/User.model.js`
- **Implementation**: Passwords are automatically hashed before saving to the database using Mongoose pre-save hooks
- **Verification**: Password comparison is done using `comparePassword` method which uses bcrypt.compare()

### 2. JWT Token Authentication
- **Token Expiration**: 5 hours (as requested)
- **Location**: `utils/generateToken.js`
- **Features**:
  - Tokens are signed with JWT_SECRET from environment variables
  - Tokens include user ID in payload
  - Automatic expiration after 5 hours

### 3. Session Management
- **Model**: `models/Session.model.js`
- **Features**:
  - Each login creates a new session record in the database
  - Sessions track:
    - User ID
    - JWT Token
    - Expiration time (5 hours)
    - IP Address
    - User Agent
    - Last activity timestamp
    - Active status
  - Sessions are automatically deleted when expired (MongoDB TTL index)
  - Sessions can be manually deactivated on logout

### 4. Enhanced Authentication Middleware
- **Location**: `middleware/auth.middleware.js`
- **Features**:
  - Validates token presence in Authorization header
  - Verifies token signature and expiration
  - Checks if session exists and is active
  - Validates session expiration
  - Updates last activity timestamp on each request
  - Provides detailed error codes for different failure scenarios:
    - `NO_TOKEN`: No token provided
    - `INVALID_SESSION`: Session not found or inactive
    - `SESSION_EXPIRED`: Session has expired
    - `TOKEN_EXPIRED`: JWT token has expired
    - `INVALID_TOKEN`: Invalid token format
    - `USER_NOT_FOUND`: User doesn't exist
    - `TOKEN_VERIFICATION_FAILED`: General token verification failure

### 5. Token Refresh Mechanism
- **Endpoint**: `POST /api/auth/refresh`
- **Features**:
  - Allows users to refresh their token before expiration
  - Invalidates old session and creates new one
  - Returns new token with 5-hour expiration
  - Frontend automatically refreshes tokens when they're about to expire (within 5 minutes)

### 6. Logout Functionality
- **Endpoints**:
  - `POST /api/auth/logout` - Logout from current device
  - `POST /api/auth/logout-all` - Logout from all devices
- **Features**:
  - Deactivates session(s) in database
  - Prevents token reuse after logout
  - Frontend clears local storage on logout

### 7. Frontend Security Enhancements
- **Location**: `src/services/api.js` and `src/context/AuthContext.jsx`
- **Features**:
  - Automatic token expiration checking before each request
  - Automatic token refresh when token is about to expire (within 5 minutes)
  - Token expiration time stored in localStorage
  - Automatic logout on token expiration
  - Token included in Authorization header for all requests
  - Handles 401 errors gracefully with automatic redirect to login
  - Clears all authentication data on logout

### 8. Request Security
- **IP Address Tracking**: Sessions track IP addresses for security monitoring
- **User Agent Tracking**: Sessions track user agents for device identification
- **Trust Proxy**: Server configured to trust proxy for accurate IP addresses

## API Endpoints

### Authentication Endpoints
- `POST /api/auth/register/creator` - Register as creator (creates session)
- `POST /api/auth/register/subscriber` - Register as subscriber (creates session)
- `POST /api/auth/login` - Login (creates session)
- `GET /api/auth/me` - Get current user (requires valid token)
- `POST /api/auth/logout` - Logout from current device
- `POST /api/auth/logout-all` - Logout from all devices
- `POST /api/auth/refresh` - Refresh token

## Environment Variables Required

```env
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=5h  # Optional, defaults to 5h
JWT_REFRESH_SECRET=your_refresh_secret_key_here  # Optional, uses JWT_SECRET if not set
```

## Security Best Practices Implemented

1. **Password Security**:
   - Passwords are never stored in plain text
   - bcrypt with salt rounds prevents rainbow table attacks
   - Minimum password length enforced (6 characters)

2. **Token Security**:
   - Short expiration time (5 hours) limits exposure window
   - Tokens are validated on every request
   - Sessions are tracked in database for revocation capability

3. **Session Security**:
   - Sessions expire automatically
   - Sessions can be manually revoked
   - Last activity tracking for security monitoring
   - IP and User Agent tracking for anomaly detection

4. **Request Security**:
   - All protected routes require valid token
   - Token validation happens in middleware before route handlers
   - Detailed error messages help with debugging while maintaining security

5. **Frontend Security**:
   - Automatic token refresh prevents user interruption
   - Token expiration checking prevents unnecessary API calls
   - Secure storage in localStorage (consider httpOnly cookies for production)

## Security Considerations for Production

1. **HTTPS**: Always use HTTPS in production to protect tokens in transit
2. **CORS**: Configure CORS properly to restrict allowed origins
3. **Rate Limiting**: Consider adding rate limiting to prevent brute force attacks
4. **Token Storage**: Consider using httpOnly cookies instead of localStorage for better XSS protection
5. **Session Cleanup**: Implement periodic cleanup of expired sessions
6. **IP Whitelisting**: Consider IP whitelisting for sensitive operations
7. **2FA**: Consider adding two-factor authentication for enhanced security
8. **Audit Logging**: Consider adding audit logs for security events

## Testing Security Features

To test the security features:

1. **Token Expiration**: Wait 5 hours after login and try making a request
2. **Session Validation**: Try using an old token after logout
3. **Token Refresh**: Use refresh endpoint before token expires
4. **Invalid Token**: Try making requests with invalid/malformed tokens
5. **No Token**: Try accessing protected routes without token

## Error Codes Reference

- `NO_TOKEN`: No token provided in request
- `INVALID_SESSION`: Session not found or inactive
- `SESSION_EXPIRED`: Session has expired
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: Invalid token format
- `USER_NOT_FOUND`: User doesn't exist
- `TOKEN_VERIFICATION_FAILED`: General token verification failure
- `INSUFFICIENT_PERMISSIONS`: User doesn't have required role

