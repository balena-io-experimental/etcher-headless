#!/bin/env node

{
    const supervisorClient = require(__dirname + '/libs/supervisorClient/supervisorClient.js');
    const imageDownloader = require(__dirname + '/libs/imageDownloader/imageDownloader.js');
    const guiType = (process.env.GUI_TYPE == null) ? "none" : process.env.GUI_TYPE;
    const gui = require(__dirname + '/libs/gui/' + process.env.guiType + '.js');
    const chalk = require('chalk');
    const Writer = require(__dirname + '/libs/writer.js');
    const debug = require('debug')('main');

    gui.ready();
    imageDownloader.download(process.env.ETCHER_IMAGE_URL);

    imageDownloader.on('start', () => {
        "use strict";
        gui.downloadStart();
    });

    imageDownloader.on('error', () => {
        "use strict";
        gui.downloadError();
    });

    imageDownloader.on('complete', () => {
        "use strict";
        gui.downloadComplete();
        const writer = Writer.start('/data/resin.img');
        writer.on('progress', (data) => {
            debug(data);
            progress(data);
        });

        writer.on('done', (data) => {
            debug(data);
            complete(data);
        });

        writer.on('error', (error) => {
            console.error('Error!');
            console.error(error);
        });
    });

    let progress = function(data) {
        "use strict";
        if (isWriting(data.state.type)) {
            gui.write(identifyDevice(data.device));
        } else {
            gui.verify(identifyDevice(data.device));
        }
    };

    let complete = function(data) {
        "use strict";
        gui.done(identifyDevice(data.device));
    };

    let identifyDevice = function(data) {
        "use strict";
        switch (data) {
            case "/dev/sda":
                return 4;
            case "/dev/sdb":
                return 3;
            case "/dev/sdc":
                return 2;
            case "/dev/sdd":
                return 1;
            default:
                return 5;

        }
    };

    let isWriting = function(data) {
        "use strict";
        if (data === "write") {
            return true;
        } else {
            return false;
        }
    };

}
