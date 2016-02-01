"use strict";

const nodeRestClient = require('node-rest-client').Client;
const client = new nodeRestClient(); 

const _defaultHost = "https://portal.cedexis.com/";

class Cedexis {
  constructor(clientId, clientSecret, options) {
  	this._clientId = clientId;
  	this._clientSecret = clientSecret;
    this._options = options || {};
    this._host = this._options.host || _defaultHost;
    this._verbose = this._options.verbose || false;
  }

  get host() {
    return this._host;
  }
  
  generateAccessToken(callback) {
    let args = {
      data: [`client_id=${this._clientId}`, `client_secret=${this._clientSecret}`, `grant_type=client_credentials`].join('&'),
      headers: { "Content-Type": "application/x-www-form-urlencoded" } 
    };

    client.post(`${this.host}api/oauth/token`, args, (data, response) => {
      this.log("Token Data: ", data);

      if (data && data.access_token && response.statusCode === 200) {
        this._token = data.access_token;
        return callback(null, data.access_token);
      }

      this.log("Token Status Code: ", response.statusCode);
      let message = setErrorMessage("Error getting access token", data);
      return callback(new RadarException(message));
    }); 
  }

  getPlatforms(filter, callback) {
    let args = {
      headers: { "Authorization": `Bearer ${this._token}` } 
    };

    client.get(`${this.host}api/v2/config/platforms.json`, args, (data, response) => {
      // Too much data for verbose
      //log("Platform Data: ", data);

      if (data && response.statusCode === 200) {
        let filtered = filter ? data.filter(filter) : data;
        this.log("Filtered Platform Data: ", filtered);
        return callback(null, filtered);
      }

      this.log("Platforms Status Code: ", response.statusCode);
      let message = setErrorMessage("Error getting platforms", data);
      return callback(new RadarException(message));
    }); 
  }

  updatePlatform(platform, callback) {
    let args = {
      data: platform,
      headers: { "Authorization": `Bearer ${this._token}`, "Content-Type": "application/json" } 
    };

    client.put(`${this.host}api/v2/config/platforms.json/${platform.id}`, args, (data, response) => {
      this.log("Update Data: ", data);

      if (data && response.statusCode === 200) {
        return callback(null, data);
      }

      this.log("Update Status Code: ", response.statusCode);
      let message = setErrorMessage("Error updating platform", data);          
      return callback(new RadarException(message));
    }); 
  }

  setErrorMessage(message, data) {
    if (data && data.developerMessage) {
      message = data.developerMessage;
    }

    return message;
  }

  log(message, data) {
    if (this._verbose) { 
      print(message + ((typeof data === 'object') ? stringify(data) : data)); 
    }
  }
}

function print(string) {
  console.log(string);
}

function stringify(json) {
  return JSON.stringify(json, null, 2);
}

function RadarException(message) {
  this.message = message;
  this.name = "RadarException";
}

module.exports = Cedexis;