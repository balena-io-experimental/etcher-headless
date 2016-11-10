# etcher-headless
[WIP] etcher-based automatic drive flashing device

## Getting started

- Sign up on [resin.io](https://dashboard.resin.io/signup)
- go throught the [getting started guide](http://docs.resin.io/raspberrypi/nodejs/getting-started/) and create a new RPI zero application called `etcherHeadless`
- clone this repository to your local workspace
- set these variables in the `Fleet Configuration` application side tab if you want to use a raspberry Pi

  - `RESIN_HOST_CONFIG_max_usb_current` = `1`


- add the _resin remote_ to your local workspace using the useful shortcut in the dashboard UI ![remoteadd](https://raw.githubusercontent.com/resin-io-projects/boombeastic/master/docs/gitresinremote.png)

- `git push resin master`
- see the magic happening, your device is getting updated Over-The-Air!

## Configure via [environment variables](https://docs.resin.io/management/env-vars/)
Variable Name | Default | Description
------------ | ------------- | -------------
ETCHER_IMAGE_URL | `NaN` | The UL from which etcher downloads the image to be flashed
PORTAL_SSID | `ResinAP` | the SSID name of the Access Point the device spawns for WiFi configuration
GUI_TYPE | `none` | the Feedback device to be used (for now, you can pick the [Pimoroni blinkt LED strip](https://shop.pimoroni.com/products/blinkt) setting `ledStrip`)

## How it works
The device downloads the image set via `ETCHER_IMAGE_URL` and then checks for new media attached - every time a new one is found, it flashes the downloaded image on it. Works in parallel so you can attach and flash multiple media at the same time.

## License

Copyright 2016 Resinio Ltd.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
