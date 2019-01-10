import { PostProcess } from "./PostProcess";
import { Context } from "../context/context"
import { Action } from "../action/action"

export class PostProcessIterate implements PostProcess {
    condition: string
    context: Context
    action: Action
    iterateObject: string
    iterateObjectName: string
    iterateCondition: string //ctx.obj._source.eventID = 1

    constructor(condition: string, context: Context, action: Action, iterateObject: string, iterateObjectName: string, iterateCondition: string) {
        this.condition = condition
        this.context = context
        this.action = action
        this.iterateObject = iterateObject
        this.iterateObjectName = iterateObjectName
        this.iterateCondition = iterateCondition
    }

    execute() {
        if (this.context.evaluate(this.condition)) {
            let objects = this.context.get(this.iterateObject)
            for (let obj of objects) {
                this.context.set(this.iterateObjectName, obj)
                if (this.context.evaluate(this.iterateCondition)) {
                    //this.action.act('iterate rule fired ' + this.iterateCondition + obj)
                    this.action.act(obj)
                } else {
                    //console.log('iterate condition is false : ' + this.iterateCondition)
                }
            }
            this.context.set(this.iterateObjectName, {})
        }
    }
}