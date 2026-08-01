# Security Posture & AI Architecture

## 3-Strike Security System
Ai-Scout is equipped with a strict anti-hacking guardrail:
1. When a user asks about hacking, vulnerabilities, DDoS, SQL Injection, or XSS, Ai-Scout flags the request as a `SecurityThreat`.
2. The `routes/ai.js` controller increments an in-memory `securityStrikes` Map tied to the user's username.
3. On strikes 1 and 2, the user is warned via chat.
4. On strike 3, the server emits a `force_logout` event to the user's socket, completely disconnecting them from the app. The strike counter resets.

## RAG (Retrieval-Augmented Generation) Implementation [On Hold]
*Future Roadmap for Ai-Scout Evolution*

1. **Vector Database**: Instead of using `node-nlp` in-memory intents, utterances in `corpus.json` will be converted to embeddings and stored in a vector DB (e.g., Pinecone or Postgres pgvector via Supabase).
2. **Semantic Retrieval**: When a user chats, their prompt will be embedded, and the closest matching context chunks will be retrieved from the Vector DB.
3. **LLM Synthesis**: The retrieved chunks + the user's prompt will be sent to an LLM (OpenAI/Gemini).
4. **Result**: The LLM will synthesize a natural, highly contextual answer without suffering from the rigidity of pre-defined intent matching.

*This file is restricted to your local machine and will not be pushed to GitHub.*
