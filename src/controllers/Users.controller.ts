import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Neode from "neode"
import {eagerNode} from 'neode/build/Query/EagerUtils';


import expressPerm from "express-jwt-permissions";
import { Object } from "es6-shim";
const guard = expressPerm();

// Assign router to the express.Router() instance
const router: Router = Router();

function getHashedPassword(pass: string) {
	return crypto
		.createHash("sha1")
		.update(pass + "saltt")
		.digest("hex");
}

function getPermissionsByRole(role: string) {
	let permissions = []
	if(role === 'admin') {
		permissions = [role, 'user:self', 'process:read', 'alert:read', 'alert:assign', 'alert:unassign', 'alert:write', 
		'adcomputer:read', 'aduser:read', 'user:read', 'log:read', 'user:create', 'user:reset_password', 'user:write']
	} 
	if(role === 'viewer') {
		permissions = [role, 'user:self', 'process:read', 'alert:read', 'alert:assign', 'alert:unassign', 'alert:write', 
		'adcomputer:read', 'aduser:read', 'user:read', 'log:read']
	}
	if(role === 'responder') {
		permissions = [role, 'user:self', 'process:read', 'alert:read', 'alert:write', 'adcomputer:read', 'aduser:read',
		 'user:read', 'log:read']
	}
	return permissions
}

router.get('/', guard.check('user:read'), async (req: Request, res: Response) => {
	let instacne = ClientFactory.createClient("neode") as Neode;
	let limit : number = 50
	let skip : number = 0
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
	let count = await instacne.cypher('MATCH (n:User) RETURN count(n) as cnt', {})
	count = count.records[0].get('cnt').toInt()
	let users = await instacne.all('User', {}, [], limit, skip)
	/*let resp = []

	for(let index = 0; index < users.length; index++) {
		let user = await users.get(index).toJson()
		if(!user['disabled']) {
			user.disabled = false
			let u = await instacne.findById('User', user._id)
			await u.update(user)
		}
		delete user['password'] 
		resp.push(user)
	}
	*/
	res.json({
		total: count,
		hits: await users.toJson()
	})
})

router.post('/:userID/disable', guard.check('user:write'), async (req: Request, res: Response) => {
	
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			throw new Error('user not found')
		}
		let oldUser = await user.toJson()
		oldUser['disabled'] = true
		let newUser = await user.update(oldUser)
		res.json(await newUser.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.post('/:userID/enable', guard.check('user:write'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			throw new Error('user not found')
		}
		let oldUser = await user.toJson()
		delete oldUser['_id']
		delete oldUser['_labels']
		oldUser['disabled'] = false
		let newUser = await user.update(oldUser)
		res.json(await newUser.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.put('/:userID/update', guard.check('user:write'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			throw new Error('user not found')
		}
		if(req.body.password) {
			req.body.password = getHashedPassword(req.body.password)
		}
		let old = await user.toJson()
		for(let key of Object.keys(req.body)) {
			old[key] = req.body[key]
		}
		delete old['_id']
		delete old['_labels']
		let newUser = await user.update(old)
		res.json(await newUser.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.delete('/:userID', guard.check('user:delete'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			throw new Error('user not found')
		}
		let delUser = await user.delete()
		res.json(await delUser.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
	
})


router.get('/notifications', guard.check('user:read'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
        let limit : number = 20
		let skip : number = 0
		if(req.query.limit) {
			if(Number(req.query.limit)) {
				limit = Number(req.query.limit)
				if(limit > 20 || limit < 0) {
					limit = 20
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
		let countBuilder = instacne.query()
		countBuilder
			.match('user', instacne.model('User'))
			.relationship('HAS_NOTIFICATION', 'out', 'rel', 1)
			.to('notif', instacne.model('Notification'))
			.where('user.username', req.user.username)
			.return('count(notif)')
			.build()
			
		let count = await countBuilder.execute()
		let notifCount = count.records[0].get('count(notif)').toInt()
		let builder = instacne.query()
		builder
			.match('user', instacne.model('User'))
			.relationship('HAS_NOTIFICATION', 'out', 'rel', 1)
			.to('notif', instacne.model('Notification'))
			.where('user.username', req.user.username)
			.return(eagerNode(instacne, 1, 'notif', instacne.model('Notification')))
			.orderBy('notif.read', 'ASC')
			.orderBy('notif.created_at', 'DESC')
			.skip(skip).limit(limit)
			.build()
			
		let assign = await builder.execute()
		// console.log(assign)
		let notifs = instacne.hydrate(assign, 'notif', instacne.model('Notification'))
		// console.log(notifs)
		res.json({
			total: notifCount,
			hits: await notifs.toJson()
		})
		// let alert = instacne.hydrateFirst(resp, 'alert', instacne.model('Alert'))
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}	
})


router.get('/notifications/:notifId', guard.check('user:read'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let builder = instacne.query()
		builder
			.match('user', instacne.model('User'))
			.relationship('HAS_NOTIFICATION', 'out', 'rel', 1)
			.to('notif', instacne.model('Notification'))
			.where('user.username', req.user.username)
			.whereId('notif', req.params.notifId)
			.return(eagerNode(instacne, 1, 'notif', instacne.model('Notification')))
			.build()
			
		let assign = await builder.execute()
		let notif = instacne.hydrateFirst(assign, 'notif', instacne.model('Notification'))
		notif.update({
			read: true,
			text: notif.get('text'),
			created_at: notif.get('created_at')
		})
		res.json(await notif.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}	
})

router.get('/self', guard.check('user:self'), async (req: any, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		console.log(req.user.username)
		let user = await instacne.model('User').find(req.user.username)
		if(!user) {
			throw new Error(' user not found')
		}
		res.json(await user.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.get('/:userID', guard.check('user:read'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			user = await instacne.find('User', req.params.userID)
			if(!user) {
				return res.status(404).json({
					message: 'user not found'
				});
			}
		}
		let userObj = await user.toJson()
		res.json(userObj)
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
	
})


router.post('/newUser', guard.check('user:create'), async (req: Request, res: Response) => {
	try {
		console.log(req.body)
		let instacne = ClientFactory.createClient("neode") as Neode;
		if(req.body.password) {
			req.body.password = getHashedPassword(req.body.password)
		}
		let user = await instacne.create('User', req.body)
		if(!user) {
			throw new Error('user not found')
		}
		res.json(await user.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

// Export the express.Router() instance to be used by server.ts
export const UserController: Router = router;
