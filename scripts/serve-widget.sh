#!/bin/bash

# Simple script to serve the widget files for CDN simulation

echo "🚀 VibeQA Widget CDN Simulator"
echo "=============================="
echo ""

# Check if widget is built
if [ ! -f "dist-widget/widget.iife.js" ]; then
    echo "❌ Widget not built. Building now..."
    npm run build:widget
    echo ""
fi

# Show widget info
if [ -f "dist-widget/widget.iife.js" ]; then
    SIZE=$(ls -lh dist-widget/widget.iife.js | awk '{print $5}')
    echo "✅ Widget ready!"
    echo "   File: dist-widget/widget.iife.js"
    echo "   Size: $SIZE"
    echo ""
fi

# Start simple HTTP server
echo "Starting HTTP server..."
echo "========================"
echo ""
echo "Widget URLs:"
echo "  - http://localhost:8080/widget.iife.js"
echo "  - http://localhost:8080/widget.iife.js.map"
echo ""
echo "Test page:"
echo "  - http://localhost:8080/widget-demo.html"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Change to dist-widget directory and start server
cd dist-widget
python3 -m http.server 8080