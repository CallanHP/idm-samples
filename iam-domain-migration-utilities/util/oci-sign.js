//Just going to use base nodeJS Crypto for signing
import {createHash, createSign, createPrivateKey} from 'node:crypto';

//Implement this as a class to maintain key data between calls.
class OciRequestSigner {
  constructor(keyId, key, passphrase) {
    this.keyId = keyId;
    this.passphrase = passphrase;
    this.key;
    if(passphrase && key.includes("ENCRYPTED")){
      this.key = createPrivateKey({key, passphrase});
    }else{
      this.key = createPrivateKey(key);
    }
  }

  /* Sign a 'request' with the given KeyID and Key.
   * A request is an object with:
   *  - url
   *  - method
   *  - headers
   *  - body
   * Returns an updated request, with all of the headers needed for Auth populated
   */
  signRequest(request) {
    let headersToSign = [
      "date",
      "(request-target)",
      "host"
    ];
    let headers = normaliseHeaders(request.headers);
    let nowDate = new Date().toGMTString();
    let hostname = /^https?:\/\/([^\/:]+)/.exec(request.url.trim())[1];
    let reqTarget = request.method.toLowerCase() + " " + encodeURI(request.url.trim().replace(/^https?:\/\/[^\/]+/, ""));
    let headerSigningValues = {
      "(request-target)": reqTarget,
      "host": hostname,
      "date": nowDate
    };
    let methodsThatRequireExtraHeaders = ["POST", "PUT", "PATCH"];
    if (methodsThatRequireExtraHeaders.indexOf(request.method.toUpperCase()) !== -1) {
      let body = request.body;
      //Calculate the hash of the body, then set a letiable for it.
      const hash = createHash('sha256');
      hash.update(body)
      let sha256digest = hash.digest("base64");
      headersToSign = headersToSign.concat([
        "content-type",
        "content-length",
        "x-content-sha256"
      ]);
      headerSigningValues["content-type"] = headers["content-type"];
      request.headers["Content-Length"] = body.length;
      headerSigningValues["content-length"] = body.length;
      request.headers["x-content-sha256"] = sha256digest;
      headerSigningValues["x-content-sha256"] = sha256digest;
    }
    //Establish the signing string
    let signingBase = '';
    headersToSign.forEach(function (h) {
      if (signingBase !== '') {
        signingBase += '\n';
      }
      signingBase += h.toLowerCase() + ": " + headerSigningValues[h];
    });
    //Sign it with our private key
    const sign = createSign('SHA256');
    sign.update(signingBase);
    sign.end();
    
    let hash = sign.sign( this.key, "base64");
    let signatureOptions = {
      version: "1",
      keyId: this.keyId,
      algorithm: "rsa-sha256",
      headers: headersToSign,
      signature: hash
    };
    //Parametised template for the signature string
    let template = 'Signature version="${version}",keyId="${keyId}",algorithm="${algorithm}",headers="${headers}",signature="${signature}"';
    let signature = template;
    //Fill in the parametised string using the signatureOptions we just built
    Object.keys(signatureOptions).forEach(function (key) {
      let pattern = "${" + key + "}";
      let value = (typeof signatureOptions[key] != 'string') ? signatureOptions[key].join(' ') : signatureOptions[key];
      signature = signature.replace(pattern, value);
    });
    //Set the request headers
    request.headers["Authorization"] = signature;
    request.headers["host"] = hostname;
    request.headers["date"] = nowDate;
    return request;
  }
}

//Convert all of the supplied header names to lowercase
function normaliseHeaders(headers){
  let lowerHeaders = {};
  for(let header in headers){
    lowerHeaders[header.toLowerCase()] = headers[header]
  }
  return lowerHeaders;
}

export default OciRequestSigner;