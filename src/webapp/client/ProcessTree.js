import React, { Component } from 'react';
import './app.css';
import SplitPane from 'react-split-pane';
import {
	Tab, Tabs, TabList, TabPanel
} from 'react-tabs';
import { Link } from 'react-router-dom';
import '@trendmicro/react-sidenav/dist/react-sidenav.css';
import history from './history';
import TreeList from 'react-treelist';


import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import 'react-tabs/style/react-tabs.css';
import 'react-vertical-timeline-component/style.min.css';
import {Treebeard} from 'react-treebeard';

export default class ProcessTree extends Component {
	state = {
		data: [],
		guid: '',
		done: false
	}
	constructor(props) {
		super(props);
		this.onToggle = this.onToggle.bind(this);
		console.log('new proc tree', this.props.guid)
		
		this.setState({
			guid: this.props.guid,
			done: false
		})
	}
	
    onToggle(node, toggled){
        if(this.state.cursor){this.state.cursor.active = false;}
        node.active = true;
        if(node.children){ node.toggled = toggled; }
        this.setState({ cursor: node });
    }

	componentDidUpdate(prevProps, prevState) {
		if(this.state.guid != this.props.guid) {
			console.log('componentDidUpdate proc tree', this.props.guid)
			this.updateState()
		}
	}
	
	componentDidMount() {
		// console.log('mount ptree')

		this.updateState()
	}
	
	updateState() {
		console.log('proc req', encodeURI(this.props.guid))
		fetch('/api/process?guid=' + encodeURI(this.props.guid))
		.then(res => res.json())
		.then(data => {
			console.log(data)
			this.setState({
				data: data,
				done: true,
				guid: this.props.guid
			})
		});
	}

	
	treeConfig = {
		stateKey: 'tree-grid-1',
		gridType: 'tree', // either `tree` or `grid`,
		showTreeRootNode: false, // dont display root node of tree
		columns: [
			{
				dataIndex: 'category',
				name: 'Category',
				expandable: true // this will be the column that shows the nested hierarchy
			},
			{
				dataIndex: 'categoryCode',
				name: 'Category Code',
				expandable: true // can be set on multiple columns
			},
			{
				dataIndex: 'editable',
				name: 'Editable',
				expandable: false // will be displayed as flat data
			}
		],
	};

	data = {
		root: {
			id: -1,
			parentId: null,
			children: [
				{
					id: 1,
					parentId: -1,
					name: 'Category 1',
					categoryCode: 'as-ffw-34neh-',
					editable: true,
					children: [
						{
							id: 12,
							parentId: 1,
							leaf: false // there are children for this record that haven't been fetched yet
							// ... rest of data
						},
						{
							id: 13,
							parentId: 1
							// ... rest of data
						}
					]
				}
			]
		}
	}

	guidFormatter(guid) {
		return (
			<Link to={{
				pathname: "/process/" + guid,
			}}>{guid}</Link>
		)
	}


	render() {
		
		return (
			<TreeList
				data={this.state.data}  
				columns={[ { "title": "ID", "field": "id", "type": "number", "width": 300 }, { "title": "Command Line", "field": "name", "type": "string" }, { 
					"title": "Guid",
					"field": "guid",
					"formatter" : this.guidFormatter,
					"type": "string" 
				} ]}
				options={{ "minimumColWidth": 100, "expandAll": true }}
				id={'id'}
				parentId={'parentId'}></TreeList>
		);
	}
}

