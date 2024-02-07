import { expect, assert } from 'chai';
import sinon from 'sinon';
//Take advantage of Node module caching to stub the base modules
import fs from 'fs';

import {loadLocalConfig} from "../util/oci-config-loader.js";

describe("OCI Config File Parser", function () {
  it("Should parse an OCI config file holding 'key=value' pairs", function () {
    let fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(() => { return "[default]\nuser=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4" });
    let expectedConfig = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value4" };
    let config = loadLocalConfig("/dummy", "default");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  it("Should include the pass_phrase if specified", function () {
    let fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(() => { return "[default]\nuser=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4\npass_phrase=value5" });
    let expectedConfig = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value4", "pass_phrase": "value5" };
    let config = loadLocalConfig("/dummy", "default");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  it("Should handle comments in the file", function () {
    let fakefs = sinon.stub(fs, "readFileSync");
    fakefs.callsFake(() => { return "[default]\nuser=value1 #username here\nfingerprint=value2 #fingerprint here\nkey_file=value3\ntenancy=value4\n" });
    let expectedConfig = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value4" };
    let config = loadLocalConfig("/dummy");
    expect(config).to.deep.equal(expectedConfig);
    fakefs.restore();
  });

  describe("Profile Selection", function () {
    it("Should handle requesting a profile", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => { return "[default]\nuser=othervalue\n\n[profile1]\nuser=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4" });
      let expectedProfile = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value4" };
      let config = loadLocalConfig("/dummy", "profile1");
      expect(config).to.deep.equal(expectedProfile);
      fakefs.restore();
    });
    it("Should return the default profile if none requested", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => {
        return "[profile1]\nuser=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4\n"
          + "\n[default]\nuser=value5\nfingerprint=value6\nkey_file=value7\ntenancy=value8"
      });
      let expectedDefaultProfile = { "user": "value5", "fingerprint": "value6", "key_file": "value7", "tenancy": "value8" };;
      let config = loadLocalConfig("/dummy");
      expect(config).to.deep.equal(expectedDefaultProfile);
      fakefs.restore();
    });
    it("Should inherit values from default if not specified in the requested profile", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => {
        return "[profile1]\nuser=value1\nfingerprint=value2\nkey_file=value3\n"
          + "\n[default]\nuser=value5\nfingerprint=value6\nkey_file=value7\ntenancy=value8"
      });
      let expectedConfig = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value8" };
      let config = loadLocalConfig("/dummy", "profile1");
      expect(config).to.deep.equal(expectedConfig);
      fakefs.restore();
    });
    it("Should assume that an unnamed profile is the default", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => { return "user=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4\n" });
      let expectedConfig = { "user": "value1", "fingerprint": "value2", "key_file": "value3", "tenancy": "value4" };
      let config = loadLocalConfig("/dummy", "default");
      expect(config).to.deep.equal(expectedConfig);
      fakefs.restore();
    });
    it("Should throw an error if the requested profile isn't present in the file", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => {
        return "[profile1]\nuser=value1\nfingerprint=value2\nkey_file=value3\ntenancy=value4\n"
          + "\n[default]\nuser=value5\nfingerprint=value6\nkey_file=value7\ntenancy=value8"
      });
      try {
        let config = loadLocalConfig("/dummy", "profile2");
      } catch (e) {
        expect(e).to.be.an("error");
        expect(e.message).to.equal("No profile \"profile2\" in config file!");
      }
      fakefs.restore();
    });
  });

  describe("Config Format Validation", function () {
    it("Should throw an error if a profile name is malformed", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => { return "[profile1\nkey1=value1\nkey2=value2\nkey3=value3" });
      let expectedConfig = { "key1": "value1", "key2": "value2", "key3": "value3" };
      try {
        let config = loadLocalConfig("/dummy");
        assert.fail("Error should have been thrown from passing malformed profile");
      } catch (e) {
        expect(e).to.be.an("error");
        expect(e.message).to.equal("Config file is malformed - profile name line: \"[profile1\" is invalid!")
      }
      fakefs.restore();
    });
    it("Should throw an error if a key/value line is malformed", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => { return "[profile1]\nkey1=value1\nkey2 value2\nkey3=value3" });
      try {
        let config = loadLocalConfig("/dummy");
        assert.fail("Error should have been thrown from passing malformed profile");
      } catch (e) {
        expect(e).to.be.an("error");
        expect(e.message).to.equal("Config file is malformed - line: \"key2 value2\" is invalid!")
      }
      fakefs.restore();
    });
    it("Should throw an error if one or more required fields are not present", function () {
      let fakefs = sinon.stub(fs, "readFileSync");
      fakefs.callsFake(() => {
        return "[profile1]\nfingerprint=value2\nkey_file=value3\ntenancy=value4\n"
          + "\n[default]\nkey_file=value7\ntenancy=value8"
      });
      try {
        let config = loadLocalConfig("/dummy", "profile1");
        assert.fail("Error should have been thrown from passing malformed profile");
      } catch (e) {
        expect(e).to.be.an("error");
        expect(e.message).to.equal("Required field [\"user\"] not present in the config file.")
      }
      try {
        let config = loadLocalConfig("/dummy");
        assert.fail("Error should have been thrown from passing malformed profile");
      } catch (e) {
        expect(e).to.be.an("error");
        expect(e.message).to.equal("Required field [\"user\",\"fingerprint\"] not present in the default profile in the config file.")
      }
      fakefs.restore();
    });
  });
});