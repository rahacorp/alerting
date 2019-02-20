import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import {withRouter} from 'react-router'
import ReactJson from 'react-json-view'
import DataTable from 'react-data-table-component';
import ReactFilterBox, {AutoCompleteOption, SimpleResultProcessing, GridDataAutoCompleteHandler} from "react-filter-box";
import "react-filter-box/lib/react-filter-box.css"
import '@trendmicro/react-sidenav/dist/react-sidenav.css';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';
import AlertTimeline from './AlertTimeline';
import LogSearch from './LogSearch';
import ProcessTree from './ProcessTree';


class Process extends Component {
	state = {
		name: '',
		domain: '',
		guid: '',
	}

	constructor(props) {
		console.log(props.match.params.guid)
		// props.sid = 'S-1-5-21-4262445451-1243674249-2486969527-1110'
		super(props);
		
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.state.guid != this.props.match.params.guid) {
			this.updateState()
		}
	}
	
	componentDidMount() {
		this.updateState()
	}
	
	updateState() {
		console.log('updated process ' + this.props.match.params.guid)
		fetch('/api/process?guid=' + this.props.match.params.guid)
		.then(res => res.json())
		.then(process => {
			this.setState({
				tree: process,
				guid: this.props.match.params.guid
			})
		});
	}

	render() {
		const detail = this.state;
		return (
			<div id="mainPanel">
				<ProcessTree
					guid={this.state.guid}
				/>
			</div>
		);
	}
}

export default withRouter(Process);
