"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("./src/rule/rule");
const TimeTrigger_1 = require("./src/trigger/TimeTrigger");
const ElasticInput_1 = require("./src/input/ElasticInput");
const logAction_1 = require("./src/action/logAction");
const PostProcessIterate_1 = require("./src/input/PostProcessIterate");
class Startup {
    static main() {
        let lsassRule = require('./rules/lsass_dump.js');
        let myRule = new rule_1.Rule(lsassRule.name, lsassRule.description, lsassRule.package);
        for (let trigger of lsassRule.triggers) {
            if (trigger.type == 'time') {
                myRule.addTrigger(new TimeTrigger_1.TimeTrigger(trigger.options.text, myRule));
            }
            else {
                console.log('trigger type not supported :' + trigger.type);
            }
        }
        for (let ii of lsassRule.inputs) {
            let input;
            if (ii.type == 'elasticsearch') {
                input = new ElasticInput_1.ElasticInput(ii.request, myRule.context, ii.name);
            }
            else {
                console.log('input type not supported :' + ii.type);
            }
            if (input) {
                if (ii.post_process) {
                    for (let postProcess of ii.post_process) {
                        if (postProcess.iterate) {
                            //it's iterator
                            let action = Startup.parseAction(postProcess.action);
                            input.addPostProcess(new PostProcessIterate_1.PostProcessIterate(postProcess.condition, myRule.context, action, postProcess.iterate.iterateObject, postProcess.iterate.iterateDestination, postProcess.iterate.condition));
                        }
                    }
                }
                myRule.addInput(input);
            }
        }
        for (let action of lsassRule.actions) {
            myRule.addAction(Startup.parseAction(action));
        }
        myRule.setCondition(lsassRule.condition);
        myRule.start();
        return 0;
    }
    static parseAction(action) {
        if (action.type == 'console') {
            return new logAction_1.LogAction(action.name);
        }
        else {
            console.log('trigger type not supported :' + action.type);
            return null;
        }
    }
}
Startup.main();
//# sourceMappingURL=main.js.map