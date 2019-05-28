import Neode from 'neode'

export default class Comment {
    static model: Neode.SchemaObject = {
        text: {
            type: 'string',
            required: true
        },
        type: {
            type: 'string',
            required: true
        },
        created_at: {
            type: 'datetime',
            required: true
        },
        written_by: {
            type: 'relationship',
            target: 'User',
            direction: 'out',
            relationship: 'WRITTEN_BY',
            properties: {},
            eager: true
        },
        attachment: {
            type: 'relationship',
            target: 'Attachment',
            direction: 'out',
            relationship: 'ATTACHMENT',
            properties: {},
            eager: true
        },
    }
}