# Swift Patterns MCP - Intent Cache

## What This Is

An MCP server that provides curated Swift/SwiftUI best practices and patterns from multiple content sources (Swift by Sundell, Antoine van der Lee, Point-Free, Patreon creators). This milestone adds intent-aware response caching to eliminate redundant processing for identical queries.

## Core Value

Return high-quality Swift patterns fast. If the same query hits with the same enabled sources, serve it from cache.

## Requirements

### Validated

- ✓ MCP server exposing tools to Claude/AI assistants — existing
- ✓ Free RSS-based sources (Sundell, VanderLee, NilCoalescing, PointFree) — existing
- ✓ Premium Patreon source with OAuth — existing
- ✓ YouTube metadata integration — existing
- ✓ Topic detection and relevance scoring — existing
- ✓ Full-text search with fuzzy matching — existing
- ✓ Two-tier caching (memory LRU + file) for RSS/articles — existing
- ✓ Source enable/disable management — existing

### Active

- [ ] Intent-aware response cache for tool handlers
- [ ] Query normalization (lowercase, trim, stopwords)
- [ ] SHA-256 hashed cache keys
- [ ] Cache stores pattern metadata only (IDs, scores, ordering)
- [ ] minQuality included in cache key
- [ ] Source config changes invalidate affected entries only
- [ ] Integration with getSwiftPattern and searchSwiftContent handlers

### Out of Scope

- Caching raw article content — already handled by articleCache
- Caching LLM-generated text — no LLM text in this system
- New external dependencies — use built-in crypto + existing FileCache
- Redis or external cache infrastructure — file-based is sufficient

## Context

The codebase already has a robust `FileCache` class in `src/utils/cache.ts` with:
- Memory LRU with configurable max entries
- File persistence with TTL-based expiration
- Automatic cleanup on startup
- `getOrFetch()` pattern for cache-miss handling

Current flow: Each tool call re-fetches patterns from sources, re-analyzes them, re-scores them. With intent caching, identical requests (same tool + normalized query + sources + quality threshold) return instantly.

Key files:
- `src/utils/cache.ts` — FileCache infrastructure
- `src/tools/handlers/getSwiftPattern.ts` — first integration point
- `src/tools/handlers/searchSwiftContent.ts` — second integration point
- `src/config/swift-keywords.ts` — STOPWORDS already defined

## Constraints

- **Dependencies**: Built-in only (crypto). No new npm packages.
- **TTL**: 6-24 hours for intent cache (longer than RSS cache)
- **Cache content**: Pattern metadata only — never raw articles
- **Invalidation**: Source enable/disable must clear affected entries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Include minQuality in cache key | Different quality thresholds = different result sets | — Pending |
| Selective invalidation on source change | Full invalidation too aggressive, natural expiry too slow | — Pending |
| Use existing FileCache | No new infra, proven patterns, memory+file tiers | — Pending |

---
*Last updated: 2026-01-20 after initialization*
