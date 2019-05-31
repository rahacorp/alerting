import Neode from 'neode'

export default class Rule {
    static model: Neode.SchemaObject = {
        data: {
            type: 'string',
            hidden: true
        },
        title: 'string',
        description: 'string',
        severity: 'number',
        last_successful_check: 'string',
        name: 'string',
        author: 'string',
        tags: 'string',
    }
}