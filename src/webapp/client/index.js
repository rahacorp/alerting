import React from 'react';
import ReactDOM from 'react-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { Router } from 'react-router-dom';
import {
	faUsers, faDesktop, faCodeBranch, faBell, faHome, faTasks, faNetworkWired, faUser, faSearch
} from '@fortawesome/free-solid-svg-icons';
import WebFont from 'webfontloader';
import App from './App';
import history from './history';

library.add(faUsers, faDesktop, faCodeBranch, faBell, faHome, faTasks, faNetworkWired, faUser, faSearch);

WebFont.load({
	google: {
		families: ['Titillium Web:300,400,700', 'sans-serif']
	}
});

ReactDOM.render((
	<Router history={history}>
		<App />
	</Router>
), document.getElementById('root'));
