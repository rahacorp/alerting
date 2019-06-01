import { Action } from "./action";
import { ClientFactory } from "../clientFactory/ClientFactory";
import { Rule } from "../rule/rule";
import * as util from "util";
import {v1 as neo4j} from 'neo4j-driver'
import { Context } from "../context/context";
export class Neo4jAction implements Action {
	name: string;
	neo4jClient: any;
	context: Context;
	relations: any;
	message: string;
	hash: string

	constructor(name: string, context: Context, relations: any, message: string, hash: string) {
		this.name = name;
		this.neo4jClient = ClientFactory.createClient("neo4j");
		this.context = context;
		this.relations = relations;
		this.message = message;
		this.hash = hash
	}

	private async mergeWithNearAlerts(occuredAt: Date) {
		//search alerts in last hour with this hash and !alert.hidden
		//if there are some nodes
		//	merge an alert with sourceID of hash and on create 
		//	
		//create a node with this hash and ... as NEW_NODE
		//copy all of those rels to NEW_NODE
		//set alert.hidden = true




		
		let q = `MATCH (p:Alert {hash: {hash}}) where abs(duration.inSeconds(p.occured_at, {occured_at}).seconds) > 1000*60*60*5 WITH p ORDER BY p.created_at
		WITH COLLECT(p) AS nodes
		CALL apoc.refactor.mergeNodes(
			nodes,
			{
				properties:{
					hash: 'discard', message: 'discard', data: 'combine', 
					created_at: 'discard', state: 'overwrite', sourceID: 'discard',
					occured_at: 'discard'
				}, 
				mergeRels:true
			}
		) yield node
		return node`
		let neo4jSession = ClientFactory.createClient("neo4j_session");
		let result = await neo4jSession.run(q, {
			hash: this.hash,
			occured_at: neo4j.types.DateTime.fromStandardDate(occuredAt)
		})
		console.log('alert merged : ', result);
				
	}

	act(obj: any, sourceID: string, relations: any, rule: Rule) {
		let action = this;
		return new Promise(async (resolve, reject) => {
            // let neo4jSession = action.neo4jClient.session();
			try {
				
                console.log("[" + action.name + "]", obj, rule.name + ":" + sourceID);
                let neo4jSession = ClientFactory.createClient("neo4j_session");
				let occuredAt = undefined
				if(obj._source && obj._source['@timestamp']) { 
					occuredAt = new Date(obj._source['@timestamp'])
				}
				if(!occuredAt) {
					occuredAt = new Date()
				}
				let result = await neo4jSession.run(
					"MATCH (rule:Rule {name : {ruleName}, package: {rulePackage} }) " +
						"MERGE (alert:Alert {sourceID : {sourceID} }) " +
						"MERGE (rule)-[r:TRIGGERED]->(alert) " +
						"ON CREATE SET alert.data = {data}, alert.created_at = {nowTime}, alert.occured_at = {time}, " + 
						"alert.state = 'initialized', alert.message = {message}, alert.hash = {hash}",
					{
						ruleName: rule.name,
						rulePackage: rule.pkg,
						sourceID: rule.name + ":" + sourceID,
						data: JSON.stringify(obj),
						message: this.message || '',
						hash: this.hash,
						nowTime: neo4j.types.DateTime.fromStandardDate(new Date()),
						time:  neo4j.types.DateTime.fromStandardDate(occuredAt)
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
				await this.mergeWithNearAlerts(occuredAt)
				resolve("done");
			} catch (error) {
                console.error(error)
				reject(error);
			}
		});
	}
}
