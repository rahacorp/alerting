import { Rule } from '../rule/rule'

export interface Action {
    name: string
    act(obj: any, sourceID: string, relations: any, rule: Rule): Promise<any>
}