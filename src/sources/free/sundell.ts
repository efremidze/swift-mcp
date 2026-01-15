// src/sources/free/sundell.ts

import Parser from 'rss-parser';
import { rssCache } from '../../utils/cache.js';
import { SearchIndex, combineScores } from '../../utils/search.js';

const CACHE_TTL = 3600; // 1 hour for RSS feeds

export interface SundellPattern {
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

export class SundellSource {
  private parser = new Parser();
  private feedUrl = 'https://www.swiftbysundell.com/feed.rss';
  
  async fetchPatterns(): Promise<SundellPattern[]> {
    try {
      // Use cached patterns if available
      const cacheKey = 'sundell-patterns';
      const cached = await rssCache.get<SundellPattern[]>(cacheKey);
      if (cached) {
        return cached;
      }

      const feed = await this.parser.parseURL(this.feedUrl);

      const patterns = feed.items.map(item => {
        const content = item.content || item.contentSnippet || '';
        const text = `${item.title} ${content}`.toLowerCase();

        // Detect topics
        const topics = this.detectTopics(text);

        // Detect code presence first (needed for relevance)
        const hasCode = this.hasCodeContent(content);

        // Calculate relevance for iOS development
        const relevanceScore = this.calculateRelevance(text, hasCode);
        
        return {
          id: `sundell-${item.guid || item.link}`,
          title: item.title || '',
          url: item.link || '',
          publishDate: item.pubDate || '',
          excerpt: (item.contentSnippet || '').substring(0, 300),
          content: content,
          topics,
          relevanceScore,
          hasCode,
        };
      });

      // Cache the results
      await rssCache.set(cacheKey, patterns, CACHE_TTL);
      return patterns;
    } catch (error) {
      console.error('Failed to fetch Sundell content:', error);
      return [];
    }
  }
  
  private detectTopics(text: string): string[] {
    const topicKeywords: Record<string, string[]> = {
      'testing': ['test', 'unittest', 'xctest', 'mock'],
      'networking': ['network', 'urlsession', 'api', 'http'],
      'architecture': ['architecture', 'mvvm', 'viper', 'coordinator'],
      'swiftui': ['swiftui', 'view', 'state', 'binding'],
      'concurrency': ['async', 'await', 'actor', 'task', 'thread'],
      'protocols': ['protocol', 'generic', 'associated type'],
      'performance': ['performance', 'optimization', 'memory', 'speed'],
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
    // Base score: Sundell is a known high-quality source
    let score = 50;

    // Content quality signals
    const qualitySignals = {
      // Technical depth
      'how to': 5,
      'step by step': 5,
      'tutorial': 5,
      'guide': 4,
      'example': 4,
      'pattern': 6,
      'best practice': 8,
      'tip': 3,

      // Advanced topics
      'architecture': 8,
      'testing': 7,
      'performance': 7,
      'concurrency': 7,
      'async': 6,
      'await': 6,
      'actor': 6,
      'protocol': 5,
      'generic': 5,

      // Frameworks
      'swiftui': 6,
      'combine': 6,
      'uikit': 5,
      'foundation': 4,
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
  
  async searchPatterns(query: string): Promise<SundellPattern[]> {
    const patterns = await this.fetchPatterns();

    // Use advanced search with fuzzy matching, TF-IDF, and stemming
    const searchIndex = new SearchIndex<SundellPattern>(['title', 'content', 'topics']);
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

export default SundellSource;
