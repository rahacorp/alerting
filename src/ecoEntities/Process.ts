import Neode from 'neode'

export default class Process {
    static model: Neode.SchemaObject = {
        ProcessGuid: {
            type: 'string',
            unique: true,
            primary: true
        },
        CommandLine: 'string',
        CurrentDirectory: 'string',
        ParentImage: 'string',
        ParentCommandLine: 'string',
        ProcessId: 'number',
        ParentProcessGuid: 'string',
        UtcTime: 'datetime',
        startTime: 'datetime',
        endTime: 'datetime',
        Hashes: 'string',
        Image: 'string',
        IntegrityLevel: 'string',
        Company: 'string',
        Product: 'string',
        Description: 'string',
        User: 'string',
    }
}