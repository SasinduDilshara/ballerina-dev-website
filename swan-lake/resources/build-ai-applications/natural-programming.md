---
layout: ballerina-natural-programming-left-nav-pages-swanlake
title: Natural programming
description: Learn how Ballerina's natural expressions and natural functions let you describe logic in natural language, execute it with an LLM at runtime, and bind the result to Ballerina types.
keywords: ballerina, AI, natural programming, natural expressions, natural functions, LLM, np
permalink: /learn/natural-programming/
active: natural-programming
intro: This guide explains the natural programming features of Ballerina, which blend natural language with typed Ballerina code, and how they relate to the rest of the AI library.
---

## What is natural programming

Natural programming lets you write parts of a program in natural language while keeping the guarantees of a typed programming language. Ballerina provides this through **natural expressions**: an expression whose body is a natural language prompt, evaluated by a large language model (LLM) at runtime, with the result bound to the expected Ballerina type. Because the type is the contract, the JSON schema of the expected type is sent to the LLM along with the prompt, and the response is validated and converted before your code sees it.

> **Note:** Natural expressions are supported on Swan Lake Update 13 (2201.13.0) or newer versions. They are currently an experimental feature and require the `--experimental` flag with `bal` commands, and experimental features enabled in the VS Code extension.

## Natural expressions

A natural expression has the form `natural (model) { ... }`, where `model` is an `ai:ModelProvider` and the body is the prompt. In-scope variables and parameters are inserted with `${...}` interpolations. The `(model)` argument is optional; without it, the default model provider is used.

```ballerina
import ballerina/ai;

final ai:ModelProvider model = check ai:getDefaultModelProvider();

# Represents a tourist attraction.
type Attraction record {|
    # The name of the attraction
    string name;
    # The city where the attraction is located
    string city;
    # A notable feature or highlight of the attraction
    string highlight;
|};

function getAttractions(int count, string country, string interest) returns Attraction[]|error {
    Attraction[]|error attractions = natural (model) {
        Give me the top ${count} tourist attractions in ${country}
        for visitors interested in ${interest}.

        For each attraction, the highlight should be one sentence
        describing what makes it special or noteworthy.
    };
    return attractions;
}
```

The documentation comments on the record and its fields are included in the generated JSON schema, so they guide the LLM towards the intended meaning of each field.

Any `ai:ModelProvider` implementation can be used, including provider-specific modules with your own keys. See [Configure model and embedding providers](/learn/configure-model-and-embedding-providers/), and the [Natural expressions](/learn/by-example/natural-expressions/) and [Natural expressions with a specific model provider](/learn/by-example/natural-expressions-with-model-provider/) examples.

## Natural functions

A natural function is a function whose body is a natural expression, written with the expression-bodied function syntax. The signature is declared in Ballerina and the logic in natural language, so callers use it like any other function.

```ballerina
# Represents the analysis of a customer review.
type ReviewAnalysis record {|
    # The overall sentiment: "positive", "negative", or "neutral"
    string sentiment;
    # A confidence score between 0 and 1
    float confidence;
    # The main topics mentioned in the review
    string[] topics;
    # A one-sentence summary of the review
    string summary;
|};

function analyzeReview(string review) returns ReviewAnalysis|error => natural (model) {
    Analyze the following customer review of a hotel stay.

    Identify the overall sentiment, how confident you are, the main topics
    mentioned (e.g., cleanliness, staff, location, price), and provide a
    one-sentence summary.

    Review: ${review}
};
```

See the [Natural functions](/learn/by-example/natural-functions/) example.

## Natural expressions and the AI library

Natural expressions are the language-level counterpart of the `generate` method of `ai:ModelProvider`; both send a prompt and the schema of the expected type to the LLM and bind the response. Use a natural expression when the prompt is a fixed part of the program's logic, and `generate` when the prompt is constructed dynamically or when working with the provider directly. Agents build on the same model providers and add tools, memory, and a reasoning-action loop; see [Build an AI agent](/learn/build-an-ai-agent/).

## Compile-time support

The [`ballerina/ai.np`](https://central.ballerina.io/ballerina/ai.np/latest) module provides the compile-time support for natural programming, including the generation of the JSON schemas for the types used with natural expressions. It is bundled with the distribution and does not need to be imported explicitly to use natural expressions.

## Run a program with natural expressions

Configure the model provider (for the default model provider, run `Configure default WSO2 Model Provider` from the VS Code command palette to add the configuration to the `Config.toml` file) and run the program with the `--experimental` flag.

```
$ bal run --experimental
```

## Learn more

- [Work with Large Language Models (LLMs) using natural expressions](/learn/work-with-llms-using-natural-expressions/) tutorial
- [Natural Language is Code: A hybrid approach with Natural Programming](https://blog.ballerina.io/posts/2025-04-26-introducing-natural-programming/)
- [Natural expressions](/learn/by-example/natural-expressions/) and [Natural functions](/learn/by-example/natural-functions/) examples
- [`ballerina/ai` module](https://central.ballerina.io/ballerina/ai/latest)
