import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import './app.css';
import SideNav, {
	NavItem, NavIcon, NavText
} from '@trendmicro/react-sidenav';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import history from './history';

import '@trendmicro/react-sidenav/dist/react-sidenav.css';

export default class Sidebar extends Component {
	state = { };

	sideNavRef = null;

	constructor(props) {
		super(props);
		this.sideNavRef = React.createRef();
		console.log(this);
	}

	componentDidMount() {


		// this.sideNavRef.selected = 'user';
	}

	render() {
		return (
			<SideNav
				onSelect={(selected) => {
					const to = `/${selected}`;
					if (selected === 'home') {
						history.push('/');
					} else {
						history.push(to);
					}
				}}
			>

				<SideNav.Toggle />
				<SideNav.Nav defaultSelected="home" ref={this.sideNavRef}>
					<NavItem eventKey="home">
						<NavIcon>
							<FontAwesomeIcon
								icon="home"
							/>
						</NavIcon>
						<NavText>Home</NavText>
					</NavItem>
					<NavItem eventKey="users">
						<NavIcon>
							<FontAwesomeIcon
								icon="users"
							/>
						</NavIcon>
						<NavText>Users</NavText>
					</NavItem>
					<NavItem eventKey="computers">

						<NavIcon>
							<FontAwesomeIcon
								icon="desktop"
							/>
						</NavIcon>
						<NavText>Computers</NavText>
					</NavItem>
					<NavItem eventKey="logs">
					
						<NavIcon>
							<FontAwesomeIcon
								icon="search"
							/>
						</NavIcon>
						<NavText>Logs</NavText>
					</NavItem>
					<NavItem eventKey="alerts">
						<NavIcon>
							<FontAwesomeIcon
								icon="bell"
							/>
						</NavIcon>
						<NavText>Alerts</NavText>
					</NavItem>
					
					{/* <NavItem eventKey="home">
				<NavIcon>
					<i className="fa fa-fw fa-home" style={{ fontSize: '1.75em' }} />
				</NavIcon>
				<NavText>
					Home
				</NavText>
			</NavItem>
			<NavItem eventKey="devices">
				<NavIcon>
					<i className="fa fa-fw fa-device" style={{ fontSize: '1.75em' }} />
				</NavIcon>
				<NavText>
					Devices
				</NavText>
			</NavItem> */}
				</SideNav.Nav>
			</SideNav>
		);
	}
}
