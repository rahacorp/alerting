import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Assign router to the express.Router() instance
const router: Router = Router();

function getHashedPassword(pass: string) {
	return crypto
		.createHash("sha1")
		.update(pass + "saltt")
		.digest("hex");
}

router.post("/register", (req: Request, res: Response) => {
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
					permissions: [record.get("role")]
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
					roles: payload.permissions
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

// Export the express.Router() instance to be used by server.ts
export const AuthController: Router = router;
