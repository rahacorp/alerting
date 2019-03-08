import { Router, Request, Response } from 'express';
import { ClientFactory } from "../clientFactory/ClientFactory";


// Assign router to the express.Router() instance
const router: Router = Router();

function getAlertObjectsFromResults(result) {
	let alerts = []
	let currentAlert = {
        id: undefined,
        timestamp: undefined,
        sourceID: undefined,
        users: {},
		computers: {},
		data: undefined,
    }
	console.log(result.records)
	for (const alertRecord of result.records) {
		let fields = alertRecord._fields
		let timestamp = new Date(fields[2].toString())
		let sourceID = fields[3]
		if (!currentAlert.id) {
			currentAlert = {
				id: fields[0].toNumber(),
				timestamp: timestamp,
				sourceID: sourceID,
				users: {},
				computers: {},
				data: "{}",
			}
		} else if (currentAlert.id != fields[0].toNumber()) { //changed id
			alerts.push(currentAlert)
			currentAlert = {
				id: fields[0].toNumber(),
				timestamp: timestamp,
				sourceID: sourceID,
				users: {},
				computers: {},
				data: fields[8]
			}
		}

		let user = {
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
	}
	if (currentAlert.id) {
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


router.get('/getAlerts', (req: Request, res: Response) => {
	console.log(req.query);
	if (req.query.user) {
		const session = ClientFactory.createClient("neo4j_session")
		session
			.run('MATCH (um:ADUser)<-[r2:RELATED_TO]-(n:Alert) where um.objectSid = {sid} ' +
				'OPTIONAL MATCH (n)-[r:RELATED_TO]->(c:ADComputer) ' +
				'OPTIONAL MATCH (n)-[r3:RELATED_TO]->(u:ADUser)' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, c.dNSHostName, c.objectSid, u.logonName, u.objectSid, n.data ' +
				'ORDER BY n.created_at desc', {
					sid: req.query.user
				})
			.then((result) => {
				let alerts = getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	} else if (req.query.computer) {
		const session = ClientFactory.createClient("neo4j_session");
		session
			.run('MATCH (cm:ADComputer)<-[r2:RELATED_TO]-(n:Alert) where cm.objectSid = {sid} ' +
				'OPTIONAL MATCH (n)-[r:RELATED_TO]->(u:ADUser) ' +
				'OPTIONAL MATCH (n)-[r3:RELATED_TO]->(c:ADComputer)' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, c.dNSHostName, c.objectSid, u.logonName, u.objectSid, n.data ' +
				'ORDER BY n.created_at desc', {
					sid: req.query.computer
				})
			.then((result) => {
				let alerts = getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		const session = ClientFactory.createClient("neo4j_session");
		session
			.run('MATCH (n:Alert) ' +
				'OPTIONAL MATCH (n)-[r:RELATED_TO]->(u:ADUser) ' +
				'OPTIONAL MATCH (n)-[r3:RELATED_TO]->(c:ADComputer)' +
				'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, c.dNSHostName, c.objectSid, u.logonName, u.objectSid, n.data ' +
				'ORDER BY n.created_at desc', {
					sid: req.query.computer
				})
			.then((result) => {
				let alerts = getAlertObjectsFromResults(result)
				res.send(alerts);
			})
			.catch((error) => {
				console.log(error);
			});
	}
	// res.send('done2');
});

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

router.get('/logs', async function (req: Request, res: Response) {
    let elasticClient = ClientFactory.createClient('elastic')
	const response = await elasticClient.search({
		index: 'winlogbeat-*',
		size: 500,
		body: {
			query: {
				query_string: {
					query: req.query.q
				}
			}
		}
	})
	// console.log(response.hits.hits)
	res.send(response.hits.hits)
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

// Export the express.Router() instance to be used by server.ts
export const ApiController: Router = router;