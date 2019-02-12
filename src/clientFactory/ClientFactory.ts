import * as elastic from 'elasticsearch'
import * as ActiveDirectory from 'activedirectory2'
import {v1 as neo4j} from 'neo4j-driver'
import config from '../../config.json'

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
            } else if (type === 'neo4j') {
                let client = neo4j.driver(config.neo4j.address, neo4j.auth.basic(config.neo4j.username, config.neo4j.password))
                ClientFactory.clients[type] = client
                return client
            } else if (type === 'neo4j_session') {
                let neo4jDriver = ClientFactory.createClient("neo4j")
                let session = neo4jDriver.session()
                ClientFactory.clients[type] = session
                return session
            } else {
                throw new Error('client type not supported :' + type)
            }
        }
    }
}