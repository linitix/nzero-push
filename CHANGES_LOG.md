# Changes log
###### v2.2.0

* Fix unregister method _(pull request)_
* Update channel_endpoint.js _(pull request)_

###### v2.1.2

* Fixed typo (brodcast -> broadcast)

###### v2.1.1

* Fix an issue with schema name

###### v2.1.0

* Update wiki
* Broadcast all devices for a platform and not only for a specific channel
* Retrieve inactive tokens without the `since` parameter

###### v2.0.0

* Complete rewrite of the module.
* Use JSON schema to validate all parameters.

###### v1.3.2

* Fix required & optional params checking **(PULL REQUEST)**

###### v1.3.1

* Changed the way device tokens are added on iOS **(PULL REQUEST)**

###### v1.3.0

* add `since` optional parameter for `GET /inactive_tokens`
* move changes log into his own file
* use `neo-async` instead of `async`
* upgrade all modules version
* you can now do `var zeroPush = new require("nzero-push")("iosdev_ZCERp6nYpjd1c4EMZ5h6");` instead of `var zeropush = new require("nzero-push").ZeroPush("auth-token");`

###### v1.2.0

* `notify` and `broadcast` endpoints accept Android platform

###### v1.1.0

* Add new endpoints
  * `GET /channels`
  * `GET /channels/{channel_name}`
  * `DELETE /channels/{channel_name}`
  * `GET /devices`
  * `GET /devices/{device_token}`
  * `PUT /devices/{device_token}`
  * `PATCH /devices/{device_token}`
* Update Wiki

###### v1.0.2

* Use `DELETE /register` instead of (now deprecated) `DELETE /unregister`

###### v1.0.1

* Use `Content-Type: application/json` instead of `Content-Type: application/x-www-form-urlencoded`
* Add custom errors
* Fix some issues

###### v1.0.0

* First release
