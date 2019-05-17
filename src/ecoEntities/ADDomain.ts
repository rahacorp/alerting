import Neode from 'neode'

export default class Process {
    static model: Neode.SchemaObject = {
        domainName: {
            type: 'string',
            unique: true
        },
    }
}