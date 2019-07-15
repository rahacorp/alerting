import { PostProcess } from "./PostProcess";
import { Context } from "../context/context"
import { Action } from "../action/action"
import { Rule } from "../rule/rule";
import crypto from 'crypto'

export class PostProcessIterate implements PostProcess {
    condition: string
    context: Context
    action: Action
    iterateObject: string
    iterateObjectName: string
    iterateCondition: string //ctx.obj._source.eventID = 1
    innerIterate: PostProcessIterate
    key: any
    rule: Rule


    constructor(condition: string, context: Context, action: Action, iterateObject: string, 
        iterateObjectName: string, iterateCondition: string, innerIterate: PostProcessIterate,
        key: any, rule: Rule) {
        // this.condition = condition
        this.context = context
        this.action = action
        this.iterateObject = iterateObject
        this.iterateObjectName = iterateObjectName
        this.iterateCondition = iterateCondition
        this.innerIterate = innerIterate
        this.key = key
        this.rule = rule
    }

    conditionMet() {
        if(this.condition) {
            return this.context.evaluate(this.condition)
        } else {
            return true
        }
    }

    execute() {
        return new Promise(async (resolve, reject) => {
            if (this.conditionMet()) {
                console.log('postprocess eval true')
                let objects = this.context.get(this.iterateObject)
                for (let obj of objects) {
                    this.context.set(this.iterateObjectName, obj)
                    if (this.context.evaluate(this.iterateCondition)) {
                        //this.action.act('iterate rule fired ' + this.iterateCondition + obj)
                        // let sourceID = new Date().toString()
                        // if(obj._id && obj._index) {
                            // sourceID = obj._index + '/' + obj._id
                        // }
                        if(this.innerIterate) {
                            await this.innerIterate.execute()
                        }
                        if(this.action) {
                            let sourceObj = obj
                            if(this.key) {
                                sourceObj = this.context.formatObject(this.key)
                            }
                            let sourceID = crypto.createHash('sha1').update(JSON.stringify(sourceObj)).digest('hex') + ':' + new Date().toLocaleDateString()
                            // console.log('postprocess action:', sourceID, sourceObj)
                            let actionResp = await this.action.act(sourceObj, sourceID, {}, this.rule)
                            // console.log('postprocess dn action', actionResp)
                        }
                    } else {
                        console.log('iterate condition is false : ' + this.iterateCondition)
                    }
                }
                this.context.set(this.iterateObjectName, {})
            }
            console.log('post process iterate done')
            resolve()
        })
        
    }
}