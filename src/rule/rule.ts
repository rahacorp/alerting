import { Context } from "../context/context";
import { Trigger } from "../trigger/Trigger";
import { Action } from "../action/action";
import { Input } from "../input/Input";

export class Rule {
    context : Context
    triggers : Trigger[]
    actions : Action[]
    inputs : Input[]
    pkg : string
    name : string
    description : string
    condition: string


    constructor(name : string, description : string, pkg : string) {
        this.context = new Context()
        this.inputs = []
        this.triggers = []
        this.actions = []
        this.name = name
        this.description = description
        this.pkg = pkg
    }

    setCondition(cond: string) {
        this.condition = cond
    }
    addTrigger(trigger : Trigger) {
        this.triggers.push(trigger)
    }
    
    addAction(action: Action) {
        this.actions.push(action)
    }

    start() {
        if(this.triggers.length > 0) {
            for(let trigger of this.triggers) {
                trigger.start()
            }
        } else {
            this.fire()
        }
    }

    addInput(input: Input) {
        this.inputs.push(input)
    }

    async fire() {
        console.log('fire in the hole')
        console.log('executing inputs')
        for(let input of this.inputs) {
            console.log('=======================================================')
            console.log('executing input', input.name)
            await input.execute()
            console.log('input executed    =====================================')
            await input.postProcess()
            console.log('post process done =====================================')
        }
        if(this.context.evaluate(this.condition)) {
            console.log('eval true :', this.condition + "=======================")
            for(let action of this.actions) {
                action.act(this.name + ' matched')
            }
        } else {
            console.log('condition did not met ---------------------------------')
        }
        // console.log('context: ')
        // this.context.print()
        console.log('fire done', this.name)
    }

    getContext() : Context {
        return this.context
    }
}