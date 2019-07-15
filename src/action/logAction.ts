import { Action } from "./action";
import { Rule } from '../rule/rule'
import * as util from 'util'
export class LogAction implements Action {
    name: string
    constructor(name: string) {
        this.name = name
    }
    
    async act(obj: any, sourceID: string, relations: any, rule: Rule) {
        return console.log('[' + this.name + ']', obj)
    }
}