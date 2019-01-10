"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const ClientFactory_1 = require("../clientFactory/ClientFactory");
class ElasticInput {
    constructor(searchObj, context, name) {
        this.type = 'elastic';
        this.client = ClientFactory_1.ClientFactory.createClient('elastic');
        this.searchObj = searchObj;
        this.context = context;
        this.name = name;
        this.postProcesses = [];
    }
    execute() {
        //this.context.
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                this.context.set('inputs.' + this.name, {});
                let response = yield this.client.search({
                    "body": this.searchObj
                });
                // console.log('resp', response)
                this.context.set('inputs.' + this.name + '.response', response);
                console.log('response set');
                resolve();
            }
            catch (err) {
                console.log('err', err);
                this.context.set('inputs.' + this.name + '.error', err);
                reject(err);
            }
        }));
    }
    postProcess() {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            for (let postProcess of this.postProcesses) {
                postProcess.execute();
                resolve();
            }
        }));
    }
    addPostProcess(postProcess) {
        this.postProcesses.push(postProcess);
    }
}
exports.ElasticInput = ElasticInput;
//# sourceMappingURL=ElasticInput.js.map