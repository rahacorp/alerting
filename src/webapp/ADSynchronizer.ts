import { ClientFactory } from "../clientFactory/ClientFactory";

export class ADSynchronizer {

	/*
	remove all nodes
	MATCH (r)-[l:MEMBER_OF]->(b) DELETE l
	MATCH (r:ADUser) DELETE r
	MATCH (r:ADGroup) DELETE r
	MATCH (r:ADComputer) DELETE r
	*/
	//this class reads users, computers, and groups date from ldap and creates/updates graph in neo4j based on ldap data
	domainName: string;
	ldapClient: any;
	neo4jClient: any;
	neo4jSession: any;
	groupsAdded: boolean;

	constructor() {
		this.ldapClient = ClientFactory.createClient("ldap");
		this.neo4jClient = ClientFactory.createClient("neo4j");
		this.neo4jSession = this.neo4jClient.session();
		this.groupsAdded = false
	}

	public syncAllGroups() {
		let synchronizer = this
		return new Promise((resolve, reject) => {
			synchronizer.ldapClient.findGroups("cn=*", function(err, groups) {
				if (err) {
					return reject(err);
				}

				if (!groups || groups.length == 0) {
					return reject("No groups found.");
				} else {
					for (let group of groups) {
						console.log(group);
						synchronizer.neo4jSession
							.run(
								"MERGE (group:ADGroup {dn : {dn} }) ON CREATE SET group.cn = {cn}, group.description = {description}",
								group
							)
							.then(function(result) {
								if (
									result.summary.counters._stats.nodesCreated == 1
								) {
									synchronizer.groupsAdded = true
								}
								console.log(group.cn, result.summary.counters._stats);
							})
							.catch(function(error) {
								console.error(error)
								return reject(error);
							});
					}
					resolve("done");
				}
			});
		});
	}

	public syncAllComputers() {
		let synchronizer = this
		synchronizer.ldapClient.find({
			filter: "(objectCategory=computer)",
			attributes: ["cn", "dn", "operatingSystem", "objectSid", "description", "dNSHostName", "operatingSystemServicePack", "operatingSystemVersion", "name"]
		}, (err, computers) => {
			if (err) {
				console.log(`ERROR: ${JSON.stringify(err)}`);
				return;
			}

			if (!computers || computers.length === 0) {
				console.log("No computers found.");
			} else {
				console.log(computers)
				for (let computer of computers.other) {
					console.log(computer);
					if(computer.cn) {
						computer.cn = computer.cn.toLowerCase()
					}
					if(computer.dNSHostName) {
						computer.dNSHostName = computer.dNSHostName.toLowerCase()
					}
					synchronizer.neo4jSession
						.run(
							"MERGE (computer:ADComputer {dn : {dn} }) ON CREATE SET computer.cn = {cn}, computer.objectSid = {objectSid}, computer.dNSHostName = {dNSHostName}, " + 
							"computer.operatingSystem = {operatingSystem}, computer.operatingSystemVersion = {operatingSystemVersion}",
							computer
						)
						.then(function(result) {
							console.log(result.summary.counters._stats);
						})
						.catch(function(error) {
							console.log(error);
						});
				}
			}
		})
	}

	public syncAllUsersAndGroups() {
		let synchronizer = this
		synchronizer.ldapClient.findUsers("cn=*", true, (err, users) => {
			if (err) {
				console.log(`ERROR: ${JSON.stringify(err)}`);
				return;
			}

			if (!users || users.length === 0) {
				console.log("No users found.");
			} else {
				for (let user of users) {
					console.log(user);
					if (user.userPrincipalName) {
						let domainName =  user.userPrincipalName.split('@')[1].split('.')[0]
						user.logonName = (domainName.toUpperCase() + '\\' + user.sAMAccountName).toLowerCase()
					} else {
						let domainName = user.dn.split(',DC=')[1]
						user.logonName = (domainName.toUpperCase() + '\\' + user.sAMAccountName).toLowerCase()
					}
					if(user.cn) {
						user.cn = user.cn.toLowerCase()
					}
					
					synchronizer.neo4jSession
						.run(
							"MERGE (user:ADUser {dn : {dn} }) ON CREATE SET user.cn = {cn}, user.objectSid = {objectSid}, user.logonName = {logonName}",
							user
						)
						.then(function(result) {
							console.log(result.summary.counters._stats);
							if (
								result.summary.counters._stats.nodesCreated == 1 || synchronizer.groupsAdded
							) {
								//adding groups
								for (let group of user.groups) {
									synchronizer.neo4jSession.run(
										"MATCH (user:ADUser {dn : {udn} }) " +
											"MATCH (group:ADGroup {dn : {gdn} }) " +
											"MERGE (user)-[r:MEMBER_OF]->(group)",
										{
											udn: user.dn,
											gdn: group.dn
										}
									).then(function(result) {
										console.log(group.cn, result.summary.counters._stats);
									})
									.catch(function(error) {
										console.log(error);
									})
								}
							}
						})
						.catch(function(error) {
							console.log(error);
						});
				}
				// console.log(`findUsers: ${JSON.stringify(users)}`);
				// res.send(users);
			}
		});
	}
}
