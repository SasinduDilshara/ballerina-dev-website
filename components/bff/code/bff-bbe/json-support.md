---
title: 'Streamline Backend Data Handling'
description: Ballerina has built-in support for multi-part payloads, constraint validations, transformations, and, enrichments for working with complex payloads.

url: 'https://github.com/SasinduDilshara/BFF-Samples/tree/dev/ballerina_rest_payload_validation'
---
```
service /crm on new http:Listener(9090) {
    
    resource function get customers/[string customerId]/agreement() 
            returns byte[]|http:InternalServerError {
        byte[]|error agreementForm = getAgreementForm(customerId);
        if agreementForm is error {
            return <http:InternalServerError>{
                body: {message: "Agreement form not found for the customer ID: " + customerId}
            };
        }
        return agreementForm;
    }

    resource function post customers(http:Request request) 
            returns http:Created|http:InternalServerError {
        do {
            mime:Entity[] bodyParts = check request.getBodyParts();
            string registrationDataString = check bodyParts[0].getText();
            CustomerData registrationData = check registrationDataString.fromJsonStringWithType();
            byte[] image = check bodyParts[1].getByteArray();
            byte[] agreemntForm = check bodyParts[2].getByteArray();
            string customerId = check registerCustomer(registrationData, agreemntForm, image);
            return <http:Created>{body: {message: "Customer registered successfully.", customerId}};
        } on fail error e {
            return <http:InternalServerError>{body: {message: string `Error while processing the request: ${e.message()}`}};
        }
    }
}
```