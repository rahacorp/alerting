import { Action } from "./action";
import * as util from 'util'
export class LogAction implements Action {
    
    constructor() {

    }
    
    act(obj: any) {
        util.inspect(obj)
    }
}