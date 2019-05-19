import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Neode from "neode"

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
	let users = await instacne.all('User')
	let resp = []
	for(let index = 0; index < users.length; index++) {
		let user = await users.get(index).toJson()
		delete user['password'] 
		resp.push(user)
	}
	res.json(resp)
})

router.post('/disable/:userID', guard.check('user:write'), async (req: Request, res: Response) => {
	
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

router.post('/enable/:userID', guard.check('user:write'), async (req: Request, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.findById('User', req.params.userID)
		if(!user) {
			throw new Error('user not found')
		}
		let oldUser = await user.toJson()
		oldUser['disabled'] = false
		let newUser = await user.update(oldUser)
		res.json(await newUser.toJson())
	} catch (err) {
		return res.status(400).json({
			message: err.message
		});
	}
})

router.post('/update/:userID', guard.check('user:write'), async (req: Request, res: Response) => {
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

router.put('/newUser', guard.check('user:create'), async (req: Request, res: Response) => {
	try {
		console.log(req.body)
		let instacne = ClientFactory.createClient("neode") as Neode;
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

router.get('/self', guard.check('user:self'), async (req: any, res: Response) => {
	try {
		let instacne = ClientFactory.createClient("neode") as Neode;
		let user = await instacne.model('User').find(req.user.username)
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

router.post("/register", guard.check('user:create'), (req: Request, res: Response) => {
	console.log(req.body);
	if (!req.body.username) {
		return res.status(400).json({
			success: false,
			message: 'please provide "username"'
		});
	}
	if (!req.body.password) {
		return res.status(400).json({
			success: false,
			message: 'please provide "password"'
		});
	}
	if (!req.body.role) {
		return res.status(400).json({
			success: false,
			message: 'please provide "role"'
		});
	} else if (["admin", "viewer", "responder"].indexOf(req.body.role) == -1) {
		return res.status(400).json({
			success: false,
			message: "role is one of : [admin, viewer, responder]"
		});
	}
	let session = ClientFactory.createClient("neo4j_session");
	let q =
		"MERGE (user:User {username : {username} }) ON CREATE SET user.username = {username}, user.password = {password}, user.role = {role}";
	session
		.run(q, {
			username: req.body.username,
			password: getHashedPassword(req.body.password),
			role: req.body.role
		})
		.then(result => {
			console.log(result.summary);
			if (result.summary.counters._stats.nodesCreated == 1) {
				return res.json({
					success: true,
					message: "account created successfully",
					user: {
						username: req.body.username,
						password: getHashedPassword(req.body.password),
						role: req.body.role
					}
				});
			} else {
				return res.status(400).json({
					success: false,
					message: "account already exists"
				});
			}
		})
		.catch(error => {
			console.log(error);
			res.status(500).json({
				success: false,
				message: error.message
			});
		});
});

router.post("/login", async (req: Request, res: Response) => {
	console.log(req.body);
	// res.send("ok" + req.body);
	let username = req.body.username;
	let password = req.body.password;

	if (username && password) {
		try {
			let session = ClientFactory.createClient("neo4j_session");
			let users = await session.run(
				"MATCH (u:User) WHERE u.username = {username} AND u.password = {password} RETURN u.role as role",
				{ username: username, password: getHashedPassword(password) }
			);
			// console.log(users.records);
			if (users.records.length == 1) {
				let record = users.records[0];
				let payload = {
					username: username,
					permissions: getPermissionsByRole(record.get("role"))
				};
				console.log(payload);
				let token = jwt.sign(payload, "shhhhhhared-secret", {
					expiresIn: "24h" // expires in 24 hours
				});
				// return the JWT token for the future API calls
				res.json({
					success: true,
					message: "Authentication successful!",
					token: token,
					roles: [record.get("role")],
					permissions: payload.permissions
				});
			} else {
				res.status(403).json({
					success: false,
					message: "Incorrect username or password"
				});
			}
		} catch (err) {
			res.status(400).json({
				success: false,
				message: err.message
			});
		}
	} else {
		res.status(400).json({
			success: false,
			message: "Authentication failed! Please check the request"
		});
	}
});



router.post("/resetPassword", guard.check('user:reset_password'), async (req: Request, res: Response) => {
	let username = req.body.username;
	let password = req.body.password;

	if (username && password) {
		try {
			let session = ClientFactory.createClient("neo4j_session");
			let users = await session.run(
				"MATCH (u:User) WHERE u.username = {username} SET u.password = {password}",
				{ username: username, password: getHashedPassword(password) }
			);
			if (users.summary.counters._stats.propertiesSet == 1) {
				res.json({
					success: true,
					message: "password reset success",
				})
			} else {
				res.status(404).json({
					success: false,
					message: 'user not  found'
				})
			}
		} catch (err) {
			res.status(400).json({
				success: false,
				message: err.message
			});
		}
	} else {
		res.status(400).json({
			success: false,
			message: "Please provide 'username' and 'password' parameters"
		});
	}
})

// Export the express.Router() instance to be used by server.ts
export const UserController: Router = router;
