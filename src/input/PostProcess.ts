import {Context} from "../context/context"
import { Rule } from '../rule/rule'
import {Action} from "../action/action"

export interface PostProcess {
    context: Context
    condition: string
    action: Action
    rule: Rule
    
    conditionMet(): boolean
    execute(): Promise<any>
}