# nzero-push

## Description

ZeroPush is a simple service for sending Apple Push Notifications. This library wraps the API requests for use in NodeJS.

## Contributors

NEED YOUR HELP (if you have an account and a sample mobile app)

## Available endpoints

* `/notify` : Sends a notification to a list of device tokens.
* `/register` : Registers a device and/or updates the devices active status
* `/unregister` : Unregisters a previously registered device token
* `/inactive_tokens` : Returns an array of device tokens along with the time each token was marked inactive
* `/set_badge` : Sets a device's badge number to a given value

## ToDo

* better documentation!
* all endpoints
* better errors handling (name and message)

## Full documentation

See the [wiki](https://github.com/linitix/nzero-push/wiki) for full documentation about module API.