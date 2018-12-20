import * as later from 'later'
import { Rule } from '../rule/rule';
import { Trigger } from './Trigger';

export class TimeTrigger implements Trigger {
    laterObj;
    fire: () => void;
    timer
    rule: Rule

    constructor(laterStr: string, rule : Rule) {
        this.laterObj = later.parse.text(laterStr);
        this.rule = rule
    }

    start() {
        console.log('start time trigger')
        this.timer = later.setInterval(() => this.rule.fire(), this.laterObj);
    }

    stop() {
        if(this.timer) {
            this.timer.clear()
            this.timer = undefined
        } else {
            throw new Error('trying to stop a stopped trigger')
        }
    }
}