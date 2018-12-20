import safeEval from 'safe-eval'
import * as flat from 'flat'
import {NodeVM} from 'vm2'
import * as util from 'util'
import * as fs from 'fs'

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
        this.vm.run('ctx.inputs = {}')
        this.vm.run('ctx.conditions = {}')
    }

    public print() {
        console.log(this.vm.run('return ctx'))
    }

    public set(addr : string, obj : any) {
        let objStr: string
        objStr = Buffer.from(JSON.stringify(obj)).toString("base64")
        let code = "ctx." + addr + " = JSON.parse(Buffer.from('" + objStr + "', 'base64').toString())"
        //fs.writeFileSync('./code.txt', code)
        // console.log(code)
        this.vm.run(code)
        //console.log(this.vm.run('return ctx'))
    }

    public get(val: string) {
        return this.vm.run('return ctx.' + val)

        //return safeEval(val, this.ctx)
    }
}