// src/tools/handlers/getSwiftPattern.ts

import type { ToolHandler } from '../types.js';
import { getSources, type FreeSourceName } from '../../utils/source-registry.js';
import { formatTopicPatterns } from '../../utils/pattern-formatter.js';

export const getSwiftPatternHandler: ToolHandler = async (args, context) => {
  const topic = args?.topic as string;

  if (!topic) {
    return {
      content: [{
        type: "text",
        text: `Missing required argument: topic

Usage: get_swift_pattern({ topic: "swiftui" })

Example topics:
- swiftui, concurrency, testing, networking
- performance, architecture, protocols
- async-await, combine, coredata`,
      }],
    };
  }

  const source = (args?.source as string) || "all";
  const minQuality = (args?.minQuality as number) || 60;

  // Get sources based on request
  const sources = getSources(source as FreeSourceName | 'all');
  
  // Search all requested sources in parallel
  const allResults = await Promise.all(
    sources.map(s => s.searchPatterns(topic))
  );
  
  // Filter by quality and flatten
  const results = allResults
    .flat()
    .filter(p => p.relevanceScore >= minQuality);

  if (results.length === 0) {
    return {
      content: [{
        type: "text",
        text: `No patterns found for "${topic}" with quality ≥ ${minQuality}.

Try:
- Broader search terms
- Lower minQuality
- Different topic

Available sources: Swift by Sundell, Antoine van der Lee, Nil Coalescing, Point-Free
${context.sourceManager.isSourceConfigured('patreon') ? '\n💡 Enable Patreon for more premium content!' : ''}`,
      }],
    };
  }

  // Sort by relevance
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Format using shared utility
  const formatted = formatTopicPatterns(results, topic, {
    maxResults: 10,
    includeQuality: true,
    includeTopics: true,
    includeCode: true,
    excerptLength: 300,
  });

  return {
    content: [{
      type: "text",
      text: formatted,
    }],
  };
};
