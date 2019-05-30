import * as elastic from 'elasticsearch'
import * as ActiveDirectory from 'activedirectory2'
import Neode, { RelationshipType } from 'neode'
import Startup from '../../main'
import {v1 as neo4j} from 'neo4j-driver'
import {Client as restClient} from 'node-rest-client'
import config from '../../config.json'
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

export class ClientFactory {
    static clients: any

    public static createClient(type: string) {
        if(!ClientFactory.clients) {
            ClientFactory.clients = {}
        }
        if (ClientFactory.clients[type]) {
            return ClientFactory.clients[type]
        } else {
            if (type === 'elastic') {
                let client = new elastic.Client(config.elasticConfig)
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'ldap') {
                let client = ActiveDirectory.default(config.activeDirectory)
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'rest') {
                let client = new restClient()
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'neo4j') {
                let client = neo4j.driver(config.neo4j.address, neo4j.auth.basic(config.neo4j.username, config.neo4j.password))
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'neo4j_session') {
                let neo4jDriver = ClientFactory.createClient("neo4j")
                let session = neo4jDriver.session()
                ClientFactory.clients[type] = session
                return session
            } else if (type === 'neode') {
                let instance = new Neode(config.neo4j.address, config.neo4j.username, config.neo4j.password);
                instance.model('ADComputer', ADComputer.model)
                instance.model('ADDomain', ADDomain.model)
                instance.model('ADUser', ADUser.model)
                instance.model('File', File.model)
                instance.model('Process', Process.model)
                instance.model('User', User.model)
                instance.model('Alert', Alert.model)
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
            data: undefined
        },
        neo4j: {
            status: undefined,
            data: undefined
        },
        logstash: {
            status: undefined,
            data: undefined
        },
        kafka_input: {
            status: undefined,
            data: undefined
        },
        elastic_output: {
            status: undefined,
            data: undefined
        }
    }

    

    public static async checkHealth() {
    	const session = ClientFactory.createClient("neo4j_session")
        let elasticClient = ClientFactory.createClient('elastic')
        let rest = ClientFactory.createClient('rest')
        while(true) {
            try {
                let elasticStatus = await elasticClient.cat.health({
                    format: 'json'
                })
                ClientFactory.health.elastic.data = elasticStatus[0]
                ClientFactory.health.elastic.status = elasticStatus[0].status
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
                rest.get("http://192.168.1.218:9600/_node/stats/pipelines", function (data, response) {
                    // parsed response body as js object
                    ClientFactory.health.logstash.data = data
                    ClientFactory.health.logstash.status = 'green'
                    
                    if(ClientFactory.health.kafka_input.data) {
                        if(ClientFactory.health.kafka_input.data.events.out < data.pipelines.main.plugins.inputs[0].events.out) {
                            ClientFactory.health.kafka_input.status = 'green'
                        } else {
                            if(ClientFactory.health.kafka_input.status == 'green') {
                                ClientFactory.health.kafka_input.status = 'yellow'
                            } else {
                                ClientFactory.health.kafka_input.status = 'red'
                            }
                        }
                    }
                    ClientFactory.health.kafka_input.data = data.pipelines.main.plugins.inputs[0]

                    if(ClientFactory.health.elastic_output.data) {
                        if(ClientFactory.health.elastic_output.data.events.out < data.pipelines.main.plugins.outputs[1].events.out) {
                            ClientFactory.health.elastic_output.status = 'green'
                        } else {
                            if(ClientFactory.health.elastic_output.status == 'green') {
                                ClientFactory.health.elastic_output.status = 'yellow'
                            } else {
                                ClientFactory.health.elastic_output.status = 'red'
                            }
                        }
                    }
                    ClientFactory.health.elastic_output.data = data.pipelines.main.plugins.outputs[1]



                    // raw response
                }).on('error', function (err) {
                    ClientFactory.health.logstash.status = 'red'
                    ClientFactory.health.logstash.data = err
                    ClientFactory.health.kafka_input.status = 'red'
                    ClientFactory.health.kafka_input.data = undefined
                    ClientFactory.health.elastic_output.status = 'red'
                    ClientFactory.health.elastic_output.data = undefined
                });
            } catch (err) {
            }	
            console.log('check health')
            await Startup.sleep(60 * 1000);
        }
    }
}