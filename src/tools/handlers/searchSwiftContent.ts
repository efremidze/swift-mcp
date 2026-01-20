// src/tools/handlers/searchSwiftContent.ts

import type { ToolHandler } from '../types.js';
import { searchMultipleSources } from '../../utils/source-registry.js';
import { formatSearchPatterns } from '../../utils/pattern-formatter.js';
import { createTextResponse } from '../../utils/response-helpers.js';

export const searchSwiftContentHandler: ToolHandler = async (args) => {
  const query = args?.query as string;
  const requireCode = args?.requireCode as boolean;

  if (!query) {
    return createTextResponse(`Missing required argument: query

Usage: search_swift_content({ query: "async await" })`);
  }

  // Search all free sources in parallel
  const results = await searchMultipleSources(query);

  // Filter by code if requested
  const filtered = requireCode
    ? results.filter(r => r.hasCode)
    : results;

  if (filtered.length === 0) {
    return createTextResponse(`No results found for "${query}"${requireCode ? ' with code examples' : ''}.`);
  }

  // Format using shared utility
  const formatted = formatSearchPatterns(filtered, query, {
    maxResults: 10,
    includeCode: true,
    excerptLength: 200,
  });

  return createTextResponse(formatted);
};
