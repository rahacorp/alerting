"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const context_1 = require("./context");
class Startup {
    static main() {
        let ctx = new context_1.Context();
        ctx.set('key', {});
        ctx.set("key['test']", 23);
        console.log(ctx.get('key'));
        ctx.print();
        return 0;
    }
}
Startup.main();
//# sourceMappingURL=main.js.map