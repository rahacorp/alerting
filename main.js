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
const logAction_1 = require("./src/action/logAction");
const ADSynchronizer_1 = require("./src/webapp/ADSynchronizer");
class Startup {
    static main2() {
        return __awaiter(this, void 0, void 0, function* () {
            // let filename = "C:/Users/alireza/Desktop/Programming/personal/rules/Windows/access_share_admin.js"
            // let rule = Rule.fromFile(filename + 'on')
            // rule.addToNeo4j()
            let r = yield rule_1.Rule.fromDB('access_share_admin', 'ir.raha.share.access');
            r.start();
            return 0;
            // let sampleRule = require(filename)
            // fs.writeFileSync(filename + 'on', JSON.stringify(sampleRule))
            // rule.start()
            return 0;
            let adSync = new ADSynchronizer_1.ADSynchronizer();
            // let grp = await adSync.syncAllGroups()
            // console.log(grp)
            adSync.syncAllUsersAndGroups();
            // adSync.syncAllComputers()
            return 0;
        });
    }
    /*
        public static main(file: string): number {
            let sampleRule = require(file)
            console.log('name:', sampleRule.name)
            console.log('description:', sampleRule.description)
            console.log('package:', sampleRule.package)
    
            let myRule = new Rule(sampleRule.name, sampleRule.description, sampleRule.package)
    
            for (let trigger of sampleRule.triggers) {
                if (trigger.type == 'time') {
                    myRule.addTrigger(new TimeTrigger(trigger.options.text, myRule))
                } else {
                    console.log('trigger type not supported :' + trigger.type)
                }
            }
    
            for (let ii of sampleRule.inputs) {
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
                    console.log('added input ', input.name, input.type)
                    myRule.addInput(input)
                }
            }
    
            for (let action of sampleRule.actions) {
                myRule.addAction(Startup.parseAction(action))
            }
    
            myRule.setCondition(sampleRule.condition)
            myRule.start()
            return 0;
        }
    */
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