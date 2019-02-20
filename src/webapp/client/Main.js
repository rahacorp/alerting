import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import { Timeline, TimelineEvent } from 'react-event-timeline';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import {
	UserCard,
	ProductCard,
	TaggedContentCard,
	FlippingCard,
	FlippingCardFront,
	FlippingCardBack,
	RecipeCard,
	NewsHeaderCard,
	CryptoCard,
	PaymentCard
} from 'react-ui-cards'
// import 'rea/styles.scss';

import AnimatedNumber from 'react-animated-number';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';




export default class Main extends Component {
	state = {
		logs: 0,
		alerts: 0
	}
	constructor(props) {
		super(props);
		this.state = {
			logs: 0,
			alerts: 0
		};
	}

	updateCount() {
		let main = this
		fetch('/api/logCount')
		.then(res => res.json())
		.then(res => {
			console.log(res)
			main.setState({
				logs: res.logs,
				alerts: res.alerts
			})
		});
	}

	componentDidMount() {
		let main = this
		setTimeout(() => {
			main.updateCount()
		}, 1000)
		setInterval(() => {
			main.updateCount()
		}, 20000)
	}

	render() {
		return (
			<div id="mainPanel">
				<div className="dummydiv"></div>
				<ProductCard
					photos={[
						'https://www.shareicon.net/download/128x128//2016/12/12/862832_internet_512x512.png'
					]}
					productName={
						<AnimatedNumber component="text" value={this.state.logs}
						style={{
							transition: '0.8s ease-out',
							fontSize: 48,
							transitionProperty:
								'color, opacity'
						}}
						duration={300}
						formatValue={n => n.toLocaleString()}
					/>}
					description='Logs Processed'
				/>
				<ProductCard
					photos={[
						'http://www.myiconfinder.com/icon/download/d126274718a0e884768ab345d31b53c0-alert.png~21165'
					]}
					productName={
						<AnimatedNumber component="text" value={this.state.alerts}
						style={{
							transition: '0.8s ease-out',
							fontSize: 48,
							transitionProperty:
								'color, opacity'
						}}
						duration={300}
						formatValue={n => n.toLocaleString()}
					/>}
					description='Alerts Triggered'
				/>
				<div className="dummydiv"></div>

			</div>
		);
	}
}
