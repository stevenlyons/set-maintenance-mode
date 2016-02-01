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

const Cedexis = require('./cedexis.js');
const async = require('async');
const minimist = require('minimist');

const _host = "https://portal.cedexis.com/";
const _clientId = "";
const _clientSecret = "";

const _options = extractOptions();
const cedexis = new Cedexis(_options.id, _options.secret, { host: _options.host, verbose: _options.verbose });
let _token;

main();

function main() {
  log("Options: ", _options);

  if ((_options.enable && _options.disable) ||
      (_options.platforms.length === 0)) {
    print("Error: Specify at least one platform and whether to enable or disable");
    process.exit(1);
  }

  print(startMessage(_options));

  // async === ugly
  async.waterfall([
      generateAccessToken,
      getPlatforms
    ], 
    function (err, result) {

      // Update each of the platforms that are specified
      async.each (result, updatePlatform, function(err) {
        if (err) {
          print("Error: " + err.message);
          process.exit(1);
        }

        print("Finished updating platforms");
      });
  });
}

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

function filterPlatforms(value) {
  return _options.platforms.indexOf(value.name) >= 0;
}

function generateAccessToken(callback) {
  return cedexis.generateAccessToken(callback)
}

function getPlatforms(token, callback) {
  return cedexis.getPlatforms(filterPlatforms, callback)
}

function updatePlatform(platform, callback) {
  if (!(_options.enable || _options.disable)) {
    return callback(new Exception("No update specified"));
  }
  
  // enable = true, disable = false
  var status = _options.enable;

  print(`${status ? "Enabling" : "Disabling"} maintenance mode on: ${platform.displayName} - ${platform.name}`);

  if (platform && platform.sonarConfig) {
    platform.sonarConfig.maintenanceMode = status;
  }

  cedexis.updatePlatform(platform, callback);
}

function print(string) {
  console.log(string);
}

function stringify(json) {
  return JSON.stringify(json, null, 2);
}

function log(message, data) {
  if (_options.verbose) { 
    print(message + ((typeof data === 'object') ? stringify(data) : data)); 
  }
}

function Exception(message) {
  this.message = message;
  this.name = "Exception";
}