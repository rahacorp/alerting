"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("./src/rule/rule");
const TimeTrigger_1 = require("./src/trigger/TimeTrigger");
const ElasticInput_1 = require("./src/input/ElasticInput");
const logAction_1 = require("./src/action/logAction");
const PostProcessIterate_1 = require("./src/input/PostProcessIterate");
class Startup {
    static main(file) {
        let sampleRule = require(file);
        console.log('name:', sampleRule.name);
        console.log('description:', sampleRule.description);
        console.log('package:', sampleRule.package);
        let myRule = new rule_1.Rule(sampleRule.name, sampleRule.description, sampleRule.package);
        for (let trigger of sampleRule.triggers) {
            if (trigger.type == 'time') {
                myRule.addTrigger(new TimeTrigger_1.TimeTrigger(trigger.options.text, myRule));
            }
            else {
                console.log('trigger type not supported :' + trigger.type);
            }
        }
        for (let ii of sampleRule.inputs) {
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
                console.log('added input ', input.name, input.type);
                myRule.addInput(input);
            }
        }
        for (let action of sampleRule.actions) {
            myRule.addAction(Startup.parseAction(action));
        }
        myRule.setCondition(sampleRule.condition);
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
if (process.argv.length != 3) {
    console.log('usage: tsc main.ts rule_file_name.js');
    //
}
else {
    Startup.main(process.argv[2]);
}
//# sourceMappingURL=main.js.map