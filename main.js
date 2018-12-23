"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("./src/rule/rule");
const TimeTrigger_1 = require("./src/trigger/TimeTrigger");
const ElasticInput_1 = require("./src/input/ElasticInput");
const logAction_1 = require("./src/action/logAction");
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
            if (ii.type == 'elasticsearch') {
                myRule.addInput(new ElasticInput_1.ElasticInput(ii.request, myRule.context, ii.name));
            }
            else {
                console.log('input type not supported :' + ii.type);
            }
        }
        for (let action of lsassRule.actions) {
            if (action.type == 'console') {
                myRule.addAction(new logAction_1.LogAction());
            }
            else {
                console.log('trigger type not supported :' + action.type);
            }
        }
        myRule.setCondition(lsassRule.condition);
        myRule.start();
        return 0;
    }
}
Startup.main();
//# sourceMappingURL=main.js.map