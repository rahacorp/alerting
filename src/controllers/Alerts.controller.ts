import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Neode, { Builder } from "neode"
import {eagerNode} from 'neode/build/Query/EagerUtils';

import {v1 as neo4j} from 'neo4j-driver'
import multer from 'multer'
const upload = multer({
    dest: 'uploads/'
})
import expressPerm from "express-jwt-permissions";
import User from "../ecoEntities/User";
const guard = expressPerm();
// Assign router to the express.Router() instance
const router: Router = Router();


function parseSkipLimit(query: any, defaultLimit: number, maxLimit: number) {
	let limit = defaultLimit
	let skip = 0
	if(query.limit) {
		if(Number(query.limit)) {
			limit = Number(query.limit)
			if(limit > maxLimit || limit < 0) {
				limit = maxLimit
			}
		}
	}

	if(query.skip) {
		if(Number(query.skip)) {
			skip = Number(query.skip)
			if(skip < 0) {
				skip = 0
			}
		}
	}
	return {
		skip: skip,
		limit: limit
	}
}


router.get('/', guard.check('alert:read'), async (req: Request, res: Response) => {
	try {
		let skipLimit = parseSkipLimit(req.query, 10, 50)
		
		let instacne = ClientFactory.createClient("neode") as Neode;
		let countBuilder = instacne.query()
		countBuilder
			.match('alert', instacne.model('Alert'))
			.return('count(alert)')
			.build()

		let count = await countBuilder.execute()
		let notifCount = count.records[0].get('count(alert)').toInt()
			

		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.return(eagerNode(instacne, 1, 'alert', instacne.model('Alert')))
			.orderBy('alert.created_at', 'DESC')
			.skip(skipLimit.skip).limit(skipLimit.limit)
			.build()
		let resp = await builder.execute()
		let alerts = instacne.hydrate(resp, 'alert', instacne.model('Alert'))
		res.json({
			total: notifCount,
			hits: await alerts.toJson()
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.get('/relatedToComputer/:sid', guard.check('alert:read'), async (req: Request, res: Response) => {
	try {
		let skipLimit = parseSkipLimit(req.query, 10, 50)

		let instacne = ClientFactory.createClient("neode") as Neode;
		let countBuilder = instacne.query()
		countBuilder
			.match('alert', instacne.model('Alert'))
			.relationship('RELATED_TO', 'out', 'rel', 1)
			.to('computer', instacne.model('ADComputer'))
			.where('computer.objectSid', req.params.sid)
			.return('count(alert)')
			.build()

		let count = await countBuilder.execute()
		let notifCount = count.records[0].get('count(alert)').toInt()
			

		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.relationship('RELATED_TO', 'out', 'rel', 1)
			.to('computer', instacne.model('ADComputer'))
			.where('computer.objectSid', req.params.sid)
			.return(eagerNode(instacne, 1, 'alert', instacne.model('Alert')))
			.orderBy('alert.created_at', 'DESC')
			.skip(skipLimit.skip).limit(skipLimit.limit)
			.build()
		let resp = await builder.execute()
		let alerts = instacne.hydrate(resp, 'alert', instacne.model('Alert'))
		res.json({
			total: notifCount,
			hits: await alerts.toJson()
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.get('/relatedToUser/:sid', guard.check('alert:read'), async (req: Request, res: Response) => {
	try {
		let skipLimit = parseSkipLimit(req.query, 10, 50)

		let instacne = ClientFactory.createClient("neode") as Neode;
		let countBuilder = instacne.query()
		countBuilder
			.match('alert', instacne.model('Alert'))
			.relationship('RELATED_TO', 'out', 'rel', 1)
			.to('user', instacne.model('ADUser'))
			.where('user.objectSid', req.params.sid)
			.return('count(alert)')
			.build()

		let count = await countBuilder.execute()
		let notifCount = count.records[0].get('count(alert)').toInt()
			

		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.relationship('RELATED_TO', 'out', 'rel', 1)
			.to('user', instacne.model('ADUser'))
			.where('user.objectSid', req.params.sid)
			.return(eagerNode(instacne, 1, 'alert', instacne.model('Alert')))
			.orderBy('alert.created_at', 'DESC')
			.skip(skipLimit.skip).limit(skipLimit.limit)
			.build()
		let resp = await builder.execute()
		let alerts = instacne.hydrate(resp, 'alert', instacne.model('Alert'))
		res.json({
			total: notifCount,
			hits: await alerts.toJson()
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.get('/assignedToUser/:username', guard.check('alert:read'), async (req: Request, res: Response) => {
	try {
		let skipLimit = parseSkipLimit(req.query, 10, 50)

		let instacne = ClientFactory.createClient("neode") as Neode;
		let countBuilder = instacne.query()
		countBuilder
			.match('alert', instacne.model('Alert'))
			.relationship('ASSIGNED_TO', 'out', 'rel', 1)
			.to('user', instacne.model('User'))
			.where('user.username', req.params.username)
			.return('count(alert)')
			.build()

		let count = await countBuilder.execute()
		let notifCount = count.records[0].get('count(alert)').toInt()
			

		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.relationship('ASSIGNED_TO', 'out', 'rel', 1)
			.to('user', instacne.model('User'))
			.where('user.username', req.params.username)
			.return(eagerNode(instacne, 1, 'alert', instacne.model('Alert')))
			.orderBy('alert.created_at', 'DESC')
			.skip(skipLimit.skip).limit(skipLimit.limit)
			.build()
		let resp = await builder.execute()
		let alerts = instacne.hydrate(resp, 'alert', instacne.model('Alert'))
		res.json({
			total: notifCount,
			hits: await alerts.toJson()
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.get('/:alertId', guard.check('alert:read'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
        console.log(req.user.username)
		let alert = await instacne.model('Alert').findById(req.params.alertId)
        if(!alert) {
			return res.status(404).json({
				message: 'alert not found'
            })
		}
		res.json(await alert.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.post('/:alertId/assign', guard.check('alert:assign'), async (req: any, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
        console.log(req.user.username)
        let user = await instacne.model('User').find(req.user.username)
		let alert = await instacne.model('Alert').findById(req.params.alertId)
        if(!alert) {
			return res.status(404).json({
				message: 'alert not found'
            })
		}
		if(!user) {
			return res.status(404).json({
				message: 'user not found'
            })
		}
		await alert.relateTo(user, 'assigned_to', {})
		await User.notify(user, 'new alert assigned to you', alert)
		await User.comment(user, req.body.username, 'assign', alert)

		res.json(await alert.toJson())
	} catch (err) {
		console.log(err)
		return res.status(400).json({
			message: err.message
		});
	}
})

router.post('/:alertId/unassign', guard.check('alert:unassign'), async (req: any, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
        
		let alert = await instacne.model('Alert').findById(req.params.alertId)
		let user = await instacne.model('User').find(req.user.username)
		// console.log(alert, user)
		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.relationship('ASSIGNED_TO', 'out', 'rel', undefined)
			.to('user', instacne.model('User'))
			.whereId('alert', req.params.alertId)
			.where('user.username', req.user.username)
			.delete('rel')
			.build()
		let assign = await builder.execute()
		if (assign.summary.counters.relationshipsDeleted() == 1) {
			await User.comment(user, req.body.username, 'unassign', alert)
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
		// let alert = instacne.hydrateFirst(resp, 'alert', instacne.model('Alert'))
	} catch (err) {
		console.log(err)
		return res.status(400).json({
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
		let instacne = ClientFactory.createClient("neode") as Neode;
        console.log(req.user.username)
        let user = await instacne.model('User').find(req.user.username)
        let alert = await instacne.model('Alert').findById(req.params.alertId)
        if(!alert) {
			return res.status(404).json({
                message: 'alert not found'
            })
		}
		if(!user) {
            return res.status(404).json({
                message: 'user not found'
            })
		}
		console.log({
			state: req.body.state,
			created_at: (alert.get('created_at') as any).toInt(),
			sourceID: alert.get('sourceID'),
		})
		await alert.update({
			state: req.body.state,
			created_at: (alert.get('created_at') as any).toInt(),
			sourceID: alert.get('sourceID'),
		})
		await User.comment(user, req.body.state, 'state', alert)
		res.json({
			success: true,
			message: 'state changed successfully'
		})
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
	
})

router.post('/:alertId/comment', guard.check('alert:write'), async (req: any, res: Response) => {

    try {
		let instacne = ClientFactory.createClient("neode") as Neode;
        console.log(req.user.username)
        let user = await instacne.model('User').find(req.user.username)
        let alert = await instacne.model('Alert').findById(req.params.alertId)
        if(!alert) {
			return res.status(404).json({
                message: 'alert not found'
            })
		}
		if(!user) {
            return res.status(404).json({
                message: 'user not found'
            })
		}
		await User.comment(user, req.body.comment, 'comment', alert)
		res.json({
			success: true,
			message: 'comment added successfully'
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.post('/comment/:commentId/upload', upload.single('attachment'), guard.check('alert:write'), async (req: any, res: Response) => {
    console.log(req.file)
})

router.get('/:alertId/comment', guard.check('alert:read'), async (req: any, res: Response) => {
	try {
		let skipLimit = parseSkipLimit(req.query, 10, 50)

		let instacne = ClientFactory.createClient("neode") as Neode;
		let countBuilder = instacne.query()
		countBuilder
			.match('alert', instacne.model('Alert'))
			.relationship('COMMENT', 'out', 'rel', 1)
			.to('comment', instacne.model('Comment'))
			.whereId('alert', req.params.alertId)
			.return('count(comment)')
			.build()

		let count = await countBuilder.execute()
		let commentCount = count.records[0].get('count(comment)').toInt()
			

		let builder = instacne.query()
		builder
			.match('alert', instacne.model('Alert'))
			.relationship('COMMENT', 'out', 'rel', 1)
			.to('comment', instacne.model('Comment'))
			.whereId('alert', req.params.alertId)
			.return(eagerNode(instacne, 1, 'comment', instacne.model('Comment')))
			.orderBy('comment.created_at', 'ASC')
			.skip(skipLimit.skip).limit(skipLimit.limit)
			.build()
		let resp = await builder.execute()
		let comments = instacne.hydrate(resp, 'comment', instacne.model('Comment'))
		res.json({
			total: commentCount,
			hits: await comments.toJson()
		})
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})



// Export the express.Router() instance to be used by server.ts
export const AlertsController: Router = router;
