// src/tools/handlers/getPatreonPatterns.ts

import type { ToolHandler, PatreonPattern } from '../types.js';
import { createTextResponse } from '../../utils/response-helpers.js';

export const getPatreonPatternsHandler: ToolHandler = async (args, context) => {
  if (!context.sourceManager.isSourceConfigured('patreon')) {
    return createTextResponse(`Patreon not configured.

Set it up with: swift-patterns-mcp setup --patreon`);
  }

  if (!context.patreonSource) {
    return createTextResponse(`Patreon module not available. Check your installation.`);
  }

  const topic = args?.topic as string | undefined;
  const requireCode = args?.requireCode as boolean | undefined;

  const patreon = new context.patreonSource();
  let patterns: PatreonPattern[] = topic
    ? await patreon.searchPatterns(topic)
    : await patreon.fetchPatterns();

  if (requireCode) {
    patterns = patterns.filter(p => p.hasCode);
  }

  if (patterns.length === 0) {
    return createTextResponse(`No Patreon patterns found${topic ? ` for "${topic}"` : ''}${requireCode ? ' with code' : ''}.`);
  }

  const formatted = patterns.slice(0, 10).map(p => `
## ${p.title}
**Creator**: ${p.creator}
**Date**: ${new Date(p.publishDate).toLocaleDateString()}
${p.hasCode ? '**Has Code**: Yes' : ''}
**Topics**: ${p.topics.length > 0 ? p.topics.join(', ') : 'General'}

${p.excerpt}...

**[Read full post](${p.url})**
`).join('\n---\n');

  return createTextResponse(`# Patreon Patterns${topic ? `: ${topic}` : ''}

Found ${patterns.length} posts from your subscriptions:

${formatted}

${patterns.length > 10 ? `\n*Showing top 10 of ${patterns.length} results*` : ''}`);
};
