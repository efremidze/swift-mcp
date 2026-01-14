// src/sources/free/sundell.ts

import { Item } from 'rss-parser';
import { BaseRSSSource, RSSPattern } from './base-rss-source.js';

export interface SundellPattern extends RSSPattern {}

export class SundellSource extends BaseRSSSource<SundellPattern> {
  protected feedUrl = 'https://www.swiftbysundell.com/feed.xml';
  
  protected transformItem(item: Item): SundellPattern {
    const content = item.content || item.contentSnippet || '';
    const text = `${item.title} ${content}`.toLowerCase();
    
    // Detect topics
    const topics = this.detectTopics(text);
    
    // Calculate relevance for iOS development
    const relevanceScore = this.calculateRelevance(text);
    
    // Detect code presence
    const hasCode = this.hasCodeContent(content);
    
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
  
  private calculateRelevance(text: string): number {
    let score = 0;
    
    // High-value keywords
    const keywords = {
      'swift': 10,
      'swiftui': 10,
      'ios': 8,
      'testing': 7,
      'architecture': 7,
      'pattern': 6,
      'best practice': 8,
      'tutorial': 5,
      'example': 4,
    };
    
    for (const [keyword, points] of Object.entries(keywords)) {
      if (text.includes(keyword)) {
        score += points;
      }
    }
    
    return Math.min(100, score);
  }
}

export default SundellSource;
