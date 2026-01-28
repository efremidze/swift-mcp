// src/utils/profiler.ts
// Pyroscope profiler setup for local debugging

import Pyroscope from '@pyroscope/nodejs';

let initialized = false;

/**
 * Initialize Pyroscope profiler for local debugging
 * Enable by setting PYROSCOPE_ENABLED=true environment variable
 */
export function initProfiler(): void {
  if (initialized) return;
  
  // Only enable if explicitly requested via env var
  const enabled = process.env.PYROSCOPE_ENABLED === 'true';
  if (!enabled) return;

  const serverUrl = process.env.PYROSCOPE_SERVER_URL || 'http://localhost:4040';
  const appName = process.env.PYROSCOPE_APP_NAME || 'swift-patterns-mcp';

  try {
    Pyroscope.init({
      serverAddress: serverUrl,
      appName: appName,
      tags: {
        env: process.env.NODE_ENV || 'development',
      },
    });

    initialized = true;
    console.log(`[Pyroscope] Profiling enabled - ${serverUrl}`);
  } catch (error) {
    console.error('[Pyroscope] Failed to initialize:', error);
  }
}

/**
 * Stop profiling (called on graceful shutdown)
 */
export function stopProfiler(): void {
  if (!initialized) return;
  
  try {
    Pyroscope.stop();
    console.log('[Pyroscope] Profiling stopped');
  } catch (error) {
    console.error('[Pyroscope] Failed to stop:', error);
  }
}
