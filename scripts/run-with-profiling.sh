#!/bin/bash
# scripts/run-with-profiling.sh
# Run the MCP server with Pyroscope profiling enabled

# Ensure Pyroscope server is running
if ! curl -s http://localhost:4040/healthz > /dev/null 2>&1; then
  echo "⚠️  Pyroscope server not detected on http://localhost:4040"
  echo ""
  echo "Start Pyroscope server with:"
  echo "  docker run -p 4040:4040 pyroscope/pyroscope:latest server"
  echo ""
  echo "Or install locally:"
  echo "  brew install pyroscope-io/brew/pyroscope"
  echo "  pyroscope server"
  echo ""
  read -p "Continue anyway? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

# Enable profiling and run
export PYROSCOPE_ENABLED=true
export PYROSCOPE_SERVER_URL=http://localhost:4040
export PYROSCOPE_APP_NAME=swift-patterns-mcp

echo "🔥 Starting with Pyroscope profiling enabled"
echo "📊 View profiles at: http://localhost:4040"
echo ""

npm run build && node build/index.js
