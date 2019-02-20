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

export default class UserList extends Component {
	state = {
		users: []
	}

	columns = [
		{
			name: 'Name',
			selector: 'cn',
			sortable: true,
		},
		{
			name: 'Logon Name',
			selector: 'logonName',
			sortable: true,
		},
		{
			name: 'Full Name',
			selector: 'dn',
			sortable: true,
		}
	];
	constructor(props) {
		super(props);

	}

	componentDidUpdate(prevProps, prevState) {
	}
	
	componentDidMount() {
		this.updateState()
	}
	
	updateState() {
		fetch('/api/users')
		.then(res => res.json())
		.then(users => {
			// console.log(computers)
			this.setState({
				users: users
			})
		});
	}

	render() {
		
		return (
			<div id="mainPanel">
				<DataTable
					title="Users"
					columns={this.columns}
					data={this.state.users}
					className="logTableGeneral"
					onRowClicked={
						(row, index) => {
							history.push('/user/' + row.objectSid);
						}
					}
  				/>
			</div>
		);
	}
}

