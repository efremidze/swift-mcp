# swift-mcp

> Curated Swift/SwiftUI patterns from top iOS developers

An MCP server that brings best practices from leading iOS developers directly to your AI assistant.

## 🌟 Features

### Always Available (Free)
- ✅ Swift by Sundell articles
- ✅ Antoine van der Lee tutorials  
- ✅ Point-Free open source

### Optional (Premium)
- 🔐 **Patreon Integration** - Access content from creators you support
- 🔐 **GitHub Sponsors** (Coming soon)

## 🚀 Quick Start
```bash
# Install
npm install -g swift-mcp

# Basic setup (free sources)
swift-mcp setup

# Optional: Add Patreon
swift-mcp setup --patreon
```

## 📚 Content Sources

### Free Sources
Always enabled, no authentication needed:

| Source | Content Type | Update Frequency |
|--------|--------------|------------------|
| Swift by Sundell | Articles, patterns | Weekly |
| Antoine van der Lee | Tutorials, tips | Weekly |
| Point-Free | OSS repos | On release |

### Premium Sources
Optional, requires authentication:

| Source | What You Get | Setup |
|--------|--------------|-------|
| Patreon | Your subscriptions | OAuth |
| GitHub Sponsors* | Your sponsors | OAuth |

*Coming soon

## 💡 Example Usage
```typescript
// Basic (free sources)
"Show me SwiftUI animation patterns"
→ Returns from Sundell, van der Lee, Kavsoft

// With Patreon enabled
"Show me advanced SwiftUI patterns from my Patreon"
→ Returns from your Patreon subscriptions + free sources

// Specific source
"What does Sundell say about testing?"
→ Returns only from Swift by Sundell
```

## 🔧 Configuration
```bash
# ~/.swift-mcp/config.json
{
  "sources": {
    "sundell": { "enabled": true },
    "vanderlee": { "enabled": true },
    "pointfree": { "enabled": true },
    "patreon": { "enabled": false }  // Optional
  }
}
```

## ⚙️ Enable/Disable Sources
```bash
# Enable Patreon
swift-mcp source enable patreon

# Disable a source
swift-mcp source disable kavsoft

# List sources
swift-mcp source list
```
