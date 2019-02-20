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


class Alerts extends Component {
	constructor(props) {
		super(props);
		
	}

	
	componentDidMount() {
		// this.updateState()
	}
	
	updateState() {
		console.log('updated user ' + this.props.match.params.usersid)
		fetch('/api/user?sid=' + this.props.match.params.usersid)
		.then(res => res.json())
		.then(user => {
			console.log(user)
			this.setState({
				name: user.logonName,
				domain: user.dn,
				sid: user.objectSid
			})
		});
	}

	
	render() {
		return (
			<div id="mainPanel">
				<AlertTimeline/>
			</div>			
		);
	}
}

export default withRouter(Alerts);
