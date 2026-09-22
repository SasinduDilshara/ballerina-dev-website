---
layout: ballerina-human-in-the-loop-agents-left-nav-pages-swanlake
title: Human-in-the-loop agents
description: Learn how to require human approval before an AI agent in Ballerina calls sensitive tools, how to resume paused runs, and how to expose approvals over a chat service.
keywords: ballerina, AI, agent, human in the loop, approval, tool approval, resume
permalink: /learn/human-in-the-loop-agents/
active: human-in-the-loop-agents
intro: This guide explains how to gate sensitive tool calls behind human approval, how a paused run is resumed, and how approvals work with persistent memory and chat services.
---

## Why human-in-the-loop

Some tool calls have consequences that should not be left to the LLM alone, such as issuing refunds, sending messages to customers, or deleting data. Human-in-the-loop approval lets an agent propose such a call, pause, and continue only after a person approves or rejects it.

## Mark a tool as requiring approval

Set the `requiresApproval` field of the `@ai:AgentTool` annotation (or of an `ai:ToolConfig`). The value can be `true` to always require approval, or an `isolated` function with the same parameters as the tool that returns `boolean`, to decide per call from the proposed arguments (e.g., only refunds above a threshold).

```ballerina
import ballerina/ai;

# Issues a refund for an order. This action is irreversible.
# + orderId - The order ID
# + amount - The amount to refund
@ai:AgentTool {requiresApproval: true}
isolated function issueRefund(string orderId, decimal amount) returns string|error {
    // ...
}
```

## Handle the pause and resume the run

When the agent proposes a call to a gated tool, `run` returns an `ai:ApprovalRequiredError`. Its detail carries one `ai:ApprovalRequest` per pending call with the request ID, the tool name, and the proposed arguments. If the LLM proposed several gated calls in the same turn, all of them are listed.

To continue, call `run` again with an `ai:Resume` value instead of a query, using the same session ID. The `decisions` map associates each request ID with an `ai:HumanDecision`: `ai:APPROVE`, or `ai:REJECT` with an optional reason that is shown to the agent. The agent executes the approved calls, learns about the rejected ones, and continues to produce the final response. A partial map is allowed; the undecided requests stay pending and a new `ai:ApprovalRequiredError` lists them.

```ballerina
import ballerina/io;

public function main() returns error? {
    string sessionId = "customer-7";
    string|ai:Error result = supportAgent.run("Please refund my order ORD-1001 in full.", sessionId);

    if result is ai:ApprovalRequiredError {
        map<ai:HumanDecision> decisions = {};
        foreach ai:ApprovalRequest request in result.detail().requests {
            io:println(string `Approval required to call '${request.toolName}' with arguments ${
                    request.arguments.toJsonString()}`);
            string answer = io:readln("Approve? (y/n): ");
            decisions[request.id] = answer.toLowerAscii() == "y" ?
                    {outcome: ai:APPROVE} :
                    {outcome: ai:REJECT, reason: "Rejected by the support supervisor"};
        }
        ai:Resume resume = {decisions: decisions.cloneReadOnly()};
        string response = check supportAgent.run(resume, sessionId);
        io:println("Agent: ", response);
    } else {
        io:println("Agent: ", check result);
    }
}
```

See the [Human-in-the-loop tool approval](/learn/by-example/ai-agent-human-in-the-loop/) example.

## Persist the paused state

The paused state is checkpointed in the agent's memory store. With the default in-memory store, the run can only be resumed by the same process. With a persistent store such as [`ballerinax/ai.sqlite`](https://central.ballerina.io/ballerinax/ai.sqlite/latest) or [`ballerinax/ai.memory.postgresql`](https://central.ballerina.io/ballerinax/ai.memory.postgresql/latest), the checkpoint survives restarts and the run can be resumed from another instance, which is what an approval workflow that spans minutes or hours needs. The checkpoint table must be created beforehand as described in the documentation of the store module. See [Persist agent memory](/learn/persist-agent-memory/).

Calling `run` with an `ai:Resume` for a session that has no pending approval fails with `ai:ApprovalNotFoundError`, and a decision for an unknown request ID fails with `ai:UnknownApprovalIdError`.

## Approvals over a chat service

When an agent is exposed via an `ai:Listener`, the chat service can define a `decision` resource in addition to the `chat` resource. The `decision` resource accepts an `ai:DecisionMessage`, which carries the session ID and the decisions keyed by request ID, and resumes the agent by calling `run` with an `ai:Resume` built from those decisions. The `ai:ChatClient` client provides the corresponding `decision` operation to submit decisions from another program. See the [Chat agents](/learn/by-example/chat-agents/) and [Chat client](/learn/by-example/ai-chat-client/) examples for the chat service and client basics.

## Learn more

- [Build an AI agent](/learn/build-an-ai-agent/)
- [Persist agent memory](/learn/persist-agent-memory/)
- [Human-in-the-loop tool approval](/learn/by-example/ai-agent-human-in-the-loop/) example
- [`ballerina/ai` module](https://central.ballerina.io/ballerina/ai/latest)
