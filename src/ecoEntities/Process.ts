import Neode from 'neode'

export default class Process {
    static model: Neode.SchemaObject = {
        processGuid: {
            type: 'string',
            unique: true
        },
        commandLine: 'string',
        company: 'string',
        CurrentDirectory: 'string',
        operatingSystem: 'string',
        operatingSystemVersion: 'string',
        processId: 'number',
        terminalSessionId: 'number',
        utcTime: 'datetime',
        startTime: 'datetime',
        endTime: 'datetime',
    }
}