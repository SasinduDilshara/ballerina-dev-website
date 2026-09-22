---
layout: ballerina-build-a-rag-application-left-nav-pages-swanlake
title: Build a RAG application
description: Learn how to build a retrieval-augmented generation (RAG) application in Ballerina with data loaders, chunkers, embedding providers, vector stores, knowledge bases, and metadata filters.
keywords: ballerina, AI, RAG, retrieval-augmented generation, vector store, embeddings, knowledge base, pgvector, Pinecone, Milvus, Weaviate
permalink: /learn/build-a-rag-application/
active: build-a-rag-application
intro: This guide walks through the ingestion and query workflows of retrieval-augmented generation (RAG) and the abstractions Ballerina provides for each step.
---

## Understand RAG

Retrieval-augmented generation (RAG) grounds the responses of a large language model (LLM) in your own data. It has two workflows.

- **Ingestion**: load documents, split them into chunks, convert the chunks into vector embeddings, and index them in a vector store.
- **Query**: embed the user's question, retrieve the most similar chunks, augment the prompt with them, and call the LLM.

The [`ballerina/ai`](https://central.ballerina.io/ballerina/ai/latest) module provides an abstraction for each step, so the implementations (e.g., the vector database or the embedding model) can be swapped without changing the workflow.

| Step | Abstraction | Built-in implementations | External implementations |
|---|---|---|---|
| Load documents | `ai:DataLoader` | `ai:TextDataLoader` (PDF, DOCX, Markdown, HTML, PPTX) | `ballerinax/ai.microsoft.sharepoint` |
| Chunk documents | `ai:Chunker` | `ai:GenericRecursiveChunker`, `ai:MarkdownChunker`, `ai:HtmlChunker` | |
| Embed chunks | `ai:EmbeddingProvider` | `ai:getDefaultEmbeddingProvider()` | `ballerinax/ai.openai`, `ballerinax/ai.azure`, `ballerinax/ai.openrouter`, `ballerinax/ai.googleapis.vertex` |
| Store vectors | `ai:VectorStore` | `ai:InMemoryVectorStore` | `ballerinax/ai.pgvector`, `ballerinax/ai.pinecone`, `ballerinax/ai.milvus`, `ballerinax/ai.weaviate` |
| Index and retrieve | `ai:KnowledgeBase` | `ai:VectorKnowledgeBase` | `ballerinax/ai.azure` (Azure AI Search), custom implementations |

## Set up the providers and the knowledge base

Create an embedding provider, a vector store, and a knowledge base. The knowledge base orchestrates chunking, embedding, storage, and retrieval.

```ballerina
import ballerina/ai;

final ai:EmbeddingProvider embeddingProvider = check ai:getDefaultEmbeddingProvider();
final ai:VectorStore vectorStore = check new ai:InMemoryVectorStore();
final ai:KnowledgeBase knowledgeBase = new ai:VectorKnowledgeBase(vectorStore, embeddingProvider);
```

To use an external vector database, replace the vector store. For example, with pgvector (a PostgreSQL extension), the vector dimension must match the embedding model.

```ballerina
import ballerinax/ai.pgvector;

configurable string pgPassword = ?;

final ai:VectorStore vectorStore = check new pgvector:VectorStore("localhost", "postgres", pgPassword,
        "vector_db", tableName = "policy_vectors", configs = {vectorDimension: 1536});
```

See the [RAG with pgvector vector store](/learn/by-example/rag-with-pgvector-vector-store/) and [RAG ingestion with external vector store](/learn/by-example/rag-ingestion-with-external-vector-store/) (Pinecone) examples. To use your own embedding model, see [Configure model and embedding providers](/learn/configure-model-and-embedding-providers/).

## Ingest documents

### Load documents

The `ai:TextDataLoader` loads files as `ai:TextDocument` values and supports the `pdf`, `docx`, `markdown`, `html`, and `pptx` file types.

```ballerina
ai:DataLoader loader = check new ai:TextDataLoader("./employee_handbook.md", "./leave_policy.pdf");
ai:Document|ai:Document[] documents = check loader.load();
```

Documents can also be created directly, for example, from data fetched from another system.

```ballerina
ai:TextDocument document = {content: "Full-time employees are entitled to 20 days of paid annual leave per year."};
```

### Chunk documents

When documents are ingested into an `ai:VectorKnowledgeBase`, chunking is handled automatically based on the document type (the `ai:AUTO` configuration). For finer control, chunk explicitly and ingest the chunks. The chunkers start with the specified unit (e.g., Markdown headers or paragraphs) and recursively fall back to smaller units when a chunk exceeds the maximum size.

```ballerina
ai:Chunker chunker = new ai:MarkdownChunker(maxChunkSize = 300, maxOverlapSize = 40);
ai:Chunk[] chunks = check chunker.chunk(document);
```

See the [Document loading](/learn/by-example/rag-document-loading/) and [Document chunking](/learn/by-example/rag-document-chunking/) examples.

### Index the chunks

```ballerina
check knowledgeBase.ingest(documents);
```

## Query the knowledge base

Retrieve the most relevant chunks for a question, augment the question with them, and call the model.

```ballerina
final ai:ModelProvider model = check ai:getDefaultModelProvider();

public function main() returns error? {
    string query = "How much paid vacation do I get?";
    ai:QueryMatch[] matches = check knowledgeBase.retrieve(query, 3);
    ai:ChatUserMessage augmentedQuery = ai:augmentUserQuery(matches, query);
    ai:ChatAssistantMessage response = check model->chat(augmentedQuery);
}
```

See the [RAG with in-memory vector store](/learn/by-example/rag-with-in-memory-vector-store/) and [RAG query with external vector store](/learn/by-example/rag-query-with-external-vector-store/) examples.

## Filter by metadata

Chunks carry metadata (`ai:Metadata`) with predefined fields such as the file name and chunk index, plus arbitrary custom fields. Metadata filters combine vector similarity with exact conditions, for example, to scope retrieval to a department, a document, or a tenant. The same filters can delete chunks with `deleteByFilter`.

```ballerina
ai:TextChunk[] chunks = [
    {content: "Employees get 20 days of paid annual leave.", metadata: {"department": "HR", "year": 2025}},
    {content: "Production deployments require two approvals.", metadata: {"department": "Engineering", "year": 2025}}
];
check knowledgeBase.ingest(chunks);

ai:QueryMatch[] matches = check knowledgeBase.retrieve(query, 2, {
    condition: ai:AND,
    filters: [
        {key: "department", operator: ai:IN, value: ["HR", "Finance"]},
        {key: "year", operator: ai:GREATER_THAN_OR_EQUAL, value: 2025}
    ]
});

check knowledgeBase.deleteByFilter({filters: [{key: "year", operator: ai:LESS_THAN, value: 2025}]});
```

See the [Vector search with metadata filters](/learn/by-example/rag-query-with-metadata-filters/) example.

## Use other knowledge bases

Any retrieval backend can be integrated by implementing the `ai:KnowledgeBase` type (`ingest`, `retrieve`, and `deleteByFilter`). The [`ballerinax/ai.azure`](https://central.ballerina.io/ballerinax/ai.azure/latest) module provides a knowledge base backed by Azure AI Search, and the [Custom knowledge base](/learn/by-example/rag-custom-knowledge-base/) example shows a keyword-based implementation.

## Use RAG from an agent

A knowledge base can be used as a tool of an agent, so the agent retrieves context when it decides it is needed.

```ballerina
# Searches the HR policy documents.
# + query - The search query
@ai:AgentTool
isolated function searchPolicies(string query) returns string[]|error {
    ai:QueryMatch[] matches = check knowledgeBase.retrieve(query, 3);
    return matches.map(queryMatch => queryMatch.chunk.content.toString());
}
```

## Learn more

- [Build an AI agent](/learn/build-an-ai-agent/)
- [Configure model and embedding providers](/learn/configure-model-and-embedding-providers/)
- The RAG examples in [Ballerina by Example](/learn/by-example/)
- [`ballerina/ai` module](https://central.ballerina.io/ballerina/ai/latest)
