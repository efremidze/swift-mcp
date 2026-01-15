// src/utils/search.ts
// Advanced search utilities with fuzzy matching, TF-IDF scoring, and stemming

import MiniSearch from 'minisearch';
import natural from 'natural';

// Porter Stemmer for English
const stemmer = natural.PorterStemmer;

// Common stopwords to filter out
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
  'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'must', 'shall', 'can', 'this', 'that', 'these',
  'those', 'it', 'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your',
  'i', 'my', 'me', 'he', 'she', 'him', 'her', 'his', 'who', 'what', 'which',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
  'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only', 'same',
  'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there'
]);

// Swift-specific terms that shouldn't be stemmed (preserve technical accuracy)
const PRESERVE_TERMS = new Set([
  'swift', 'swiftui', 'uikit', 'combine', 'async', 'await', 'actor',
  'struct', 'class', 'enum', 'protocol', 'extension', 'func', 'var', 'let',
  'mvvm', 'viper', 'mvc', 'tca', 'xctest', 'xcode', 'ios', 'macos',
  'watchos', 'tvos', 'ipados', 'appkit', 'foundation', 'coredata',
  'cloudkit', 'urlsession', 'codable', 'observable', 'published',
  'stateobject', 'observedobject', 'environmentobject', 'binding', 'state'
]);

export interface SearchableDocument {
  id: string;
  title: string;
  content: string;
  topics: string[];
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: string[];
}

export interface SearchOptions {
  fuzzy?: number;           // Fuzzy matching threshold (0-1, default 0.2)
  boost?: Record<string, number>;  // Field boosting
  minScore?: number;        // Minimum score threshold
}

// Custom tokenizer with stemming
function tokenize(text: string): string[] {
  const tokens = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')  // Keep hyphens for terms like async-await
    .split(/\s+/)
    .filter(token => token.length > 1 && !STOPWORDS.has(token));

  return tokens.map(token => {
    // Preserve Swift-specific terms
    if (PRESERVE_TERMS.has(token)) {
      return token;
    }
    // Stem other terms
    return stemmer.stem(token);
  });
}

// Process query with same tokenization for consistent matching
function processQuery(query: string): string[] {
  return tokenize(query);
}

export class SearchIndex<T extends SearchableDocument> {
  private miniSearch: MiniSearch<T>;
  private documents: Map<string, T> = new Map();

  constructor(fields: string[] = ['title', 'content', 'topics']) {
    this.miniSearch = new MiniSearch<T>({
      fields,
      storeFields: ['id'],
      tokenize,
      processTerm: (term) => term, // Already processed by tokenize
      searchOptions: {
        boost: { title: 2, topics: 1.5, content: 1 },
        fuzzy: 0.2,
        prefix: true,
      },
    });
  }

  addDocuments(docs: T[]): void {
    // Clear existing documents
    this.miniSearch.removeAll();
    this.documents.clear();

    // Preprocess documents for indexing
    const processedDocs = docs.map(doc => ({
      ...doc,
      // Join topics array for indexing
      topics: Array.isArray(doc.topics) ? doc.topics.join(' ') : doc.topics,
    }));

    // Add to MiniSearch
    this.miniSearch.addAll(processedDocs);

    // Store original documents for retrieval
    docs.forEach(doc => this.documents.set(doc.id, doc));
  }

  search(query: string, options: SearchOptions = {}): SearchResult<T>[] {
    const {
      fuzzy = 0.2,
      boost = { title: 2, topics: 1.5, content: 1 },
      minScore = 0,
    } = options;

    // Get stemmed query terms for match highlighting
    const queryTerms = processQuery(query);

    // Search with MiniSearch
    const results = this.miniSearch.search(query, {
      fuzzy,
      prefix: true,
      boost,
      combineWith: 'OR',
    });

    // Map results to original documents with scores
    return results
      .filter(result => result.score >= minScore)
      .map(result => {
        const doc = this.documents.get(result.id);
        if (!doc) return null;

        // Find which terms matched
        const matches = this.findMatches(doc, queryTerms);

        return {
          item: doc,
          score: result.score,
          matches,
        };
      })
      .filter((r): r is SearchResult<T> => r !== null);
  }

  private findMatches(doc: T, queryTerms: string[]): string[] {
    const matches: string[] = [];
    const searchText = `${doc.title} ${doc.content} ${doc.topics.join(' ')}`.toLowerCase();

    for (const term of queryTerms) {
      // Check both stemmed and original
      if (searchText.includes(term)) {
        matches.push(term);
      }
    }

    return [...new Set(matches)];
  }
}

// Standalone search function for simple use cases
export function fuzzySearch<T extends SearchableDocument>(
  documents: T[],
  query: string,
  options: SearchOptions = {}
): SearchResult<T>[] {
  const index = new SearchIndex<T>();
  index.addDocuments(documents);
  return index.search(query, options);
}

// Calculate TF-IDF score for a term in a document
export function calculateTfIdf(
  term: string,
  document: string,
  corpus: string[]
): number {
  const stemmedTerm = PRESERVE_TERMS.has(term.toLowerCase())
    ? term.toLowerCase()
    : stemmer.stem(term.toLowerCase());

  // Term Frequency: how often term appears in document
  const docTokens = tokenize(document);
  const tf = docTokens.filter(t => t === stemmedTerm).length / docTokens.length;

  // Inverse Document Frequency: how rare is the term across corpus
  const docsWithTerm = corpus.filter(doc =>
    tokenize(doc).includes(stemmedTerm)
  ).length;

  const idf = docsWithTerm > 0
    ? Math.log(corpus.length / docsWithTerm)
    : 0;

  return tf * idf;
}

// Get search relevance score (combines MiniSearch score with static relevance)
export function combineScores(
  searchScore: number,
  staticRelevance: number,
  searchWeight: number = 0.6
): number {
  // Normalize search score (MiniSearch scores can vary widely)
  const normalizedSearch = Math.min(searchScore / 10, 1) * 100;

  // Weighted combination
  return Math.round(
    normalizedSearch * searchWeight +
    staticRelevance * (1 - searchWeight)
  );
}

// Suggest similar terms (for "did you mean?" functionality)
export function suggestSimilar(
  query: string,
  knownTerms: string[],
  maxSuggestions: number = 3
): string[] {
  const queryLower = query.toLowerCase();

  // Calculate Levenshtein distance
  const suggestions = knownTerms
    .map(term => ({
      term,
      distance: natural.LevenshteinDistance(queryLower, term.toLowerCase()),
    }))
    .filter(({ distance }) => distance <= 3 && distance > 0)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, maxSuggestions)
    .map(({ term }) => term);

  return suggestions;
}

export default SearchIndex;
