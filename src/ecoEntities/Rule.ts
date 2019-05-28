import Neode from 'neode'

export default class Rule {
    static model: Neode.SchemaObject = {
        author: 'string',
        data: {
            type: 'string',
            hidden: true
        },
        description: 'string',
        last_successful_check: 'string',
        name: 'string',
        severity: 'number',
        tags: 'string',
    }
}