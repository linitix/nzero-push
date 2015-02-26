# nzero-push

[![Gitter](https://badges.gitter.im/Join Chat.svg)](https://gitter.im/linitix/nzero-push?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge) [![Stories in Ready](https://badge.waffle.io/linitix/nzero-push.svg?label=ready&title=Ready)](http://waffle.io/linitix/nzero-push)

## Description

ZeroPush is a simple service for sending Apple Push Notifications. This library wraps the API requests for use in NodeJS.

## To do

* /!\ Maybe run some tests /!\
* Better errors handling (name and message)

## Changes log

See [changes log](CHANGES_LOG.md).

## Contributors

See [contributors](https://github.com/linitix/nzero-push/graphs/contributors).

## License

See [license](LICENSE).

## Available endpoints

* `/notify` : Sends a notification to a list of device tokens.
* `/register` : Registers a device and/or updates the devices active status or unregisters a previously registered device token.
* `/inactive_tokens` : Returns an array of device tokens along with the time each token was marked inactive.
* `/set_badge` : Sets a device's badge number to a given value.
* `/subscribe/:channel` : Subscribes a device to a particular notification channel or unsubscribes a device from a particular notification channel.
* `/broadcast[/:channel]` : Sends a notification to all registered and active devices. If the channel parameter is specified, only devices subscribed to that channel will recieve notifications.
* `/devices[/:device_token]` : Get all, one or update device(s) details.
* `/channels[/:channel_name]` : Get all, one or delete channel(s).

## Full documentation

See the [wiki](https://github.com/linitix/nzero-push/wiki) for full documentation about module API.