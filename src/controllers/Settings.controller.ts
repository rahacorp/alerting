import {Router, Request, Response} from 'express'
import {ClientFactory} from '../clientFactory/ClientFactory'
import Neode from 'neode'
import * as fs from 'fs'
import * as path from 'path'
import User from '../ecoEntities/User'
// Assign router to the express.Router() instance
const router: Router = Router()

router.post('/setup', async (req: Request, res: Response) => {
    let configFilePath = path.join(__dirname, '../../../connection.json')
    console.log(req.body, configFilePath)
    if (fs.existsSync(configFilePath)) {
        return res.status(400).json({
            message: 'this server already configured!, delete connection.json to reconfig',
        })
    }
    if (!req.body.admin_password) {
        return res.status(400).json({
            message: 'please set "admin_password" parameter!',
        })
    }
    if (!req.body.neo4j_address || !req.body.neo4j_username || !req.body.neo4j_password) {
        return res.status(400).json({
            message: 'please set "neo4j_address" and "neo4j_username" and "neo4j_password" parameter',
        })
    }

    console.log('connectiong to neo4j ', req.body)
    let instacne = new Neode(req.body.neo4j_address, req.body.neo4j_username, req.body.neo4j_password)
    instacne.model('User', User.model)
    console.log('connected')
    try {
        await instacne.cypher(
            "MERGE (config:Config {name: 'config'}) SET config.elastic_host = {elastic_host} " +
                ', config.ad_url = {ad_url}, config.ad_basedn = {ad_basedn}, config.ad_username = {ad_username}, config.ad_password = {ad_password} ' +
                ', config.neo4j_address = {neo4j_address}, config.neo4j_username = {neo4j_username}, config.neo4j_password = {neo4j_password} ' +
                ', config.logstash_address = {logstash_address}',
            req.body
        )
    } catch (err) {
        return res.status(400).json({
            message: err.message,
        })
    }

    fs.writeFileSync(
        configFilePath,
        JSON.stringify({
            neo4j: {
                address: req.body.neo4j_address,
                username: req.body.neo4j_username,
                password: req.body.neo4j_password,
            },
        })
    )
    let admin = await instacne.find('User', 'admin')
    if (!admin) {
        admin = await instacne.create('User', {
            username: 'admin',
            role: 'admin',
            password: User.getHashedPassword(req.body.admin_password),
            disabled: false,
        })
    } else {
        admin.update({
            username: 'admin',
            role: 'admin',
            password: User.getHashedPassword(req.body.admin_password),
            disabled: false,
        })
    }
    ClientFactory.fillConfigFromDB()
    res.json({
        message: 'config done'
    })
})

router.delete('/setup', async (req: Request, res: Response) => {
    let configFilePath = path.join(__dirname, '../../../connection.json')
    fs.unlink(configFilePath, (err) => {
        if(err) {
            return res.status(400).json({
                message: err.message,
            })
        } else {
            return res.json({
                message: 'config file deleted',
            })
        }
    })
})
// Export the express.Router() instance to be used by server.ts
export const SettingsController: Router = router
