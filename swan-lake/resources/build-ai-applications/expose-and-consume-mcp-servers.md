---
layout: ballerina-expose-and-consume-mcp-servers-left-nav-pages-swanlake
title: Expose and consume MCP servers
description: Learn how to build Model Context Protocol (MCP) servers in Ballerina, manage sessions, bind HTTP request information, secure them, and consume MCP tools from clients and agents.
keywords: ballerina, AI, MCP, Model Context Protocol, MCP server, MCP client, agent tools
permalink: /learn/expose-and-consume-mcp-servers/
active: expose-and-consume-mcp-servers
intro: This guide explains how to expose Ballerina integrations as MCP servers and how to consume tools from MCP servers in clients and agents.
---

## Understand MCP

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is a standard for connecting AI applications to external data sources, tools, and workflows. An MCP server exposes tools that AI assistants (e.g., Claude Desktop, GitHub Copilot) and agents can discover and call; an MCP client connects to servers to use their tools.

The [`ballerina/mcp`](https://central.ballerina.io/ballerina/mcp/latest) module provides both sides over the Streamable HTTP transport, and the [`ballerina/ai`](https://central.ballerina.io/ballerina/ai/latest) module's `ai:McpToolKit` lets agents use MCP tools.

## Expose tools as an MCP server

Attach a service to an `mcp:StreamableHttpListener`. With the `mcp:Service` type, every `remote` method becomes an MCP tool: the tool description and input schema are generated from the method signature and its documentation comment, and the listener handles the `tools/list` and `tools/call` requests.

```ballerina
import ballerina/mcp;

type Weather record {|
    string location;
    decimal temperature;
    string condition;
|};

listener mcp:StreamableHttpListener mcpListener = new (9090);

service mcp:Service /mcp on mcpListener {

    # Get current weather for a city.
    #
    # + city - City name (e.g., "New York", "Tokyo")
    # + return - Current weather data for the specified city
    remote function getCurrentWeather(string city) returns Weather|error {
        return {location: city, temperature: 27.0, condition: "Sunny"};
    }
}
```

> **Note:** `mcp:Listener` is deprecated in favor of `mcp:StreamableHttpListener`, which makes the transport explicit.

For full control over tool listing and invocation, declare the service with the `mcp:AdvancedService` type and implement the `onListTools` and `onCallTool` remote methods. See the [MCP service](/learn/by-example/mcp-service/) and [MCP advanced service](/learn/by-example/mcp-service-advanced/) examples.

## Manage sessions

The `@mcp:StreamableHttpServiceConfig` annotation configures a service exposed over the Streamable HTTP transport, including the server information and the session mode.

- `mcp:STATEFUL`: a session ID is assigned when a client initializes the connection, and an `mcp:Session` is maintained per client.
- `mcp:STATELESS`: each request is independent.
- `mcp:AUTO` (the default): decided based on whether the client initializes a session.

In stateful mode, the `onCallTool` method of an `mcp:StreamableHttpAdvancedService` receives the client's `mcp:Session`, which can store and retrieve state across tool calls.

```ballerina
@mcp:StreamableHttpServiceConfig {
    info: {name: "Shopping Cart MCP Server", version: "1.0.0"},
    sessionMode: mcp:STATEFUL
}
service mcp:StreamableHttpAdvancedService /mcp on new mcp:StreamableHttpListener(9091) {

    isolated remote function onListTools() returns mcp:ListToolsResult|mcp:ServerError => {
        tools: [
            {
                name: "addItem",
                description: "Add an item to the shopping cart of the current session",
                inputSchema: {
                    "type": "object",
                    "properties": {"item": {"type": "string", "description": "The name of the item"}},
                    "required": ["item"]
                }
            }
        ]
    };

    isolated remote function onCallTool(mcp:CallToolParams params, mcp:Session? session)
            returns mcp:CallToolResult|mcp:ServerError {
        if session is () {
            return error("A session is required to use the shopping cart");
        }
        // Read and update the state stored in the session.
        string[] items = [];
        if session.hasKey("items") {
            string[]|mcp:Error storedItems = session.getWithType("items");
            if storedItems is mcp:Error {
                return error("Failed to read the shopping cart", storedItems);
            }
            items = storedItems;
        }
        record {|string item;|}|error arguments = params.arguments.cloneWithType();
        if arguments is error {
            return error("Invalid arguments", arguments);
        }
        items.push(arguments.item);
        session.set("items", items);
        return {content: [{'type: "text", text: string `The cart now has ${items.length()} item(s).`}]};
    }
}
```

See the [MCP service with sessions](/learn/by-example/mcp-service-with-sessions/) example.

## Bind HTTP request information in tools

Declaring the service with the `mcp:StreamableHttpService` type allows tool methods to bind information from the underlying HTTP request in addition to the tool arguments: an `http:Headers` parameter, an `http:Request` parameter, or `@http:Header` annotated parameters. These parameters are excluded from the tool's input schema, so they are populated from the request rather than provided by the AI client. This is useful for tenant identifiers, correlation IDs, and authorization headers set by a gateway.

```ballerina
import ballerina/http;

service mcp:StreamableHttpService /mcp on new mcp:StreamableHttpListener(9092) {

    # Get the orders of the tenant making the request.
    #
    # + headers - The HTTP headers of the incoming request
    # + status - The order status to filter by
    # + return - The matching orders
    remote function getOrders(http:Headers headers, string? status = ()) returns Order[]|error {
        string tenantId = check headers.getHeader("x-tenant-id");
        // ...
    }

    # Get an order by ID for the tenant making the request.
    #
    # + orderId - The order ID
    # + tenantId - The tenant ID, bound from the `x-tenant-id` HTTP header
    # + return - The order details
    remote function getOrder(string orderId, @http:Header {name: "x-tenant-id"} string tenantId)
            returns Order|error {
        // ...
    }
}
```

See the [MCP tools with HTTP request binding](/learn/by-example/mcp-service-http-request-binding/) example.

## Secure the MCP server

Since the Streamable HTTP transport is built on HTTP, an MCP service is secured like an `http:Service`. Configure TLS on the listener with `secureSocket`, and configure authentication and authorization via the `auth` field of `httpConfig` in the `@mcp:StreamableHttpServiceConfig` annotation. Basic authentication with a file or LDAP user store, JWT, and OAuth2 are supported.

```ballerina
listener mcp:StreamableHttpListener securedListener = new (9093,
    secureSocket = {
        key: {
            certFile: "../resource/path/to/public.crt",
            keyFile: "../resource/path/to/private.key"
        }
    }
);

@mcp:StreamableHttpServiceConfig {
    info: {name: "Payroll MCP Server", version: "1.0.0"},
    httpConfig: {
        auth: [
            {
                fileUserStoreConfig: {},
                scopes: ["admin"]
            }
        ]
    }
}
service mcp:StreamableHttpService /mcp on securedListener {
    // ...
}
```

The users of the file user store are defined in the `Config.toml` file.

```toml
[[ballerina.auth.users]]
username="alice"
password="alice@123"
scopes=["admin"]
```

See the [MCP service security](/learn/by-example/mcp-service-security/) example.

## Consume MCP tools from a client

The `mcp:StreamableHttpClient` client connects to an MCP server, discovers its tools, and calls them.

```ballerina
mcp:StreamableHttpClient mcpClient = check new ("http://localhost:9090/mcp");
check mcpClient->initialize({name: "Weather MCP Client", version: "1.0.0"});

mcp:ListToolsResult toolsResult = check mcpClient->listTools();
mcp:CallToolResult result = check mcpClient->callTool({
    name: "getCurrentWeather",
    arguments: {"city": "Colombo"}
});
check mcpClient->close();
```

Pass `auth` (e.g., `auth = {username: "alice", password: "alice@123"}`) and other `http:ClientConfiguration` fields to the client constructor for secured servers, and pass headers to `callTool` when tools bind HTTP headers. See the [MCP client](/learn/by-example/mcp-client/) example.

## Consume MCP tools from an agent

Add an `ai:McpToolKit` to the tools of an agent to use all the tools of a server, or a subset by listing the permitted tool names.

```ballerina
import ballerina/ai;

final ai:McpToolKit weatherTools = check new ("http://localhost:9090/mcp", ["getCurrentWeather"]);

final ai:Agent weatherAgent = check new ({
    systemPrompt: {
        role: "Weather-aware AI Assistant",
        instructions: "You assist users based on accurate and timely weather information."
    },
    tools: [weatherTools],
    model: check ai:getDefaultModelProvider()
});
```

See the [Agent with MCP integration](/learn/by-example/ai-agent-mcp-integration/) example.

## Learn more

- [Build an AI agent](/learn/build-an-ai-agent/)
- The MCP examples in [Ballerina by Example](/learn/by-example/)
- [`ballerina/mcp` module](https://central.ballerina.io/ballerina/mcp/latest)
- [Model Context Protocol specification](https://modelcontextprotocol.io/specification)
