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


class User extends Component {
	state = {
		name: '',
		domain: '',
		sid: '',
	}

	constructor(props) {
		console.log(props.match.params.usersid)
		// props.sid = 'S-1-5-21-4262445451-1243674249-2486969527-1110'
		super(props);
		
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.state.sid != this.props.match.params.usersid) {
			this.updateState()
		}
	}
	
	componentDidMount() {
		this.updateState()
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

	sanitize(val) {
		return val
		.replace(/[\*\+\-=~><\"\?^\${}\(\)\:\!\/[\]\\\s]/g, '\\$&') // replace single character special characters
		.replace(/\|\|/g, '\\||') // replace ||
		.replace(/\&\&/g, '\\&&') // replace &&
		.replace(/AND/g, '\\A\\N\\D') // replace AND
		.replace(/OR/g, '\\O\\R') // replace OR
		.replace(/NOT/g, '\\N\\O\\T'); // replace NOT
	}
	
	render() {
		const detail = this.state;
		return (
			<SplitPane
				split="vertical"
				minSize={350}
				defaultSize={350}
			>
				<div id="detail">
					<br />

					<FontAwesomeIcon
						icon="user"
						size="9x"
					/>
					<br />
					<h3>{detail.name}</h3>
					<span>
						<FontAwesomeIcon
							icon="network-wired"
						/>
						{detail.domain}
					</span>
				</div>
				<div id="tabs">
					<Tabs>
						<TabList>
							<Tab>Alerts</Tab>
							<Tab>Logs</Tab>
						</TabList>
						<TabPanel>
							<AlertTimeline sid={this.state.sid} type="user"/>
						</TabPanel>
						<TabPanel>
							<LogSearch
								filterField='event_data.User'
								filterValue={this.state.name}
							/>
						</TabPanel>
					</Tabs>


				</div>
			</SplitPane>
		);
	}
}

export default withRouter(User);
