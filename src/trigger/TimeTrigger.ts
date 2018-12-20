import * as later from 'later'

class TimeTrigger implements Trigger {
    laterObj;
    fire: () => void;
    timer;

    constructor(laterStr: string, fireFunc: () => void) {
        this.laterObj = later.parse.text(laterStr);
        this.fire = fireFunc;
    }

    start() {
        this.timer = later.setInterval(this.fire, this.laterObj);
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