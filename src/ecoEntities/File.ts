import Neode from 'neode'

export default class File {
    static model: Neode.SchemaObject = {
        md5hash: {
            type: 'string',
            unique: true
        },
        sha1hash: {
            type: 'string',
            unique: true
        },
        company: 'string',
        description: 'string',
        FileVersion: 'string',
    }
}