#!/bin/env node

{

    let noneGui = function() {
        "use strict";
        if (!(this instanceof noneGui)) return new noneGui();
        this.initialized = false;
    };

    ledStrip.prototype.ready = function() {
        "use strict";
        return true;
    };

    ledStrip.prototype.write = function(i) {
        "use strict";
        return true;
    };

    ledStrip.prototype.verify = function(i) {
        "use strict";
        return true;
    };

    ledStrip.prototype.done = function(i) {
        "use strict";
        return true;
    };

    ledStrip.prototype.dwnloadStart = function(i) {
        "use strict";
        return true;
    };

    ledStrip.prototype.dwnloadComplete = function(i) {
        "use strict";
        return true;
    };

    ledStrip.prototype.dwnloadError = function(i) {
        "use strict";
        return true;
    };

    module.exports = noneGui();

}
