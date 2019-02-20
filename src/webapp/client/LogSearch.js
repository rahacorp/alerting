import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import {withRouter} from 'react-router'
import Modal from 'react-awesome-modal';
import ReactJson from 'react-json-view'
import DataTable from 'react-data-table-component';
import ReactFilterBox, {AutoCompleteOption, SimpleResultProcessing, GridDataAutoCompleteHandler} from "react-filter-box";
import "react-filter-box/lib/react-filter-box.css"
import '@trendmicro/react-sidenav/dist/react-sidenav.css';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';
import AlertTimeline from './AlertTimeline';
import ProcessTree from './ProcessTree';


export default class LogSearch extends Component {
	state = {
		searchResponse: [],
		visible: false,
		currentGuid: ''
	}

	columns = [
		{
			name: 'Timestamp',
			selector: '_source.@timestamp',
			sortable: true,
			grow: 2
		},
		{
			name: 'Computer',
			selector: '_source.computer_name',
			sortable: true,
			grow: 3
		},
		{
			name: 'Event ID',
			selector: '_source.event_id',
			sortable: true,
			grow: 1
		},
		{
			name: 'Level',
			selector: '_source.level',
			sortable: true,
			grow: 1
		},
		{
			name: 'Source Name',
			selector: '_source.source_name',
			sortable: true,
			grow: 2
		},
		{
			name: 'Message',
			selector: '_source.message',
			sortable: true,
			grow: 4
		}
	];

	constructor(props) {
		super(props);
		this.options = [
			{
				columField: "computer_name",
                type:"selection"
			},
			{
				columField: "event_id",
                type:"selection"
            },
            {
				columField: "event_data.CommandLine",
                type:"text"
            },
            {
				columField: "event_data.Description",
                type:"text"
            },
			{
				columField: "event_data.DestinationIp",
                type:"text"
			},
			// event_data.DestinationIp,  event_data.Hashes event_data.Image event_data.ParentImage  event_data.ProcessName event_data.User event_data.WorkstationName host.os.build level  source_name
			{
				columField: "event_data.Hashes",
                type:"text"
			},
			{
				columField: "event_data.Image",
                type:"text"
			},
			{
				columField: "event_data.ParentImage",
                type:"text"
			},
			{
				columField: "event_data.ProcessName",
                type:"text"
			},
			{
				columField: "event_data.User",
                type:"selection"
			},
			{
				columField: "event_data.WorkstationName",
                type:"selection"
			},
			{
				columField: "host.os.build",
                type:"selection"
			},
			{
				columField: "level",
                type:"selection"
			},
			{
				columField: "source_name",
                type:"text"
			}
        ];
		this.customAutoComplete = new CustomAutoComplete([],this.options);

	}

	sanitize(val) {
		return val
		.replace(/[\*\+\-=~><\"\?^\${}\(\)\:\!\/[\]\\\s]/g, '\\$&') // replace single character special characters
		.replace(/\|\|/g, '\\||') // replace ||
		.replace(/\&\&/g, '\\&&') // replace &&
		.replace(/AND/g, '\\A\\N\\D') // replace AND
		.replace(/OR/g, '\\O\\R') // replace OR
		.replace(/NOT/g, '\\N\\O\\T'); // replace NOT
	}
	getValue(val) {
		if(val.includes(' ')) {
			return '"' + this.sanitize(val) + '"'
		} else {
			return this.sanitize(val)
		}
	}

	parseExpression(expressions) {
		//(computer_name == aa AND event_data.CommandLine == ss) OR event_data.Image == aaaaaaa
		let q = ''
		for(let exp of expressions) {
			if(exp.expressions) {
				q += (exp.conditionType ? ' ' + exp.conditionType + ' ' : '') + '' + '(' + this.parseExpression(exp.expressions) + ')'
			} else {
				q += (exp.conditionType ? ' ' + exp.conditionType + ' ' : '') + '' + exp.category + exp.operator + this.getValue(exp.value)
			}
		}
		return q
	}

	
	onParseOk(expressions){
		// console.log(expressions)
		let q = this.parseExpression(expressions)
		if(this.props.filterField && this.props.filterValue) {
			q = '(' + q + ') AND ' + this.props.filterField + ':"' + this.sanitize(this.props.filterValue) + '"'	
		}
		// console.log(q)
		function objToQueryString(obj) {
			const keyValuePairs = [];
			for (const key in obj) {
			  keyValuePairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
			}
			return keyValuePairs.join('&');
		}

		const queryString = objToQueryString({
			q: q,
		});
		fetch(`/api/logs?${queryString}`)
		.then(res => res.json())
		.then(res => {
			// console.log(res)
			this.setState({
				searchResponse: res
			})
		});
	}
	
	customRenderCompletionItem(self, data, pick) {
        var className = ` hint-value cm-${data.type}`
        
        return <div className={className}  >
                    <span style={{ fontWeight: "bold" }}>{data.value}</span>
                    <span style={{color:"gray", fontSize:10}}> [{data.type}] </span>
                </div>
	}

	openModal(guid) {
		console.log('current: ', guid)
        this.setState({
			visible : true,
			currentGuid: guid
        });
    }

    closeModal() {
        this.setState({
            visible : false
        });
	}
	
	render() {
		const detail = this.state;
		return (
			<div style={{width: '100%'}}>
				<ReactFilterBox 
					data={[]}
					options={this.options}
					onParseOk={this.onParseOk.bind(this)}
					// autoCompleteHandler = {this.customAutoComplete}
				/>
				<DataTable
					className={this.props.className || "logTable logTableGeneral"}
					columns={this.columns}
					data={this.state.searchResponse}
					noHeader={true}
					pagination={true}
					expandableRows={true}
					expandableRowsComponent={<ExpanableComponent openModal={this.openModal} closeModal={this.closeModal} bind={this}/>}
				/>
				<Modal 
                    visible={this.state.visible}
                    width="60%"
                    height="60%"
                    effect="fadeInUp"
                    onClickAway={() => this.closeModal()}
                >
					<ProcessTree
						guid={this.state.currentGuid}
					/>
                </Modal>
			</div>
		);
	}
}

const procTree = (props) => {
	console.log('proc tree ', props)
	return (
		<ProcessTree
			guid={props.guid}
		/>
	)
}

const ExpanableComponent = (props) => {
	console.log(props)
	return (<ReactJson 
		src={props.data} 
		theme="monokai"
		onSelect={
			(select)=>{
				if(select.name === 'ProcessGuid' || select.name === 'ParentProcessGuid') {
					console.log('selected', select)
					props.openModal.bind(props.bind)(select.value)
				}
			}
		}
	/>)
};

class ProcessModal extends Component {
    constructor(props) {
        super(props);
        this.state = {
            visible : false
        }
    }

    openModal() {
        this.setState({
            visible : true
        });
    }

    closeModal() {
        this.setState({
            visible : false
        });
    }

    render() {
        return (
            <section>
                <h1>React-Modal Examples</h1>
                <input type="button" value="Open" onClick={() => this.openModal()} />
                <Modal 
                    visible={this.state.visible}
                    width="400"
                    height="300"
                    effect="fadeInUp"
                    onClickAway={() => this.closeModal()}
                >
                    <div>
                        <h1>Title</h1>
                        <p>Some Contents</p>
                        <a href="javascript:void(0);" onClick={() => this.closeModal()}>Close</a>
                    </div>
                </Modal>
            </section>
        );
    }
}

class CustomAutoComplete extends GridDataAutoCompleteHandler {

    // override this method to add new your operator
    needOperators(parsedCategory) {
        var result = super.needOperators(parsedCategory);
        return result.concat(["startsWith"]);
	}
	
	async needValues(parsedCategory, parsedOperator) {
		// parsedCategory = this.tryToGetFieldCategory(parsedCategory);
		try {
			let resp = await fetch('/api/suggest?field=event_data.User&prefix=r')
			let parsed = await resp.json()
			console.log(parsed)
		} catch (err) {
			console.log(err)
		}
        return ['haha', '22'];
    }
}

