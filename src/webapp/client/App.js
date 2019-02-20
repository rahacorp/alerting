import React, { Component } from 'react';
import './app.css';
import Sidebar from './Sidebar';
import Main from './Main';
import Computer from './Computer';
import ComputerList from './ComputerList';
import UserList from './UserList';
import User from './User';
import Logs from './Logs';
import Process from './Process';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import PrimarySearchAppBar from './PrimarySearchAppBar';
import {
	BrowserRouter, Switch, Route, Link
} from 'react-router-dom';
import 'react-tabs/style/react-tabs.css';
import 'searchkit/release/theme.css';
import 'react-treelist/build/css/index.css';
import Alerts from './Alerts';

export default class App extends Component {
	state = { username: null };

	componentDidMount() {
		fetch('/api/getUsesrname')
			.then(res => res.json())
			.then(user => this.setState({ username: user.username }));
	}

	render() {
		const { username } = this.state;
		return (
			<div>

				<PrimarySearchAppBar />
				<Sidebar />
				<MainRouter />
			</div>
		);
	}
}

function Home() {
	return (<div>home</div>);
}

function MainRouter() {
	return (
		<main>
			<Switch>
				<Route exact path="/" component={Main} />
				<Route path="/computers" component={ComputerList} />
				<Route path="/computer/:computersid" component={Computer} />
				<Route path="/process/:guid" component={Process} />
				<Route path="/users" component={UserList} />
				<Route path="/user/:usersid" component={User} />
				<Route path="/logs" component={Logs} />
				<Route path="/alerts" component={Alerts} />
			</Switch>
		</main>
	);
}
