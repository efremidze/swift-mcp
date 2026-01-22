// src/tools/handlers/searchSwiftContent.ts

import type { ToolHandler } from '../types.js';
import { searchMultipleSources, getSourceNames, getSource, type FreeSourceName } from '../../utils/source-registry.js';
import { formatSearchPatterns } from '../../utils/pattern-formatter.js';
import { createTextResponse } from '../../utils/response-helpers.js';
import { intentCache, type IntentKey, type StorableCachedSearchResult } from '../../utils/intent-cache.js';
import type { BasePattern } from '../../sources/free/rssPatternSource.js';
import { SemanticRecallIndex, type SemanticRecallConfig } from '../../utils/semantic-recall.js';
import SourceManager from '../../config/sources.js';

// Module-level singleton for semantic recall index
let semanticIndex: SemanticRecallIndex | null = null;

function getSemanticIndex(config: SemanticRecallConfig): SemanticRecallIndex {
  if (!semanticIndex) {
    semanticIndex = new SemanticRecallIndex(config);
  }
  return semanticIndex;
}

interface SemanticRecallOptions {
  query: string;
  lexicalResults: BasePattern[];
  config: SemanticRecallConfig;
  sourceManager: SourceManager;
  requireCode: boolean;
}

/**
 * Attempt semantic recall to supplement lexical results.
 * Returns additional patterns not in lexicalResults, or empty array on failure.
 * Handles all errors internally - never throws.
 */
async function trySemanticRecall(options: SemanticRecallOptions): Promise<BasePattern[]> {
  const { query, lexicalResults, config, sourceManager, requireCode } = options;

  try {
    // Check if semantic recall should activate
    const maxScore = lexicalResults.length > 0
      ? Math.max(...lexicalResults.map(p => p.relevanceScore)) / 100
      : 0;

    const shouldActivate = lexicalResults.length === 0 || maxScore < config.minLexicalScore;
    if (!shouldActivate) return [];

    // Get/create index and fetch patterns from enabled sources
    const index = getSemanticIndex(config);
    const enabledSources = sourceManager.getEnabledSources();
    const sourceIds = enabledSources.map(s => s.id as FreeSourceName);
    const sources = sourceIds.map(id => getSource(id));

    const fetchResults = await Promise.allSettled(
      sources.map(source => source.fetchPatterns())
    );
    const allPatterns = fetchResults
      .filter((r): r is PromiseFulfilledResult<BasePattern[]> => r.status === 'fulfilled')
      .flatMap(r => r.value);

    await index.index(allPatterns);

    // Search and filter
    const semanticResults = await index.search(query, 5);
    const existingIds = new Set(lexicalResults.map(p => p.id));

    return semanticResults.filter(p =>
      !existingIds.has(p.id) &&
      (!requireCode || p.hasCode) &&
      p.relevanceScore >= config.minRelevanceScore
    );
  } catch {
    // Semantic recall is best-effort; return empty on any failure
    return [];
  }
}

export const searchSwiftContentHandler: ToolHandler = async (args) => {
  const query = args?.query as string;
  const requireCode = args?.requireCode as boolean;

  if (!query) {
    return createTextResponse(`Missing required argument: query

Usage: search_swift_content({ query: "async await" })`);
  }

  // Build intent key for caching
  // This handler always uses 'all' sources and default minQuality of 0
  const intentKey: IntentKey = {
    tool: 'search_swift_content',
    query,
    minQuality: 0,
    sources: getSourceNames('all'),
    requireCode: requireCode || false,
  };

  // Try to get cached result
  const cached = await intentCache.get(intentKey);

  let filtered: BasePattern[];

  // Track whether this was a cache hit (to avoid re-caching)
  let wasCacheHit = false;

  if (cached) {
    // Cache hit - use cached patterns (includes any semantic results from prior search)
    filtered = (cached.patterns as BasePattern[]) || [];
    wasCacheHit = true;
  } else {
    // Cache miss - fetch from sources
    const results = await searchMultipleSources(query);

    // Filter by code if requested
    filtered = requireCode
      ? results.filter(r => r.hasCode)
      : results;
  }

  // Semantic recall: supplement lexical results when enabled and not cached
  const sourceManager = new SourceManager();
  const semanticConfig = sourceManager.getSemanticRecallConfig();

  let finalResults = filtered;

  if (!wasCacheHit && semanticConfig.enabled) {
    const semanticResults = await trySemanticRecall({
      query,
      lexicalResults: filtered,
      config: semanticConfig,
      sourceManager,
      requireCode: requireCode || false,
    });

    if (semanticResults.length > 0) {
      finalResults = [...filtered, ...semanticResults]
        .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
  }

  // Cache final results (after semantic merge) if this was a cache miss
  if (!wasCacheHit && finalResults.length > 0) {
    const cacheData: StorableCachedSearchResult = {
      patternIds: finalResults.map(p => p.id),
      scores: Object.fromEntries(finalResults.map(p => [p.id, p.relevanceScore])),
      totalCount: finalResults.length,
      patterns: finalResults,
    };
    await intentCache.set(intentKey, cacheData);
  }

  if (finalResults.length === 0) {
    return createTextResponse(`No results found for "${query}"${requireCode ? ' with code examples' : ''}.`);
  }

  // Format using shared utility
  const formatted = formatSearchPatterns(finalResults, query, {
    maxResults: 10,
    includeCode: true,
    excerptLength: 200,
  });

  return createTextResponse(formatted);
};
