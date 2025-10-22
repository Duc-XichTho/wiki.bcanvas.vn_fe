#!/bin/bash

# Script để deploy lên render.com với cấu hình nginx tối ưu

echo "🚀 Starting deployment to render.com..."

# Build the application
echo "📦 Building application..."
npm run build

# Copy production nginx config
echo "⚙️  Setting up nginx configuration..."
cp nginx.production.conf nginx.conf

# Create a simple deployment script for render.com
cat > render-deploy.sh << 'EOF'
#!/bin/bash
# This script will be run by render.com

# Install dependencies
npm ci

# Build the application
npm run build

# Copy nginx config
cp nginx.production.conf nginx.conf

echo "✅ Build completed successfully!"
EOF

chmod +x render-deploy.sh

echo "✅ Deployment preparation completed!"
echo ""
echo "📋 Next steps for render.com:"
echo "1. Use 'render-deploy.sh' as your build command"
echo "2. Set 'nginx.conf' as your nginx configuration file"
echo "3. Make sure your environment variables are set correctly"
echo ""
echo "🔧 Key improvements made:"
echo "- Removed window.location.reload() that was causing routing issues"
echo "- Added proper error handling for schema switching"
echo "- Improved nginx configuration for SPA routing"
echo "- Added CORS headers for API requests"
echo "- Added proper caching headers"
