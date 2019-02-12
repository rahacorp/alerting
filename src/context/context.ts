import safeEval from "safe-eval";
import * as flat from "flat";
import * as format from "string-format";
import { NodeVM } from "vm2";
import * as util from "util";
import * as fs from "fs";

export class Context {
	ctx: any;
	sandbox: any;
	vm: any;

	constructor() {
		this.sandbox = {};
		this.vm = new NodeVM({
			sandbox: this.sandbox,
			require: {
				external: ["flat", "util"],
				builtin: ["JSON", "util"]
			},
			wrapper: "none"
		});
		this.vm.run("ctx = {}");
		this.vm.run("ctx.inputs = {}");
		this.vm.run("ctx.conditions = {}");
		this.vm.run('var util = require("util")');
	}

	public print() {
		console.log(util.inspect(this.vm.run("return ctx"), false, 10));
		//this.vm.run('util.inspect(ctx)')
	}

	public set(addr: string, obj: any) {
		let objStr: string;
		objStr = Buffer.from(JSON.stringify(obj)).toString("base64");
		let code =
			"ctx." +
			addr +
			" = JSON.parse(Buffer.from('" +
			objStr +
			"', 'base64').toString())";
		//fs.writeFileSync('./code.txt', code)
		// console.log(code)
		this.vm.run(code);
		//console.log(this.vm.run('return ctx'))
	}

	public get(val: string) {
		return this.vm.run("return ctx." + val);

		//return safeEval(val, this.ctx)
	}

	public formatObject(val: any) {
		let retVal = undefined;
		if (val instanceof Array) {
            retVal = [];
			for (let member of val) {
				retVal.push(this.formatObject(member));
			}
			return retVal
		} else if (val instanceof Object) {
            retVal = {};
			for (let member in val) {
				retVal[member] = this.formatObject(val[member]);
			}
			return retVal
		} else {
			if (typeof val == "string") {
				return format.default(val, this.vm.run("return ctx"));
			} else {
				return val;
			}
		}
	}

	public evaluate(val: string) {
		return this.vm.run("return (" + val + ")");
	}
}
