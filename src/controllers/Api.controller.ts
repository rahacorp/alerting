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
		severity: undefined,
		tags: [],
    }
	// console.log(result.records)
	for (const alertRecord of result.records) {
		let fields = alertRecord._fields
		let timestamp = new Date(fields[2].toString())
		let sourceID = fields[3]
		let data = fields[4]
		if(data instanceof Array) {
			data = '[' + data.join(', ') + ']'
		}
		let state = fields[5]
		currentAlert = {
			id: fields[0].toNumber(),
			timestamp: timestamp,
			sourceID: sourceID,
			users: {},
			computers: {},
			assignedTo: {},
			data: data,
			state: state,
			severity: 1,
			tags: [],
		}
		let relations = await session.run(
			"Match (n)<-[r]-(a:Alert)<-[r2:TRIGGERED]-(ru:Rule) where (n:ADUser OR n:ADComputer OR n:User) " + 
			" AND ID(a) = {alertId} RETURN n, LABELS(n), ru.severity, ru.tags",
			{ alertId: fields[0] }
		)
		for(let related of relations.records) {
			currentAlert.severity = related._fields[2] ? related._fields[2].toInt() : 1
			currentAlert.tags = related._fields[3] ? related._fields[3] : []
			//dnshostname logonname
			if(related._fields[1].includes('ADComputer')) {
				currentAlert.computers[related._fields[0].properties.objectSid] = {
					objectSid: related._fields[0].properties.objectSid,
					label: related._fields[0].properties.dNSHostName,
				}
			} else if(related._fields[1].includes('ADUser')) {
				currentAlert.users[related._fields[0].properties.objectSid] = {
					objectSid: related._fields[0].properties.objectSid,
					label: related._fields[0].properties.logonName,
				}
			}  else if(related._fields[1].includes('User')) {
				currentAlert.assignedTo[related._fields[0].properties.username] = {
					role: related._fields[0].properties.role,
					label: related._fields[0].properties.username,
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

router.get('/process', /*guard.check('process:read'),*/ (req: Request, res: Response) => {
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


router.get('/computer', /*guard.check('adcomputer:read'),*/ (req: Request, res: Response) => {
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

router.get('/computers', /*guard.check('adcomputer:read'),*/ (req: Request, res: Response) => {
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

router.get('/user', /*guard.check('aduser:read'),*/ (req: Request, res: Response) => {
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

router.get('/users', /*guard.check('aduser:read'),*/ (req: Request, res: Response) => {
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


router.get('/logs', /*guard.check('log:read'),*/ async function (req: Request, res: Response) {
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
	if(skip + limit > 10000) {
		return res.status(400).json({
			message: 'skip + limit must be less than 10000 (elasticsearch limits)'
		})
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

router.get('/searchObjects', /*guard.check(['aduser:read', 'adcomputer:read']),*/ async (req: Request, res: Response) => {
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