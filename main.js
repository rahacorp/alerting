"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rule_1 = require("./src/rule/rule");
const TimeTrigger_1 = require("./src/trigger/TimeTrigger");
const ElasticInput_1 = require("./src/input/ElasticInput");
class Startup {
    static main() {
        let myRule = new rule_1.Rule('rule1', 'testing', 'ir.raha.win');
        myRule.setTrigger(new TimeTrigger_1.TimeTrigger('every 10 second', myRule));
        myRule.addInput(new ElasticInput_1.ElasticInput({
            "query": {
                "match_all": {}
            }
        }, myRule.context, 'test_elastic'));
        myRule.start();
        return 0;
    }
}
Startup.main();
//# sourceMappingURL=main.js.map