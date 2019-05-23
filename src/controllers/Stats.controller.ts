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
		for (let user of result.records) {
			users.push({
				label: user._fields[0],
				importance: user._fields[1],
				alertCount: user._fields[2].toInt(),
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

router.get('/topOS', guard.check('adcomputer:read'), async (req: Request, res: Response) => {
	try {
		let session = ClientFactory.createClient("neo4j_session");
		let result = await session.run(
			"MATCH (n:ADComputer) WITH count(*) as c MATCH (n:ADComputer) " +
			"RETURN n.operatingSystem as os, 100.0 * count(n.operatingSystem)/c as percent limit 5",
		);
		let oses = []
		for (let os of result.records) {
			oses.push({
				label: os._fields[0],
				percent: os._fields[1],
				alertCount: os._fields[2].toInt(),
			})
		}
		res.json({
			success: true,
			computers: oses
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

router.get('/counts', guard.check(['log:read', 'alert:read', 'process:read', 'adcomputer:read', 'aduser:read']), async function (req: Request, res: Response) {
	try {
		let elasticClient = ClientFactory.createClient('elastic')
		//MATCH (n:Alert) RETURN count(*) as cnt
		const { count } = await elasticClient.count();
		const session = ClientFactory.createClient("neo4j_session")
		let alertsResp = await session.run('MATCH (n:Alert) RETURN count(*) as cnt')
		let adcomputersResp = await session.run('MATCH (n:ADComputer) RETURN count(*) as cnt')
		let usersResp = await session.run('MATCH (n:ADUser) RETURN count(*) as cnt')
		let processesResp = await session.run('MATCH (n:Process) RETURN count(*) as cnt')
		res.send({
			logs: count,
			alerts: alertsResp.records[0]._fields[0].toInt(),
			adcomputers: adcomputersResp.records[0]._fields[0].toInt(),
			users: usersResp.records[0]._fields[0].toInt(),
			processes: processesResp.records[0]._fields[0].toInt(),
		})
	} catch (err) {
		res.status(400).json({
			success: false,
			message: err.message
		});
	}
   
})

// Export the express.Router() instance to be used by server.ts
export const StatsController: Router = router;
