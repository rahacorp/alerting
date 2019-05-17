
import Neode from 'neode'

export default class ADUComputer {
    static model: Neode.SchemaObject = {
        objectSid: {
            'type': 'string',
            primary: true
        },
        cn: 'string',
        dn: 'string',
        dNSHostName: 'string',
        operatingSystem: 'string',
        operatingSystemVersion: 'string',
    }
}