//Load a local OCI config, assuming there will be a similar
//setup to OCI CLI, which puts config information in ~/.oci/config
import fs from 'node:fs';
import log4js from 'log4js';
const logger = log4js.getLogger();

const expectedFields=["user", "fingerprint", "key_file", "tenancy"];
//pass_phrase is optional. Normally 'region' would be required, but it isn't used in this context.

function loadLocalConfig(filepath, profile){
  //Validate the parameters
  if(profile && typeof profile != 'string'){
    throw new SyntaxError("Invalid format for profile name, expected string, got " +typeof profile +".");
  }
  if(!filepath){
    throw new SyntaxError("Path to the config file is required.");
  }
  logger.debug("Loading OCI config file for profile [" +(profile?profile:"default") +"]");
  //Attempt to read the file
  let configStr 
  try{
    configStr = fs.readFileSync(filepath, {encoding: 'utf8'});
  } catch(e){
    logger.error("Unable to load config file!");
    throw e;
  }
  let configLines = configStr.split("\n");
  let configs = {};
  let currentConfig;
  for(let line of configLines){
    line = line.trim();
    if(line.length == 0 || line.startsWith("#") || line.startsWith("!")){
      continue;
    }
    if(line.startsWith("[")){
      //This is a profile
      try{
        let configName = line.match(/\[(.+)\]/)[1].trim().toLowerCase();
        configs[configName] = {};
        currentConfig = configName;
      }catch(e){
        throw new Error("Config file is malformed - profile name line: \"" +line +"\" is invalid!");
      }
    }else{
      try{
        //Slightly primative regex (it doens't handle escaped quotations, so um.. don't use them...)
        let [match, key, val] = line.match(/(.+)=\s*"{0,1}([^"#]*)/);
        if(!currentConfig){
          configs["default"]={};
          currentConfig = "default";
        }
        if(val && val.trim().length != 0){
          configs[currentConfig][key.trim()] = val.trim();
        }        
      }catch(e){
        throw new Error("Config file is malformed - line: \"" +line +"\" is invalid!");
      }
    }
  }
  //If a particular profile was requested...
  if(profile){
    //Assemble the response, using profile inheritance
    if(!configs[profile.toLowerCase()]){
      logger.error("Requested profile [" +profile +"] not present in config file.");
      throw new Error("No profile \"" +profile +"\" in config file!");
    }
    let profileResponse = {};
    let missingFields = [];
    for(let field of expectedFields){
      profileResponse[field]=configs[profile.toLowerCase()][field] || configs["default"][field] || null;
      if(!profileResponse[field]){
        missingFields.push(field);
      }
    }
    if(missingFields.length > 0){
      throw new Error("Required field " +JSON.stringify(missingFields) +" not present in the config file.");
    }
    //Handle pass_phrase
    if(configs[profile.toLowerCase()]["pass_phrase"] || (!configs[profile.toLowerCase()]["key_file"] && configs["default"]["pass_phrase"])){
      profileResponse["pass_phrase"] = configs[profile.toLowerCase()]["pass_phrase"] || configs["default"]["pass_phrase"];
    }
    return profileResponse;
  }
  //Otherwise, validate the default profile.
  let profileResponse = {};
  let missingFields = [];
  for(let field of expectedFields){
    if(!configs["default"][field]){
      missingFields.push(field);
    }else{
      profileResponse[field] = configs["default"][field];
    }    
  }
  if(missingFields.length > 0){
    throw new Error("Required field " +JSON.stringify(missingFields) +" not present in the default profile in the config file.");
  }
  if(configs["default"]["pass_phrase"]){
    profileResponse["pass_phrase"] = configs["default"]["pass_phrase"];
  }
  return profileResponse;
}

export {loadLocalConfig}