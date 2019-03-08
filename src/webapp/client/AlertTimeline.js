import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import * as moment from 'moment';
import './app.css';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import ReactJson from 'react-json-view'

import InfoIcon from '@material-ui/icons/Info';
import SchoolIcon from '@material-ui/icons/School';
import StarIcon from '@material-ui/icons/Star';
import DesktopWindowsIcon from '@material-ui/icons/DesktopWindows';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-vertical-timeline-component/style.min.css';

import '@trendmicro/react-sidenav/dist/react-sidenav.css';

export default class AlertTimeline extends Component {
	state = {
		sid: '',
		alerts: []
	 };


	constructor(props) {
		super(props);
		console.log(props)
	}

	componentDidMount() {
		this.updateState()
	}

	componentDidUpdate(prevProps, prevState) {
		if(this.state.sid != this.props.sid) {
			console.log('props: ', this.props)
			this.updateState()
		}
	}
	
	updateState() {
		fetch('/api/getAlerts?' + this.props.type + '=' + this.props.sid)
		.then(res => res.json())
		.then(alerts => {
			this.setState({ 
				sid: this.props.sid,
				alerts: alerts 
			})
		});
	}

	timelineElementRenderer(alert, index) {
		console.log(alert, index)
		let alertSub = alert.sourceID.split(':')[0].replace(/_/g, ' ')
		let fromNow = moment(alert.timestamp).fromNow()
		let users = Object.keys(alert.users)
		return (
			<VerticalTimelineElement
				key={index}
				className="vertical-timeline-element"
				date={fromNow}
				iconStyle={{ background: 'rgb(33, 150, 243)', color: '#fff' }}
				icon={<InfoIcon />}
			>
				<h3 className="vertical-timeline-element-title">Alert</h3>
				<h4 className="vertical-timeline-element-subtitle">{alertSub}</h4>
				<p>this attacked happened in
					{
						Object.keys(alert.computers).map((key, index) => {
							return (<span key={index} style={{margin: "5px"}}> 
								<Link to={{
									pathname: "/computer/" + alert.computers[key].objectSid,
								}}>{alert.computers[key].label}</Link>
							</span>)
						})
					}
					computer, and 
					{
						users.map((key, index) => {
							return (<span key={index} style={{margin: "5px"}}> 
								<Link to={{
									pathname: "/user/" + alert.users[key].objectSid,
								}}>{alert.users[key].label}{index + 1 < users.length ? ',' : '' }</Link>
							</span>)
						})
					}
					 user{users.length > 1 ? 's are' : ' is'} related to this alert
				</p> 

				<ReactJson 
					src={JSON.parse(alert.data)} 
					// theme="monokai"
					collapsed={true}
					onSelect={
						(select)=>{
							if(select.name === 'ProcessGuid' || select.name === 'ParentProcessGuid') {
								console.log('selected', select)
								props.openModal.bind(props.bind)(select.value)
							}
						}
					}
				/>
			</VerticalTimelineElement>
		)
	}

	render() {
		return (
			<VerticalTimeline layout="1-column">
				{
					this.state.alerts.map((alert, index) => {
						return this.timelineElementRenderer(alert, index)
					})
				}
			</VerticalTimeline>
		);
	}
}
