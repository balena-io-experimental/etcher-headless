#!/usr/bin/env bash

# DEBUG='multiwrite*' \
IMAGE_DATA_DIR='/Users/Jonas/Work/etcher-headless/data' \
IMAGE_URL='http://172.18.0.70:8080/resin-beastv3pitft-2.6.0_rev2-dev-v6.2.9.img' \
DRIVE_BLACKLIST='/dev/disk0,/dev/disk1' \
  node app/index.js
