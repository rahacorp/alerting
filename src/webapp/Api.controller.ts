import { Router, Request, Response } from 'express';
import { ClientFactory } from "../clientFactory/ClientFactory";
import {v1 as neo4j} from 'neo4j-driver'

import expressPerm from "express-jwt-permissions";
const guard = expressPerm();

// Assign router to the express.Router() instance
const router: Router = Router();

async function getAlertObjectsFromResults(result) {
	// return result
	let session = ClientFactory.createClient("neo4j_session");
	let alerts = []
	let currentAlert = {
        id: undefined,
        timestamp: undefined,
        sourceID: undefined,
        users: {},
		computers: {},
		assignedTo: {},
		data: undefined,
		state: undefined,
    }
	// console.log(result.records)
	for (const alertRecord of result.records) {
		let fields = alertRecord._fields
		let timestamp = new Date(fields[2].toString())
		let sourceID = fields[3]
		let data = fields[4]
		let state = fields[5]
		currentAlert = {
			id: fields[0].toNumber(),
			timestamp: timestamp,
			sourceID: sourceID,
			users: {},
			computers: {},
			assignedTo: {},
			data: data,
			state: state
		}
		let relations = await session.run(
			"Match (n)<-[r]-(a:Alert) where (n:ADUser OR n:ADComputer OR n:User) AND ID(a) = {alertId} RETURN n, LABELS(n)",
			{ alertId: fields[0] }
		)
		for(let related of relations.records) {
			//dnshostname logonname
			if(related._fields[1].includes('ADComputer')) {
				currentAlert.computers[related._fields[0].properties.objectSid] = {
					objectSid: related._fields[0].properties.objectSid,
					label: related._fields[0].properties.dNSHostName
				}
			} else if(related._fields[1].includes('ADUser')) {
				currentAlert.users[related._fields[0].properties.objectSid] = {
					objectSid: related._fields[0].properties.objectSid,
					label: related._fields[0].properties.logonName
				}
			}  else if(related._fields[1].includes('User')) {
				currentAlert.assignedTo[related._fields[0].properties.username] = {
					role: related._fields[0].properties.role,
					label: related._fields[0].properties.username
				}
			}
		}
		// console.log(fields[0].toNumber(), relations.records)

		/*let user = {
			objectSid: fields[7],
			label: fields[6]
		}
		currentAlert.users[user.objectSid] = user
		let computer = {
			objectSid: fields[5],
			label: fields[4]
		}
		currentAlert.computers[computer.objectSid] = computer
		console.log(sourceID, timestamp, user, computer);
		*/
		alerts.push(currentAlert)
	}
	return alerts
}
/*
MATCH (p:Process {ProcessGuid: '{E9A1F38A-C367-5C3D-0000-001031FDB302}'})
OPTIONAL MATCH (p)-[r:CHILD_OF]->(parent:Process)
OPTIONAL MATCH (child:Process)-[r2:CHILD_OF]->(p)
OPTIONAL MATCH (sibling:Process)-[r3:CHILD_OF]->(parent)
RETURN p.ProcessGuid, p.CommandLine, child.ProcessGuid, child.CommandLine, parent.ProcessGuid, parent.CommandLine, sibling.ProcessGuid, sibling.CommandLine
*/

function children(main, parentID) {
	let resp = []
	main.parentId = parentID
	resp.push(main)
	for(let child of main.children) {
		resp = resp.concat(children(child, main.id))
	}
	for(let node of resp) {
		node.children = undefined
		node.toggled = undefined
		node.loading = undefined
	}
	return resp
}

router.get('/process', (req: Request, res: Response) => {
	console.log(req.query)
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (p:Process {ProcessGuid: {guid}})' +
			'OPTIONAL MATCH (p)-[r:CHILD_OF]->(parent:Process)' +
			'OPTIONAL MATCH (child:Process)-[r2:CHILD_OF]->(p)' +
			'RETURN p.ProcessGuid, p.CommandLine, child.ProcessGuid, child.CommandLine, parent.ProcessGuid, parent.CommandLine, ID(p), ID(child), ID(parent)', {
				guid: req.query.guid
			})
		.then((result) => {

			console.log(result)
			if (result.records.length > 0) {
				//getting siblings
				session
					.run('MATCH (p:Process {ProcessGuid: {guid}})' +
						'OPTIONAL MATCH (sibling:Process)-[r2:CHILD_OF]->(p) WHERE sibling.ProcessGuid <> {mainGuid}' +
						'RETURN sibling.ProcessGuid, sibling.CommandLine, ID(sibling)', {
							guid: result.records[0]._fields[4],
							mainGuid: result.records[0]._fields[0]
						})
					.then((siblings) => {
						
						let parent = {
							name: result.records[0]._fields[5],
							guid: result.records[0]._fields[4],
							id: result.records[0]._fields[8].toInt(),
							toggled: true,
							children: []
						}
						let main = {
							name: '[ ' + result.records[0]._fields[1] + ' ]',
							guid: result.records[0]._fields[0],
							id: result.records[0]._fields[6].toInt(),
							toggled: false,
							children: []
						}
						for(let child of result.records) {
							if(child._fields[7]) {
								if(main.children.length < 10) {
									main.children.push({
										name: child._fields[3],
										guid: child._fields[2],
										id: child._fields[7].toInt(),
										loading: true,
										children: []
									})
								} else if(main.children.length == 10) {
									main.children.push({
										name: '...',
										id: child.records[10]._fields[2].toInt(),
										loading: true,
										children: []
									})
								}
							}
						}
						parent.children.push(main)
						for(let sibling of siblings.records) {
							if(sibling._fields[2]) {
								if(parent.children.length < 10) {
									parent.children.push({
										name: sibling._fields[1],
										guid: sibling._fields[0],
										id: sibling._fields[2].toInt(),
										loading: true,
										children: []
									})
								} else if(parent.children.length == 10) {
									parent.children.push({
										name: '...',
										id: siblings.records[10]._fields[2].toInt(),
										loading: true,
										children: []
									})
								}
							}
						}

						let nodeList = children(parent, undefined)

						res.send(nodeList);
						
					})
			} else {
				res.send(404)
			}
		})
		.catch((error) => {
			console.log(error);
		});
});


router.get('/alert/:alertId'/*, guard.check('admin')*/, (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session");
		session
			.run('MATCH (n:Alert) WHERE ID(n) = {alertId} ' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, n.data, n.state ', {
					alertId: neo4j.int(req.params.alertId) 
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				if(alerts.length == 0) {
					res.status(404)
				}
				res.send(alerts[0]);
			})
			.catch((error) => {
				res.status(500).json({
					success: false,
					message: error.message
				})
				console.log(error);
			});
})

router.get('/getAlerts'/*, guard.check('admin')*/, (req: Request, res: Response) => {
	console.log(req.query);
	let limit = 50
	let skip = 0
	if(req.query.limit) {
		if(Number(req.query.limit)) {
			limit = Number(req.query.limit)
			if(limit > 100 || limit < 0) {
				limit = 50
			}
		}
	}

	if(req.query.skip) {
		if(Number(req.query.skip)) {
			skip = Number(req.query.skip)
			if(skip < 0) {
				skip = 0
			}
		}
	}
	if (req.query.user) {
		const session = ClientFactory.createClient("neo4j_session")
		session
			.run('MATCH (um:ADUser)<-[r2:RELATED_TO]-(n:Alert) where um.objectSid = {sid} ' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, n.data, n.state ' +
				'ORDER BY n.created_at desc SKIP {skip} LIMIT {limit}', {
					sid: req.query.user,
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	} else if (req.query.computer) {
		const session = ClientFactory.createClient("neo4j_session");
		session
			.run('MATCH (cm:ADComputer)<-[r2:RELATED_TO]-(n:Alert) where cm.objectSid = {sid} ' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, n.data, n.state ' +
				'ORDER BY n.created_at desc SKIP {skip} LIMIT {limit}', {
					sid: req.query.computer,
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		const session = ClientFactory.createClient("neo4j_session");
		session
			.run('MATCH (n:Alert) ' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, n.data, n.state ' +
				'ORDER BY n.created_at desc SKIP {skip} LIMIT {limit}', {
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	}
	// res.send('done2');
});

router.post('/alert/:alertId/assign', async (req: Request, res: Response) => {
	if(!req.body.username) {
		return res.status(400).json({
			success: false,
			message: 'please provide "username" parameter'
		})
	}
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let assign = await session.run(
			"MATCH (u:User {username : {username}}) MATCH (a:Alert) WHERE ID(a) = {alertId} MERGE (a)-[r:ASSIGNED_TO]->(u)",
			{ username: req.body.username, alertId: neo4j.int(req.params.alertId) }
		);
		if (assign.summary.counters._stats.relationshipsCreated == 1) {
			res.json({
				success: true,
				message: 'assign relation created successfully'
			})
		} else {
			res.json({
				success: false,
				message: 'assign relation not created'
			})
		}
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
	
})

router.post('/alert/:alertId/unassign', async (req: Request, res: Response) => {
	if(!req.body.username) {
		return res.status(400).json({
			success: false,
			message: 'please provide "username" parameter'
		})
	}
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let assign = await session.run(
			"MATCH (u:User {username : {username}}) MATCH (a:Alert) WHERE ID(a) = {alertId} MATCH (a)-[r:ASSIGNED_TO]->(u) DELETE r",
			{ username: req.body.username, alertId: neo4j.int(req.params.alertId) }
		);
		// console.log(assign.summary.counters._stats)
		if (assign.summary.counters._stats.relationshipsDeleted == 1) {
			res.json({
				success: true,
				message: 'assign relation deleted successfully'
			})
		} else {
			res.json({
				success: false,
				message: 'assign relation not deleted'
			})
		}
	} catch (err) {
		res.status(400).json({
			message: err.message
		});
	}
})

router.post('/alert/:alertId/setState', async (req: Request, res: Response) => {
	if(!req.body.state) {
		return res.status(400).json({
			success: false,
			message: 'please provide "state" parameter'
		})
	} else if (["initialized", "assigned", "checking", "not_important", "responded"].indexOf(req.body.state) == -1) {
		return res.status(400).json({
			success: false,
			message: 'state is one of : ["initialized", "assigned", "checking", "not_important", "responded"]'
		})
	}
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let assign = await session.run(
			"MATCH (a:Alert) WHERE ID(a) = {alertId} SET a.state = {state}",
			{ state: req.body.state, alertId: neo4j.int(req.params.alertId)  }
		);
		if (assign.summary.counters._stats.propertiesSet == 1) {
			res.json({
				success: true,
				message: 'state changed successfully'
			})
		} else {
			res.json({
				success: false,
				message: 'assign did not change'
			})
		}
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
	
})

router.get('/user', (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (n:ADUser {objectSid: {sid} }) RETURN n', {
			sid: req.query.sid
		})
		.then((result) => {
			console.log(req.query.sid)
			console.log(result)
			if (result.records.length == 1) {
				res.send(result.records[0]._fields[0].properties);
			} else {
				res.send(404)
			}
		})
		.catch((error) => {
			console.log(error);
		});
});

router.get('/computer', (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (n:ADComputer {objectSid: {sid} }) RETURN n', {
			sid: req.query.sid
		})
		.then((result) => {
			console.log(req.query.sid)
			console.log(result)
			if (result.records.length == 1) {
				res.send(result.records[0]._fields[0].properties);
			} else {
				res.send(404)
			}
		})
		.catch((error) => {
			console.log(error);
		});
});

router.get('/computers', (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (n:ADComputer) RETURN n')
		.then((result) => {
			let computers = []
			for (let computer of result.records) {
				computers.push(computer._fields[0].properties)
			}
			res.send(computers);
		})
		.catch((error) => {
			console.log(error);
		});
});

router.get('/users', (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (n:ADUser) RETURN n')
		.then((result) => {
			let users = []
			for (let user of result.records) {
				users.push(user._fields[0].properties)
			}
			res.send(users);
		})
		.catch((error) => {
			console.log(error);
		});
});

router.get('/users2', (req: Request, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (n:User) RETURN n')
		.then((result) => {
			let users = []
			for (let user of result.records) {
				users.push({
					username: user._fields[0].properties.username,
					role: user._fields[0].properties.role					
				})
			}
			res.send(users);
		})
		.catch((error) => {
			console.log(error);
		});
});

router.get('/logs'/*, guard.check('admin')*/, async function (req: Request, res: Response) {
	let elasticClient = ClientFactory.createClient('elastic')
	let limit = 50
	let skip = 0
	if(req.query.limit) {
		if(Number(req.query.limit)) {
			limit = Number(req.query.limit)
			if(limit > 500 || limit < 0) {
				limit = 500
			}
		}
	}

	if(req.query.skip) {
		if(Number(req.query.skip)) {
			skip = Number(req.query.skip)
			if(skip < 0) {
				skip = 0
			}
		}
	}
	const response = await elasticClient.search({
		index: 'winlogbeat-*',
		size: limit,
		from: skip,
		body: {
			query: {
				query_string: {
					query: req.query.q
				}
			}
		}
	})
	// console.log(response.hits.hits)
	res.json({
		total: response.hits.total,
		hits: response.hits.hits
	})
})

router.get('/logCount', async function (req: Request, res: Response) {
    let elasticClient = ClientFactory.createClient('elastic')
	//MATCH (n:Alert) RETURN count(*) as cnt
	const { count } = await elasticClient.count();
	const session = ClientFactory.createClient("neo4j_session")
	let result = await session.run('MATCH (n:Alert) RETURN count(*) as cnt')
	res.send({
		logs: count,
		alerts: result.records[0]._fields[0].toInt()
	})
})

router.get('/suggest', async function (req: Request, res: Response) {
    let elasticClient = ClientFactory.createClient('elastic')
	// req.query.field
	// req.query.prefix
	let body = {
		"query": {
			"prefix": {

			}
		},
		"aggs": {
			"tagg": {
				"terms": {
					"field": req.query.field + ".keyword",
					"size": 10
				}
			}
		}
	}
	body.query.prefix[req.query.field + ".keyword"] = req.query.prefix
	console.log(body)
	const response = await elasticClient.search({
		index: 'winlogbeat-*',
		size: 0,
		body: body
	})
	console.log(response)
	res.send(response.aggregations.tagg.buckets)
})

router.get('/searchObjects', async (req: Request, res: Response) => {
	if(!req.query.q) {
		return res.status(400).json({
			success: false,
			message: 'please provide "q" parameter'
		})
	}
	let query = '(?i).*' + req.query.q + '.*'
	const session = ClientFactory.createClient("neo4j_session")
	let result = await session.run(
		'Match (n) where (n:ADUser OR n:ADComputer) ' + 
		'AND (any(prop in keys(n) where n[prop] =~ {query})) return n LIMIT 10', {
			query: query
		})
	let response = []
	for(let obj of result.records) {
		response.push({
			type: obj._fields[0].labels[0],
			label: obj._fields[0].properties.logonName || obj._fields[0].properties.dNSHostName,
			objectSid: obj._fields[0].properties.objectSid 
		})
	}
	res.json(response)
})
// Export the express.Router() instance to be used by server.ts
export const ApiController: Router = router;