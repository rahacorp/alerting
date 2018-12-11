"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var later = require("later");
var TimeTrigger = /** @class */ (function () {
    function TimeTrigger(laterStr, fireFunc) {
        this.laterObj = later.parse.text(laterStr);
        this.fire = fireFunc;
    }
    TimeTrigger.prototype.start = function () {
        this.timer = later.setInterval(this.fire, this.laterObj);
    };
    TimeTrigger.prototype.stop = function () {
        if (this.timer) {
            this.timer.clear();
            this.timer = undefined;
        }
        else {
            throw new Error('trying to stop a stopped trigger');
        }
    };
    return TimeTrigger;
}());
//# sourceMappingURL=TimeTrigger.js.map