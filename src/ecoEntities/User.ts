import Neode from 'neode'

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
            required: true
        },
        disabled: 'boolean'
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




}

enum UserType {
    Up = "UP",
    Down = "DOWN",
    Left = "LEFT",
    Right = "RIGHT",
}