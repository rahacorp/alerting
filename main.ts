import { Rule } from './src/rule/rule'
import { TimeTrigger } from './src/trigger/TimeTrigger'
import { ElasticInput } from './src/input/ElasticInput'
import { Input } from './src/input/Input'
import { LogAction } from './src/action/logAction';
import { PostProcessIterate } from './src/input/PostProcessIterate';
import { Action } from './src/action/action';

class Startup {
    public static main(): number {
        let lsassRule = require('./rules/lsass_dump.js')
        let myRule = new Rule(lsassRule.name, lsassRule.description, lsassRule.package)

        for (let trigger of lsassRule.triggers) {
            if (trigger.type == 'time') {
                myRule.addTrigger(new TimeTrigger(trigger.options.text, myRule))
            } else {
                console.log('trigger type not supported :' + trigger.type)
            }
        }

        for (let ii of lsassRule.inputs) {
            let input: Input

            if (ii.type == 'elasticsearch') {
                input = new ElasticInput(ii.request, myRule.context, ii.name)
            } else {
                console.log('input type not supported :' + ii.type)
            }
            if (input) {
                if (ii.post_process) {
                    for (let postProcess of ii.post_process) {
                        if (postProcess.iterate) {
                            //it's iterator
                            let action: Action = Startup.parseAction(postProcess.action)
                            input.addPostProcess(new PostProcessIterate(postProcess.condition, myRule.context, action, postProcess.iterate.iterateObject, postProcess.iterate.iterateDestination, postProcess.iterate.condition))
                        }
                    }
                }
                myRule.addInput(input)
            }
        }

        for (let action of lsassRule.actions) {
            myRule.addAction(Startup.parseAction(action))
        }

        myRule.setCondition(lsassRule.condition)
        myRule.start()
        return 0;
    }

    static parseAction(action: any): Action {
        if (action.type == 'console') {
            return new LogAction(action.name)
        } else {
            console.log('trigger type not supported :' + action.type)
            return null;
        }
    }
}

Startup.main();