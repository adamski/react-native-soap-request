# react-native-soap-request
Simple module for making SOAP requests with WSSecurity

### Install

```
npm install react-native-soap-request --save
```

### Usage

```js
const soapRequest = new SoapRequest({
  security: {
    username: 'username',
    password: 'password'
  },
  targetNamespace: 'http://soap.acme.com/2.0/soap-access-services',
  commonTypes: 'http://soap.acme.com/2.0/soap-common-types',
  requestURL: soapWebserviceURL
});

const xmlRequest = soapRequest.createRequest({
  'soap:ProductRegistrationRequest': {
    attributes: {
      'xmlns:soap': 'http://soap.acme.com/2.0/soap-access-services',
      'xmlns:cmn': 'http://soap.acme.com/2.0/soap-common-types'
    },
    'soap:productId': {
      'cmn:internalId': {
        'cmn:id': productId
      }
    },
    'soap:userId': {
      'cmn:internalId': {
        'cmn:id': userId
      }
    }
  }
});

const response = await soapRequest.sendRequest();

```
