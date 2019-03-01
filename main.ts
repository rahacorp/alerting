import { Rule } from "./src/rule/rule";
import { LogAction } from "./src/action/logAction";
import * as fs from "fs";
import { Action } from "./src/action/action";
import { ADSynchronizer } from "./src/webapp/ADSynchronizer";
import * as util from "util";
import express from 'express';

import {ApiController} from './src/webapp/Controllers'

const app: express.Application = express();
const port: number = parseInt(process.env.PORT) || 8080;
app.use(express.static('dist'));

class Startup {

    public static async main3(args) {
        if(args[0] === 'add' || args[0] === 'update') {
            let path = args[1]
            let update = args[0] === 'update'
            if(fs.lstatSync(path).isDirectory()) {
                console.log('processing directory :' + path)
                fs.readdirSync(path).forEach(file => {
                    Startup.addFileToDB(file, update, args[2]);
                });
            } else if(fs.lstatSync(path).isFile()) {
                Startup.addFileToDB(path, update, args[2]);
            }
        } else if(args[0] === 'remove') {
            let pkg = args[1]
            let ruleName = args[2]
            console.log('removing', pkg, ruleName, args[3])
            Rule.removeFromNeo4j(pkg, ruleName, args[3] === '-force')
        } else if(args[0] === 'set_last_run') {
            let pkg = args[1]
            let ruleName = args[2]
            let r = await Rule.fromDB(ruleName, pkg);
            await r.addToNeo4j(true, args[3])
        } else if(args[0] === 'adsync') {
            let adSync = new ADSynchronizer();
            let grp = await adSync.syncAllGroups()
            console.log(grp)
            adSync.syncAllUsersAndGroups();
            adSync.syncAllComputers()
        } else if(args[0] === 'run') {
            let pkg = args[1]
            let ruleName = args[2]
            let r = await Rule.fromDB(ruleName, pkg);
		    r.start();
        }
        // console.log('happy sarbazi')
    }

    static addFileToDB(path: string, update: boolean, lastTime: string) {
        if(path.toLowerCase().endsWith('.json')) {
            console.log('add to db ', path, update, lastTime)
            let rule = Rule.fromFile(path)
            rule.addToNeo4j(update, lastTime)
        }
    }
	public static async main2() {

		let filename = "C:/Users/alireza/Desktop/Programming/personal/rules/Windows/detect_execute_commad_schtask.js"
        let sampleRuler = require(filename)
        let sampleRule = JSON.parse(JSON.stringify(sampleRuler))
        let myAction = {
            "type": "alert",
            "name": "alert_iterate",
            "relations": {
                "ADUser": [
                    {
                        "field": "logonName",
                        "value": "{my_hit._source.event_data.SubjectDomainName}\\{my_hit._source.event_data.SubjectUserName}"
                    }
                ],
                "ADComputer": [
                    {
                        "field": "dNSHostName",
                        "value": "{my_hit._source.computer_name}"
                    }
                ]
            }
        }
        for(let input of sampleRule.inputs) {
            if(input.type == 'elasticsearch') {
                if(input.request.query.query_string) {
                    let qs = JSON.parse(JSON.stringify(input.request.query))
                    input.request.query = {
                        "bool": {
                            "must": [qs,
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": "{last_successful_check}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                } else if(input.request.query.bool && input.request.query.bool.must) {
                    let qs = JSON.parse(JSON.stringify(input.request.query.bool.must[0]))
                    input.request.query = {
                        "bool": {
                            "must": [qs,
                                {
                                    "range": {
                                        "@timestamp": {
                                            "gte": "{last_successful_check}"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                } else {
                    console.log('error it ', input.request.query.sdfs.fsd)
                }
                
                // if(input.post_process && input.post_process.action.type == 'console') {
                //     input.post_process.action = myAction
                // }

                for(let i = 0; i < input.post_process.length; i++) {
                    let pp = input.post_process[i]
                    if(pp.action.type && pp.action.type == 'console') {
                        input.post_process[i].action = myAction
                    }
                }
            }
        }

        if(sampleRule.condition == 'false') {
            sampleRule.actions = []
        } else {
            for(let i = 0; i < sampleRule.actions.length; i++) {
                let action = sampleRule.actions[i]
                if(action.type && action.type == 'console') {
                    sampleRule.actions[i] = myAction
                }
            }
        }
        console.log(util.inspect(sampleRule, false, 10))
		fs.writeFileSync(filename + 'on', JSON.stringify(sampleRule))
        return 0;
		// let rule = Rule.fromFile(filename + 'on')
		// rule.addToNeo4j()
		let r = await Rule.fromDB("access_share_admin", "ir.raha.share.access");
		r.start();
        return 0;
        
        
        
		// rule.start()
		return 0;

		let adSync = new ADSynchronizer();
		// let grp = await adSync.syncAllGroups()
		// console.log(grp)
		adSync.syncAllUsersAndGroups();
		// adSync.syncAllComputers()
		return 0;
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

    static printHelp() {
        let help = "add {file/directory_of_files}: add rules to db \n" + 
        "update {file/directory_of_files} [time]: updates rules in db, with [time] sets last successful run to [time] like 2019-02-15T20:54:18.999Z \n" + 
        "remove {rule_package} {rule_name} [-force]: removes rules from db (you can use regexp like: remove rule .* .*), -force deletes rule with its alerts \n" +
        "set_last_run {rule_package} {rule_name} {last_run_time}: sets last success run of rule to provided date and time \n" +
        "run {rule_package} {rule_name}: runs the rule, sry you cant use regexp here \n" + 
        "adsync [--only-computers] [--only-users]:: syncs db with active directory \n" + 
        "start: runs all rules priodically"
        console.log(help)
    }

	static parseAction(action: any): Action {
		if (action.type == "console") {
			return new LogAction(action.name);
		} else {
			console.log("trigger type not supported :" + action.type);
			return null;
		}
	}
}

// Startup.main2();





console.log(process.argv)

if(process.argv.length < 3) {
    app.use('/api', ApiController);
    app.listen(port, () => {
        console.log(`Listening at http://localhost:${port}/`);
});
} else {
    if(process.argv[2] == '-help') {
        Startup.printHelp()
    }
    Startup.main3(process.argv.slice(2))
}
