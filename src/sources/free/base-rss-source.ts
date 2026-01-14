// src/sources/free/base-rss-source.ts

import Parser, { Item } from 'rss-parser';

/**
 * Configuration for RSS source caching
 */
export const RSS_CACHE_CONFIG = {
  DURATION_MS: 5 * 60 * 1000, // 5 minutes
};

/**
 * Base interface for RSS-based patterns
 */
export interface RSSPattern {
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

/**
 * Base class for RSS-based content sources
 * Provides caching and common RSS parsing functionality
 */
export abstract class BaseRSSSource<T extends RSSPattern> {
  protected parser = new Parser();
  protected lastFetchTime: number = 0;
  protected cachedPatterns: T[] | null = null;
  protected abstract feedUrl: string;
  
  /**
   * Fetch patterns with caching to avoid hammering RSS feeds
   */
  async fetchPatterns(): Promise<T[]> {
    const now = Date.now();
    if (this.cachedPatterns && (now - this.lastFetchTime) < RSS_CACHE_CONFIG.DURATION_MS) {
      return this.cachedPatterns;
    }
    
    try {
      const feed = await this.parser.parseURL(this.feedUrl);
      const patterns = feed.items.map((item: Item) => this.transformItem(item));
      
      this.cachedPatterns = patterns;
      this.lastFetchTime = Date.now();
      return patterns;
    } catch (error) {
      console.error(`Failed to fetch content from ${this.feedUrl}:`, error);
      return [];
    }
  }
  
  /**
   * Transform RSS item to pattern - must be implemented by subclasses
   */
  protected abstract transformItem(item: Item): T;
  
  /**
   * Detect if content has code examples
   */
  protected hasCodeContent(content: string): boolean {
    return content.includes('<code>') || 
           content.includes('```') ||
           /\b(func|class|struct|protocol|extension)\s+\w+/.test(content);
  }
  
  /**
   * Search patterns by query
   */
  async searchPatterns(query: string): Promise<T[]> {
    const patterns = await this.fetchPatterns();
    const lowerQuery = query.toLowerCase();
    
    return patterns.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.topics.some(t => t.includes(lowerQuery))
    );
  }
}
