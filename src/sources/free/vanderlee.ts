// src/sources/free/vanderlee.ts

import Parser from 'rss-parser';

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
      const feed = await this.parser.parseURL(this.feedUrl);
      
      return feed.items.map(item => {
        const content = item.content || item.contentSnippet || '';
        const text = `${item.title} ${content}`.toLowerCase();

        const topics = this.detectTopics(text);

        // Detect code presence first (needed for relevance)
        const hasCode = this.hasCodeContent(content);

        // Calculate relevance
        const relevanceScore = this.calculateRelevance(text, hasCode);
        
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
      });
    } catch (error) {
      console.error('Failed to fetch van der Lee content:', error);
      return [];
    }
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
    const lowerQuery = query.toLowerCase();
    
    return patterns.filter(p =>
      p.title.toLowerCase().includes(lowerQuery) ||
      p.content.toLowerCase().includes(lowerQuery) ||
      p.topics.some(t => t.includes(lowerQuery))
    );
  }
}

export default VanderLeeSource;
