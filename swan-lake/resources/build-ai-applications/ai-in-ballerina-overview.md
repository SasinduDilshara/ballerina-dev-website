---
layout: ballerina-ai-in-ballerina-overview-left-nav-pages-swanlake
title: AI in Ballerina overview
description: Learn how the Ballerina AI library and related modules fit together to build LLM-powered applications, agents, RAG workflows, and MCP servers.
keywords: ballerina, AI, LLM, agent, RAG, MCP, natural expressions, model provider
permalink: /learn/ai-in-ballerina-overview/
active: ai-in-ballerina-overview
intro: This guide gives an overview of the building blocks Ballerina provides for AI applications and maps each of them to the module that provides it.
---

## The building blocks

Ballerina provides first-class abstractions for AI applications in the [`ballerina/ai`](https://central.ballerina.io/ballerina/ai/latest) module, complemented by language-level support for natural expressions and a set of provider-specific modules. The main building blocks are the following.

| Building block | What it does | Key types and functions |
|---|---|---|
| Model providers | A unified interface to call large language models (LLMs) for chat and structured generation | `ai:ModelProvider`, `ai:getDefaultModelProvider()`, `chat`, `generate` |
| Natural expressions and natural functions | Language-level syntax to call an LLM with a natural language prompt and bind the response to a Ballerina type | `natural (model) { ... }` |
| Agents | Autonomous reasoning-action loops that use tools, memory, and a system prompt to complete tasks | `ai:Agent`, `@ai:AgentTool`, `ai:BaseToolKit`, `ai:McpToolKit`, `ai:HttpServiceToolKit` |
| Memory | Conversation history per session, in memory or persisted in a database | `ai:Memory`, `ai:ShortTermMemory`, `ai:ShortTermMemoryStore` |
| Retrieval-augmented generation (RAG) | Load, chunk, embed, and index documents, and retrieve relevant context for a query | `ai:DataLoader`, `ai:Chunker`, `ai:EmbeddingProvider`, `ai:VectorStore`, `ai:KnowledgeBase`, `ai:augmentUserQuery` |
| Model Context Protocol (MCP) | Expose tools to AI clients as an MCP server and consume tools from MCP servers | `mcp:StreamableHttpListener`, `mcp:Service`, `mcp:StreamableHttpClient`, `ai:McpToolKit` |
| Chat services | Expose an agent over HTTP as a chat service and call it from clients | `ai:Listener`, `ai:ChatService`, `ai:ChatClient` |
| Human-in-the-loop | Pause an agent before sensitive tool calls until a human approves | `requiresApproval`, `ai:ApprovalRequiredError`, `ai:Resume` |
| Observability and evaluation | Inspect agent execution traces, publish traces, and evaluate agent quality with tests | `ai:Trace`, `ballerinax/amp`, `ballerina/ai.eval` |

## How the pieces fit together

A typical AI integration starts with a **model provider**. The default model provider, obtained via `ai:getDefaultModelProvider()`, lets you get started without managing API keys; provider-specific modules such as `ballerinax/ai.openai` and `ballerinax/ai.azure` let you use your own keys. All of them implement the same `ai:ModelProvider` type, so the rest of the code does not depend on the provider.

For a single call to an LLM, use a **natural expression** or the `generate` method of the model provider and let Ballerina bind the response to the expected type. For multi-step tasks, create an **agent** with a system prompt, a model provider, and tools. Tools can be Ballerina functions, tool kits, operations from an OpenAPI specification, or tools exposed by MCP servers. Agents keep conversation history in **memory**, which can be persisted for durability.

To ground responses in your own data, build a **RAG** workflow: load documents with a data loader, chunk them, embed the chunks with an embedding provider, and index them in a vector store through a knowledge base. At query time, retrieve the most relevant chunks and augment the prompt before calling the model. A knowledge base can also be used as a tool by an agent.

To integrate with the wider AI ecosystem, expose your integrations as **MCP** servers, so that AI assistants and agents can discover and call them, and consume existing MCP servers from your agents.

## Module map

The table below lists the modules that provide the AI features, with links to their API documentation on Ballerina Central.

| Module | Purpose |
|---|---|
| [`ballerina/ai`](https://central.ballerina.io/ballerina/ai/latest) | Core AI library: model provider abstraction, agents, tools, memory, RAG abstractions, chat listener and client |
| [`ballerina/mcp`](https://central.ballerina.io/ballerina/mcp/latest) | Model Context Protocol server and client |
| [`ballerina/ai.eval`](https://central.ballerina.io/ballerina/ai.eval/latest) | Rule-based and LLM-as-a-judge evaluation templates for agents |
| [`ballerina/ai.np`](https://central.ballerina.io/ballerina/ai.np/latest) | Compile-time support for natural programming, including JSON schema generation for natural expressions |
| [`ballerinax/ai.openai`](https://central.ballerina.io/ballerinax/ai.openai/latest) | OpenAI model and embedding providers |
| [`ballerinax/ai.anthropic`](https://central.ballerina.io/ballerinax/ai.anthropic/latest) | Anthropic model provider |
| [`ballerinax/ai.azure`](https://central.ballerina.io/ballerinax/ai.azure/latest) | Azure OpenAI model and embedding providers, and the Azure AI Search knowledge base |
| [`ballerinax/ai.deepseek`](https://central.ballerina.io/ballerinax/ai.deepseek/latest) | DeepSeek model provider |
| [`ballerinax/ai.mistral`](https://central.ballerina.io/ballerinax/ai.mistral/latest) | Mistral model provider |
| [`ballerinax/ai.ollama`](https://central.ballerina.io/ballerinax/ai.ollama/latest) | Ollama model provider for locally running models |
| [`ballerinax/ai.openrouter`](https://central.ballerina.io/ballerinax/ai.openrouter/latest) | OpenRouter model and embedding providers |
| [`ballerinax/ai.googleapis.vertex`](https://central.ballerina.io/ballerinax/ai.googleapis.vertex/latest) | Google Vertex AI model and embedding providers |
| [`ballerinax/ai.pinecone`](https://central.ballerina.io/ballerinax/ai.pinecone/latest) | Pinecone vector store |
| [`ballerinax/ai.milvus`](https://central.ballerina.io/ballerinax/ai.milvus/latest) | Milvus vector store |
| [`ballerinax/ai.pgvector`](https://central.ballerina.io/ballerinax/ai.pgvector/latest) | pgvector (PostgreSQL) vector store |
| [`ballerinax/ai.weaviate`](https://central.ballerina.io/ballerinax/ai.weaviate/latest) | Weaviate vector store |
| [`ballerinax/ai.microsoft.sharepoint`](https://central.ballerina.io/ballerinax/ai.microsoft.sharepoint/latest) | Data loader for Microsoft SharePoint documents |
| [`ballerinax/ai.sqlite`](https://central.ballerina.io/ballerinax/ai.sqlite/latest) | SQLite-backed persistent short-term memory store |
| [`ballerinax/ai.memory.postgresql`](https://central.ballerina.io/ballerinax/ai.memory.postgresql/latest) | PostgreSQL-backed persistent short-term memory store |
| [`ballerinax/ai.memory.redis`](https://central.ballerina.io/ballerinax/ai.memory.redis/latest) | Redis-backed persistent short-term memory store |
| [`ballerinax/ai.memory.mssql`](https://central.ballerina.io/ballerinax/ai.memory.mssql/latest) | Microsoft SQL Server-backed persistent short-term memory store |
| [`ballerinax/amp`](https://central.ballerina.io/ballerinax/amp/latest) | Publishes agent traces to the WSO2 AI Agent Management Platform via OpenTelemetry |

## Where to go next

- [Configure model and embedding providers](/learn/configure-model-and-embedding-providers/) to choose an LLM and an embedding model.
- [Build an AI agent](/learn/build-an-ai-agent/) to create an agent with tools and a chat interface.
- [Persist agent memory](/learn/persist-agent-memory/) to keep conversation history across restarts.
- [Build a RAG application](/learn/build-a-rag-application/) to ground responses in your documents.
- [Expose and consume MCP servers](/learn/expose-and-consume-mcp-servers/) to integrate with the MCP ecosystem.
- [Human-in-the-loop agents](/learn/human-in-the-loop-agents/) to require approval before sensitive tool calls.
- [Observe and evaluate agents](/learn/observe-and-evaluate-agents/) to inspect traces and test agent quality.
- [Natural programming](/learn/natural-programming/) to use natural expressions and natural functions.
- [Work with Large Language Models (LLMs) using natural expressions](/learn/work-with-llms-using-natural-expressions/) for a step-by-step tutorial.
- The Generative AI section of [Ballerina by Example](/learn/by-example/) for runnable examples of every building block.
