# Profiling with Pyroscope

This project includes Pyroscope integration for continuous profiling during local development.

## Quick Start

### 1. Start Pyroscope Server

**Using Docker (Recommended):**
```bash
docker run -d -p 4040:4040 pyroscope/pyroscope:latest server
```

**Using Homebrew (macOS):**
```bash
brew install pyroscope-io/brew/pyroscope
pyroscope server
```

### 2. Run with Profiling

```bash
npm run profile
```

Or manually:
```bash
export PYROSCOPE_ENABLED=true
npm run build && node build/index.js
```

### 3. View Profiles

Open http://localhost:4040 in your browser to view the profiling UI.

## Configuration

Environment variables (add to `.env`):

```env
# Enable profiling
PYROSCOPE_ENABLED=true

# Pyroscope server URL (default: http://localhost:4040)
PYROSCOPE_SERVER_URL=http://localhost:4040

# Application name in Pyroscope UI (default: swift-patterns-mcp)
PYROSCOPE_APP_NAME=swift-patterns-mcp
```

## What Gets Profiled

- **CPU Usage**: Function execution time
- **Heap Allocations**: Memory allocation patterns
- **Sample Rate**: 100% (all samples captured)

## Use Cases

### Performance Testing
Profile your code while running tests or handling requests:
```bash
PYROSCOPE_ENABLED=true npm test
```

### Memory Leak Detection
Monitor heap allocations over time to identify memory leaks.

### Bottleneck Identification
Identify which functions consume the most CPU time.

## Viewing Results

In the Pyroscope UI (http://localhost:4040):

1. **Flame Graph**: Visual representation of CPU usage
2. **Timeline**: See performance over time
3. **Comparison**: Compare different time ranges
4. **Tags**: Filter by environment or other tags

## Disabling

Profiling is **disabled by default**. It only runs when:
- `PYROSCOPE_ENABLED=true` is set
- Pyroscope server is running

To disable, simply unset the variable or set it to `false`:
```bash
export PYROSCOPE_ENABLED=false
```

## Production

Profiling is designed for local development only. In production:
- Keep `PYROSCOPE_ENABLED=false` (or unset)
- The profiler will not initialize
- No performance overhead

## Troubleshooting

### Port Already in Use
If port 4040 is taken, configure a different port:
```bash
# Start Pyroscope on different port
docker run -p 4041:4040 pyroscope/pyroscope:latest server

# Update env variable
export PYROSCOPE_SERVER_URL=http://localhost:4041
```

### No Data Showing
1. Verify Pyroscope server is running: `curl http://localhost:4040/healthz`
2. Check profiler initialized: Look for `[Pyroscope] Profiling enabled` in logs
3. Run some operations to generate profile data
4. Refresh the Pyroscope UI

### TypeScript Errors
If you get type errors, ensure `@pyroscope/nodejs` is installed:
```bash
npm install -D @pyroscope/nodejs
```

## Learn More

- [Pyroscope Documentation](https://pyroscope.io/docs/)
- [Node.js Integration Guide](https://pyroscope.io/docs/integration-nodejs/)
