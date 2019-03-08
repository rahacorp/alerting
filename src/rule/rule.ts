import { Context } from "../context/context";
import { Trigger } from "../trigger/Trigger";
import { Action } from "../action/action";
import { TimeTrigger } from "../trigger/TimeTrigger";
import { ElasticInput } from "../input/ElasticInput";
import { LogAction } from "../action/logAction";
import { PostProcessIterate } from "../input/PostProcessIterate";
import { Input } from "../input/Input";
import { ClientFactory } from "../clientFactory/ClientFactory";
import * as fs from "fs";
import { Neo4jAction } from "../action/neo4jAction";

export class Rule {
	context: Context;
	triggers: Trigger[];
	actions: Action[];
	inputs: Input[];
	pkg: string;
	name: string;
	description: string;
    condition: string;
    data: string;

	constructor(ruleObj: any, lastSuccessfulCheck: string = undefined) {
        // let data = fs.readFileSync(fileName).toString()
		// let ruleObj = JSON.parse(data);

		console.log("name:", ruleObj.name);
		console.log("description:", ruleObj.description);
		console.log("package:", ruleObj.package);

		this.context = new Context();
		this.inputs = [];
		this.triggers = [];
		this.actions = [];
		this.name = ruleObj.name;
		this.description = ruleObj.description;
		this.pkg = ruleObj.package;
        this.data = JSON.stringify(ruleObj)

		for (let trigger of ruleObj.triggers) {
			if (trigger.type == "time") {
				this.addTrigger(new TimeTrigger(trigger.options.text, this));
			} else {
				console.log("trigger type not supported :" + trigger.type);
			}
		}

		for (let ii of ruleObj.inputs) {
			let input: Input;

			if (ii.type == "elasticsearch") {
				input = new ElasticInput(ii.request, this.context, ii.name);
			} else {
				console.log("input type not supported :" + ii.type);
			}
			if (input) {
				if (ii.post_process) {
					for (let postProcess of ii.post_process) {
						if (postProcess.iterate) {
							//it's iterator
							let action: Action = this.parseAction(
								postProcess.action
							);
							input.addPostProcess(
								new PostProcessIterate(
									postProcess.condition,
									this.context,
									action,
									postProcess.iterate.iterateObject,
									postProcess.iterate.iterateDestination,
									postProcess.iterate.condition,
									this
								)
							);
						}
					}
				}
				console.log("added input ", input.name, input.type);
				this.addInput(input);
			}
		}

		for (let action of ruleObj.actions) {
			this.addAction(this.parseAction(action));
		}

        this.setCondition(ruleObj.condition);
        
        //this should change and get from db but
        if(lastSuccessfulCheck) {
            this.context.set('last_successful_check', lastSuccessfulCheck)
        } else {
            this.context.set('last_successful_check', '2010-01-01T00:00:00.000Z')
        }
    }

    static fromFile(fileName: string): Rule {
        let data = fs.readFileSync(fileName).toString()
        return new Rule(JSON.parse(data))
    }

    static async fromDB(name: string, pkg: string): Promise<Rule> {
        let neo4jDriver = ClientFactory.createClient("neo4j")
        let session = neo4jDriver.session()
        let rules = await session.run('MATCH (n:Rule {name: {ruleName} , package: {pkgName}}) RETURN n.data as data, n.last_successful_check as last_successful_check', {ruleName: name, pkgName: pkg})
        if(rules.records.length == 1) {
            let data = rules.records[0].get('data')
            let lastSuccessfulCheck = rules.records[0].get('last_successful_check')
            session.close()
            return new Rule(JSON.parse(data), lastSuccessfulCheck) 
        } else {
            session.close()
            throw new Error('rule not found')
        }
        console.log(rules.records)
    }
	/*
    constructor(name : string, description : string, pkg : string) {
        this.context = new Context()
        this.inputs = []
        this.triggers = []
        this.actions = []
        this.name = name
        this.description = description
        this.pkg = pkg
    }
*/

	parseAction(action: any): Action {
		if (action.type == "console") {
			return new LogAction(action.name);
		} else if (action.type == "alert") {
			return new Neo4jAction(action.name, this.context, action.relations);
		} else {
			console.log("trigger type not supported :" + action.type);
			return null;
		}
	}
	setCondition(cond: string) {
		this.condition = cond;
	}
	addTrigger(trigger: Trigger) {
		this.triggers.push(trigger);
	}

	addAction(action: Action) {
		this.actions.push(action);
	}

	start() {
		if (this.triggers.length > 0) {
			for (let trigger of this.triggers) {
				trigger.start();
			}
		} else {
			this.fire();
		}
	}

	addInput(input: Input) {
		this.inputs.push(input);
	}

	async fire() {
		let lastTimeDateStr = new Date(Date.now() - 20000).toISOString() //20 seconds before now, for 'rahati-e ghalb :)'
		console.log("fire in the hole: " + this.name);
		console.log("executing inputs");
		for (let input of this.inputs) {
			console.log(
				"======================================================="
			);
			console.log("executing input", input.name);
			await input.execute();
			console.log(
				"input executed    ====================================="
			);
			await input.postProcess();
			console.log(
				"post process done ====================================="
			);
		}
		if (this.context.evaluate(this.condition)) {
			console.log(
				"eval true :",
				this.condition + "======================="
			);
			for (let action of this.actions) {
				await action.act(
					this.name + " matched",
					new Date().toString(),
					{},
					this
				);
			}
		} else {
			console.log(
				"condition did not met ---------------------------------"
			);
		}
		// console.log('context: ')
        // this.context.print()
        this.setLastSuccessTime(lastTimeDateStr)
		console.log("fire done", this.name);
    }
    
    private setLastSuccessTime(dateStr?: string) {
		if(!dateStr) {
			dateStr = new Date().toISOString()
		}
        this.context.set('last_successful_check', dateStr)
        let session = ClientFactory.createClient("neo4j_session")
        session.run('MATCH (n:Rule {name: {ruleName} , package: {pkgName}}) SET n.last_successful_check = {last_successful_check}', {ruleName: this.name, pkgName: this.pkg, last_successful_check: dateStr})

    }

	getContext(): Context {
		return this.context;
	}

	static async list(pkg: string = '.*', name: string = '.*') {
		let allRules = new Map<string, Rule>()
		let session = ClientFactory.createClient("neo4j_session")
		let rules = await session.run('MATCH (r:Rule) WHERE r.package =~ {pkg} AND r.name =~ {name} RETURN r.name as name, r.package as package, r.data as data', {name: name, pkg: pkg})
		for(let record of rules.records) {
			let rulePkg = record.get('package')
			let ruleName = record.get('name')
			let data = record.get('data')
			allRules.set(rulePkg + '/' + ruleName, new Rule(JSON.parse(data)))
		}
		return allRules
	}

	static removeFromNeo4j(pkg: string, name: string, force: boolean) {
		let q = 'MATCH (r:Rule) WHERE r.package =~ {pkg} AND r.name =~ {name} DELETE r'
		if(force) {
			q = 'MATCH (r:Rule) WHERE r.package =~ {pkg} AND r.name =~ {name} DETACH DELETE r'
		}
		return new Promise((resolve, reject) => {
			let session = ClientFactory.createClient("neo4j_session")
			session
				.run(
					q,
					{
                        name: name,
                        pkg: pkg,
                    }
				)
				.then(function(result) {
                    console.log(result.summary.counters._stats);
				})
				.catch(function(error) {
					console.error(error)
					return reject(error);
				});
		});
	}
	
	addToNeo4j(update: boolean, lastSuccessTime: string) {
		return new Promise((resolve, reject) => {
			try {
				let session = ClientFactory.createClient("neo4j_session")

				let q = "MERGE (rule:Rule {name : {ruleName}, package: {rulePackage} }) ON CREATE SET rule.data = {data}"
				if(update) {
					q = "MERGE (rule:Rule {name : {ruleName}, package: {rulePackage} }) ON MATCH SET rule.data = {data}"
					if(lastSuccessTime) {
						q += ", rule.last_successful_check = {lastSuccess}"
					}
				}
				session
					.run(
						q,
						{
							ruleName: this.name,
							rulePackage: this.pkg,
							data: this.data,
							lastSuccess: lastSuccessTime
						}
					)
					.then(function(result) {
						// console.log(result.summary.counters._stats);
						return resolve(result.summary.counters._stats)
					})
					.catch(function(error) {
						console.error(error)
						return reject(error);
					});
			} catch (err) {
				console.error(err)
				reject(err)
			}
		});
	}
}
