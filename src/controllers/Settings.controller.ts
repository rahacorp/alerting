import { Router, Request, Response } from 'express';
import { ClientFactory } from "../clientFactory/ClientFactory";
import Neode from 'neode'
import * as fs from 'fs'
import User from '../ecoEntities/User';
// Assign router to the express.Router() instance
const router: Router = Router();

// The / here corresponds to the route that the WelcomeController
// is mounted on in the server.ts file.
// In this case it's /welcome
router.post('/setup', async (req: Request, res: Response) => {
    if(fs.existsSync('./connection.json')) {
        return res.status(400).json({
            message: 'this server already configured!, delete connection.json to reconfig'
        })
    }
    if(!req.body.admin_password) {
        return res.status(400).json({
            message: 'please set "admin_password" parameter'
        })
    }
    let instacne = ClientFactory.createClient('neode') as Neode
    instacne.cypher(
        "MERGE (config:Config {name: 'config'}) SET config.elasticHost = {elastic_host} " + 
        ", config.ad_url = {ad_url}, config.ad_basedn = {ad_basedn}, config.ad_username = {ad_username}, config.ad_password = {ad_password} " + 
        ", config.neo4j_address = {neo4j_address}, config.neo4j_username = {neo4j_username}, config.neo4j_password = {neo4j_password} " + 
        ", config.logstash_address = {logstash_address}", req.body)
    let admin = await instacne.find('User', 'admin')
    if(!admin) {
        admin = await instacne.create('User', {
            username: 'admin',
            role: 'admin',
            password: User.getHashedPassword(req.body.admin_password),
            disabled: false
        })
    } else {
        admin.update({
            username: 'admin',
            role: 'admin',
            password: User.getHashedPassword(req.body.admin_password),
            disabled: false
        })
    }

});


// Export the express.Router() instance to be used by server.ts
export const SettingsController: Router = router;