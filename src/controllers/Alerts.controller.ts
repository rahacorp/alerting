import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import {v1 as neo4j} from 'neo4j-driver'
import multer from 'multer'
const upload = multer({
    dest: 'uploads/'
})
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
			data = '{' + data.join(', ') + '}'
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


router.get('/', guard.check('alert:read'), (req: Request, res: Response) => {
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
	let returnOrder = 'RETURN ID(n), n.created_at, datetime({epochmillis:n.created_at}), n.sourceID, n.data, n.state, c ' +
	'ORDER BY n.created_at desc SKIP {skip} LIMIT {limit}'
	if (req.query.user) {
		const session = ClientFactory.createClient("neo4j_session")
		let q = 'MATCH (um:ADUser)<-[r2:RELATED_TO]-(n:Alert) where um.objectSid = {sid} '
		session
			.run(q + ' WITH count(*) as c ' + q + returnOrder, {
					sid: req.query.user,
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				let total = 0
				if(result.records.length > 0) {
					total = result.records[0]._fields[6].toInt()
				}
				res.send({
					total: total,
					hits: alerts
				});
			})
			.catch((error) => {
				console.log(error);
			});
	} if (req.query.user2) {
		const session = ClientFactory.createClient("neo4j_session")
		let q = 'MATCH (um:User)<-[r2:ASSIGNED_TO]-(n:Alert) where um.username = {username} '
		session
			.run(q + ' WITH count(*) as c ' + q + returnOrder, {
					username: req.query.user2,
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				let total = 0
				if(result.records.length > 0) {
					total = result.records[0]._fields[6].toInt()
				}
				res.send({
					total: total,
					hits: alerts
				});
			})
			.catch((error) => {
				console.log(error);
			});
	} else if (req.query.computer) {
		const session = ClientFactory.createClient("neo4j_session");
		let q = 'MATCH (cm:ADComputer)<-[r2:RELATED_TO]-(n:Alert) where cm.objectSid = {sid} '
		session
			.run(q + ' WITH count(*) as c ' + q + returnOrder, {
					sid: req.query.computer,
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				let total = 0
				if(result.records.length > 0) {
					total = result.records[0]._fields[6].toInt()
				}
				res.send({
					total: total,
					hits: alerts
				});
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		const session = ClientFactory.createClient("neo4j_session");
		let q = 'MATCH (n:Alert) '
		session
			.run(q + ' WITH count(*) as c ' + q + returnOrder, {
					skip: skip,
					limit: limit
				})
			.then(async (result) => {
				let alerts = await getAlertObjectsFromResults(result)
				let total = 0
				if(result.records.length > 0) {
					total = result.records[0]._fields[6].toInt()
				}
				res.send({
					total: total,
					hits: alerts
				});
			})
			.catch((error) => {
				console.log(error);
			});
	}
	// res.send('done2');
});

router.get('/:alertId', guard.check('alert:read'), (req: Request, res: Response) => {
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
				//find comments
				


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

router.post('/:alertId/assign', guard.check('alert:assign'), async (req: any, res: Response) => {
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
            await addComment(req.params.alertId, req.user.username, req.body.username, 'unassign')
			res.json({
				success: true,
				message: 'assign relation created successfully'
			})
		} else {
			res.status(400).json({
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

router.post('/:alertId/unassign', guard.check('alert:unassign'), async (req: any, res: Response) => {
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
            await addComment(req.params.alertId, req.user.username, req.body.username, 'assign')
			res.json({
				success: true,
				message: 'assign relation deleted successfully'
			})
		} else {
			res.status(400).json({
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

router.post('/:alertId/setState', guard.check('alert:write'), async (req: any, res: Response) => {
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
            await addComment(req.params.alertId, req.user.username, req.body.state, 'state')
			res.json({
				success: true,
				message: 'state changed successfully'
			})
		} else {
			res.status(400).json({
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

router.post('/:alertId/comment', guard.check('alert:write'), async (req: any, res: Response) => {
	if(!req.body.comment) {
		return res.status(400).json({
			success: false,
			message: 'please provide "comment" parameter'
		})
	}
	try {
        let response = await addComment(req.params.alertId, req.user.username, req.body.comment, 'comment')
        if(response) {
            res.json({
                success: true,
                message: 'comment added successfully'
            })
        }
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
	
})

router.post('/comment/:commentId/upload', upload.single('attachment'), guard.check('alert:write'), async (req: any, res: Response) => {
    console.log(req.file)
})

router.get('/:alertId/comment', guard.check('alert:read'), async (req: any, res: Response) => {
	const session = ClientFactory.createClient("neo4j_session")
	session
		.run('MATCH (a:Alert)<-[com:COMMENT_OF]-(c:Comment)<-[w:WRITTEN]-(u) WHERE ID(a) = {alertId} RETURN datetime({epochmillis:c.created_at}), c.text, c.type, u.username, ID(c) ORDER BY c.created_at desc', {
			alertId: neo4j.int(req.params.alertId)
		})
		.then((result) => {
            let resp = []
            for(let comment of result.records) {
                resp.push({
                    created_at: new Date(comment._fields[0].toString()),
                    text: comment._fields[1],
                    type: comment._fields[2],
                    user: comment._fields[3],
                    id: comment._fields[4].toInt(),
                })
            }
			console.log(result)
            res.send(resp);
		})
		.catch((error) => {
			console.log(error);
		});
	
})

async function addComment(alertId: number, username: string, text: string, type: string) {
    let session = ClientFactory.createClient("neo4j_session");
    let assign = await session.run(
        "MATCH (a:Alert) WHERE ID(a) = {alertId} " + 
        "MATCH (u:User {username: {username}}) " + 
        "CREATE (c:Comment {text: {comment}, type: {type}}) SET c.created_at = TIMESTAMP() " + 
        "CREATE (a)<-[com:COMMENT_OF]-(c)<-[w:WRITTEN]-(u) ",
        { 
            comment: text, 
            type: type,
            username: username,
            alertId: neo4j.int(alertId)
        }
    );
    if (assign.summary.counters._stats.nodesCreated == 1) {
        return true
    } else {
        throw new Error('comment did not add')
    }
}


// Export the express.Router() instance to be used by server.ts
export const AlertsController: Router = router;
