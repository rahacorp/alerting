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
    constructor(laterStr, rule) {
        this.laterObj = later.parse.text(laterStr);
        this.rule = rule;
    }
    start() {
        console.log('start time trigger');
        this.timer = later.setInterval(() => this.rule.fire(), this.laterObj);
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
exports.TimeTrigger = TimeTrigger;
//# sourceMappingURL=TimeTrigger.js.map