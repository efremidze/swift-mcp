// src/sources/free/vanderlee.ts

import Parser from 'rss-parser';
import { rssCache, articleCache } from '../../utils/cache.js';
import { SearchIndex, combineScores } from '../../utils/search.js';

const RSS_CACHE_TTL = 3600; // 1 hour for RSS feeds
const ARTICLE_CACHE_TTL = 86400; // 24 hours for full articles

export interface VanderLeePattern {
  id: string;
  title: string;
  url: string;
  publishDate: string;
  excerpt: string;
  content: string;
  topics: string[];
  relevanceScore: number;
  hasCode: boolean;
}

export class VanderLeeSource {
  private parser = new Parser();
  private feedUrl = 'https://www.avanderlee.com/feed/';

  async fetchPatterns(): Promise<VanderLeePattern[]> {
    try {
      // Use cached patterns if available
      const cacheKey = 'vanderlee-patterns';
      const cached = await rssCache.get<VanderLeePattern[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const feed = await this.parser.parseURL(this.feedUrl);

      // Fetch full content for all articles in parallel
      const patterns = await Promise.all(
        feed.items.map(item => this.processArticle(item))
      );

      // Cache the results
      await rssCache.set(cacheKey, patterns, RSS_CACHE_TTL);
      return patterns;
    } catch (error) {
      console.error('Failed to fetch van der Lee content:', error);
      return [];
    }
  }

  private async processArticle(item: Parser.Item): Promise<VanderLeePattern> {
    const rssContent = item.content || item.contentSnippet || '';
    const url = item.link || '';

    // Try to fetch full article content
    let fullContent = rssContent;
    try {
      if (url) {
        fullContent = await this.fetchArticleContent(url);
      }
    } catch {
      // Fall back to RSS content if fetch fails
      fullContent = rssContent;
    }

    const text = `${item.title} ${fullContent}`.toLowerCase();
    const topics = this.detectTopics(text);
    const hasCode = this.hasCodeContent(fullContent);
    const relevanceScore = this.calculateRelevance(text, hasCode);

    return {
      id: `vanderlee-${item.guid || item.link}`,
      title: item.title || '',
      url,
      publishDate: item.pubDate || '',
      excerpt: (item.contentSnippet || '').substring(0, 300),
      content: fullContent,
      topics,
      relevanceScore,
      hasCode,
    };
  }

  private async fetchArticleContent(url: string): Promise<string> {
    // Check article cache first
    const cached = await articleCache.get<string>(url);
    if (cached) {
      return cached;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'swift-mcp/1.0 (RSS Reader)',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const content = this.extractPostContent(html);

      // Cache the extracted content
      await articleCache.set(url, content, ARTICLE_CACHE_TTL);
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  private extractPostContent(html: string): string {
    // Extract content from post-content div
    const postContentMatch = html.match(/<div[^>]*class="[^"]*post-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<div/i);
    if (postContentMatch) {
      return this.stripHtml(postContentMatch[1]);
    }

    // Fallback: extract from article tag
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      return this.stripHtml(articleMatch[1]);
    }

    return '';
  }

  private stripHtml(html: string): string {
    // Keep code blocks intact for detection, remove other HTML
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      // Keep pre/code tags for code detection
      .replace(/<(?!pre|code|\/pre|\/code)[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private detectTopics(text: string): string[] {
    const topicKeywords: Record<string, string[]> = {
      'debugging': ['debug', 'breakpoint', 'lldb', 'xcode'],
      'performance': ['performance', 'memory', 'leak', 'optimization'],
      'swiftui': ['swiftui', 'view', 'state', 'binding'],
      'combine': ['combine', 'publisher', 'subscriber'],
      'concurrency': ['async', 'await', 'actor', 'task'],
      'testing': ['test', 'xctest', 'mock'],
      'tooling': ['xcode', 'git', 'ci', 'fastlane'],
    };

    const detected: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        detected.push(topic);
      }
    }

    return detected;
  }

  private calculateRelevance(text: string, hasCode: boolean): number {
    // Base score: van der Lee is a known high-quality source
    let score = 50;

    // Content quality signals
    const qualitySignals = {
      // Technical depth
      'how to': 5,
      'step by step': 5,
      'tutorial': 5,
      'guide': 4,
      'example': 4,
      'tip': 3,
      'fix': 4,
      'solve': 4,

      // Performance & debugging (van der Lee specialties)
      'performance': 8,
      'memory': 7,
      'debugging': 7,
      'leak': 6,
      'optimization': 7,
      'profiling': 6,

      // Advanced topics
      'concurrency': 7,
      'async': 6,
      'await': 6,
      'combine': 6,

      // Frameworks & tools
      'swiftui': 6,
      'xcode': 5,
      'instruments': 6,
      'ci': 4,
      'fastlane': 4,
    };

    for (const [keyword, points] of Object.entries(qualitySignals)) {
      if (text.includes(keyword)) {
        score += points;
      }
    }

    // Bonus for code examples
    if (hasCode) {
      score += 10;
    }

    return Math.min(100, score);
  }

  private hasCodeContent(content: string): boolean {
    // HTML code tags
    if (content.includes('<code>') || content.includes('<pre>')) {
      return true;
    }

    // Markdown code blocks
    if (content.includes('```')) {
      return true;
    }

    // Swift declarations
    if (/\b(func|class|struct|protocol|extension|enum|actor)\s+\w+/.test(content)) {
      return true;
    }

    // Swift keywords that indicate code
    const codeIndicators = [
      /\blet\s+\w+\s*[=:]/, // let x = or let x:
      /\bvar\s+\w+\s*[=:]/, // var x = or var x:
      /\breturn\s+\w+/,     // return value
      /\bguard\s+let/,      // guard let
      /\bif\s+let/,         // if let
      /\basync\s+(func|let|var|throws)/, // async patterns
      /\bawait\s+\w+/,      // await calls
      /\b\w+\s*\(\s*\)\s*->\s*\w+/, // function signatures
      /@\w+\s+(struct|class|func|var)/, // property wrappers
    ];

    return codeIndicators.some(pattern => pattern.test(content));
  }

  async searchPatterns(query: string): Promise<VanderLeePattern[]> {
    const patterns = await this.fetchPatterns();

    // Use advanced search with fuzzy matching, TF-IDF, and stemming
    const searchIndex = new SearchIndex<VanderLeePattern>(['title', 'content', 'topics']);
    searchIndex.addDocuments(patterns);

    const results = searchIndex.search(query, {
      fuzzy: 0.2,  // Allow ~20% character difference for typo tolerance
      boost: { title: 2.5, topics: 1.8, content: 1 },
    });

    // Combine search relevance with static relevance scores
    // Sort by combined score
    return results
      .map(result => ({
        ...result.item,
        relevanceScore: combineScores(result.score, result.item.relevanceScore),
      }))
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
}

export default VanderLeeSource;
