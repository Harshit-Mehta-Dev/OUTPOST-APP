/**
 * ==============================================================================
 * SCOUT VOCABULARY & TOKENIZER (ScoutTokenizer)
 * ==============================================================================
 * Converts raw natural language into dense feature vectors suitable for deep
 * neural processing, including n-gram extraction, stem extraction, and TF-IDF.
 * ==============================================================================
 */

class ScoutTokenizer {
  constructor(vectorSize = 64) {
    this.vectorSize = vectorSize;
    this.vocabulary = new Map();
    this.docCount = 0;
    this.docFrequencies = new Map();
  }

  /**
   * Clean and normalize input text into words
   */
  tokenize(text) {
    if (!text || typeof text !== 'string') return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s\+\-\*\/\^\=]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Extract unigrams and bigrams
   */
  extractTokens(text) {
    const words = this.tokenize(text);
    const tokens = [...words];
    for (let i = 0; i < words.length - 1; i++) {
      tokens.push(`${words[i]}_${words[i + 1]}`);
    }
    return tokens;
  }

  /**
   * Build dictionary vocabulary from a corpus of documents
   */
  fit(documents) {
    this.docCount = documents.length;
    this.vocabulary.clear();
    this.docFrequencies.clear();

    const counts = new Map();

    for (const doc of documents) {
      const tokens = this.extractTokens(doc);
      const uniqueTokens = new Set(tokens);

      for (const t of uniqueTokens) {
        this.docFrequencies.set(t, (this.docFrequencies.get(t) || 0) + 1);
      }

      for (const t of tokens) {
        counts.set(t, (counts.get(t) || 0) + 1);
      }
    }

    // Pick top most frequent tokens up to vectorSize
    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    const topTokens = sorted.slice(0, this.vectorSize);

    topTokens.forEach(([token], index) => {
      this.vocabulary.set(token, index);
    });
  }

  /**
   * Transform text into a normalized feature vector
   */
  vectorize(text) {
    const vector = new Array(this.vectorSize).fill(0);
    const tokens = this.extractTokens(text);
    if (tokens.length === 0) return vector;

    const termFreq = new Map();
    for (const t of tokens) {
      termFreq.set(t, (termFreq.get(t) || 0) + 1);
    }

    let normSq = 0;
    for (const [token, count] of termFreq.entries()) {
      if (this.vocabulary.has(token)) {
        const idx = this.vocabulary.get(token);
        const tf = count / tokens.length;
        const df = this.docFrequencies.get(token) || 1;
        const idf = Math.log((this.docCount + 1) / (df + 1)) + 1;
        const weight = tf * idf;
        vector[idx] = weight;
        normSq += weight * weight;
      }
    }

    // L2 normalization
    const norm = Math.sqrt(normSq) || 1.0;
    return vector.map(v => v / norm);
  }

  exportVocab() {
    return {
      vectorSize: this.vectorSize,
      docCount: this.docCount,
      vocab: [...this.vocabulary.entries()],
      docFrequencies: [...this.docFrequencies.entries()]
    };
  }

  importVocab(snapshot) {
    this.vectorSize = snapshot.vectorSize;
    this.docCount = snapshot.docCount;
    this.vocabulary = new Map(snapshot.vocab);
    this.docFrequencies = new Map(snapshot.docFrequencies);
  }
}

module.exports = ScoutTokenizer;
