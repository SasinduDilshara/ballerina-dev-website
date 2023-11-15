---
title: 'Automate Data Access with Ballerina'
description: Ballerina's persistence features offer a straightforward way to create a data access layer for any complex application by providing a simplified interface for CRUD operations.
url: 'https://github.com/SasinduDilshara/BFF-Samples/tree/dev/ballerina_persists'
---
```
Client dbClient = check new ();

service /sales on new http:Listener(9090) {
    resource function get orders() returns Order[]|error {
        return from Order entry in orderDatabase->/orders(Order)
            select entry;
    };

    resource function post orders(Order orderEntry) returns http:Ok|http:InternalServerError|http:BadRequest {
        orderEntry.cargoId = getCargoId();
        string[]|persist:Error submitResult = orderDatabase->/orders.post([orderEntry]);
        if submitResult is string[] {
            return http:OK;
        } 
        if submitResult is persist:ConstraintViolationError {
            return <http:BadRequest>{body: {message: string `Invalid cargo id: ${orderEntry.cargoId}`}};
        }
        return <http:InternalServerError>{
            body: {message: string `Error while inserting an order ${submitResult.message()}`}
        };
    };
}
```