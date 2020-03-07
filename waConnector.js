/*----------------------------------------------------------------------------------------------------
/ Copyright (C) 2018 SQUAD <hello@squad.com> http://squad.com
/ 
/ Permission is hereby granted, free of charge, to any person obtaining
/  a copy of this software and associated documentation files (the "Software"),
/  to deal in the Software without restriction, including without limitation
/  the rights to use, copy, modify, merge, publish, distribute, sublicense,
/  and/or sell copies of the Software, and to permit persons to whom the
/  Software is furnished to do so, subject to the following conditions:
/ 
/ The above copyright notice and this permission notice shall be included
/  in all copies or substantial portions of the Software.
/ 
/ THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
/  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
/  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
/  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
/  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
/  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
/  OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
----------------------------------------------------------------------------------------------------*/
'use strict'
const crypto = require('crypto');
const EventEmitter = require('events');
var twilioAPI = require('./myTwilio');
const db = require('./users.js');
const clog = require('./clog.js');

/** 
 * WACConnector main Class representing Whatsapp integration tool
 **/
class WACConnector extends EventEmitter {

	/**
     * Create a WACConnector.
     * @param {WACSystem} system - An specific implementation of system.
     */
	constructor(system) {
		super();
		this._sessionManager = new WACSessionManager();
		this._system = system;
		system.connector = this;
		this.init();
	}

	/**
     * Get the receiver session manager.
     * @return {WACSessionManager} The session manager.
     */
	get sm() {
		return this._sessionManager;
	}

	/**
     * Get the receiver system. Must be a WACSystem subclass
     * @return {any} System.
     */
	get system() {
		return this._system;
	}

	/**
     * Set the receiver system. Must be a WACSystem subclass
     * @param {any} value.
     */
	set system(value) {
		this._system = value;
	}

	/**
     * PRIVATE - Initializes the receiver
     */
	init() { }

	/**
     * A new span session has been launched.
	 * @param {WACSpan} span.
     */
	newSpan(span) {
		this.addSpan(span);
	}


	// Procces any kind of incomming message from web client (webSocket)
	processWSMessage(data, ip, callback) {
		data = JSON.parse(data);
		switch (data.type) {
			case 'CCmdSessionUser':
				this.processWSGetSession(data.id, data.tid, ip, (resp, user, tuser) => {
					this._sessionManager.createSessionFor(user, tuser);
					callback(JSON.stringify(resp));
				});
				break;
			case 'CCmdMessages':
				this.processWSGetMessages(data.id, data.phoneNumber, data.tid, data.targetPhoneNumber, (resp) => {
					callback(JSON.stringify(resp));
				});
				break;
			case 'CCmdSendMessage':
				this.processWSSendMessage(data.body, data.from, data.to, (resp) => {
					this._sessionManager.activityForNumber(data.from);
					//registerSend(resp);
					callback(JSON.stringify(resp));
				});
				break;
			case 'CCmdSendTemplate':
				this.processSendTemplateMessages(data.phoneNumber, data.targetPhoneNumber, (resp) => {
					this._sessionManager.activityForNumber(data.phoneNumber);
					//registerSend(resp);
					callback(JSON.stringify(resp));
				});
				break;

			default:
				processWSUnknown(data, (resp) => {
					callback(JSON.stringify(resp));
				});
		}
	}

	// Process a new session requested from web client
	processWSGetSession(userId, tuserId, ip, out) {

		var thisDB = db;
		var data = null;
		var usr = null;
		var tusr = null;
		try {
			db.allUserById([userId, tuserId], (users) => {

				usr = (users[0].id == userId) ? users[0] : users[1];
				tusr = (users[1].id == tuserId) ? users[1] : users[0];
				usr.ip = ip;
				tusr.ip = null;
				var user = new WACUser(usr);
				var tuser = new WACUser(tusr);
				var data = {
					"command": "CmdSessionUserResponse",
					"user": {
						"userId": user.id,
						"name": user.name,
						"phoneNumber": user.phoneNumber
					},
					"targetUser": {
						"userId": tuser.id,
						"name": tuser.name,
						"phoneNumber": tuser.phoneNumber
					}
				};
				out(data, user, tuser);
			});
		}
		catch (err) {
			console.log(err);
			data = { "command": "CmdUnknowSessionUser" };
		}
	}

	// Procces and returns all messages between phoneNumber and tPhoneNumber
	processWSGetMessages(id, phoneNumber, tid, tPhoneNumber, out) {
		// Get twilio messages "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json"
		/*
		{"body":"You said :Ok.\n Configure your WhatsApp Sandbox's Inbound URL to change this message.",
		"id":"SM4cb1ec1fa6807fadaa4b572be77e65fa",
		"author":"+14155238886",
		"time":1538337992000,
		"dateCreated":1538337992000,
		"dateUpdated":1538337995000,
		"dateSent":1538337993000,
		"direction":"outbound-reply",
		"status":"delivered",
		"chatId":"+14155238886",
		"type":"chat",
		"senderName":"+14155238886",
		"to":"+5492215455520",
		"from":"+14155238886",
		"fromMe":true,
		"messageNumber":610}
		
		
		try {
			console.log("Antes de twilio API");
			twilioAPI.listMessagesBetween(phoneNumber, tPhoneNumber, out);
		} catch(err) {
			console.log("ERROR: "+ err);
			
		}
		*/

		var msg = null;
		var cmdMessages = new Array();
		this._system.getMessages(phoneNumber, tPhoneNumber, null, (messages, spanId) => {

			var cmdData = {
				"command": "CmdMessageSet",
				"span": spanId,
				"messages": []
			};
			var count = 1;
			for (var i = 0; i < messages.length; i++) {
				var message = messages[i];
				msg = {
					"body": message.body,
					"id": message.id,
					"author": message.author,
					"time": new Date(message.time).getTime(),
					"dateCreated": new Date(message.dateCreated).getTime(),
					"dateUpdated": new Date(message.dateUpdated).getTime(),
					"dateSent": new Date(message.dateSent).getTime(),
					"direction": message.direction,
					"status": message.status,
					"chatId": message.chatId,
					"type": "chat",
					"senderName": message.sender,
					"to": message.receiver,
					"from": message.sender,
					"fromMe": (phoneNumber == message.sender),
					"messageNumber": count
				};
				cmdData.messages.push(msg);
				count++;
			}
			out(cmdData);
		})

	}

	// Procces a requested sending message from web client
	processWSSendMessage(text, phone, tPhone, out) {
		twilioAPI.sendMessage(text, phone, tPhone, (data) => {
			data = JSON.parse(data);
			var dateCreated = new Date(data.date_created.split('+')[0]).getTime();
			var dateSent = (data.date_sent != null) ? new Date(data.date_sent.split('+')[0]).getTime() : data.date_sent;
			var dateUpdated = new Date(data.date_updated.split('+')[0]).getTime();

			var msg = {
				"command": "CmdMessageAck",
				"body": data.body,
				"id": data.sid,
				"author": data.from.split(':')[1],
				"time": new Date(data.date_created).getTime(),
				"dateCreated": dateCreated,
				"dateUpdated": dateUpdated,
				"dateSent": dateSent,
				"direction": data.direction,
				"status": data.status,
				"chatId": data.from.split(':')[1],
				"type": "chat",
				"senderName": data.from.split(':')[1],
				"to": data.to.split(':')[1],
				"from": data.from.split(':')[1],
				"fromMe": (phone == data.from.split(':')[1]),
				"messageNumber": 0
			};
			out(msg);
			this.emit("#sentMessage", msg, text, phone, tPhone);
		});
	}

	// Procces a requested sending template message from web client
	processWSSendTemplateMessages(phone, tPhone, out) {
		twilioAPI.sendTemplateMessage(phone, tPhone, out);
	}

	// Procces a requested sending template message from web client
	processWSSendTemplateMessages(phone, tPhone, out) {
		twilioAPI.sendTemplateMessage(phone, tPhone, out);
	}

	// Procces a requested unkonwn message from web client
	processWSUnknown(data, out) {
		clog('<<DATA {time}>>', Reverse, data);
		out({ "command": "CmdUnknow" });
	}

	// Procces an incomming (webHook) telephony network message
	processWHMessage(idata, out) {

		//clog('<<WHDATA {time}>>', Reverse, idata.MessageSid);
		var data = {
			"command": "CmdMessageReponse",
			"id": idata.MessageSid,
			"author": idata.From.split(':')[1],
			"time": new Date().getTime(),
			"body": idata.Body,
			"dateCreated": new Date().getTime(),
			"dateUpdated": new Date().getTime(),
			"dateSent": new Date().getTime(),
			"direction": 'in-webhook',
			"status": 'received',
			"chatId": idata.From.split(':')[1],
			"type": "chat",
			"senderName": idata.From.split(':')[1],
			"to": idata.To.split(':')[1],
			"from": idata.From.split(':')[1],
			"fromMe": false,
			"messageNumber": -1,
			"receiveTime": Date.now()
		}
		this.emit('#receivedWHMessage', data, data.body, data.from, data.to);
		var session = this._sessionManager.sessionForNumber(data.to);
		if (session != null) {
			out(data, session.user.ip);
		}
		/*
		db.userByPhoneNumber(data.to, (user) => {
			out(data, user.ip);
		});
		*/
	}

	// Procces an incomming (webHook) telephony network status message
	processWHStatus(idata, out) {
		var data = {
			"command": "CmdMessageStatus",
			"id": idata.MessageSid,
			"status": (idata.hasOwnProperty('EventType') ? idata.EventType : idata.SmsStatus),
			"event": (idata.hasOwnProperty('EventType') ? idata.EventType : idata.SmsStatus),
			"chatId": idata.From.split(':')[1],
			"direction": 'in-status',
			"type": "chat",
			"senderName": idata.From.split(':')[1],
			"to": idata.To.split(':')[0],
			"from": idata.From.split(':')[1]
		}
		this.emit('#receivedWHStatus', data);
		var session = this._sessionManager.sessionForNumber(data.from);
		if (session != null) {
			clog.log('<< {time}>>', clog.Reverse, " #receivedWHStatus");
			out(data, session.user.ip);
		}
		/*
		db.userByPhoneNumber(msg.from, (user) => {
			out(msg, user.ip);
		});
		*/
	}

	wsNotifySpanExpiration(span, session) {

		if (session != null) {
			var data = {
				"command": "CmdSpanExpiration",
				"spanId": span.oid,
				"init": span.init,
				"end": span.end,
				"ip": session.user.ip
			}
			this.emit('#mustNotifySpanExpiration', data, session.user.ip);
		}
	}
}

class WACSystem {
	constructor() {
		this._connector = null;
	}

	get connector() {
		return this._connector;
	}

	set connector(value) {
		this._connector = value;
		this.initHooks();
	}

	get sessionManager() {
		return this.connector.sm;
	}

	/**
     * Add span to receiver.
	 * 
	 * @author Elvio Fernandez <elvio.fernandez@gmail.com>
	 * @param {WACSpan} span.
     */
	addSpan(span) {
		this.connector.sm.addSpan(span);
		this.spanAdded(span);
	}

	// Initialize routing events for receiver
	initHooks() {
		//_connector.on('#createdSpane');
		this._connector.sm.on('#expiredSpan', (span, session) => {
			this.spanExpired(span, session);
		});

		this._connector.on('#receivedWHMessage', (rawdata, text, phone, tPhone) => {
			this.whReceivedMessage(rawdata, text, phone, tPhone);
		});
		this._connector.on('#receivedWHStatus', (rawdata) => {
			this.whStatusReceived(rawdata);
		});
		this._connector.on('#sentMessage', (rawdata, body, phone, tPhone) => {
			this.sentMessage(rawdata, body, phone, tPhone);
		});
	}

	// Incoming message from telecomunication network received
	whReceivedMessage(rawdata, body, from, to) {
		// Redefined by subclasses
	}

	// Incoming status message from telecomunication network received
	whStatusReceived(rawdata, out) {
		// Redefined by subclasses
	}

	// Outgoing message to telecomunication network
	sentMessage(rawdata, body, from, to) {
		// Redefined by subclasses
	}

	// Outgoing message to telecomunication network
	getMessages(phoneNumber, tPhoneNumber, page, callback) {

	}

	// Outgoing message to telecomunication network
	spanAdded(span) {
		// Redefined by subclasses
	}

	// An span session has exprired
	spanExpired(wacSpan, wacSessionOrNUll) {
		// Redefined by subclasses

	}


}

class WACUser {


	constructor(user) {
		this._name = user.name;
		this._userId = user.userId;
		this._ip = user.ip;
		this._phoneNumber = user.phoneNumber;
	}

	get name() {
		return this._name;
	}

	set name(value) {
		this._name = value;
	}

	get ip() {
		return this._ip;
	}

	set ip(value) {
		this._ip = value;
	}

	get userId() {
		return this._userId;
	}

	set userId(value) {
		this._userId = value;
	}

	get phoneNumber() {
		return this._phoneNumber;
	}

	set phoneNumber(value) {
		this._phoneNumber = value;
	}
}

class WACSpan {

	constructor() {
		this._dirty = true;
		this._init = new Date().getTime();
		this._end = null;
		this._lastActivity = this._init;
		this._phoneNumber1 = null;
		this._phoneNumber2 = null;
		this._messages = new Array();
		this._oid = crypto.randomBytes(16).toString("hex");
	};

	get messages() {
		return this._messages;
	}

	set messages(value) {
		this._messages = value;
	}

	get lastActivity() {
		return this._lastActivity;
	}

	set lastActivity(value) {
		this._lastActivity = value;
	}

	get dirty() {
		return this._dirty;
	}

	set dirty(value) {
		this._dirty = value;
	}

	get oid() {
		return this._oid;
	}

	get init() {
		return this._init;
	}

	set init(value) {
		this._init = value;
	}

	get end() {
		return this._end;
	}

	set end(value) {
		this._end = value;
	}

	get phoneNumber1() {
		return this._phoneNumber1;
	}

	set phoneNumber1(value) {
		this._phoneNumber1 = value;
	}

	get phoneNumber2() {
		return this._phoneNumber2;
	}

	set phoneNumber2(value) {
		this._phoneNumber2 = value;
	}

	/* Session span duration in minutes */
	spanLength() {
		return 1;
	}

	/* Adds a message to receiver's collection */
	add(wacMessage) {
		this.lastActivity = Date.now();
		this._messages.push(wacMessage);
	}

}

class WACSession {

	constructor() {
		this._user = null;
		this._tuser = null;
		this._initTime = Date.now();
		this._oid = crypto.randomBytes(16).toString("hex");
		this._lastActivity = Date.now();
		this._span = null;

	};

	get user() {
		return this._user;
	}

	set user(value) {
		this._user = value;
	}

	get span() {
		return this._span;
	}

	set span(value) {
		this._span = value;
	}

	get tuser() {
		return this._tuser;
	}

	set tuser(value) {
		this._tuser = value;
	}

	get initTime() {
		return this._initTime;
	}

	get lastActivity() {
		return this._lastActivity;
	}

	set lastActivity(value) {
		this._lastActivity = value;
	}

	/* Session span duration in minutes */
	spanLength() {
		return 1;
	}
}


class WACSessionManager extends EventEmitter {

	constructor() {
		super();
		this._sessions = new Array();
		this._spans = new Array();
		this.initCleanerJob();
	}

	get sessions() {
		return this._sessions;
	}

	set sessions(value) {
		this._sessions = value;
	}

	get spans() {
		return this._spans;
	}

	set spans(value) {
		this._spans = value;
	}

	addSpan(span) {
		this._spans.push(span)
	}

	cleanTime() {
		// 64000 milliseconds is a minute
		return (1 * 64000);
	}

	initCleanerJob() {
		setInterval(() => {
			this.notifyOlderSpan();
		}, this.cleanTime());
	}

	notifyOlderSpan() {
		//console.log("#notifyOlderSpan");
		clog.log('<<{time}>>', clog.FgGreen, "#notifyOlderSpan");
		var diff = 0;
		var self = this;
		var span = null;
		var older = new Array();

		for (var i = 0; i < this.spans.length; i++) {
			span = this.spans[i];
			diff = Date.now() - span.lastActivity;
			//var seconds = diff/1000;
			//var hours = diff/3600000;
			//var days = diff/86400000;
			var minutes = diff / 60000;
			console.log(minutes, span.spanLength(), span.lastActivity);
			if (minutes > span.spanLength()) older.push(span);
		}
		if (older.length == 0) clog.log('<<{time}>>', clog.FgGreen, "No span to clean"); else {
			this.cleanExpiredSpan(older);
			//console.dir(older);
			//console.log("===================");
		}

	}

	cleanExpiredSpan(older) {
		var session = null;
		older.forEach(old => {
			for (var i = 0; i < this.spans.length; i++) {
				if ((this.spans[i]).oid === old.oid) {
					old.end = Date.now();
					this.spans.splice(i, 1);
					session = this.sessionForNumbers(old.phoneNumber1, old.phoneNumber2);
					if (session != null) {
						session.span = null;
					}
					old.dirty = true;
					this.emit('#expiredSpan', old, session);
				}
			}
		});
	}


	/**
	* Creates a session for a paired users
	*
	* @author Elvio Fernandez <elvio.fernandez@gmail.com>
	* @param {WACUser} user1
	* @param {WACUser} user2
	* @returns {WACSession} session
	*/
	createSessionFor(user1, user2) {
		var session = new WACSession();
		var user = new WACUser(user1);
		var tuser = new WACUser(user2);
		session.user = user;
		session.tuser = tuser;
		var span = new WACSpan();
		span.init = Date.now();
		span.phoneNumber1 = user.phoneNumber;
		span.phoneNumber2 = tuser.phoneNumber;
		session.span = span;
		this.sessions.push(session);
		return session;
	}


	/**
	 * Gets the session for a number. Returns null if absent.
	 * 
	 * @author Elvio Fernandez <elvio.fernandez@gmail.com>
	 * @param {string} number - phone number.
	 * @returns {(WACSession|null)} session - WACSession or null	 
 	*/
	sessionForNumber(number) {
		var session = this.sessions.find(ses => (ses.user.phoneNumber == number) || (ses.tuser.phoneNumber == number));
		if (session == undefined) return null; else return session;
	}

	/**
	 * Gets the session for a number. Returns null if absent.
	 * 
	 * @author Elvio Fernandez <elvio.fernandez@gmail.com>
	 * @param {string} num1 - phone number.
	 * @param {string} num2 - phone number.
	 * @returns {(WACSession|null)} session - WACSession or null	 
 	*/
	sessionForNumbers(num1, num2) {

		var session = this.sessions.find(ses =>
			((ses.user.phoneNumber == num1) && (ses.tuser.phoneNumber == num2)) || (ses.tuser.phoneNumber == num1) && (ses.user.phoneNumber == num2));
		if (session == undefined) return null; else return session;
	}

	/**
	 * Returns a session span given two number. Returns null if absent.
	 * 
	 * @author Elvio Fernandez <elvio.fernandez@gmail.com>
	 * @param {string} from - phone number.
	 * @param {string} to - phone number.
	 * @returns {(WACSpan|null)} span - WACSpan or null	 
 	*/
	sessionSpanForNumber(from, to) {
		var fromTo = from + to;
		var toFrom = to + from;
		var span, found = null;
		for (var i = 0; i < this.spans.length; i++) {
			span = this.spans[i];
			if (((span.phoneNumber1 + span.phoneNumber2) == fromTo) ||
				((span.phoneNumber1 + span.phoneNumber2) == toFrom)) {
				found = span;
			}
		}
		return found;
	}


	/* 
	Register activity for a number
	*/
	activityForNumber(number) {

		var session = this.sessionForNumber(number);
		session.lastActivity = Date.now();
	}

}

class WACMessage {

	constructor(rawdata) {
		this._rawdata;
	};

	get rawdata() {
		return this._rawdata;
	}

	set rawdata(value) {
		this._rawdata = value;
	}
}

module.exports = {
	WACSessionManager,
	WACUser,
	WACSession,
	WACSpan,
	WACConnector,
	WACMessage,
	WACSystem
};

/*module.exports = Object.assign({
	WACSessionManager,
	WACUser,
	WACSession,
	WACSpan,
	WACConnector,
	WACMessage,
	WACSystem
  }, module.exports);
*/

