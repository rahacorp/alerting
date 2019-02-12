import { Action } from "./action";
import { ClientFactory } from "../clientFactory/ClientFactory";
import { Rule } from "../rule/rule";
import * as util from "util";
import { Context } from "../context/context";
export class Neo4jAction implements Action {
	name: string;
    neo4jClient: any;
    context: Context
    relations: any

	constructor(name: string, context: Context, relations: any) {
		this.name = name;
        this.neo4jClient = ClientFactory.createClient("neo4j");
        this.context = context
        this.relations = relations
	}

	act(obj: any, sourceID: string, relations: any, rule: Rule) {
        let action = this
        return new Promise((resolve, reject) => {
            console.log("[" + action.name + "]", obj);
            let neo4jSession = action.neo4jClient.session();
            neo4jSession
                .run(
                    "MATCH (rule:Rule {name : {ruleName}, package: {rulePackage} }) " +
                        "MERGE (alert:Alert {sourceID : {sourceID} }) " +
                        "MERGE (rule)-[r:TRIGGERED]->(alert) " + 
                        "ON CREATE SET alert.data = {data}",
                    { 
                        ruleName: rule.name,
                        rulePackage: rule.pkg,
                        sourceID: rule.name + ':' + sourceID,
                        data: JSON.stringify(obj)
                    }
                )
                .then(function(result) {
                    console.log(result.summary.counters._stats);
                    if (
                        result.summary.counters._stats.relationshipsCreated == 1
                    ) {
                        let relEvaluated = action.context.formatObject(action.relations)
                        for(let type in relEvaluated) {
                            for(let relation of relEvaluated[type]) {
                                //MATCH (n:`type` {`relation.field`: {val}}) MERGE (rule)-[r:RELATED_TO]->(n), {val: relation.value}
                                let query = `MATCH (n:${type} {${relation.field}: {val}}) MERGE (alert:Alert {sourceID : {sourceID} }) MERGE (alert)-[r:RELATED_TO]->(n)`
                                neo4jSession.run(query,
                                    {
                                        val: relation.value,
                                        sourceID: rule.name + ':' + sourceID
                                    }
                                ).then(function(result) {
                                    console.log('related_to : ', result.summary.counters._stats);
                                })
                                .catch(function(error) {
                                    reject(error);
                                })
                
                            }
                        }
                    }
                    neo4jSession.close();
                    resolve('done')
                })
                .catch(function(error) {
                    reject(error);
                })
        })
		
        
	}
}
