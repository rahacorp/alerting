import React, { Component } from 'react';
import TopAppBar, {TopAppBarFixedAdjust} from '@material/react-top-app-bar';
import MaterialIcon from '@material/react-material-icon';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import '@material/react-top-app-bar/dist/top-app-bar.css';
import '@material/react-material-icon/dist/material-icon.css';

export default class PrimarySearchAppBar extends Component {
	state = { };

	componentDidMount() {

	}

	render() {
		return (
			  <TopAppBar
				title='Endpiont Detection & Response by Raha'
				navigationIcon={<MaterialIcon
				  icon='menu'
				  onClick={() => console.log('click')}
				/>}
				actionItems={[<img src="/public/raha-transparent.png" height="256" width="256"></img>]}
			  />
		  );
	}
}