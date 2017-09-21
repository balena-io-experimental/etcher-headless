#!/usr/bin/env bash

# DEBUG='multiwrite*' \
IMAGE_DATA_DIR='/Users/Jonas/Work/etcher-headless/data' \
IMAGE_URL='https://github.com/resin-io/etcher/releases/download/v1.1.2/resin-beastv3pitft-2.3.0+rev1-dev-v6.1.3.img' \
DRIVE_BLACKLIST='/dev/disk0,/dev/disk1' \
  node app/index.js
