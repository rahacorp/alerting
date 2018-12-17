import { ClientFactory } from "../clientFactory/ClientFactory";
import {Context} from "../context"

class ElasticInput implements Input {
    client: any
    config: any
    context: Context
    constructor(config: any, context: Context) {
        this.client = ClientFactory.createClient('elastic')
        this.config = config
        this.context = context
    }

    execute() {
        //this.context.
    }
}