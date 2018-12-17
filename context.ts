import safeEval from 'safe-eval'
import * as flat from 'flat'
import {NodeVM} from 'vm2'
import * as util from 'util'

export class Context {
    ctx : any
    sandbox: any
    vm : any

    constructor() {
        this.sandbox = {}
        this.vm = new NodeVM({
            sandbox: this.sandbox,
            require: {
                external: ['flat'],
                builtin: ['JSON']
            },
            wrapper: 'none'
        })
        this.vm.run('ctx = {}')
    }

    public print() {
        console.log(this.vm.run('return ctx'))
    }

    public set(addr : string, obj : any) {
        obj = JSON.stringify(obj)
        let code = 'ctx.' + addr + '= JSON.parse(\'' + obj + '\')'
        //console.log(code)
        this.vm.run(code)
        //console.log(this.vm.run('return ctx'))
    }

    public get(val: string) {
        return this.vm.run('return ctx.' + val)

        //return safeEval(val, this.ctx)
    }
}