import Neode from 'neode'
import { ClientFactory } from '../clientFactory/ClientFactory';

export default class User {
    static model: Neode.SchemaObject = {
        username: {
            type: 'string',
            unique: true,
            required: true,
            primary: true
        },
        email: 'string',
        name: 'string',
        phone: 'string',
        role: {
            type: 'string',
            required: true
        },
        password: {
            type: 'string',
            required: true,
            hidden: true
        },
        disabled: 'boolean',

        //relations
        has_notification: {
            type: 'relationship',
            target: 'Notification',
            direction: 'out',
            relationship: 'HAS_NOTIFICATION',
            properties: {},
            eager: false
        }
    }

    constructor(usrename: string) {

    }

    static registerNewUser(username: string, type: UserType, email: string, password: string): User {
        return undefined
    }

    static findUser(username: string): User {
        return undefined
    }

    static login(username: string, password: string): User {
        return undefined
    }

    resetPassword(newPassword: string) {

    }

    static async notify(user: Neode.Node<{}>, text: string, alert: Neode.Node<{}>) {
		let instacne = ClientFactory.createClient("neode") as Neode;

        let notif = await instacne.create('Notification', {
            text: text,
            created_at: new Date(),
            read: false
        })

        await user.relateTo(notif, 'has_notification', {})
        await notif.relateTo(alert, 'relate_to_alert', {})
    }

    static async comment(user: Neode.Node<{}>, text: string, type: string, alert: Neode.Node<{}>) {
		let instacne = ClientFactory.createClient("neode") as Neode;

        let comment = await instacne.create('Comment', {
            text: text,
            type: type,
            created_at: new Date(),
        })

        await comment.relateTo(user, 'written_by', {})
        await alert.relateTo(comment, 'comment', {})
    }


}

enum UserType {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}