const crypto = require('crypto');
const EventEmitter = require('events');

class User {
	constructor() {
		this._name = null;
		this._userId = null;
		this._phoneNumber = null;		
	}

	get name() {
		return this._name;
	}
	
	set name(value) {
		this._name = value;
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

class SessionSpan {

	constructor() {

		this._init = Date.now();
		this._end = null;
		this._phoneNumber1 = null;
		this._phoneNumber2 = null;
		this._oid = crypto.randomBytes(16).toString("hex");		
	};

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
}

class Session {
	
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


class SessionManager extends EventEmitter {

	get sessions() {
		return this._sessions;
	}

	set sessions(value) {
		this._sessions = value;
	}

	constructor() {
		super();
		this._sessions = new Array();
		this._spans = new Array();
		this.initCleanerJob();
	}

	cleanTime() {
		// 64000 milliseconds is a minute
		return (1*64000);
	}	

	initCleanerJob() {
		setInterval(() => {
			this.notifyOlderSpan();
		}, this.cleanTime());
	}

	notifyOlderSpan() {
		console.log("notifyOlderSpan");
		var diff = 0;
		var self = this;
				
		// Finalize older spans
		this.sessions.forEach(ses => {			
			diff = Date.now() - ses.lastActivity;
			//var seconds = diff/1000;
			var minutes = diff/60000;
			console.log(minutes,  ses.spanLength());
			//var hours = diff/3600000;
			//var days = diff/86400000;
			if(ses.span != null) {
				if(minutes > ses.spanLength()) {
					var span = ses.span;
					ses.span = null;
					this.emit('expiredSpan', ses, span);
				}
			}			
		});
	}

	/* 
	Creates a session for a paired users
	*/
	createSessionFor( user1, user2 ) {
		var session = new Session();
		session.user = user1;
		session.tuser = user2;
		var span = new SessionSpan();
		span.init = Date.now();
		session.span = span;
		this.sessions.push(session);
		return session;
	}

	/* 
	Gets the session for a number. Returns null if absent
	*/
	sessionForNumber(number) {
		
		var session = this.sessions.find(ses => (ses.user.phoneNumber == number) ||  (ses.tuser.phoneNumber == number));
		if(session == undefined) return null; else return session;
	}

	/* 
	Register activity for a number
	*/
	activityForNumber(number) {
		
		var session =  this.sessionForNumber(number);		
		session.lastActivity = Date.now();		
	}

}

module.exports = Object.assign({
	SessionManager,
	User,
	Session,
	SessionSpan
  }, module.exports);


