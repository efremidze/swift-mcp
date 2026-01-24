---
name: swift-patterns-mcp-expert
description: Use swift-patterns-mcp MCP tools to find, summarize, and apply curated Swift/SwiftUI/iOS best practices and real-world patterns. Use for searching patterns, comparing approaches, extracting code guidance, and turning patterns into actionable implementations.
---

# swift-patterns-mcp Expert Skill

## Overview

This skill helps you use the **swift-patterns-mcp** MCP server as a high-signal reference layer for Swift, SwiftUI, and iOS engineering best practices.

Use it when you want to:
- Find proven patterns (state management, navigation, architecture, concurrency, testing, etc.)
- Quickly search trusted sources and curated excerpts
- Convert retrieved patterns into clean, production-quality Swift/SwiftUI code
- Compare multiple approaches and explain tradeoffs

This skill assumes the MCP server is available and configured in the agent environment.

---

## Best Use Cases

### 1) “Find me a pattern”
Example prompts:
- “Find the best SwiftUI pattern for navigation + deep links.”
- “What’s a clean approach for caching in Swift Concurrency?”
- “Show best practices for structuring a modular iOS app.”

### 2) “Review my code using proven patterns”
Example prompts:
- “Review this ViewModel for concurrency and state correctness.”
- “Is this dependency injection approach clean and testable?”

### 3) “Generate implementation from patterns”
Example prompts:
- “Use patterns from swift-patterns-mcp to implement this feature.”
- “Give me a SwiftUI skeleton following best practices.”

---

## Workflow

### Step 1 — Identify the user goal
Classify the request:
- **Search:** user needs references / examples
- **Explain:** user wants understanding + tradeoffs
- **Implement:** user wants code
- **Review:** user has code, wants critique and improvements

### Step 2 — Search the MCP server first
Prefer querying curated patterns before relying on generic memory.

Use searches like:
- Search by topic: “state”, “navigation”, “async/await”, “testing”, “architecture”
- Search by keyword: “Observable”, “Task cancellation”, “actor isolation”, “dependency injection”
- Search by intent: “best practices”, “pattern”, “anti-pattern”, “tradeoffs”

### Step 3 — Choose the best result(s)
When multiple patterns appear:
- Prefer modern Swift / SwiftUI APIs
- Prefer practical production constraints (testability, clarity, maintainability)
- Prefer patterns that match the user’s platform constraints (iOS version, UIKit vs SwiftUI)

### Step 4 — Apply the pattern (don’t just quote it)
Turn retrieved content into:
- a recommended approach
- short reasoning + tradeoffs
- an implementation example

### Step 5 — Keep responses structured and scannable
Use this format:
1. ✅ Recommendation (1–2 sentences)
2. Why (3–5 bullets)
3. Implementation (code)
4. Alternatives (if relevant)
5. Pitfalls / gotchas

---

## Output Rules

- Prefer concise, production-ready code examples.
- Avoid dumping many long excerpts; summarize and apply instead.
- When giving SwiftUI code:
  - Keep view bodies simple
  - Move logic into testable helpers/models
  - Be explicit about ownership (`@State` vs injected state)
- Always call out tradeoffs when relevant (performance vs complexity, safety vs flexibility).

---

## Common “Pattern Types” to Retrieve

When searching swift-patterns-mcp, prioritize these categories:

### Swift Concurrency
- `async/await`
- cancellation + structured concurrency
- actors + isolation
- `Task {}` vs `.task {}` usage

### SwiftUI Architecture
- state ownership rules
- unidirectional data flow
- view composition and extraction
- navigation patterns

### Testing
- protocol-based mocking
- dependency injection
- unit testable design

### Code Quality
- naming conventions
- avoid massive view models
- avoid “god objects”
- separation of concerns without over-architecting

---

## Quick Prompts (for the agent)

Use these when interacting with the MCP tools:

- “Search swift-patterns-mcp for: <topic>”
- “Return 3 best patterns for: <problem>”
- “Summarize + provide implementation guidance for: <pattern>”
- “Compare 2 approaches and recommend one for: <constraints>”
- “Review this code against retrieved patterns and refactor it”

---

## Success Criteria Checklist

Before responding, confirm:
- [ ] I used swift-patterns-mcp results (when appropriate)
- [ ] I recommended a specific approach
- [ ] I explained tradeoffs
- [ ] I included an actionable implementation or next steps
- [ ] I avoided unnecessary verbosity
