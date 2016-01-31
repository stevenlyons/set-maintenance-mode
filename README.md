# set-maintenance-mode

## Setup

This is a simple node.js app, just pull the files to a location and npm install:

```
$ npm install
```

Portal:
* Get an OAuth token from the Portal for the desired account.
* In the script, update the url, client id and client secret

## Run

The basic commandline:

```
$ node app.js -v -e test_sonar_1 test_sonar_2 -i script_test -s 869ffa8e...
```

The following options are available:

Option | Alias | Description
-------|-------|------------
 | | The platforms to be changed
-d | disable | Disables Maintenance Mode on all specified platforms
-e | enable | Enables Maintenance Mode on all specified platforms
-h | host | API host to call, defaults to http://portal.cedexis.com/
-i | id | Client Id
-s | secret | Client Secret
-v | verbose | Outputs additional information while processing