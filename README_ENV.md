# Environment Variables Setup

## ✅ Your .env file has been created!

The `.env` file has been created with the following configuration:

### Required Variables (Already Set):
- ✅ `JWT_SECRET` - Generated secure secret key
- ✅ `JWT_REFRESH_SECRET` - Generated secure refresh token key
- ✅ `MONGODB_URI` - Set to local MongoDB (default)
- ✅ `PORT` - Set to 5000
- ✅ `NODE_ENV` - Set to development
- ✅ `FRONTEND_URL` - Set to http://localhost:3000

### ⚠️ Variables You Need to Update:

1. **MONGODB_URI** (if using MongoDB Atlas or different connection):
   ```env
   # If using MongoDB Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sigmora?retryWrites=true&w=majority
   
   # If using local MongoDB with auth:
   MONGODB_URI=mongodb://username:password@localhost:27017/sigmora?authSource=admin
   ```

2. **FLUTTERWAVE_SECRET_KEY** (for payment functionality):
   ```env
   # Get from: https://dashboard.flutterwave.com/ → Settings → API Keys
   # Test key format: FLWSECK_TEST-xxxxxxxxxxxxx
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-actual-test-key-here
   ```

## 🚀 Next Steps:

1. **Make sure MongoDB is running:**
   ```bash
   # Check if MongoDB is running
   mongod --version
   
   # Or start MongoDB service
   # macOS: brew services start mongodb-community
   # Linux: sudo systemctl start mongod
   # Windows: net start MongoDB
   ```

2. **Restart your server:**
   ```bash
   # Stop the current server (Ctrl+C)
   # Then restart:
   npm run dev
   ```

3. **Test registration:**
   - The error should now be fixed!
   - Try registering a new user again

## 🔒 Security Notes:

- ✅ The `.env` file is in `.gitignore` and won't be committed
- ✅ Your JWT secrets are randomly generated and secure
- ⚠️ **Never share your `.env` file or commit it to version control**
- ⚠️ Use different secrets for production

## 🐛 Troubleshooting:

### If you still get "JWT_SECRET is not defined":
1. Make sure the `.env` file is in the `sigmora-server-beta` directory
2. Restart your server after creating/modifying `.env`
3. Check that there are no spaces around the `=` sign in `.env`
4. Verify the file is named exactly `.env` (not `.env.txt` or `.env.example`)

### If MongoDB connection fails:
1. Make sure MongoDB is installed and running
2. Check the `MONGODB_URI` format is correct
3. For MongoDB Atlas, ensure your IP is whitelisted

### To verify environment variables are loaded:
```bash
node -e "require('dotenv').config(); console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set ✅' : 'Missing ❌')"
```

## 📝 Complete .env File Structure:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/sigmora

# JWT Authentication
JWT_SECRET=CSMfxCGBhMgXfmgJwodRD7GRgmXAnGOjIoHvLjolFL8=
JWT_REFRESH_SECRET=WqHoTLScx+OljMQnEh5f3Sa28ED1A9UUabMHrPDqCfg=
JWT_EXPIRE=5h

# Flutterwave Payment Integration
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST-your-test-secret-key-here

# Frontend Configuration
FRONTEND_URL=http://localhost:3000
```

---

**Your server should now work! Try registering again.** 🎉

