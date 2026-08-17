# AI Assistance Platform Features — Design Spec

**Date**: 2026-08-16
**Goal**: Portfolio + freelance showcase + launchable product
**Architecture**: Monolith extension (existing Express backend)
**Build order**: File Upload → RAG → Web Search

---

## Feature 1: File Upload + Vision

### Overview
Users attach files (images, PDFs, DOCX, XLSX, PPTX) to chat messages. Images are analyzed via Gemini Vision. Documents have text extracted and stored for RAG.

### Backend

**New endpoint**: `POST /api/files/upload`
- Accepts `multipart/form-data` (use `multer` middleware)
- Stores files to `generated/uploads/`
- Saves metadata to `File` table
- Returns `{ id, fileName, mimeType, url }`
- Max file size: 10MB
- Auth required

**New endpoint**: `GET /api/files/:id/download`
- Serves the uploaded file
- Auth required (owner check)

**New Prisma model — `File`**:
```prisma
model File {
  id             String   @id @default(uuid())
  userId         String
  conversationId String?
  fileName       String
  originalName   String
  mimeType       String
  size           Int
  extractedText  String?
  createdAt      DateTime @default(now())

  user         User          @relation(fields: [userId], references: [id])
  conversation Conversation? @relation(fields: [conversationId], references: [id])
  chunks       DocumentChunk[]
}
```

**File processing pipeline** (on upload):
- Images (jpg/png/webp/gif): Store only, no text extraction
- PDF: Extract text using `pdf-parse`
- DOCX: Extract text using `mammoth`
- XLSX/PPTX: Extract text using `officeparser`

**New service**: `FileService.ts`
- `upload(userId, conversationId, file)` — save file, extract text if applicable
- `getFile(fileId, userId)` — fetch with owner check

**Socket change**: `user_message` event accepts optional `fileIds: string[]`
- If fileIds include an image: read file from disk, convert to base64, pass as `inlineData` part to Gemini's `generateContent` (vision)
- If fileIds include documents: include extracted text as context in prompt (lightweight pre-RAG; replaced by vector retrieval once Feature 2 is built)

### Frontend

**ChatInput changes**:
- Wire paperclip button → hidden `<input type="file" multiple accept="image/*,.pdf,.docx,.xlsx,.pptx" />`
- Show attached files as preview chips below input (thumbnail for images, file icon + name for docs)
- On send: upload files via `POST /api/files/upload`, then emit `user_message` with `fileIds`
- Remove chips after send

**Message rendering**:
- Messages with image attachments: render image inline (similar to AI-generated images)
- Messages with document attachments: show a file chip (icon + filename + size)

### Dependencies
- `multer` — multipart file upload
- `pdf-parse` — PDF text extraction
- `mammoth` — DOCX to text
- `officeparser` — XLSX/PPTX text extraction

---

## Feature 2: RAG (Retrieval-Augmented Generation)

### Overview
Uploaded documents are chunked, embedded, and stored as vectors in pgvector. At query time, relevant chunks are retrieved and injected into the AI prompt.

### Backend

**pgvector setup**:
- Enable `vector` extension in PostgreSQL: `CREATE EXTENSION IF NOT EXISTS vector;`
- Run via a Prisma migration

**New Prisma model — `DocumentChunk`**:
```prisma
model DocumentChunk {
  id         String @id @default(uuid())
  fileId     String
  content    String
  chunkIndex Int
  // embedding stored via raw SQL (Prisma doesn't natively support vector type)

  file File @relation(fields: [fileId], references: [id], onDelete: Cascade)
}
```

Note: The `embedding` column (`vector(768)`) is added via raw SQL migration since Prisma doesn't support the vector type natively.

**Chunking pipeline** (runs after text extraction in Feature 1):
- Split extracted text into ~500-token chunks with ~50-token overlap
- Use simple sentence-boundary splitting (split on `. `, then merge until ~500 tokens)
- Store each chunk in `DocumentChunk`

**Embedding**:
- Model: `gemini-embedding-001` (available on free tier)
- API: `ai.models.embedContent({ model, contents })`
- Returns 768-dimension vector per chunk
- Batch embed chunks (up to 100 per call for efficiency)

**Retrieval at query time** (in `ChatService.streamChat`):
1. Check if the conversation has any uploaded files with chunks
2. If yes, embed the user's query using `gemini-embedding-001`
3. Query pgvector: `SELECT content FROM document_chunks ORDER BY embedding <=> $1 LIMIT 5`
4. Prepend retrieved chunks to system prompt:
   ```
   ## Relevant Context (from uploaded documents)
   [chunk 1 text]
   [chunk 2 text]
   ...
   
   Use the context above to answer the user's question. Cite the document when relevant.
   ```
5. If no documents in conversation, skip (normal chat flow)

**New service**: `RagService.ts`
- `indexDocument(fileId)` — chunk + embed + store vectors
- `retrieveContext(conversationId, query)` — embed query, vector search, return top-5 chunks
- `deleteDocumentChunks(fileId)` — cleanup on file deletion

### Frontend

**Upload status indicator**:
- After file upload, show "Indexing document..." with a progress animation
- Socket event `indexing_complete` signals when the document is ready for Q&A

**Context badge on messages**:
- When the AI response used RAG context, show a small badge: "Based on: filename.pdf"
- Backend includes `sourceFiles: string[]` in the `ai_done` event when RAG was used

---

## Feature 3: Web Search

### Overview
Detect queries needing live information, search via Google Custom Search API (100 free/day), inject results into the AI prompt.

### Backend

**Env vars**:
- `GOOGLE_API_KEY` — reuse existing Gemini API key (works for Custom Search too)
- `GOOGLE_SEARCH_CX` — Custom Search Engine ID (new)

**New service**: `WebSearchService.ts`

`detectSearchIntent(message: string): boolean`
- Keywords: "latest", "current", "today", "news", "recent", "price of", "weather", "who won", "score", "stock", "update on", "what happened"
- Pattern matching similar to image intent detection
- Skip detection for voice mode (keep voice responses fast)

`search(query: string): Promise<SearchResult[]>`
- Call: `GET https://www.googleapis.com/customsearch/v1?key=KEY&cx=CX&q=QUERY&num=5`
- Returns: `{ title, snippet, link }[]`
- Timeout: 5 seconds

`extractSearchQuery(message: string): string`
- Strip conversational filler, extract the core search query
- e.g., "What's the latest news about React 20?" → "latest news React 20"

**Rate limiting**:
- In-memory counter: `{ count: number, resetDate: string }`
- If count >= 95 (leaving buffer), skip search, log warning
- Resets daily

**Integration in `ChatService.streamChat()`**:
```
if (detectSearchIntent && !isVoice && searchQuotaAvailable) {
  emit("ai_searching")
  results = await search(extractSearchQuery(message))
  systemPrompt += formatSearchResults(results)
}
```

**Search results format injected into prompt**:
```
## Web Search Results
1. [Title](URL) — Snippet text...
2. [Title](URL) — Snippet text...

Use these search results to provide an accurate, up-to-date answer. Cite sources with links.
```

### Frontend

**Search indicator**:
- New socket event `ai_searching` — when received, show "Searching the web..." with a globe icon animation in the streaming message area (before tokens start arriving)

**Source rendering**:
- No special handling needed — Gemini's response will include markdown links
- The existing `a` tag renderer in `AssistantMessage.tsx` already opens links in new tabs

### Dependencies
- No new npm packages — uses native `fetch` to call Google's REST API

---

## Database Migration Summary

```sql
-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- File table (handled by Prisma)
-- DocumentChunk table (handled by Prisma + raw SQL for vector column)
ALTER TABLE "DocumentChunk" ADD COLUMN embedding vector(768);
CREATE INDEX ON "DocumentChunk" USING hnsw (embedding vector_cosine_ops);
```

## New npm Dependencies (Backend)

| Package | Purpose | Size |
|---------|---------|------|
| `multer` | Multipart file upload | ~50KB |
| `pdf-parse` | PDF text extraction | ~200KB |
| `mammoth` | DOCX to text | ~150KB |
| `officeparser` | XLSX/PPTX extraction | ~100KB |
| *(none)* | Vector queries use Prisma `$queryRaw` — no extra client needed |

## Non-Goals (Explicitly Out of Scope)

- Image generation (parked — needs paid tier)
- Conversation sharing/export
- Prompt templates
- Analytics dashboard
- User file management UI (delete/rename files)
- Multi-file RAG across conversations (each conversation has its own document context)
