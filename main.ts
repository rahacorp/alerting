import {Rule} from './src/rule/rule'
import {TimeTrigger} from './src/trigger/TimeTrigger'
import {ElasticInput} from './src/input/ElasticInput'
import { LogAction } from './src/action/logAction';

class Startup {
    public static main(): number {
        let lsassRule = require('./rules/lsass_dump.js')
        let myRule = new Rule(lsassRule.name, lsassRule.description, lsassRule.package)

        for(let trigger of lsassRule.triggers) {
            if(trigger.type == 'time') {
                myRule.addTrigger(new TimeTrigger(trigger.options.text, myRule))
            } else {
                console.log('trigger type not supported :' + trigger.type)
            }
        }

        for(let ii of lsassRule.inputs) {
            if(ii.type == 'elasticsearch') {
                myRule.addInput(new ElasticInput(ii.request, myRule.context, ii.name))
            } else {
                console.log('input type not supported :' + ii.type)
            }
        }

        for(let action of lsassRule.actions) {
            if(action.type == 'console') {
                myRule.addAction(new LogAction())
            } else {
                console.log('trigger type not supported :' + action.type)
            }
        }

        myRule.setCondition(lsassRule.condition)
        myRule.start()
        return 0;
    }
}

Startup.main();