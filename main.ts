import { Rule } from "./src/rule/rule";
import { TimeTrigger } from "./src/trigger/TimeTrigger";
import { ElasticInput } from "./src/input/ElasticInput";
import { Input } from "./src/input/Input";
import { LogAction } from "./src/action/logAction";
import * as fs from "fs";
import { Action } from "./src/action/action";
import { ADSynchronizer } from "./src/webapp/ADSynchronizer";
import { Context } from "./src/context/context";
import * as readlineSync from "readline-sync";

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

        while(true) {
            var cmd = readlineSync.question('enter help for help > ');
            if(cmd === 'exit') {
                console.log('bye')
                break;
            } else if(cmd === 'help') {
                console.log('help no help')
            }

        }
		let filename = "C:/Users/alireza/Desktop/Programming/personal/rules/Windows/access_share_admin.js"
		let sampleRule = require(filename)
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
    Startup.printHelp()
} else {
    Startup.main3(process.argv.slice(2))
}

