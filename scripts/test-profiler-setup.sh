#!/bin/bash
# Quick test to verify Pyroscope setup

echo "🧪 Testing Pyroscope Setup"
echo ""

# Check if profiler module exists
if [ ! -f "build/utils/profiler.js" ]; then
  echo "❌ profiler.js not found. Run: npm run build"
  exit 1
fi

echo "✅ Profiler module compiled"

# Test with profiling disabled (default)
echo ""
echo "Testing with profiling disabled..."
export PYROSCOPE_ENABLED=false
timeout 2s node build/index.js 2>&1 | grep -i pyroscope || echo "✅ No profiler output (disabled)"

# Test with profiling enabled
echo ""
echo "Testing with profiling enabled (will fail if server not running)..."
export PYROSCOPE_ENABLED=true
export PYROSCOPE_SERVER_URL=http://localhost:4040
timeout 2s node build/index.js 2>&1 | grep -i pyroscope || echo "⚠️  No profiler output"

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start profiling:"
echo "  1. docker run -d -p 4040:4040 pyroscope/pyroscope:latest server"
echo "  2. npm run profile"
echo "  3. Open http://localhost:4040"
