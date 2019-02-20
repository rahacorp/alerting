module.exports = {
    name: 'lsass_dump',
    status: 'stable',
    description: 'finds all processes that attach to lsass, potentially for cred dump',
    package: 'ir.raha.win.cred',
    severity: 6,
    author: 'alireza',
    references: ['https://github.com/Neo23x0/sigma/wiki/Specification'],
    tags: ['credential'], 
    triggers: [],
    inputs: [
        {
            name: 'lsass_dump_search',
            type: 'elasticsearch',
            request: {
                query: {
                    query_string: {
                        query: 'source_name:"Microsoft-Windows-Sysmon" AND event_id:10 AND event_data.TargetImage:(*lsass.exe) AND (NOT (event_data.SourceImage:((*taskmgr.exe *procexp64.exe *procexp.exe *lsm.exe *csrss.exe *wininit.exe *wmiprvse.exe))))'
                    }
                }
            },
            post_process: [
                {
                    condition: 'true',
                    iterate: {
                        iterateObject: 'inputs.lsass_dump_search.response.hits.hits',
                        iterateDestination: 'my_hit',
                        condition: 'ctx.my_hit._source.record_number == 17405'
                    },
                    action: {
                        type: 'console',
                        name: 'console_log_iterate'
                    }
                }
            ]
        }
    ],
    condition: 'ctx.inputs.lsass_dump_search.response.hits.total > 0 ',
    actions: [
        {
            type: 'console',
            name: 'console_log'
        }  
    ]
}