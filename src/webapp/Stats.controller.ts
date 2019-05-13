import { Router, Request, Response } from "express";
import { ClientFactory } from "../clientFactory/ClientFactory";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import expressPerm from "express-jwt-permissions";
const guard = expressPerm();
// Assign router to the express.Router() instance
const router: Router = Router();


router.get('/riskyUsers', guard.check('aduser:read'), async (req: Request, res: Response) => {
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let result = await session.run(
			"Match (n)<-[r]-(a:Alert)<-[r2:TRIGGERED]-(ru:Rule) where (n:ADUser) and a.state = 'initialized' " +
			"RETURN n.logonName, avg(ru.severity) as importance, count(*) as cnt order by importance, cnt desc LIMIT 10",
		);
		let users = []
		for (let computer of result.records) {
			users.push({
				label: computer._fields[0],
				importance: computer._fields[1],
				alertCount: computer._fields[2].toInt(),
			})
		}
		res.json({
			success: true,
			users: users
		})
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
})


router.get('/riskyComputers', guard.check('adcomputer:read'), async (req: Request, res: Response) => {
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let result = await session.run(
			"Match (n)<-[r]-(a:Alert)<-[r2:TRIGGERED]-(ru:Rule) where (n:ADComputer) and a.state = 'initialized' " +
			"RETURN n.dNSHostName, avg(ru.severity) as importance, count(*) as cnt order by importance, cnt desc LIMIT 10",
		);
		let computers = []
		for (let computer of result.records) {
			computers.push({
				label: computer._fields[0],
				importance: computer._fields[1],
				alertCount: computer._fields[2].toInt(),
			})
		}
		res.json({
			success: true,
			computers: computers
		})
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
})

router.get('/latestLogs', guard.check('log:read'), async (req: Request, res: Response) => {
	try {
		let elasticClient = ClientFactory.createClient('elastic')
		// req.query.field
		// req.query.prefix
		let body = {
			"size": 0, 
			"query": {
			  "range": {
				  "@timestamp": {
					  "gte": "now-30h"
				  }
			  }
		  },
			"aggs" : {
				  "histogram" : {
					  "date_histogram" : {
						  "field" : "@timestamp",
						  "min_doc_count" : 0,
						  "interval": "1h",
						  "extended_bounds" : {
							"min" : "now-30h",
							"max" : "now"
						  }
					  }
				  }
			  }
		  }
		console.log(body)
		const response = await elasticClient.search({
			index: 'winlogbeat-*',
			size: 0,
			body: body
		})
		console.log(response)
		res.send(response.aggregations.histogram.buckets)
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
})


router.get('/recentAgents', guard.check('log:read'), async (req: Request, res: Response) => {
	try {
		let elasticClient = ClientFactory.createClient('elastic')
		// req.query.field
		// req.query.prefix
		let body = {
			"size": 0, 
			"query": {
			  "range": {
				  "@timestamp": {
					  "gte": "now-10d"
				  }
			  }
		  },
			"aggs" : {
				  "histogram" : {
					  "date_histogram" : {
						  "field" : "@timestamp",
						  "min_doc_count" : 0,
						  "interval": "1d",
						  "extended_bounds" : {
							"min" : "now-10d",
							"max" : "now"
						  }
					  },
					  "aggs" : {
						  "machine_count" : {
							  "cardinality": {
								  "field" : "computer_name.keyword"
							  }
						  }
					  }
				  }
			  }
		  }
		console.log(body)
		const response = await elasticClient.search({
			index: 'winlogbeat-*',
			size: 0,
			body: body
		})
		console.log(response)
		res.send(response.aggregations.histogram.buckets)
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
})
// Export the express.Router() instance to be used by server.ts
export const StatsController: Router = router;
