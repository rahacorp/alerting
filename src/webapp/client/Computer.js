import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import {withRouter} from 'react-router'
import '@trendmicro/react-sidenav/dist/react-sidenav.css';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';
import AlertTimeline from './AlertTimeline';
import LogSearch from './LogSearch';


class Computer extends Component {
	state = {
		name: '',
		domain: '',
		sid: ''
	}
	constructor(props) {
		console.log(props.match.params.computersid)
		// props.sid = 'S-1-5-21-4262445451-1243674249-2486969527-1110'
		super(props);

	}

	componentDidUpdate(prevProps, prevState) {
		if(this.state.sid != this.props.match.params.computersid) {
			this.updateState()
		}
	}
	
	componentDidMount() {
		this.updateState()
	}
	
	updateState() {
		console.log('updated comp ' + this.props.match.params.computersid)
		fetch('/api/computer?sid=' + this.props.match.params.computersid)
		.then(res => res.json())
		.then(computer => {
			console.log(computer)
			this.setState({
				name: computer.dNSHostName,
				domain: computer.dn,
				sid: computer.objectSid,
				os: computer.operatingSystem
			})
		});
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
						icon="desktop"
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
							<AlertTimeline sid={this.state.sid} type="computer"/>
						</TabPanel>
						<TabPanel>
							<LogSearch
								filterField='computer_name'
								filterValue={this.state.name}
							/>
						</TabPanel>
					</Tabs>


				</div>
			</SplitPane>
		);
	}
}

export default withRouter(Computer);
