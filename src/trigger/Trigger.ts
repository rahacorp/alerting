import { Rule } from "../rule/rule";

export interface Trigger {
    start();
    stop();
    rule: Rule;
}