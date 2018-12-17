"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vm2_1 = require("vm2");
class Context {
    constructor() {
        this.sandbox = {};
        this.vm = new vm2_1.NodeVM({
            sandbox: this.sandbox,
            require: {
                external: ['flat'],
                builtin: ['JSON']
            },
            wrapper: 'none'
        });
        this.vm.run('ctx = {}');
    }
    print() {
        console.log(this.vm.run('return ctx'));
    }
    set(addr, obj) {
        obj = JSON.stringify(obj);
        let code = 'ctx.' + addr + '= JSON.parse(\'' + obj + '\')';
        //console.log(code)
        this.vm.run(code);
        //console.log(this.vm.run('return ctx'))
    }
    get(val) {
        return this.vm.run('return ctx.' + val);
        //return safeEval(val, this.ctx)
    }
}
exports.Context = Context;
//# sourceMappingURL=context.js.map