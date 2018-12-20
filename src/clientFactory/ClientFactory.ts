import * as elastic from 'elasticsearch'
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
            } else {
                throw new Error('client type not supported :' + type)
            }
        }
    }
}