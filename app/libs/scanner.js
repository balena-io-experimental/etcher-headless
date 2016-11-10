const _ = require('lodash');
const Bluebird = require('bluebird');
const drivelist = Bluebird.promisifyAll(require('drivelist'));

let CURRENT_DRIVES = [];
let WHOLE_DRIVES = [];

const scan = () => {
    "use strict";
    return drivelist.listAsync().then((drives) => {
        WHOLE_DRIVES = _.cloneDeep(drives);
        return _.map(_.reject(drives, {
            system: true
        }), 'device');
    });
};

exports.poll = (callback) => {
    "use strict";
    return scan().then((drives) => {
        const newDrives = _.difference(drives, CURRENT_DRIVES);
        if (!_.isEmpty(newDrives)) {
            _.each(newDrives, (drive) => {
                callback({
                    device: drive,
                    size: _.find(WHOLE_DRIVES, {
                        device: drive
                    }).size
                });
            });
        }
        CURRENT_DRIVES = drives;

        return new Bluebird((resolve, reject) => {
            setTimeout(() => {
                return exports.poll(callback).then(resolve).catch(reject);
            }, 2000);
        });
    });
};
