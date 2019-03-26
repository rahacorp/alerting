import { Action } from "./action";
import { ClientFactory } from "../clientFactory/ClientFactory";
import { Rule } from "../rule/rule";
import * as util from "util";
import { Context } from "../context/context";
export class Neo4jAction implements Action {
	name: string;
	neo4jClient: any;
	context: Context;
	relations: any;

	constructor(name: string, context: Context, relations: any) {
		this.name = name;
		this.neo4jClient = ClientFactory.createClient("neo4j");
		this.context = context;
		this.relations = relations;
	}

	act(obj: any, sourceID: string, relations: any, rule: Rule) {
		let action = this;
		return new Promise(async (resolve, reject) => {
            // let neo4jSession = action.neo4jClient.session();
			try {
                console.log("[" + action.name + "]", obj, rule.name + ":" + sourceID);
                let neo4jSession = ClientFactory.createClient("neo4j_session");
				let result = await neo4jSession.run(
					"MATCH (rule:Rule {name : {ruleName}, package: {rulePackage} }) " +
						"MERGE (alert:Alert {sourceID : {sourceID} }) " +
						"MERGE (rule)-[r:TRIGGERED]->(alert) " +
						"ON CREATE SET alert.data = {data}, alert.created_at = TIMESTAMP()",
					{
						ruleName: rule.name,
						rulePackage: rule.pkg,
						sourceID: rule.name + ":" + sourceID,
						data: JSON.stringify(obj)
					}
				);
				console.log('alert created : ', result.summary.counters._stats);
				if (result.summary.counters._stats.relationshipsCreated == 1) {
					let relEvaluated = action.context.formatObject(
						action.relations
					);
					for (let type in relEvaluated) {
						for (let relation of relEvaluated[type]) {
							//MATCH (n:`type` {`relation.field`: {val}}) MERGE (rule)-[r:RELATED_TO]->(n), {val: relation.value}
							let query2 = `MATCH (n:${type} {${
								relation.field
							}: {val}}) MERGE (alert:Alert {sourceID : {sourceID} }) MERGE (alert)-[r:RELATED_TO]->(n)`;

							let query = `MATCH (n:${type}) where LOWER(n.${relation.field}) = LOWER({val}) MERGE (alert:Alert {sourceID : {sourceID} }) MERGE (alert)-[r:RELATED_TO]->(n)`;
							console.log(query, {
								val: relation.value,
								sourceID: rule.name + ":" + sourceID
							})
							// let rules = await session.run(q)
							try {
								let result = await neo4jSession.run(query, {
									val: relation.value,
									sourceID: rule.name + ":" + sourceID
								});
								console.log(
									"related_to : ",
									result.summary.counters._stats
								);
							} catch (error) {
                                console.error(error)
								reject(error);
							}
						}
					}
				}
				resolve("done");
			} catch (error) {
                console.error(error)
				reject(error);
			}
		});
	}
}
