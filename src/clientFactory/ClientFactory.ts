import * as elastic from 'elasticsearch'
import * as ActiveDirectory from 'activedirectory2'
import Neode, { RelationshipType } from 'neode'
import {v1 as neo4j} from 'neo4j-driver'
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
}