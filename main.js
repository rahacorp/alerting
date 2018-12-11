"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var later = require("later");
var Startup = /** @class */ (function () {
    function Startup() {
    }
    Startup.main = function () {
        var a = 3;
        var textSched = later.parse.text('at 10:15am every weekday');
        var cronSched = later.parse.cron('0 0/5 14,18 * * ?');
        var recurSched = later.parse.recur().last().dayOfMonth();
        var manualSched = { schedules: [{ M: 3, D: 21 }] };
        console.log(later.schedule(textSched).next(10));
        console.log('Hello ds xwe', a);
        return 0;
    };
    return Startup;
}());
Startup.main();
//# sourceMappingURL=main.js.map