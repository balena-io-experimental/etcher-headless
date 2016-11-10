#!/bin/env node

{

    let noneGui = function() {
        "use strict";
        if (!(this instanceof noneGui)) return new noneGui();
        this.initialized = false;
    };

    noneGui.prototype.ready = function() {
        "use strict";
        return true;
    };

    noneGui.prototype.write = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.verify = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.done = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.downloadStart = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.downloadComplete = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.downloadError = function(i) {
        "use strict";
        return true;
    };

    module.exports = noneGui();

}
