import {Context} from "../context/context"
import {Action} from "../action/action"

export interface PostProcess {
    context: Context
    condition: string
    action: Action

    execute()
}