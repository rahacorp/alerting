import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";

// Assign router to the express.Router() instance
const router: Router = Router();

router.post("/login", (req: Request, res: Response) => {});

router.get("/login", (req: Request, res: Response) => {
	console.log(req.query);
	// res.send("ok" + req.query);
	let username = req.query.username;
	let password = req.query.password;
	// For the given username fetch user from DB
	let mockedUsername = "admin";
	let mockedPassword = "password";

	if (username && password) {
		if (username === mockedUsername && password === mockedPassword) {
			let token = jwt.sign({ username: username, permissions: ['admin'] }, "shhhhhhared-secret", {
				expiresIn: "24h" // expires in 24 hours
			});
			// return the JWT token for the future API calls
			res.json({
				success: true,
				message: "Authentication successful!",
				token: token
			});
		} else {
			res.send(403).json({
				success: false,
				message: "Incorrect username or password"
			});
		}
	} else {
		res.send(400).json({
			success: false,
			message: "Authentication failed! Please check the request"
		});
	}
});

// Export the express.Router() instance to be used by server.ts
export const AuthController: Router = router;
