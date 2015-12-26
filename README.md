# nzero-push

[![NPM version](https://img.shields.io/npm/v/nzero-push.svg?style=flat-square)](http://badge.fury.io/js/nzero-push)
[![Dependency Status](https://img.shields.io/david/linitix/nzero-push.svg?style=flat-square)](https://david-dm.org/linitix/nzero-push)
[![License](https://img.shields.io/npm/l/nzero-push.svg?style=flat-square)]()
[![NPM Downloads](https://img.shields.io/npm/dm/nzero-push.svg?style=flat-square)]()
[![Code Climate](https://img.shields.io/codeclimate/github/linitix/nzero-push.svg?style=flat-square)](https://codeclimate.com/github/linitix/nzero-push)

## Description

ZeroPush is a simple service for sending Push Notifications (Apple & Google). This library wraps the API requests for use in NodeJS.

## Changes log

See [changes log](CHANGES_LOG.md).

## Contributors

See [contributors](https://github.com/linitix/nzero-push/graphs/contributors).

## License

See [license](LICENSE).

## Available endpoints

* `/notify` : Sends a notification to a list of device tokens.
* `/register` : Registers a device and/or updates the devices active status or unregisters a previously registered device token.
* `/unregister` : Unregisters a previously registered device token.
* `/inactive_tokens` : Returns an array of device tokens along with the time each token was marked inactive.
* `/set_badge` : Sets a device's badge number to a given value.
* `/broadcast/:channel` : Sends a notification to all registered and active devices in specified channel.
* `/devices[/:device_token]` : Get all, one or update device(s) details.
* `/channels[/:channel_name]` : Get all, one or delete channel(s).

## Full documentation

See the [wiki](https://github.com/linitix/nzero-push/wiki) for full documentation about module API.
