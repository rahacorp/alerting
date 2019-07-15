import Neode from 'neode'

export default class Attachment {
    static model: Neode.SchemaObject = {
        name: {
            type: 'string',
            required: true
        },
        file_path: {
            type: 'string',
            required: true
        },
        created_at: {
            type: 'datetime',
            required: true
        },
        size: 'number'
    }
}