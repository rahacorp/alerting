import * as later from 'later'
import {Context} from './context'

class Startup {
    public static main(): number {
        let ctx = new Context()
        ctx.set('key', {})
        ctx.set("key['test']", 23)
        console.log(ctx.get('key'))
        ctx.print()
        return 0;
    }
}

Startup.main();