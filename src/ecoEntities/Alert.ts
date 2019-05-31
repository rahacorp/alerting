import Neode from 'neode'

export default class Alert {
    static model: Neode.SchemaObject = {
        data: {
            type: 'string',
            required: false
        },
        state: {
            type: 'string',
            required: true
        },
        sourceID: {
            type: 'string',
            required: true
        },
        created_at: {
            type: 'datetime',
            required: true
        },
        occured_at: {
            type: 'datetime'
        },
        comment: {
            type: 'relationship',
            target: 'Comment',
            direction: 'out',
            relationship: 'COMMENT',
            properties: {},
            eager: false
        },
        assigned_to: {
            type: 'relationships',
            target: 'User',
            direction: 'out',
            relationship: 'ASSIGNED_TO',
            properties: {},
            eager: true
        },
        related_to_computer: {
            type: 'relationships',
            target: 'ADComputer',
            direction: 'out',
            relationship: 'RELATED_TO',
            properties: {},
            eager: true
        },
        related_to_user: {
            type: 'relationships',
            target: 'ADUser',
            direction: 'out',
            relationship: 'RELATED_TO',
            properties: {},
            eager: true
        },
        related_to_process: {
            type: 'relationships',
            target: 'Process',
            direction: 'out',
            relationship: 'RELATED_TO',
            properties: {},
            eager: true
        },
        rule: {
            type: 'relationship',
            target: 'Rule',
            direction: 'in',
            relationship: 'TRIGGERED',
            properties: {},
            eager: true
        }
    }
}