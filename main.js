"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("./src/rule/rule");
const TimeTrigger_1 = require("./src/trigger/TimeTrigger");
const ElasticInput_1 = require("./src/input/ElasticInput");
const logAction_1 = require("./src/action/logAction");
const PostProcessIterate_1 = require("./src/input/PostProcessIterate");
const ADSynchronizer_1 = require("./src/webapp/ADSynchronizer");
class Startup {
    static main2() {
        return __awaiter(this, void 0, void 0, function* () {
            let adSync = new ADSynchronizer_1.ADSynchronizer();
            let grp = yield adSync.syncAllGroups();
            console.log(grp);
            adSync.syncAllUsersAndGroups();
            return 0;
        });
    }
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
Startup.main2();
/*
if(process.argv.length != 3) {
    console.log('usage: tsc main.ts rule_file_name.js')
    //
} else {
    Startup.main(process.argv[2])
}
*/ 
//# sourceMappingURL=main.js.map