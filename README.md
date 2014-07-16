# nzero-push

## ToDo

* better documentation!
* all endpoints

## Description

ZeroPush is a simple service for sending Apple Push Notifications. This library wraps the API requests for use in NodeJS.

## Install

```
$ npm install [--save] nzero-push
```

## Usage

```javascript
var ZeroPush = require("nzero-push");

var zeroPush = new ZeroPush("auth-token");

zeroPush.notify(platform, requiredParams, optionalParams);
```

###### platform

`ios-mac` or `safari`

###### requiredParams

```
{ "device_tokens": [ "token-1", "token-2", ... ] }
```

or

```
{
	"device_tokens": [ "token-1", "token-2", ... ],
	"title": "title",
	"body": "body"
}
```

###### optionalParams

```
{
	"content_available": true,
	"expiry": 12345,
	"info": "{ \"info\": \"lol\" }" or { "info": "lol" },
	"sound": "default",
	"badge": 1 or "+1" or "-1",
	"alert": "alert" or { "body": "body", "action-loc-key": "action", "loc-key": "loc-key", "loc-args": [ "args-1", "args-2", ... ], "launch-image": "image" }
}
```

or

```
{
	"url_args": [ "args-1", "args-2", ... ],
	"expiry": 12345,
	"label": "label"
}
```