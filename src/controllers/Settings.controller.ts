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
    

    fs.writeFileSync(
        configFilePath,
        JSON.stringify({
            neo4j: {
                address: req.body.neo4j_address,
                username: req.body.neo4j_username,
                password: req.body.neo4j_password,
            },
            ad: {
                url: req.body.ad_url,
                basedn: req.body.ad_basedn,
                username: req.body.ad_username,
                password: req.body.ad_password,
            },
            logstash: {
                address: req.body.logstash_address
            },
            elastic: {
                host: req.body.elastic_host
            }
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
