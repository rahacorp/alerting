import Neode from 'neode'

export default class Notification {
    static model: Neode.SchemaObject = {
        text: {
            type: 'string',
            required: true
        },
        created_at: {
            type: 'datetime',
            required: true
        },
        read: {
            type: 'boolean',
            required: true
        },
        relate_to_alert: {
            type: 'relationship',
            target: 'Alert',
            direction: 'out',
            relationship: 'RELATE_TO_ALERT',
            properties: {},
            eager: true
        }
    }

    static notify() {

    }
}