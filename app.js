// set-maintenance-mode
// Enables/disables Maintenance Mode on an Openmix platform
// Options:
// -d: disable
// -e: enable
// -h: host
// -i: id
// -s: secret
// -v: verbose

"use strict";

const async = require('async');
const nodeRestClient = require('node-rest-client').Client;
const minimist = require('minimist');

const _host = "https://portal.cedexis.com/";
const _clientId = "";
const _clientSecret = "";

const client = new nodeRestClient(); 
const _options = extractOptions();
let _token;

// async === ugly
async.waterfall([
    function (callback) {
      verboseLog("Options: ", _options);

      if ((_options.enable && _options.disable) ||
          (_options.platforms.length === 0)) {
        print("Specify at least one platform and whether to enable or disable");
        process.exit();
      }

      print(startMessage(_options));

      callback(null, _options.id, _options.secret);
    },
    generateAccessToken,
    getPlatforms
  ], 
  function (err, result) {
   // result now equals 'done'  
   //print(result); 

  async.each (result, updatePlatform, function(err) {
    if (err) {
      print("Error: " + err.message);
    }

    print("Finished updating platforms");
  });
});

function startMessage(options) {
  let message = "";
  if (options.enable || options.disable) {
    message = (options.enable ? "Enabling platforms: " 
                              : "Disabling platforms: ");
  }
  else {
    message = "No action specified on platforms: ";
  }
  return message + options.platforms.join()
}

function extractOptions() {
  let options = {
    string: ['id', 'secret'],
    boolean: ['disable', 'enable', 'verbose'],
    alias: {
      d: 'disable',
      e: 'enable',
      h: 'host',
      i: 'id',
      s: 'secret',
      v: 'verbose',
    },
    default: {
      d: false,
      e: false,
      h: _host,
      i: _clientId,
      s: _clientSecret,
      v: false
    }
  };
  let argv = minimist(process.argv.slice(2), options);

  // Set _ to platforms (since alias doesn't work for _)
  if (argv && argv._) {
    argv.platforms = argv._;
  }

  return (argv) ? argv : {};
}

function generateAccessToken(clientId, clientSecret, callback) {
  let args = {
    data: [`client_id=${clientId}`, `client_secret=${clientSecret}`, `grant_type=client_credentials`].join('&'),
    headers: { "Content-Type": "application/x-www-form-urlencoded" } 
  };

  client.post(`${_options.host}api/oauth/token`, args, function(data, response) {
    verboseLog("Token Data: ", data);

    if (data && data.access_token && response.statusCode === 200) {
      _token = data.access_token;
      return callback(null, data.access_token);
    }

    verboseLog("Token Status Code: ", response.statusCode);

    let message = "Error getting access token";
    if (data && data.developerMessage) {
      message = data.developerMessage;
    }
        
    return callback(new RadarException(message));
  }); 
}

function getPlatforms(token, callback) {
  let args = {
    headers: { "Authorization": `Bearer ${token}` } 
  };

  client.get(`${_options.host}api/v2/config/platforms.json`, args, function(data, response) {
    // Too much data for verbose
    //verboseLog("Platform Data: ", data);

    if (data && response.statusCode === 200) {
      let filtered = data.filter(filterPlatforms);
      verboseLog("Filtered Platform Data: ", filtered);
      return callback(null, filtered);
    }

    verboseLog("Platforms Status Code: ", response.statusCode);

    let message = "Error getting platforms";
    if (data && data.developerMessage) {
      message = data.developerMessage;
    }
        
    return callback(new RadarException(message));
  }); 
}

function updatePlatform(platform, callback) {
  if (!(_options.enable || _options.disable)) {
    return callback(null, null);
  }
  
  // enable = true, disable = false
  var status = _options.enable;

  print(`${status ? "Enabling" : "Disabling"} maintenance mode on: ${platform.displayName} - ${platform.name}`);

  if (platform && platform.sonarConfig) {
    platform.sonarConfig.maintenanceMode = status;
  }
  verboseLog("update", platform);

  let args = {
    data: platform,
    headers: { "Authorization": `Bearer ${_token}`, "Content-Type": "application/json" } 
  };

  client.put(`${_options.host}api/v2/config/platforms.json/${platform.id}`, args, function(data, response) {
    verboseLog("Update Data: ", data);

    if (data && response.statusCode === 200) {
      return callback(null, data);
    }

    verboseLog("Update Status Code: ", response.statusCode);

    let message = "Error updating platform";
    if (data && data.errorDetails && data.errorDetails[0].developerMessage) {
      message = data.errorDetails[0].developerMessage;
    }
        
    return callback(new RadarException(message));
  }); 
}

function filterPlatforms(value) {
  return _options.platforms.indexOf(value.name) >= 0;
}

function print(string) {
  console.log(string);
}

function stringify(json) {
  return JSON.stringify(json, null, 2);
}

function verboseLog(message, data) {
  if (_options.verbose) { 
    print(message + ((typeof data === 'object') ? stringify(data) : data)); 
  }
}

function RadarException(message) {
  this.message = message;
  this.name = "RadarException";
}
