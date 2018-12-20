"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const later = __importStar(require("later"));
class TimeTrigger {
    constructor(laterStr, fireFunc) {
        this.laterObj = later.parse.text(laterStr);
        this.fire = fireFunc;
    }
    start() {
        this.timer = later.setInterval(this.fire, this.laterObj);
    }
    stop() {
        if (this.timer) {
            this.timer.clear();
            this.timer = undefined;
        }
        else {
            throw new Error('trying to stop a stopped trigger');
        }
    }
}
//# sourceMappingURL=TimeTrigger.js.map