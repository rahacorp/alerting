import * as elastic from 'elasticsearch'
import * as ActiveDirectory from 'activedirectory2'
import Neode, {RelationshipType} from 'neode'
import Startup from '../../main'
import {v1 as neo4j} from 'neo4j-driver'
// import config from '../../config.json'
import ADComputer from '../ecoEntities/ADComputer'
import ADDomain from '../ecoEntities/ADDomain'
import ADUser from '../ecoEntities/ADUser'
import File from '../ecoEntities/File'
import Process from '../ecoEntities/Process'
import User from '../ecoEntities/User'
import Alert from '../ecoEntities/Alert'
import Comment from '../ecoEntities/Comment'
import Notification from '../ecoEntities/Notification'
import Rule from '../ecoEntities/Rule'
import LogstashClient from './LogstashClient'
import * as fs from 'fs'
import * as path from 'path'
import Attachment from '../ecoEntities/Attachment';

export class ClientFactory {
    static clients: any

    static config = {
        elasticConfig: {
            host: undefined,
        },
        activeDirectory: {
            url: undefined,
            baseDN: undefined,
            username: undefined,
            password: undefined,
            attributes: {
                user: ['cn', 'dn', 'userPrincipalName', 'objectSid', 'sAMAccountName'],
            },
        },
        neo4j: {
            address: undefined,
            username: undefined,
            password: undefined,
        },
        logstash: {
            address: undefined,
        },
    }

    public static fillConfigFromDB() {
        let configFilePath = path.join(__dirname, '../../../connection.json')
        if (fs.existsSync(configFilePath)) {
            let fileConfig = JSON.parse(fs.readFileSync(configFilePath).toString())
            this.config.neo4j.address = fileConfig.neo4j.address
            this.config.neo4j.username = fileConfig.neo4j.username
            this.config.neo4j.password = fileConfig.neo4j.password
            // let instacne = ClientFactory.createClient("neode") as Neode;
            let instacne = new Neode(this.config.neo4j.address, this.config.neo4j.username, this.config.neo4j.password)

            instacne.cypher("MERGE (config:Config {name: 'config'}) return config", {}).then((result) => {
                if (result.records.length == 1) {
                    let configRecord = result.records[0].get('config') as neo4j.Node
                    // console.log(config.properties)
                    let config = configRecord.properties as any
                    this.config.elasticConfig = {
                        host: config.elastic_host
                    }

                    this.config.activeDirectory.url = config.ad_url
                    this.config.activeDirectory.baseDN = config.ad_basedn
                    this.config.activeDirectory.username = config.ad_username
                    this.config.activeDirectory.password = config.ad_password

                    this.config.logstash.address = config.logstash_address
                    console.log(this.config)
                    ClientFactory.clients = {}
                }
            })
        } else {
            throw new Error('server not configured')
        }
    }

    public static createClient(type: string) {
        if (!ClientFactory.clients) {
            throw new Error('server not configured yet')
            // ClientFactory.fillConfigFromDB()
            // ClientFactory.clients = {}
        }
        if (ClientFactory.clients[type]) {
            return ClientFactory.clients[type]
        } else {
            if (type === 'elastic') {
                let client = new elastic.Client(this.config.elasticConfig)
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'ldap') {
                let client = ActiveDirectory.default(this.config.activeDirectory)
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'logstash') {
                let client = new LogstashClient(this.config.logstash.address)
                // let client = new LogstashClient(config.logstash.address)
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'neo4j') {
                let client = neo4j.driver(this.config.neo4j.address, neo4j.auth.basic(this.config.neo4j.username, this.config.neo4j.password))
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'neo4j_session') {
                let neo4jDriver = ClientFactory.createClient('neo4j')
                let session = neo4jDriver.session()
                ClientFactory.clients[type] = session
                return session
            } else if (type === 'neode') {
                let instance = new Neode(this.config.neo4j.address, this.config.neo4j.username, this.config.neo4j.password)
                instance.model('ADComputer', ADComputer.model)
                instance.model('ADDomain', ADDomain.model)
                instance.model('ADUser', ADUser.model)
                instance.model('File', File.model)
                instance.model('Process', Process.model)
                instance.model('User', User.model)
                instance.model('Alert', Alert.model)
                instance.model('Attachment', Attachment.model)
                instance.model('Comment', Comment.model)
                instance.model('Notification', Notification.model)
                instance.model('Rule', Rule.model)

                /*
                instance.model('ADComputer').relationship('joined', "JOINED", "direction_out", "ADDomain")
                instance.model('ADUser').relationship('joined', "JOINED", "direction_out", "ADDomain")
                instance.model('ADUser').relationship('local_user_of', "LOCAL_USER_OF", "direction_out", "ADComputer")
                instance.model('File').relationship('has_file', "HAS_FILE", "direction_out", "ADComputer")
                instance.model('Process').relationship('child_of', "CHILD_OF", "direction_out", "Process")
                instance.model('Process').relationship('has_user', "HAS_USER", "direction_out", "ADUser")
*/
                // instance.model('Comment').relationship('comment_of', "relationship", "COMMENT_OF", "out", "Alert", {})
                // instance.model('Comment').relationship('written', "relationship", "WRITTEN", "in", "User", {})

                instance.schema.install()
                ClientFactory.clients[type] = instance
                return instance
            } else {
                throw new Error('client type not supported :' + type)
            }
        }
    }

    static health = {
        elastic: {
            status: undefined,
            data: undefined,
        },
        neo4j: {
            status: undefined,
            data: undefined,
        },
        logstash: {
            status: undefined,
            data: undefined,
        },
        kafka_input: {
            status: undefined,
            data: undefined,
        },
        elastic_output: {
            status: undefined,
            data: undefined,
        },
    }

    public static async checkHealth() {
        while (true) {
            try {
                let session = ClientFactory.createClient('neo4j_session')
                let elasticClient = ClientFactory.createClient('elastic')
                let logstash = ClientFactory.createClient('logstash') as LogstashClient

                try {
                    let elasticStatus = await elasticClient.cat.health({
                        format: 'json',
                    })
                    ClientFactory.health.elastic.data = elasticStatus[0]
                    ClientFactory.health.elastic.status = elasticStatus[0].status == 'yellow' ? 'gold' : elasticStatus[0].status 
                } catch (err) {
                    ClientFactory.health.elastic.status = 'red'
                }

                try {
                    let status = await session.run('call dbms.showCurrentUser')
                    ClientFactory.health.neo4j.data = status.summary
                    ClientFactory.health.neo4j.status = 'green'
                } catch (err) {
                    ClientFactory.health.neo4j.status = 'red'
                }

                try {
                    let logstashHealth = await logstash.check()
                    ClientFactory.health.logstash = logstashHealth.logstash
                    ClientFactory.health.kafka_input = logstashHealth.kafka_input
                    ClientFactory.health.elastic_output = logstashHealth.elastic_output
                } catch (err) {
                    ClientFactory.health.logstash = {
                        status: 'red',
                        data: undefined,
                    }
                    ClientFactory.health.kafka_input = {
                        status: 'red',
                        data: undefined,
                    }
                    ClientFactory.health.elastic_output = {
                        status: 'red',
                        data: undefined,
                    }
                }
                console.log('check health done')
            } catch (err) {
                console.log('check health error', err)
            }
            await Startup.sleep(60 * 1000)
        }
    }
}
