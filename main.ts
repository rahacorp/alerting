import * as later from 'later'
import {Context} from './src/context/context'
import {Rule} from './src/rule/rule'
import {TimeTrigger} from './src/trigger/TimeTrigger'
import {ElasticInput} from './src/input/ElasticInput'

class Startup {
    public static main(): number {
        let myRule = new Rule('rule1', 'testing', 'ir.raha.win')
        myRule.setTrigger(new TimeTrigger('every 10 second', myRule))
        myRule.addInput(new ElasticInput({
            "query": {
                "match_all": {}
            }
        }, myRule.context, 'test_elastic'))
        myRule.start()
        return 0;
    }
}

Startup.main();