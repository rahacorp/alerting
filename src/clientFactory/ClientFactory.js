"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elastic = __importStar(require("elasticsearch"));
const ActiveDirectory = __importStar(require("activedirectory2"));
const neo4j_driver_1 = require("neo4j-driver");
const config_json_1 = __importDefault(require("../../config.json"));
class ClientFactory {
    static createClient(type) {
        if (!ClientFactory.clients) {
            ClientFactory.clients = {};
        }
        if (ClientFactory.clients[type]) {
            return ClientFactory.clients[type];
        }
        else {
            if (type === 'elastic') {
                let client = new elastic.Client(config_json_1.default.elasticConfig);
                ClientFactory.clients[type] = client;
                return client;
            }
            else if (type === 'ldap') {
                let client = ActiveDirectory.default(config_json_1.default.activeDirectory);
                ClientFactory.clients[type] = client;
                return client;
            }
            else if (type === 'neo4j') {
                let client = neo4j_driver_1.v1.driver(config_json_1.default.neo4j.address, neo4j_driver_1.v1.auth.basic(config_json_1.default.neo4j.username, config_json_1.default.neo4j.password));
                ClientFactory.clients[type] = client;
                return client;
            }
            else {
                throw new Error('client type not supported :' + type);
            }
        }
    }
}
exports.ClientFactory = ClientFactory;
//# sourceMappingURL=ClientFactory.js.map