import { DOMParser, XMLSerializer } from 'xmldom';
import moment from 'moment';
import { parseString  } from 'react-native-xml2js';

const xmlHeader = '<?xml version="1.0" encoding="utf-8"?>';

class SoapRequest {
  constructor(props) {
    if (props.security) {
      if (props.security.username && props.security.password)
        this.security = props.security;
      else
        console.error("missing security username and/or password");
    }

    if (props.targetNamespace) {
      this.targetNamespace = props.targetNamespace
    }

    if (props.commonTypes) {
      this.commonTypes = props.commonTypes;
    }

    if (props.requestURL) {
      this.requestURL = props.requestURL;
    }

    this.xmlRequest = null;
    this.xmlResponse = null;
    this.responseDoc = null;
  }

  createRequest(request) {
    this.xmlDoc = new DOMParser().parseFromString('<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"></soap:Envelope>');
    this.rootElement = this.xmlDoc.documentElement;

    if (this.targetNamespace) {
      this.rootElement.setAttribute('xmlns:ch0', this.targetNamespace);
      this.rootElement.setAttribute('xmlns:tns', this.targetNamespace);
    }

    if (this.commonTypes) {
      this.rootElement.setAttribute('xmlns:ch1', this.commonTypes);
      this.rootElement.setAttribute('xmlns:cmn', this.commonTypes);
    }

    this.generateHeader();

    // Build request body
    const bodyElement = this.appendChild(this.rootElement, 'soap:Body');

    this.eachRecursive(request, bodyElement);


    //-------------------

    const xmlSerializer = new XMLSerializer();
    const xmlOutput = xmlSerializer.serializeToString(this.xmlDoc);
    this.xmlRequest = xmlHeader + xmlOutput;
    return this.xmlRequest;
  }

  eachRecursive(obj, parentElement)
  {
    let elementName = Object.keys(obj)[0];
    let currentElement = parentElement;

    for (var k in obj)
    {
      if (!obj.hasOwnProperty(k))
        continue;       // skip this property

      if (typeof obj[k] == "object" && obj[k] !== null) {
        if (Object.keys(obj[k]).find(x => x == 'attributes')) {
          for (var attr in obj[k].attributes) {
            currentElement.setAttribute(attr, obj[k].attributes[attr]);
          }
          delete obj[k].attributes;
        }
        this.eachRecursive(obj[k], this.appendChild(currentElement, k));
      }
      else {
        let text = obj[k];
        this.appendChild(currentElement, k, text);
      }
    }
  }

  // Append a child element
  appendChild(parentElement, name, text) {
    let childElement = this.xmlDoc.createElement(name);
    if (typeof text !== 'undefined') {
      let textNode = this.xmlDoc.createTextNode(text);
      childElement.appendChild(textNode);
    }
    parentElement.appendChild(childElement);
    return childElement;
  }

  generateHeader() {

    const headerElement = this.appendChild(this.rootElement, 'soap:Header');

    if (this.security) {
      const securityElement = this.appendChild(headerElement, 'wsse:Security');
      securityElement.setAttribute('xmlns:wsse', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd');
      securityElement.setAttribute('xmlns:wsu', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd');

      const timestampElement = this.appendChild(securityElement, 'wsu:Timestamp');
      const date = new Date();
      timestampElement.setAttribute('wsu:Id', 'Timestamp-'+date.toISOString());

      const createdElement = this.appendChild(timestampElement, 'wsu:Created', date.toISOString());
      const expiresElement = this.appendChild(timestampElement, 'wsu:Expires', moment(date).add(10, 'm').toISOString());

      const usernameTokenElement = this.appendChild(securityElement, 'wsse:UsernameToken');
      usernameTokenElement.setAttribute('xmlns:wsu', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd');
      usernameTokenElement.setAttribute('wsu:Id', 'SecurityToken-'+date.toISOString());

      const usernameElement = this.appendChild(usernameTokenElement, 'wsse:Username', this.security.username);
      const passwordElement = this.appendChild(usernameTokenElement, 'wsse:Password', this.security.password);
    }
  }


  async sendRequest() {

    if (!this.xmlRequest)
      throw new Error('Request empty, please call createRequest before sendRequest');
    if (!this.requestURL)
      throw new Error('requestURL empty!');

    try {
      let response = await fetch(this.requestURL, {
          method: 'POST',
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml',
          },
          body: this.xmlRequest
          });

      this.xmlResponse = await response.text();
      console.log('xmlResponse', this.xmlResponse);

      // Beware this relies on sync callback behaviour which apparently could change in future versions of react-native-xml2js
      parseString(this.xmlResponse, (err, result) => {
        if (err) {
          throw (err);
        }
        this.responseDoc = result;
      });

      return this.responseDoc;

    } catch(error) {
      console.warn(error);
    }
  }

  async sendRequestAuth(username, password) {
    const auth = 'Basic ' + new Buffer(username + ':' + password).toString('base64');
    if (!this.xmlRequest)
      throw new Error('Request empty, please call createRequest before sendRequest');
    if (!this.requestURL)
      throw new Error('requestURL empty!');

    try {
      let response = await fetch(this.requestURL, {
          method: 'POST',
          headers: {
            'Accept': 'text/xml',
            'Content-Type': 'text/xml',
            'Authorization': auth
          },
          body: this.xmlRequest
          });

      this.xmlResponse = await response.text();
      console.log('xmlResponse', this.xmlResponse);

      // Beware this relies on sync callback behaviour which apparently could change in future versions of react-native-xml2js
      parseString(this.xmlResponse, (err, result) => {
        if (err) {
          throw (err);
        }
        this.responseDoc = result;
      });

      return this.responseDoc;

    } catch(error) {
      console.warn(error);
    }
  }
}

export default SoapRequest;
