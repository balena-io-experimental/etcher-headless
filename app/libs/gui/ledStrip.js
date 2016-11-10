#!/bin/env node

{
    const fs = require("fs");
    const Blinkt = require('node-blinkt');
    const leds = new Blinkt();

    let ledStrip = function() {
        "use strict";
        if (!(this instanceof ledStrip)) return new ledStrip();
        this.initialized = false;
        this.colors = {};
    };

    ledStrip.prototype.ready = function() {
        "use strict";
        let self = this;
        leds.setup();
        leds.clearAll();
        for (let i = 0; i < 8; i++) {
            leds.setPixel(i, 0, 0, 0, 0);
            leds.sendUpdate();
        }
        self.initialized = true;
    };

    ledStrip.prototype.write = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(i, 109, 9, 9, 0.3);
        leds.sendUpdate();
    };

    ledStrip.prototype.verify = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(i, 91, 192, 222, 0.3);
        leds.sendUpdate();
    };

    ledStrip.prototype.done = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(i, 34, 132, 11, 0.3);
        leds.sendUpdate();
    };

    ledStrip.prototype.downloadStart = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(7, 91, 192, 222, 0.3);
        leds.sendUpdate();
    };

    ledStrip.prototype.downloadComplete = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(7, 34, 132, 11, 0.3);
        leds.sendUpdate();
    };

    ledStrip.prototype.downloadError = function(i) {
        "use strict";
        let self = this;
        leds.setPixel(7, 109, 9, 9, 0.3);
        leds.sendUpdate();
    };

    module.exports = ledStrip();

}
