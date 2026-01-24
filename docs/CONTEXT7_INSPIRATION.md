# Context7 Inspiration Review

This document summarizes selected ideas from the Context7 MCP server that could inform improvements to **swift-patterns-mcp**. It focuses on four areas requested: data model, indexing approach, API surface, and UX docs. Each section lists a **Context7 observation** and a **Concrete improvement for swift-patterns-mcp**.

## Data Model

**Context7 observation**
- Search results return a concise library record with identifiers, description, snippet counts, trust/benchmark scores, and available versions. This makes the results self-describing and lets clients choose a specific version. The API also returns structured snippets with title/content/source metadata.

**Concrete improvement for swift-patterns-mcp**
- Define a first-class "pattern" record that includes `id`, `title`, `summary`, `source`, `tags`, `qualityScore`, `updatedAt`, and `version` (if applicable). This would unlock richer filtering and consistent output across sources.
- Surface optional quality or freshness signals (e.g., `qualityScore`, `lastIndexedAt`) in search responses so clients can explain *why* a result was selected.
- Add a lightweight metadata-only response mode for fast UI previews before fetching full examples.

## Indexing & Ingestion

**Context7 observation**
- Context7 documents how indexing is controlled via a `context7.json` file with include/exclude folders, rules, and version pinning. The workflow supports both a quick submission path and an advanced configuration path for owners.

**Concrete improvement for swift-patterns-mcp**
- Add a `swift-patterns.json` configuration concept that mirrors include/exclude patterns and optional rules. For RSS or API sources, expose per-source filters (e.g., tag allowlist/denylist, minimum word count, required code block count).
- Implement default exclusions to skip non-technical or outdated content (e.g., “archive”, “legacy”, “deprecated”).
- Introduce a per-source versioning strategy (for example, tying patterns to Swift/SwiftUI versions or article “last updated” dates), so search can optionally filter by version.

## API Surface

**Context7 observation**
- The API is minimal and clear: search for a library, then fetch context by library ID. There is also a text response mode for direct prompt insertion and well-documented error codes.

**Concrete improvement for swift-patterns-mcp**
- Provide a two-step flow: `searchPatterns(query)` returning compact results, followed by `getPatternContext(id, format)` returning full text or JSON. This creates a stable interface for tool integrations and avoids long responses when not needed.
- Support `format=txt` responses to make it easy for MCP clients to insert results into prompts without extra formatting logic.
- Document error codes (e.g., 404 for missing pattern, 429 for rate limits) and include `retryAfter` hints for better client behavior.

## UX & Documentation

**Context7 observation**
- The README is installation-first with "add a rule" guidance to auto-invoke the server, plus multi-client setup snippets and a clear explanation of the "use context7" workflow.

**Concrete improvement for swift-patterns-mcp**
- Add a dedicated “Auto-invoke rule” section in the README showing rules for Cursor/Claude/Windsurf. This reduces friction for end users.
- Provide a short “How to ask” section with example prompts tied to patterns and filters (e.g., “Show Swift concurrency patterns for actors”).
- Include a “content freshness” note to clarify how often sources are refreshed and how to force refreshes.

## Suggested Next Steps

1. Align the existing search output with a more explicit pattern record shape (as described in **Data Model**).
2. Add a configuration file format that lets source owners define inclusion rules and per-source filters.
3. Update the README to include auto-invocation rules and a simple two-step API/tool usage example.

---

**Reference**: Context7 repository and documentation were reviewed for these patterns. (https://github.com/upstash/context7)
