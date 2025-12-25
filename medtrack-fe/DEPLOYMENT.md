# 🚀 MedTrack Netlify Deployment Guide

## Netlify Deployment Issues & Solutions

### ❌ Common Issues

1. **Build Failing**: `@mysten/sui` package resolution issues
2. **SPA Routing Not Working**: Direct links to `/producer`, `/carrier`, etc. return 404
3. **Sui Wallet Connection Issues**: Wallet not connecting in production
4. **CORS Issues**: Blockchain RPC calls blocked
5. **Environment Variables**: Missing configuration for production

### ✅ Solutions Applied

#### 1. Build Configuration Fix
- **File**: `netlify.toml`
- **Fixes**:
  - Node.js 18 environment
  - NPM production flag disabled
  - Optimized build settings

#### 2. SPA Routing Fix
- **File**: `public/_redirects`
- **Purpose**: Tells Netlify to serve `index.html` for all routes
- **Content**: `/*    /index.html   200`

#### 3. Security Headers & CORS
- **File**: `netlify.toml`
- **Features**:
  - CSP headers for Sui RPC endpoints
  - HTTPS enforcement
  - Wallet connection support

#### 4. Environment Variables
Set these in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Network Configuration
VITE_NETWORK=testnet

# Smart Contract
VITE_PACKAGE_ID=0xb7041c6d6d14f8dafeebc61604643ea031a06540a0201bc864835bae28980ccb
VITE_MODULE_NAME=supply_chain

# Features
VITE_ENABLE_DEBUG=false

# Optional: Wallet Configuration
VITE_SUPPORTED_WALLETS=sui-wallet,wallet-adapter
```

### 🔧 Manual Setup Steps

#### Step 1: Netlify Dashboard
1. Go to [Netlify](https://netlify.com)
2. Click "New site from Git" or "Deploy manually"
3. Connect your Git repository or upload the `medtrack-fe` folder

#### Step 2: Build Settings
```
Build command: npm run build
Publish directory: dist
Node version: 18
```

#### Step 3: Environment Variables
In Netlify Dashboard:
- Go to Site Settings → Environment Variables
- Add the variables listed above

#### Step 4: Deploy
- Netlify will automatically build and deploy
- The `_redirects` file handles SPA routing
- The `netlify.toml` optimizes the build

### 🐛 Troubleshooting

#### Issue: Build failing with `@mysten/sui` errors
**Solution**:
- Ensure Node.js version is exactly 18 in Netlify
- Check that `NPM_FLAGS = "--production=false"` is set
- Clear Netlify cache and redeploy
- Verify package versions in `package-lock.json`

#### Issue: Still getting 404 on direct links
**Solution**:
- Check that `_redirects` file is in `public/` folder and deployed
- Verify `netlify.toml` has the redirect rules
- Test by accessing yoursite.netlify.app/producer directly

#### Issue: Sui wallet not connecting
**Solution**:
- Ensure site is served over HTTPS (Netlify does this automatically)
- Check browser console for CSP errors
- Verify wallet extension supports the domain
- Try with different browsers/wallets

#### Issue: "Failed to connect to Sui network"
**Solution**:
- Check environment variables are set correctly
- Verify `VITE_NETWORK` is either `testnet` or `mainnet`
- Check if Sui testnet/mainnet is operational
- Look for CORS errors in browser console

#### Issue: Environment variables not working
**Solution**:
- Restart deployment after adding env vars
- Check variable names match exactly (VITE_* prefix required)
- Verify values in Netlify build logs
- Use Netlify CLI: `netlify env:list`

#### Issue: Wallet transaction failing
**Solution**:
- Ensure user has sufficient SUI for gas fees
- Check wallet is connected to correct network (testnet)
- Verify PACKAGE_ID is correct
- Check browser console for detailed error messages

### 📱 Mobile & Browser Support

- ✅ Chrome/Chromium-based browsers
- ✅ Firefox
- ✅ Safari (desktop)
- ⚠️ Safari (iOS) - Limited wallet support
- ❌ Internet Explorer - Not supported

### 🔒 Security Considerations

- Always use HTTPS in production
- Validate all user inputs
- Use environment variables for sensitive data
- Keep dependencies updated

### 📞 Support

If issues persist:
1. Check Netlify deployment logs
2. Verify browser console errors
3. Test locally with `npm run build && npm run preview`
4. Check Sui wallet compatibility

---

**🎉 Happy Deploying! Your MedTrack dApp should now work perfectly on Netlify.**
