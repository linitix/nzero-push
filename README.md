# nzero-push

## Description

ZeroPush is a simple service for sending Apple Push Notifications. This library wraps the API requests for use in NodeJS.

## Contributors

## Available endpoints

* `/notify` : Sends a notification to a list of device tokens.
* `/register` : Registers a device and/or updates the devices active status
* `/unregister` : Unregisters a previously registered device token
* `/inactive_tokens` : Returns an array of device tokens along with the time each token was marked inactive
* `/set_badge` : Sets a device's badge number to a given value
* `/subscribe/:channel` : Subscribes a device to a particular notification channel
* `/unsubscribe/:channel` : Unsubscribes a device from a particular notification channel
* `/broadcast[/:channel]` : Sends a notification to all registered and active devices. If the channel parameter is specified, only devices subscribed to that channel will recieve notifications.

## ToDo

* /!\ Maybe run some tests /!\
* Better errors handling (name and message)

## Full documentation

See the [wiki](https://github.com/linitix/nzero-push/wiki) for full documentation about module API.