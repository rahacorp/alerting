import {Client as restClient} from 'node-rest-client'

export default class LogstashClient {
    address: string
    client: any
    args: any
    health = {
        logstash: {
            status: undefined,
            data: undefined,
        },
        kafka_input: {
            status: undefined,
            data: undefined,
        },
        elastic_output: {
            status: undefined,
            data: undefined,
        },
    }
    constructor(address: string) {
        if (!address.startsWith('http://')) {
            address = 'http://' + address
        }
        if (!address.endsWith('/')) {
            address = address + '/'
        }
        this.address = address
        this.args = {
            requestConfig: {
                timeout: 1000, //request timeout in milliseconds
                noDelay: true, //Enable/disable the Nagle algorithm
            },
            responseConfig: {
                timeout: 1000 //response timeout
            }
        }
        this.client = new restClient()
    }

    public async check() {
        let logstashClient: LogstashClient = this 
        return new Promise<any>((resolve, reject) => {
            this.client
                .get(this.address + '_node/stats/pipelines', function(data, response) {
                    // parsed response body as js object
                    logstashClient.health.logstash.data = data
                    logstashClient.health.logstash.status = 'green'

                    if (logstashClient.health.kafka_input.data) {
                        if (logstashClient.health.kafka_input.data.events.out < data.pipelines.main.plugins.inputs[0].events.out) {
                            logstashClient.health.kafka_input.status = 'green'
                        } else {
                            if (logstashClient.health.kafka_input.status == 'green') {
                                logstashClient.health.kafka_input.status = 'gold'
                            } else {
                                logstashClient.health.kafka_input.status = 'red'
                            }
                        }
                    }
                    logstashClient.health.kafka_input.data = data.pipelines.main.plugins.inputs[0]

                    if (logstashClient.health.elastic_output.data) {
                        if (logstashClient.health.elastic_output.data.events.out < data.pipelines.main.plugins.outputs[1].events.out) {
                            logstashClient.health.elastic_output.status = 'green'
                        } else {
                            if (logstashClient.health.elastic_output.status == 'green') {
                                logstashClient.health.elastic_output.status = 'gold'
                            } else {
                                logstashClient.health.elastic_output.status = 'red'
                            }
                        }
                    }
                    logstashClient.health.elastic_output.data = data.pipelines.main.plugins.outputs[1]
                    resolve(logstashClient.health)
                    // raw response
                })
                .on('error', function(err) {
                    logstashClient.health.logstash.status = 'red'
                    logstashClient.health.logstash.data = {
                        err: err.message
                    }
                    logstashClient.health.kafka_input.status = 'red'
                    logstashClient.health.kafka_input.data = undefined
                    logstashClient.health.elastic_output.status = 'red'
                    logstashClient.health.elastic_output.data = undefined
                    resolve(logstashClient.health)
                })
                .on('requestTimeout', function (req) {
                    logstashClient.health.logstash.status = 'red'
                    logstashClient.health.logstash.data = {
                        err: 'requestTimeout'
                    }
                    logstashClient.health.kafka_input.status = 'red'
                    logstashClient.health.kafka_input.data = undefined
                    logstashClient.health.elastic_output.status = 'red'
                    logstashClient.health.elastic_output.data = undefined
                    resolve(logstashClient.health)
                })
                .on('responseTimeout', function (res) {
                    logstashClient.health.logstash.status = 'red'
                    logstashClient.health.logstash.data = {
                        err: 'responseTimeout'
                    }
                    logstashClient.health.kafka_input.status = 'red'
                    logstashClient.health.kafka_input.data = undefined
                    logstashClient.health.elastic_output.status = 'red'
                    logstashClient.health.elastic_output.data = undefined
                    resolve(logstashClient.health)
                })
        })
    }
}
