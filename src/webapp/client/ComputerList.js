import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import { Link } from 'react-router-dom';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import history from './history';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';
import DataTable from 'react-data-table-component';

export default class ComputerList extends Component {
	state = {
		computers: []
	}
	constructor(props) {
		console.log(props.match.params.computersid)
		// props.sid = 'S-1-5-21-4262445451-1243674249-2486969527-1110'
		super(props);

	}

	componentDidUpdate(prevProps, prevState) {
	}
	
	componentDidMount() {
		this.updateState()
	}
	
	updateState() {
		fetch('/api/computers')
		.then(res => res.json())
		.then(computers => {
			// console.log(computers)
			this.setState({
				computers: computers
			})
		});
	}

	render() {
		const columns = [
			{
				name: 'Name',
				selector: 'cn',
				sortable: true,
			},
			{
				name: 'OS',
				selector: 'operatingSystem',
				sortable: true,
			},
			{
				name: 'Version',
				selector: 'operatingSystemVersion',
				sortable: true,
			},
			{
				name: 'Full Name',
				selector: 'dNSHostName',
				sortable: true,
			}
		];
		return (
			<div id="mainPanel">
				<DataTable
					title="Endpoints"
					className="logTableGeneral"
					columns={columns}
					data={this.state.computers}
					onRowClicked={
						(row, index) => {
							history.push('/computer/' + row.objectSid);
						}
					}
  				/>
			</div>
		);
	}
}

