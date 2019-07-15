import { Router, Request, Response } from 'express';
import { ClientFactory } from "../clientFactory/ClientFactory";
import {v1 as neo4j} from 'neo4j-driver'

import expressPerm from "express-jwt-permissions";
const guard = expressPerm();

// Assign router to the express.Router() instance
const router: Router = Router();

router.get('/search', guard.check('log:read'), async function (req: Request, res: Response) {
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

// Export the express.Router() instance to be used by server.ts
export const LogsController: Router = router;