#!/bin/bash

# 🚀 MedTrack Netlify Deployment Script
# Run this script from the repository ROOT directory
# IMPORTANT: This script should be run from the MedTrack/ directory, not medtrack-fe/

echo "🚀 Starting MedTrack Netlify Deployment..."

# Check if we're in the right directory
if [ ! -f "netlify.toml" ]; then
    echo "❌ Error: netlify.toml not found in current directory"
    echo "Please run this script from the MedTrack/ repository root directory"
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Netlify CLI not found. Install it first:"
    echo "npm install -g netlify-cli"
    exit 1
fi

# Check if user is logged in
if ! netlify status &> /dev/null; then
    echo "🔐 Please login to Netlify first:"
    netlify login
fi

# Navigate to frontend directory and build
echo "🔨 Building project..."
cd medtrack-fe
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check the errors above."
    exit 1
fi

cd ..
echo "✅ Build successful!"

# Check if site already exists
if netlify sites:list | grep -q "medtrack"; then
    echo "📦 Deploying to existing site..."
    netlify deploy --prod --dir=medtrack-fe/dist
else
    echo "🆕 Creating new Netlify site..."
    netlify init
    netlify deploy --prod --dir=medtrack-fe/dist
fi

if [ $? -eq 0 ]; then
    echo "🎉 Deployment successful!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Go to Netlify Dashboard → Site Settings → Environment Variables"
    echo "2. Add these variables:"
    echo "   VITE_NETWORK=testnet"
    echo "   VITE_PACKAGE_ID=0xb7041c6d6d14f8dafeebc61604643ea031a06540a0201bc864835bae28980ccb"
    echo "   VITE_MODULE_NAME=supply_chain"
    echo "   VITE_ENABLE_DEBUG=false"
    echo ""
    echo "3. Redeploy the site to apply environment variables"
    echo ""
    echo "🔗 Your site should now be live!"
    echo ""
    echo "📝 Note: netlify.toml is now in repository root for proper processing"
else
    echo "❌ Deployment failed! Check the errors above."
    exit 1
fi
