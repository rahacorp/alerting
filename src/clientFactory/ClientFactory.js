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
const config_json_1 = __importDefault(require("../config.json"));
class ClientFactory {
    static createClient(type) {
        if (ClientFactory.clients[type]) {
            return ClientFactory.clients[type];
        }
        else {
            if (type === 'elastic') {
                let client = new elastic.Client(config_json_1.default.elasticConfig);
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