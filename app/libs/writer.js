const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const imageWrite = require('etcher-image-write');
const Bluebird = require('bluebird');
const umount = Bluebird.promisifyAll(require('umount'));
const scanner = require('./scanner');

exports.start = (image) => {
    "use strict";
    const emitter = new EventEmitter();

    scanner.poll((newDrive) => {
        console.log(`Unmounting ${newDrive.device}`);
        return umount.umountAsync(newDrive.device).then(() => {
            console.log(`Unmounted successfully ${newDrive.device}`);
            const writer = imageWrite.write({
                fd: fs.openSync(newDrive.device, 'rs+'),
                device: newDrive.device,
                size: newDrive.size
            }, {
                stream: fs.createReadStream(image),
                size: fs.statSync(image).size
            }, {
                check: true
            });

            writer.on('progress', function(state) {
                emitter.emit('progress', {
                    device: newDrive.device,
                    state: state
                });
            });

            writer.on('error', function(error) {
                emitter.emit('error', {
                    device: newDrive.device,
                    error: error
                });
            });

            writer.on('done', function(results) {
                console.log(`Unmounting ${newDrive.device}`);
                return umount.umountAsync(newDrive.device).then(() => {
                    console.log(`Unmounted successfully ${newDrive.device}`);
                    emitter.emit('done', {
                        device: newDrive.device,
                        results: results
                    });
                }).catch((error) => {
                    console.error(`Unmounted error ${newDrive.device}`);
                    emitter.emit('error', {
                        device: newDrive.device,
                        error: error
                    });
                });
            });
        }).catch((error) => {
            console.error(`Unmounted error ${newDrive.device}`);
            emitter.emit('error', {
                device: newDrive.device,
                error: error
            });
        });
    }).catch((error) => {
        emitter.emit('error', {
            device: newDrive.device,
            error: error
        });
    });

    return emitter;
};

// const x = exports.start('/Users/jviotti/Downloads/Images/coreos_production_iso_image.iso');

// x.on('error', (error) => {
// console.error('Error!');
// console.error(error);
// });

// x.on('progress', (state) => {
// console.log(state);
// });

// x.on('done', (results) => {
// console.log('Done!');
// console.log(results);
// });
