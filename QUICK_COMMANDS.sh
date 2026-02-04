#!/bin/bash
# Quick deployment commands

echo "🚂 Railway Quick Deploy Script"
echo "================================"
echo ""

echo "📦 Step 1: Install Railway CLI"
npm install -g @railway/cli

echo ""
echo "🔑 Step 2: Login to Railway"
railway login

echo ""
echo "🆕 Step 3: Initialize Project"
railway init

echo ""
echo "🗄️ Step 4: Add PostgreSQL"
railway add --database postgresql

echo ""
echo "💾 Step 5: Add Redis"
railway add --database redis

echo ""
echo "⚙️ Step 6: Set Environment Variables"
echo "⚠️  Please enter your NEW Gemini API key (get from https://makersuite.google.com/app/apikey)"
read -p "Gemini API Key: " GEMINI_KEY
railway variables set GEMINI_API_KEY=$GEMINI_KEY
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway variables set ALLOWED_ORIGINS="*"

echo ""
echo "🚀 Step 7: Deploy!"
railway up

echo ""
echo "🔧 Step 8: Run Migrations"
railway run npm run migrate --workspace=backend

echo ""
echo "✅ Step 9: Get Your URL"
railway domain

echo ""
echo "🎉 Deployment Complete!"
echo "Test your API with: railway logs"
