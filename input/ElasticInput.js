"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ClientFactory_1 = require("../clientFactory/ClientFactory");
class ElasticInput {
    constructor(config, context) {
        this.client = ClientFactory_1.ClientFactory.createClient('elastic');
        this.config = config;
        this.context = context;
    }
    execute() {
        //this.context.
    }
}
//# sourceMappingURL=ElasticInput.js.map