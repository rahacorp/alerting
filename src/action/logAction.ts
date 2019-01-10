import { Action } from "./action";
import * as util from 'util'
export class LogAction implements Action {
    name: string
    constructor(name: string) {
        this.name = name
    }
    
    act(obj: any) {
        console.log('[' + this.name + ']', obj)
    }
}