import { Context } from "../context/context";
import { Trigger } from "../trigger/Trigger";

export class Rule {
    context : Context
    trigger : Trigger
    inputs : Input[]
    pkg : string
    name : string
    description : string

    constructor(name : string, description : string, pkg : string) {
        this.context = new Context()
        this.inputs = []
        this.name = name
        this.description = description
        this.pkg = pkg
    }

    setTrigger(trigger : Trigger) {
        this.trigger = trigger
    }
    
    start() {
        this.trigger.start()
    }

    addInput(input: Input) {
        this.inputs.push(input)
    }

    async fire() {
        console.log('fire in the hole')
        for(let input of this.inputs) {
            await input.execute()
        }
        this.context.print()
        console.log('done')
    }

    getContext() : Context {
        return this.context
    }
}