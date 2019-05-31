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

async function getComputer(idOrSid: any): Promise<Neode.Node<{}>> {
    let instacne = ClientFactory.createClient('neode') as Neode
    let computer = undefined
    try {
        computer = await instacne.findById('ADComputer', idOrSid)
        if(computer) {
            return computer
        }
    } catch (err) {
        computer = undefined
    }
    if (!computer) {
        return await instacne.find('ADComputer', idOrSid)
    }
}

async function getUser(idOrSid: any): Promise<Neode.Node<{}>> {
    let instacne = ClientFactory.createClient('neode') as Neode
    let user = undefined
    console.log(idOrSid)
    try {
        user = await instacne.findById('ADUser', idOrSid)
        if(user) {
            return user
        }
    } catch (err) {
        user = undefined
    }
    if (!user) {
        return await instacne.find('ADUser', idOrSid)
    }
}

router.get('/computers/:sid/info', guard.check('aduser:read'), async (req: Request, res: Response) => {
    let instacne = ClientFactory.createClient('neode') as Neode
    let elasticClient = ClientFactory.createClient('elastic')
    let computer = await getComputer(req.params.sid)
    if (!computer) {
        return res.status(404).json({
            message: 'computer not found',
        })
    }
    console.log(await computer.toJson())
    let response = {
        alertStates: [],
        alertSeverities: [],
        lastDayLogCount: 0,
        lastLogTime: undefined,
    }
    //alert states
    let builder = instacne.query()
    builder
        .match('alert', instacne.model('Alert'))
        .relationship('RELATED_TO', 'out', 'rel', 1)
        .to('computer', instacne.model('ADComputer'))
        .where('computer.objectSid', computer.get('objectSid'))
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
    try {
        let respSeverity = await instacne.cypher(
            'MATCH\n' +
                '(rule:Rule)-[has_rule:`TRIGGERED`*1]->(alert:Alert)-[rel:`RELATED_TO`*1]->(computer:ADComputer)\n' +
                'WHERE (computer.objectSid = {where_computer_objectSid}) \n' +
                'RETURN\n' +
                'rule.severity,count(*)\n',
            {
                where_computer_objectSid: computer.get('objectSid'),
            }
        )
        console.log(respSeverity)
        for (let state of respSeverity.records) {
            response.alertSeverities.push({
                state: state.get('rule.severity') ? state.get('rule.severity').toInt() : state.get('rule.severity'),
                count: state.get('count(*)').toInt(),
            })
        }
    } catch (err) {
        console.log(err)
    }
    //log count in last 1 day
    let bodyLogCount = {
        size: 0,
        query: {
            bool: {
                must: [
                    {
                        range: {
                            '@timestamp': {
                                gte: 'now-1d',
                            },
                        },
                    },
                    {
                        term: {
                            'computer_name.keyword': {
                                value: computer.get('dNSHostName'),
                            },
                        },
                    },
                ],
            },
        },
    }
    const logCountResponse = await elasticClient.search({
        index: 'winlogbeat-*',
        body: bodyLogCount,
    })
    // console.log(logCountResponse, computer.get('dNSHostName'))
    response.lastDayLogCount = logCountResponse.hits.total
    //last log time
    let bodyLastLog = {
        size: 1,
        query: {
            term: {
                'computer_name.keyword': {
                    value: computer.get('dNSHostName'),
                },
            },
        },
        sort: [
            {
                '@timestamp': {
                    order: 'desc',
                },
            },
        ],
    }
    const lastLogResponse = await elasticClient.search({
        index: 'winlogbeat-*',
        body: bodyLastLog,
    })
    console.log(lastLogResponse)
    if (lastLogResponse.hits.hits.length == 1) {
        response.lastLogTime = lastLogResponse.hits.hits[0]._source['@timestamp']
    }

    res.json(response)
})

router.get('/users/:sid/info', guard.check('aduser:read'), async (req: Request, res: Response) => {
    //alert states
    //alert severity
    //
    //

    let instacne = ClientFactory.createClient('neode') as Neode
    let elasticClient = ClientFactory.createClient('elastic')
    let user = await getUser(req.params.sid)
    if (!user) {
        return res.status(404).json({
            message: 'user not found',
        })
    }
    console.log(await user.toJson())
    let response = {
        alertStates: [],
        alertSeverities: [],
        computersLoggedIn: [],
        lastLoginTime: undefined,
    }
    //alert states
    let builder = instacne.query()
    builder
        .match('alert', instacne.model('Alert'))
        .relationship('RELATED_TO', 'out', 'rel', 1)
        .to('user', instacne.model('ADUser'))
        .where('user.objectSid', user.get('objectSid'))
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
    try {
        let respSeverity = await instacne.cypher(
            'MATCH\n' +
                '(rule:Rule)-[has_rule:`TRIGGERED`*1]->(alert:Alert)-[rel:`RELATED_TO`*1]->(user:ADUser)\n' +
                'WHERE (user.objectSid = {where_user_objectSid}) \n' +
                'RETURN\n' +
                'rule.severity,count(*)\n',
            {
                where_user_objectSid: user.get('objectSid'),
            }
        )
        console.log(respSeverity)
        for (let state of respSeverity.records) {
            response.alertSeverities.push({
                state: state.get('rule.severity') ? state.get('rule.severity').toInt() : state.get('rule.severity'),
                count: state.get('count(*)').toInt(),
            })
        }
    } catch (err) {
        console.log(err)
    }
    //login count in computer
    let bodyLoginCount = {
        size: 0,
        query: {
            bool: {
                must: [
                    {
                        term: {
                            event_id: {
                                value: 4624,
                            },
                        },
                    },
                    {
                        term: {
                            'event_data.TargetUserSid.keyword': {
                                value: user.get('objectSid'),
                            },
                        },
                    },
                ],
            },
        },
        aggs: {
            computers: {
                terms: {
                    field: 'computer_name.keyword',
                    size: 10,
                },
            },
        },
    }
    const logCountResponse = await elasticClient.search({
        index: 'winlogbeat-*',
        body: bodyLoginCount,
    })
    console.log(logCountResponse)
    response.computersLoggedIn = logCountResponse.aggregations.computers.buckets
    //last login time
    /*
    let bodyLastLog = {
        size: 1,
        query: {
            term: {
                'computer_name.keyword': {
                    value: user.get('dNSHostName'),
                },
            },
        },
        sort: [
            {
                '@timestamp': {
                    order: 'desc',
                },
            },
        ],
    }
    const lastLogResponse = await elasticClient.search({
        index: 'winlogbeat-*',
        body: bodyLastLog,
    })
    console.log(lastLogResponse)
    if (lastLogResponse.hits.hits.length == 1) {
        response.lastLogTime = lastLogResponse.hits.hits[0]._source['@timestamp']
    }
*/
    res.json(response)
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
