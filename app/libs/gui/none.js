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

    noneGui.prototype.dwnloadStart = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.dwnloadComplete = function(i) {
        "use strict";
        return true;
    };

    noneGui.prototype.dwnloadError = function(i) {
        "use strict";
        return true;
    };

    module.exports = noneGui();

}
