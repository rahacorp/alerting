import { ClientFactory } from "../clientFactory/ClientFactory";
import {Context} from "../context"

class ElasticInput implements Input {
    client: any
    searchObj: any
    context: Context
    name : string
    type : string

    constructor(searchObj: any, context: Context, name : string) {
        this.type = 'elastic'
        this.client = ClientFactory.createClient('elastic')
        this.searchObj = searchObj
        this.context = context
        this.name = name
    }

    async execute() {
        //this.context.
        try {
            let response = await this.client.search(this.searchObj)
            this.context.set('input.' + name + '.response', response)
        } catch (err) {
            this.context.set('input.' + name + '.error', err)
            throw err
        }
    }
}