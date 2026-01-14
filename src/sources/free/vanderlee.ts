// src/sources/free/vanderlee.ts

import { Item } from 'rss-parser';
import { BaseRSSSource, RSSPattern } from './base-rss-source.js';

export interface VanderLeePattern extends RSSPattern {}

export class VanderLeeSource extends BaseRSSSource<VanderLeePattern> {
  protected feedUrl = 'https://www.avanderlee.com/feed/';
  
  protected transformItem(item: Item): VanderLeePattern {
    const content = item.content || item.contentSnippet || '';
    const text = `${item.title} ${content}`.toLowerCase();
    
    const topics = this.detectTopics(text);
    const relevanceScore = this.calculateRelevance(text);
    const hasCode = this.hasCodeContent(content);
    
    return {
      id: `vanderlee-${item.guid || item.link}`,
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
  
  private calculateRelevance(text: string): number {
    let score = 0;
    
    const keywords = {
      'swift': 10,
      'swiftui': 10,
      'ios': 8,
      'performance': 8,
      'memory': 7,
      'debugging': 7,
      'xcode': 6,
      'practical': 7,
      'tips': 5,
    };
    
    for (const [keyword, points] of Object.entries(keywords)) {
      if (text.includes(keyword)) {
        score += points;
      }
    }
    
    return Math.min(100, score);
  }
}

export default VanderLeeSource;
