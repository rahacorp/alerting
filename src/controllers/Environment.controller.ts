import {Router, Request, Response} from 'express'
import {ClientFactory} from '../clientFactory/ClientFactory'
import {v1 as neo4j} from 'neo4j-driver'
import Neode, {Builder} from 'neode'

import expressPerm from 'express-jwt-permissions'
const guard = expressPerm()

// Assign router to the express.Router() instance
const router: Router = Router()

/*
MATCH (p:Process {ProcessGuid: '{E9A1F38A-C367-5C3D-0000-001031FDB302}'})
OPTIONAL MATCH (p)-[r:CHILD_OF]->(parent:Process)
OPTIONAL MATCH (child:Process)-[r2:CHILD_OF]->(p)
OPTIONAL MATCH (sibling:Process)-[r3:CHILD_OF]->(parent)
RETURN p.ProcessGuid, p.CommandLine, child.ProcessGuid, child.CommandLine, parent.ProcessGuid, parent.CommandLine, sibling.ProcessGuid, sibling.CommandLine
*/

function children(main, parentID) {
    let resp = []
    main.parentId = parentID
    resp.push(main)
    for (let child of main.children) {
        resp = resp.concat(children(child, main.id))
    }
    for (let node of resp) {
        node.children = undefined
        node.toggled = undefined
        node.loading = undefined
    }
    return resp
}

router.get('/process/:guid', guard.check('process:read'), (req: Request, res: Response) => {
    const session = ClientFactory.createClient('neo4j_session')
    session
        .run(
            'MATCH (p:Process {ProcessGuid: {guid}})' +
                'OPTIONAL MATCH (p)-[r:CHILD_OF]->(parent:Process)' +
                'OPTIONAL MATCH (child:Process)-[r2:CHILD_OF]->(p)' +
                'RETURN p.ProcessGuid, p.CommandLine, child.ProcessGuid, child.CommandLine, parent.ProcessGuid, parent.CommandLine, ID(p), ID(child), ID(parent)',
            {
                guid: '{' + req.params.guid + '}',
            }
        )
        .then((result) => {
            console.log(result)
            if (result.records.length > 0) {
                //getting siblings
                session
                    .run(
                        'MATCH (p:Process {ProcessGuid: {guid}})' +
                            'OPTIONAL MATCH (sibling:Process)-[r2:CHILD_OF]->(p) WHERE sibling.ProcessGuid <> {mainGuid}' +
                            'RETURN sibling.ProcessGuid, sibling.CommandLine, ID(sibling)',
                        {
                            guid: result.records[0]._fields[4],
                            mainGuid: result.records[0]._fields[0],
                        }
                    )
                    .then((siblings) => {
                        let parent = {
                            name: result.records[0]._fields[5],
                            guid: result.records[0]._fields[4],
                            id: result.records[0]._fields[8].toInt(),
                            toggled: true,
                            children: [],
                        }
                        let main = {
                            name: '[ ' + result.records[0]._fields[1] + ' ]',
                            guid: result.records[0]._fields[0],
                            id: result.records[0]._fields[6].toInt(),
                            toggled: false,
                            children: [],
                        }
                        for (let child of result.records) {
                            if (child._fields[7]) {
                                if (main.children.length < 10) {
                                    main.children.push({
                                        name: child._fields[3],
                                        guid: child._fields[2],
                                        id: child._fields[7].toInt(),
                                        loading: true,
                                        children: [],
                                    })
                                } else if (main.children.length == 10) {
                                    main.children.push({
                                        name: '...',
                                        id: child.records[10]._fields[2].toInt(),
                                        loading: true,
                                        children: [],
                                    })
                                }
                            }
                        }
                        parent.children.push(main)
                        for (let sibling of siblings.records) {
                            if (sibling._fields[2]) {
                                if (parent.children.length < 10) {
                                    parent.children.push({
                                        name: sibling._fields[1],
                                        guid: sibling._fields[0],
                                        id: sibling._fields[2].toInt(),
                                        loading: true,
                                        children: [],
                                    })
                                } else if (parent.children.length == 10) {
                                    parent.children.push({
                                        name: '...',
                                        id: siblings.records[10]._fields[2].toInt(),
                                        loading: true,
                                        children: [],
                                    })
                                }
                            }
                        }

                        let nodeList = children(parent, undefined)

                        res.send(nodeList)
                    })
            } else {
                res.send(404)
            }
        })
        .catch((error) => {
            console.log(error)
        })
})

router.get('/computers/:sid', guard.check('adcomputer:read'), (req: Request, res: Response) => {
    const session = ClientFactory.createClient('neo4j_session')
    session
        .run('MATCH (n:ADComputer {objectSid: {sid} }) RETURN n', {
            sid: req.params.sid,
        })
        .then((result) => {
            console.log(req.params.sid)
            console.log(result)
            if (result.records.length == 1) {
                res.send(result.records[0]._fields[0].properties)
            } else {
                res.send(404)
            }
        })
        .catch((error) => {
            console.log(error)
        })
})

router.get('/computers', guard.check('adcomputer:read'), (req: Request, res: Response) => {
    const session = ClientFactory.createClient('neo4j_session')
    session
        .run('MATCH (n:ADComputer) RETURN n')
        .then((result) => {
            let computers = []
            for (let computer of result.records) {
                computers.push(computer._fields[0].properties)
            }
            res.send(computers)
        })
        .catch((error) => {
            console.log(error)
        })
})

router.get('/users/:sid', guard.check('aduser:read'), (req: Request, res: Response) => {
    const session = ClientFactory.createClient('neo4j_session')
    session
        .run('MATCH (n:ADUser {objectSid: {sid} }) RETURN n', {
            sid: req.params.sid,
        })
        .then((result) => {
            console.log(req.params.sid)
            console.log(result)
            if (result.records.length == 1) {
                res.send(result.records[0]._fields[0].properties)
            } else {
                res.send(404)
            }
        })
        .catch((error) => {
            console.log(error)
        })
})

router.get('/computers/:sid/info', guard.check('aduser:read'), async (req: Request, res: Response) => {
    let instacne = ClientFactory.createClient('neode') as Neode

    let response = {
        alertStates: [],
        alertSeverities: [],
    }
    //alert states
    let builder = instacne.query()
    builder
        .match('alert', instacne.model('Alert'))
        .relationship('RELATED_TO', 'out', 'rel', 1)
        .to('computer', instacne.model('ADComputer'))
        .where('computer.objectSid', req.params.sid)
        .return('alert.state', 'count(*)')
        .build()
    let resp = await builder.execute()
    console.log(resp)
    for (let state of resp.records) {
        response.alertStates.push({
            state: state.get('alert.state'),
            count: state.get('count(*)').toInt(),
        })
    }
    //alert severity
    let respSeverity = await instacne.cypher(
        'MATCH\n' +
		'(rule:Rule)-[has_rule:`TRIGGERED`*1]->(alert:Alert)-[rel:`RELATED_TO`*1]->(computer:ADComputer)\n' +
		'WHERE (computer.objectSid = {where_computer_objectSid}) \n' +
		'RETURN\n' +
		'rule.severity,count(*)\n',
        {
			where_computer_objectSid: req.params.sid
		}
    )
    console.log(respSeverity)
    for (let state of respSeverity.records) {
        response.alertSeverities.push({
            state: state.get('rule.severity').toInt(),
            count: state.get('count(*)').toInt(),
        })
    }
    //log count in last 1 day

    //last log time
    res.json(response)
})

router.get('/users/:sid/info', guard.check('aduser:read'), (req: Request, res: Response) => {
    //alert states
    //alert severity
    //login count in computer
    //last login time
})

router.get('/users', guard.check('aduser:read'), (req: Request, res: Response) => {
    const session = ClientFactory.createClient('neo4j_session')
    session
        .run('MATCH (n:ADUser) RETURN n')
        .then((result) => {
            let users = []
            for (let user of result.records) {
                users.push(user._fields[0].properties)
            }
            res.send(users)
        })
        .catch((error) => {
            console.log(error)
        })
})

router.get('/searchObjects', guard.check(['aduser:read', 'adcomputer:read']), async (req: Request, res: Response) => {
    if (!req.query.q) {
        return res.status(400).json({
            success: false,
            message: 'please provide "q" parameter',
        })
    }
    let query = '(?i).*' + req.query.q + '.*'
    const session = ClientFactory.createClient('neo4j_session')
    let result = await session.run(
        'Match (n) where (n:ADUser OR n:ADComputer) ' + 'AND (any(prop in keys(n) where n[prop] =~ {query})) return n LIMIT 10',
        {
            query: query,
        }
    )
    let response = []
    for (let obj of result.records) {
        response.push({
            type: obj._fields[0].labels[0],
            label: obj._fields[0].properties.logonName || obj._fields[0].properties.dNSHostName,
            objectSid: obj._fields[0].properties.objectSid,
        })
    }
    res.json(response)
})
// Export the express.Router() instance to be used by server.ts
export const EnvironmentController: Router = router
