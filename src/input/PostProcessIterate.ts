import { PostProcess } from "./PostProcess";
import { Context } from "../context/context"
import { Action } from "../action/action"
import { Rule } from "../rule/rule";

export class PostProcessIterate implements PostProcess {
    condition: string
    context: Context
    action: Action
    iterateObject: string
    iterateObjectName: string
    iterateCondition: string //ctx.obj._source.eventID = 1
    rule: Rule


    constructor(condition: string, context: Context, action: Action, iterateObject: string, iterateObjectName: string, iterateCondition: string, rule: Rule) {
        this.condition = condition
        this.context = context
        this.action = action
        this.iterateObject = iterateObject
        this.iterateObjectName = iterateObjectName
        this.iterateCondition = iterateCondition
        this.rule = rule
    }

    async execute() {
        if (this.context.evaluate(this.condition)) {
            let objects = this.context.get(this.iterateObject)
            for (let obj of objects) {
                this.context.set(this.iterateObjectName, obj)
                if (this.context.evaluate(this.iterateCondition)) {
                    //this.action.act('iterate rule fired ' + this.iterateCondition + obj)
                    let sourceID = new Date().toString()
                    if(obj._id && obj._index) {
                        sourceID = obj._index + '/' + obj._id
                    }
                    await this.action.act(obj, sourceID, {}, this.rule)
                } else {
                    //console.log('iterate condition is false : ' + this.iterateCondition)
                }
            }
            this.context.set(this.iterateObjectName, {})
        }
    }
}