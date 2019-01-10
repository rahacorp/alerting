import { PostProcess } from "./PostProcess";

export interface Input {
    type : string
    name : string
    execute();
    postProcess();
    addPostProcess(postProcess: PostProcess);
}