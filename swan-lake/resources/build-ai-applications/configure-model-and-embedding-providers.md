---
layout: ballerina-configure-model-and-embedding-providers-left-nav-pages-swanlake
title: Configure model and embedding providers
description: Learn how to use the default WSO2 model provider and provider-specific modules such as OpenAI, Azure OpenAI, Anthropic, Ollama, and others for LLM calls and embeddings in Ballerina.
keywords: ballerina, AI, LLM, model provider, embedding provider, OpenAI, Azure OpenAI, Anthropic, Ollama, Mistral, DeepSeek
permalink: /learn/configure-model-and-embedding-providers/
active: configure-model-and-embedding-providers
intro: This guide explains how to choose and configure the large language model (LLM) and embedding model used by natural expressions, direct LLM calls, agents, and RAG workflows.
---

## Model providers and embedding providers

Every LLM interaction in Ballerina goes through the `ai:ModelProvider` type, and every embedding operation goes through the `ai:EmbeddingProvider` type. These types are implemented by the default WSO2 providers in the [`ballerina/ai`](https://central.ballerina.io/ballerina/ai/latest) module and by provider-specific `ballerinax/ai.<provider>` modules. Because the rest of your code only depends on the abstract types, you can switch providers by changing the initialization of the provider.

A model provider exposes two operations:

- `chat` for multi-turn conversations, with optional tool definitions.
- `generate` for a single prompt whose response is bound to the expected Ballerina type.

An embedding provider exposes `embed` for a single chunk and `batchEmbed` for several chunks.

## Use the default WSO2 providers

The default providers let you get started without managing API keys. Obtain them with the `ai:getDefaultModelProvider()` and `ai:getDefaultEmbeddingProvider()` functions.

```ballerina
import ballerina/ai;

final ai:ModelProvider model = check ai:getDefaultModelProvider();
final ai:EmbeddingProvider embeddingProvider = check ai:getDefaultEmbeddingProvider();
```

The default providers read their configuration from the `ballerina.ai.wso2ProviderConfig` configurable in the `Config.toml` file. To generate the configuration, log in to the Ballerina Copilot in VS Code, open the command palette (`Ctrl + Shift + P` or `command + shift + P`), and run `Configure default WSO2 Model Provider`. This adds the configuration below to the `Config.toml` file of the open project.

```toml
[ballerina.ai.wso2ProviderConfig]
serviceUrl = "<service-url>"
accessToken = "<access-token>"
```

> **Note:** The default providers are subject to rate limits and other usage constraints. If the default provider starts returning authentication errors, re-run the command to refresh the configuration.

## Use a provider-specific module

To use your own keys, import the relevant `ballerinax/ai.<provider>` module and initialize its provider class. Store the keys in the `Config.toml` file via configurable variables and never commit them to source control.

### OpenAI

```ballerina
import ballerina/ai;
import ballerinax/ai.openai;

configurable string openAiApiKey = ?;

final ai:ModelProvider model = check new openai:ModelProvider(openAiApiKey, openai:GPT_4O_MINI,
        temperature = 0.2);
final ai:EmbeddingProvider embeddingProvider =
        check new openai:EmbeddingProvider(openAiApiKey, openai:TEXT_EMBEDDING_3_SMALL);
```

The model names are available as enum values (e.g., `openai:GPT_4O`, `openai:GPT_4_1`, `openai:GPT_5`), and the `apiType` parameter selects between the Chat Completions API (the default) and the Responses API.

### Azure OpenAI

The Azure OpenAI provider supports two URL styles. With the v1 URL (`https://<resource>.services.ai.azure.com/openai/v1` or `https://<resource>.openai.azure.com/openai/v1`), no `api-version` is required. With the legacy URL (`https://<resource>.openai.azure.com/openai`), the `apiVersion` argument (e.g., `"2024-06-01"`) is required. See the [Azure OpenAI API version lifecycle](https://learn.microsoft.com/en-us/azure/ai-foundry/openai/api-version-lifecycle) for details.

```ballerina
import ballerina/ai;
import ballerinax/ai.azure;

configurable string azureServiceUrl = ?;
configurable string azureApiKey = ?;
configurable string azureDeploymentId = ?;
configurable string azureEmbeddingDeploymentId = ?;

// v1 URL: the `apiVersion` argument is not required.
final ai:ModelProvider model = check new azure:OpenAiModelProvider(azureServiceUrl, azureApiKey,
        azureDeploymentId, temperature = 0.2);

// Legacy URL: pass the `apiVersion` argument.
final ai:ModelProvider legacyModel = check new azure:OpenAiModelProvider(
        "https://<resource>.openai.azure.com/openai", azureApiKey, azureDeploymentId,
        apiVersion = "2024-06-01");

// Embedding provider: the `apiVersion` is `()` for v1 URLs and required for legacy URLs.
final ai:EmbeddingProvider embeddingProvider = check new azure:EmbeddingProvider(azureServiceUrl,
        azureApiKey, (), azureEmbeddingDeploymentId);
```

Set `temperature` to `()` for reasoning models (e.g., the GPT-5 and o-series models) that do not support it, and use the `reasoningEffort` parameter to control their reasoning effort.

### Anthropic

```ballerina
import ballerina/ai;
import ballerinax/ai.anthropic;

configurable string anthropicApiKey = ?;

final ai:ModelProvider model = check new anthropic:ModelProvider(anthropicApiKey,
        anthropic:CLAUDE_SONNET_4_5);
```

### Ollama (local models)

[Ollama](https://ollama.com/) runs open-source models locally, and no API key is required. Pull the model first (e.g., `ollama pull llama3.2`). The default service URL is `http://localhost:11434`.

```ballerina
import ballerina/ai;
import ballerinax/ai.ollama;

final ai:ModelProvider model = check new ollama:ModelProvider("llama3.2");
```

### Other providers

The following modules follow the same pattern. See the module documentation for the constructor arguments of each.

| Module | Provider |
|---|---|
| [`ballerinax/ai.deepseek`](https://central.ballerina.io/ballerinax/ai.deepseek/latest) | DeepSeek |
| [`ballerinax/ai.mistral`](https://central.ballerina.io/ballerinax/ai.mistral/latest) | Mistral |
| [`ballerinax/ai.openrouter`](https://central.ballerina.io/ballerinax/ai.openrouter/latest) | OpenRouter (model and embedding providers) |
| [`ballerinax/ai.googleapis.vertex`](https://central.ballerina.io/ballerinax/ai.googleapis.vertex/latest) | Google Vertex AI (model and embedding providers) |

## Use the provider

Once initialized, the provider is used the same way regardless of the implementation. For example, with the `generate` method the response is bound to the expected type.

```ballerina
type Summary record {|
    string title;
    string[] keyPoints;
|};

public function main() returns error? {
    Summary summary = check model->generate(`Summarize the following text: ${text}`);
}
```

The same provider value can be passed to a natural expression (`natural (model) { ... }`), to an agent (the `model` field of the agent configuration), or used by a RAG workflow to generate the final answer.

## Configure the keys

Add the configurable values to the `Config.toml` file next to your program. For example, for the Azure OpenAI provider:

```toml
azureServiceUrl = "https://<resource>.services.ai.azure.com/openai/v1"
azureApiKey = "<your-api-key>"
azureDeploymentId = "<your-deployment-name>"
```

> **Tip:** Ballerina reports an error for values in the `Config.toml` file that are not used by the program, so include only the values the program declares as configurable variables.

## Learn more

- [Direct LLM calls](/learn/by-example/direct-llm-calls/) and [Direct LLM calls with a specific model provider](/learn/by-example/direct-llm-calls-with-model-provider/) examples
- [Direct LLM calls with a local model using Ollama](/learn/by-example/direct-llm-calls-with-ollama/) example
- [Embeddings with a specific embedding provider](/learn/by-example/rag-embedding-provider/) example
- [Natural expressions with a specific model provider](/learn/by-example/natural-expressions-with-model-provider/) example
- [`ballerina/ai` module](https://central.ballerina.io/ballerina/ai/latest)
