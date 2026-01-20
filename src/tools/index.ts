// src/tools/index.ts - Barrel export for tool handlers

export * from './types.js';
export * from './registry.js';

// Register handlers on import
import { registerHandler } from './registry.js';
import { getSwiftPatternHandler } from './handlers/getSwiftPattern.js';
import { searchSwiftContentHandler } from './handlers/searchSwiftContent.js';
import { listContentSourcesHandler } from './handlers/listContentSources.js';
import { enableSourceHandler } from './handlers/enableSource.js';
import { setupPatreonHandler } from './handlers/setupPatreon.js';
import { getPatreonPatternsHandler } from './handlers/getPatreonPatterns.js';

registerHandler('get_swift_pattern', getSwiftPatternHandler);
registerHandler('search_swift_content', searchSwiftContentHandler);
registerHandler('list_content_sources', listContentSourcesHandler);
registerHandler('enable_source', enableSourceHandler);
registerHandler('setup_patreon', setupPatreonHandler);
registerHandler('get_patreon_patterns', getPatreonPatternsHandler);
