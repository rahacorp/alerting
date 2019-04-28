import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Assign router to the express.Router() instance
const router: Router = Router();

router.get('/riskyComputers', async (req: Request, res: Response) => {
	//Match (n)<-[r]-(a:Alert)<-[r2:TRIGGERED]-(ru:Rule) where (n:ADUser) and a.state = 'initialized' 
	//RETURN n.logonName, avg(ru.severity) as importance, count(*) as cnt order by importance, cnt desc


	//Match (n)<-[r]-(a:Alert)<-[r2:TRIGGERED]-(ru:Rule) where (n:ADComputer) and a.state = 'initialized' 
	//RETURN n.dNSHostName, avg(ru.severity) as importance, count(*) as cnt order by importance, cnt desc
	
	res.send("hhhhhhh")
})
// Export the express.Router() instance to be used by server.ts
export const StatsController: Router = router;
