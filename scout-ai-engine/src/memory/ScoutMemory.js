/**
 * ==============================================================================
 * SCOUT EPISODIC & SEMANTIC MEMORY (ScoutMemory)
 * ==============================================================================
 * Provides conversation context retention, user preference recall, short-term
 * working memory, and long-term key-value episodic memories.
 * ==============================================================================
 */

class ScoutMemory {
  constructor(options = {}) {
    this.maxShortTerm = options.maxShortTerm || 20;
    this.shortTermMemory = new Map(); // userId -> Array<{ role, text, timestamp }>
    this.longTermMemory = new Map();  // userId -> Map<key, value>
    this.entityIndex = new Map();     // entity -> Set<userId>
  }

  /**
   * Append interaction to short-term sliding window
   */
  remember(userId, role, text) {
    if (!this.shortTermMemory.has(userId)) {
      this.shortTermMemory.set(userId, []);
    }
    const history = this.shortTermMemory.get(userId);
    history.push({
      role,
      text,
      timestamp: Date.now()
    });

    if (history.length > this.maxShortTerm) {
      history.shift();
    }
  }

  /**
   * Retrieve recent conversation context
   */
  getRecentContext(userId, limit = 6) {
    const history = this.shortTermMemory.get(userId) || [];
    return history.slice(-limit);
  }

  /**
   * Store persistent fact/preference in long-term memory
   */
  saveFact(userId, key, value) {
    if (!this.longTermMemory.has(userId)) {
      this.longTermMemory.set(userId, new Map());
    }
    this.longTermMemory.get(userId).set(key, {
      value,
      updatedAt: Date.now()
    });
  }

  /**
   * Recall a persistent fact
   */
  recallFact(userId, key) {
    if (!this.longTermMemory.has(userId)) return null;
    const item = this.longTermMemory.get(userId).get(key);
    return item ? item.value : null;
  }

  /**
   * Get all persistent knowledge for a user
   */
  getAllFacts(userId) {
    if (!this.longTermMemory.has(userId)) return {};
    const result = {};
    for (const [k, v] of this.longTermMemory.get(userId).entries()) {
      result[k] = v.value;
    }
    return result;
  }

  /**
   * Clear short-term memory (e.g. on new chat session)
   */
  clearSession(userId) {
    this.shortTermMemory.delete(userId);
  }
}

module.exports = ScoutMemory;
