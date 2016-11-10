#!/bin/env node

{
    const EventEmitter = require('events').EventEmitter;
    const util = require('util');
    const path = require('path');
    const chalk = require('chalk');
    const fs = require('fs');
    const request = require('request');
    const debug = require('debug')('downloader');

    let imageDownloader = function() {
        'use strict';
        if (!(this instanceof imageDownloader)) return new imageDownloader();
    };
    util.inherits(imageDownloader, EventEmitter);

    imageDownloader.prototype.download = function(url) {
        "use strict";
        let self = this;
        let destPath = path.basename(url);
        let destFile = fs.createWriteStream('/data/' + destPath);
        request
            .get(url)
            .on('error', function(err) {
              self.emit('error',err);
            })
            .on('response', function(response) {
                self.emit('start',destPath);
            })
            .pipe(destFile);
        destFile.on('finish', function() {
            self.emit('complete',destPath);
        });
    };

    module.exports = new imageDownloader();
}
