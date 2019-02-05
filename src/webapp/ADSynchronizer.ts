import { ClientFactory } from "../clientFactory/ClientFactory";

export class ADSynchronizer {
	//this class reads users, computers, and groups date from ldap and creates/updates graph in neo4j based on ldap data
	domainName: string;
	ldapClient: any;
	neo4jClient: any;
	neo4jSession: any;

	constructor() {
		this.ldapClient = ClientFactory.createClient("ldap");
		this.neo4jClient = ClientFactory.createClient("neo4j");
		this.neo4jSession = this.neo4jClient.session();
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
								console.log(group.cn, result.summary.counters._stats);
							})
							.catch(function(error) {
								return reject(error);
							});
					}
					resolve("done");
				}
			});
		});
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
					synchronizer.neo4jSession
						.run(
							"MERGE (user:ADUser {dn : {dn} }) ON CREATE SET user.cn = {cn}, user.objectSid = {objectSid}",
							user
						)
						.then(function(result) {
							console.log(result.summary.counters._stats);
							if (
								result.summary.counters._stats.nodesCreated == 1
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
									});;
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
