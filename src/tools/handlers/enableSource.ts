// src/tools/handlers/enableSource.ts

import type { ToolHandler } from '../types.js';
import { createTextResponse } from '../../utils/response-helpers.js';

export const enableSourceHandler: ToolHandler = async (args, context) => {
  const sourceId = args?.source as string;
  const source = context.sourceManager.getSource(sourceId);

  if (!source) {
    return createTextResponse(`Unknown source: "${sourceId}"

Available sources:
${context.sourceManager.getAllSources().map(s => `- ${s.id}: ${s.name}`).join('\n')}`);
  }

  if (source.requiresAuth && !context.sourceManager.isSourceConfigured(sourceId)) {
    return createTextResponse(`⚙️ ${source.name} requires setup first.

Run: swift-patterns-mcp setup --${sourceId}

This will guide you through:
${sourceId === 'patreon' ? '- Patreon OAuth authentication\n- Connecting your subscriptions' : '- Authentication setup'}`);
  }

  context.sourceManager.enableSource(sourceId);

  return createTextResponse(`✅ ${source.name} enabled!

You can now use patterns from this source.`);
};
