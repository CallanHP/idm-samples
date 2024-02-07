import { expect } from 'chai';
import sinon from 'sinon';

import OciRequestSigner from "../util/oci-sign.js";

//Using the samples from the OCI Docs
const samplePrivate = "-----BEGIN RSA PRIVATE KEY-----\n"
  + "MIICXgIBAAKBgQDCFENGw33yGihy92pDjZQhl0C36rPJj+CvfSC8+q28hxA161QF\n"
  + "NUd13wuCTUcq0Qd2qsBe/2hFyc2DCJJg0h1L78+6Z4UMR7EOcpfdUE9Hf3m/hs+F\n"
  + "UR45uBJeDK1HSFHD8bHKD6kv8FPGfJTotc+2xjJwoYi+1hqp1fIekaxsyQIDAQAB\n"
  + "AoGBAJR8ZkCUvx5kzv+utdl7T5MnordT1TvoXXJGXK7ZZ+UuvMNUCdN2QPc4sBiA\n"
  + "QWvLw1cSKt5DsKZ8UETpYPy8pPYnnDEz2dDYiaew9+xEpubyeW2oH4Zx71wqBtOK\n"
  + "kqwrXa/pzdpiucRRjk6vE6YY7EBBs/g7uanVpGibOVAEsqH1AkEA7DkjVH28WDUg\n"
  + "f1nqvfn2Kj6CT7nIcE3jGJsZZ7zlZmBmHFDONMLUrXR/Zm3pR5m0tCmBqa5RK95u\n"
  + "412jt1dPIwJBANJT3v8pnkth48bQo/fKel6uEYyboRtA5/uHuHkZ6FQF7OUkGogc\n"
  + "mSJluOdc5t6hI1VsLn0QZEjQZMEOWr+wKSMCQQCC4kXJEsHAve77oP6HtG/IiEn7\n"
  + "kpyUXRNvFsDE0czpJJBvL/aRFUJxuRK91jhjC68sA7NsKMGg5OXb5I5Jj36xAkEA\n"
  + "gIT7aFOYBFwGgQAQkWNKLvySgKbAZRTeLBacpHMuQdl1DfdntvAyqpAZ0lY0RKmW\n"
  + "G6aFKaqQfOXKCyWoUiVknQJAXrlgySFci/2ueKlIE1QqIiLSZ8V8OlpFLRnb1pzI\n"
  + "7U1yQXnTAEFYM560yJlzUpOb1V4cScGd365tiSMvxLOvTA==\n"
  + "-----END RSA PRIVATE KEY-----";

const placeholderKeyId = "ocid1.tenancy.oc1..<unique_ID>/ocid1.user.oc1..<unique_ID>/<key_fingerprint>"

var clock;

describe("API Signing implementation", function () {
  //Stub the date method to set it to the sample time
  before(function () { clock = sinon.useFakeTimers(1388957500000); })
  after(function () { clock.restore(); })

  it("Signs a GET Request with placeholder values.", function () {
    let signer = new OciRequestSigner(placeholderKeyId, samplePrivate);
    //Using the samples from the OCI Docs
    let request = {
      url: "https://iaas.us-phoenix-1.oraclecloud.com/20160918/instances?availabilityDomain=Pjwf%3APHX-AD-1"
        + "&compartmentId=ocid1.compartment.oc1..<unique_ID>" +
        "&displayName=TeamXInstances" +
        "&volumeId=ocid1.volume.oc1.phx..<unique_ID>",
      method: "GET",
      headers: {}
    }
    let expectedAuthZ = 'Signature version="1",keyId="ocid1.tenancy.oc1..<unique_ID>/ocid1.user.oc1..<unique_ID>/<key_fingerprint>",'
      + 'algorithm="rsa-sha256",headers="date (request-target) host",'
      + 'signature="nUo0x87DEV2xf6jYBo9igC2YWxm/C+2DFTzIFs4XiC71JVqeh4KEdVCmK0j2GZFbw+OZLC0j+PH2'
      + 'aU390KkTjy5Tk6FLzzap3NSpT0booSP1mKYKsTlVqerHJJi3Sp8BfGK+FjpLlyaaqKYO+i/4PrzrWHKSBN/syHrIloPPK98="';
    let expectedHostname = "iaas.us-phoenix-1.oraclecloud.com";
    let expectedDate = "Sun, 05 Jan 2014 21:31:40 GMT"
    request = signer.signRequest(request);
    expect(request.headers["Authorization"]).to.equal(expectedAuthZ);
    expect(request.headers["hostname"]).to.equal(expectedHostname);
    expect(request.headers["date"]).to.equal(expectedDate);
  });

  it("Signs a POST Request with placeholder values.", function () {
    let signer = new OciRequestSigner(placeholderKeyId, samplePrivate);
    //Using the samples from the OCI Docs
    let request = {
      url: "https://iaas.us-phoenix-1.oraclecloud.com/20160918/volumeAttachments",
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{\n'
        + '   "compartmentId": "ocid1.compartment.oc1..<unique_id>",\n'
        + '   "instanceId": "ocid1.instance.oc1.phx.<unique_id>"\n'
        + '   "volumeId": "ocid1.volume.oc1.phx.<unique_id>"\n'
        + '}'
    }
    let expectedAuthZ = 'Signature version="1",keyId="ocid1.tenancy.oc1..<unique_ID>/ocid1.user.oc1..<unique_ID>/<key_fingerprint>",'
      + 'algorithm="rsa-sha256",headers="date (request-target) host content-type content-length x-content-sha256",'
      + 'signature="wdQpB1eeILOzR3Z+syZBPSwEQ+LNBGr1Eh/ZHSI/FKluHofk/WsIkDOlIGAaMpvZPK1u0ExC1rBZbaPJ'
      + 'sHYFQMSyhblIqPI9Q8mMwmQbLCq0DhQ+7tQWFBVcksP5LQ1xb95OI/4HrMZl4gklQYONaQ6v7emyKvKIUhNZsdPvMmg="';
    let expectedHostname = "iaas.us-phoenix-1.oraclecloud.com";
    let expectedDate = "Sun, 05 Jan 2014 21:31:40 GMT"
    request = signer.signRequest(request);
    expect(request.headers["Authorization"]).to.equal(expectedAuthZ);
    expect(request.headers["hostname"]).to.equal(expectedHostname);
    expect(request.headers["date"]).to.equal(expectedDate);
  })

});