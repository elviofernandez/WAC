const db = require('mssql');
const ses = require('./session.js');
var clog = require('./clog.js');

const waConnectorConfig = {
    user: 'sa',
    //password: 'J7K8qGmQcTH2wubZ6siM',	
	password: 'mostro',	
	server: 'localhost',	
    database: 'WAConnector',
	options: {
        encrypt: false 
    }
};

const engageConnectorConfig = {
    user: 'sa',
    //password: 'J7K8qGmQcTH2wubZ6siM',	
	password: 'mostro',	
	server: 'localhost',	
    database: 'ENGAGE_GDM',
	options: {
        encrypt: false 
    }
};
var users = new Array();

Date.prototype.toStringDB = function () {
    return this.getYear()+'-'+(this.getMonth()+1)+'-'+this.getDay()+' '+this.getHours()+':'+this.getMinutes()+':'+this.getSeconds()+':'+this.getMilliseconds() ;
};

String.prototype.sQuote = function () {
    return "'"+this+"'";
};


class ConnectorDB {
    constructor() {		
		this.cacheUsers = new Array();
		this.pool = new db.ConnectionPool(waConnectorConfig, (err) => {
			if(err != null) console.log(">>> ConnectorDB > Error request pool:"+err);
		});
		this.poolEngage = new db.ConnectionPool(engageConnectorConfig, (err) => {
			if(err != null) console.log(">>> ConnectorDB engage > Error request pool:"+err);
		});
	}
	
	registerCache(user) {		
		if(!this.cacheUsers.hasOwnProperty(user.phoneNumber))
			this.cacheUsers[user.phoneNumber] = user;
		return user;		
	}

	usersInCache() {
		return this.cacheUsers;		
	}
	
	userByPhoneNumber(number, callback) {
		
		var self = this;
		if(self.cacheUsers.hasOwnProperty(number)) {
			callback(self.cacheUsers[number]);	
		} else {
			var user = {};	
			var sql = `SELECT * from WAUser WHERE phoneNumber ='${number}'`;		
			self.pool.request().query( sql, (err, result) => {
				user.userId = result.recordset[0].id;
				user.name = result.recordset[0].name;
				user.phoneNumber = result.recordset[0].phoneNumber;		
				callback(self.registerCache(user));			
			});	
		}	
		db.on('error', err => { console.log(">>> Constructor > Error:" + error) });
	}
	
	userById( userId, callback ) {		 
		var self = this;
		var user = {};
		var sql = `SELECT * from WAUser WHERE id = ${userId}`;			
		self.pool.request().query( sql, (err, result) => {		 
			user.userId = result.recordset[0].id;
			user.name = result.recordset[0].name;
			user.phoneNumber = result.recordset[0].phoneNumber;
			callback(self.registerCache(user));							
		});		
		db.on('error', err => {console.log(error) });
	}

	allUserById( arrayId, callback ) {		 
		var self = this;		
		var elem = null;
		var users = new Array();
		var sql = 'SELECT * from WACUser WHERE id IN ('+ arrayId.join(',') +')';	
		console.log(sql);	
		self.pool.request().query( sql, (err, result) => {			
			for (var i in result.recordset) {
				elem = result.recordset[i];
				var user = {};
				user.userId = elem.id;
				user.name = elem.name;
				user.phoneNumber = elem.phoneNumber;
				users.push(this.registerCache(user));				
			}			
			callback(users);							
		});		
		db.on('error', err => {console.log(error) });
	}

	getMessages(num1, num2, page, callback) {
		
		var elem = null;
		var messages = new Array();
		var self = this;
		self.getLastSpanFor(num1, num2, (lastSpan) => {
			if(lastSpan != null) {
				var sql = `SELECT * from WACMessage msg WHERE  msg.spanId = '${lastSpan.oid}' Order by msg.dateCreated Desc`;
				//console.log(sql);	
				self.pool.request().query( sql, (err, result) => {			
					for (var i in result.recordset) {
						elem = result.recordset[i];
						//console.dir(elem);
						messages.push(elem);				
					}
					callback(messages, lastSpan.oid);										
				});			
			}
		});
		db.on('error', err => {console.log(error) });
	}

	
	getLastSpanFor(num1, num2, callback) {
		var span = null;
		var elem = null;
		var self = this;
		var sql = 'SELECT Top(1) * from WACSessionSpan Order by CONVERT(datetime, initSpan) Desc';	
		//console.log(sql);	
		self.pool.request().query( sql, (err, result) => {
			if(result.recordset.length > 0) {
				elem = result.recordset[0];
				span = {};
				span.oid = elem.id;
				span.init = elem.initSpan;
				span.end = elem.endSpan;
				span.phoneNumber1 = elem.cel1;
				span.phoneNumber2 = elem.cel2;
				callback(span);
			}
		});

	}

	triggerSPForNewSpan(wacSpan) {
		console.log("Trigger stored proc for wacSpan ----------------");
		var self = this;		
		var req = self.poolEngage.request();
		req.input('PS_PKEY_CUSTOMER', db.VarChar(60), "000250D3-9686-407D-8D1B-026D0ED8F6CA");
		req.input('PS_PKEY_CAMPAIGN', db.VarChar(36), null);
		req.input('PS_JOB_TYPE_CODE', db.VarChar(20) ,"CA_GESTION_MORA");
		req.input('PS_UNIT_CODE', db.VarChar(100) ,"CALL_COBR");
		req.input('PS_USER_ID', db.VarChar(30) , null);
		req.input('PS_PARENT_JOB_PKEY', db.VarChar(100) , null);
		req.input('PS_COLS_ENTIDAD_PRINCIPAL', db.VarChar(4000) , "CLAVE_CANAL_SELEC");
		req.input('PS_VALORES_ENTIDAD_PRINCIPAL', db.VarChar(4000) , "WApp" + wacSpan.oid);
		req.input('PS_COLS_TRAMITE_PADRE', db.VarChar(4000) , null);
		req.output('PS_PKEY_JOB', db.VarChar(36));
		req.output('PS_RET_MESSAGE', db.VarChar(440));		
		req.execute('dbo.PA_SYS_NUEVO_PROCESO', (err, result) => {
        		if(err != null) { 
					console.log(err);
				} else {
					console.log(">>> Triggered stored proc ----------------");
					console.dir(wacSpan);
					console.dir(result);
					console.log(">>> --------------------------------------");
				}
		});
		
	}

	updateMessageStatus( msg ) {
		var self = this;
		var trans = new db.Transaction(self.pool);
		var eventFragment = (msg.hasOwnProperty('event')) ? `event='${msg.event}',`: ''; 
		var dateSent = (msg.dateSent == null) ? 'NULL': new Date(msg.dateSent).toLocaleString().sQuote();
		var sql = `UPDATE WACMessage SET ${eventFragment} status= '${msg.status}', dateSent=${dateSent} WHERE id = '${msg.id}'`;
		trans.begin( (err) => {			
			var request = new db.Request(trans);
    		request.query(sql, (err1, result) => {
				if(err1 != null) console.log(err1);
				else trans.commit(eror => {
					if(eror != null) console.log(">>> Commit Error:" + eror);
					clog.log('<<TRANSACTION {time}>>', clog.Reverse+ clog.FgGreen, "Transaction committed >>> "+sql); 
            		//console.log("Transaction committed >>> "+sql);
        		})
    		})
		})
	}

	saveMessage( span , msg ) {		 
		var self = this;
		var sqlSpan = "";
		var trans = new db.Transaction(self.pool);
		var dateCreated = (msg.dateCreated == null) ? 'NULL': new Date(msg.dateCreated).toLocaleString().sQuote();
		var dateUpdated = (msg.dateUpdated == null) ? 'NULL': new Date(msg.dateUpdated).toLocaleString().sQuote();
		var dateSent = (msg.dateSent == null) ? 'NULL': new Date(msg.dateSent).toLocaleString().sQuote();
		
		if(span.dirty) {
			sqlSpan = `INSERT INTO WACSessionSpan
			(id, initSpan, cel1, cel2)
			VALUES('${span.oid}', '${new Date(span.init).toLocaleString()}', '${span.phoneNumber1}', '${span.phoneNumber2}'); `;
		}
		var sql = sqlSpan + `INSERT INTO WACMessage
		(id, body, author, dateCreated, dateUpdated, dateSent, direction, status, chatId, receiver, sender, [time], spanId)
		VALUES('${msg.id}', '${msg.body}', '${msg.from}', ${dateCreated}, ${dateUpdated}, ${dateSent}, '${msg.direction}', '${msg.status}', '${msg.chatId}', '${msg.to}', '${msg.from}', '${new Date(Date.now()).toLocaleString()}', '${span.oid}')`;
		
		trans.begin( (err) => {			
			var request = new db.Request(trans);
    		request.query(sql, (err1, result) => {
				if(err1 != null) console.log(err1);
				else trans.commit(eror => {					
					if(eror != null) console.log(">>> Commit Error:" + eror);
            		else {
						span.dirty = false;
						clog.log('<<TRANSACTION {time}>>', clog.Reverse+ clog.FgGreen, "Transaction committed >>> "+sql); 
						//console.log("Transaction committed >>> " + sql);
					}
        		})
    		})
		});
	}


updateSpan( span ) {		 
	var self = this;
	var sql = "";
	var trans = new db.Transaction(self.pool);
	
	sql = `UPDATE WACSessionSpan SET
			 initSpan='${new Date(span.init).toLocaleString()}',
			 cel1 = '${span.phoneNumber1}',
			 cel2 =  '${span.phoneNumber2}',
			 endSpan =  '${new Date(span.end).toLocaleString()}'
			 WHERE  id='${span.oid}'`;
	
		trans.begin( (err) => {			
			var request = new db.Request(trans);
			request.query(sql, (err1, result) => {
				if(err1 != null) console.log(err1);
				else trans.commit(eror => {					
					if(eror != null) console.log(">>> Commit Error:" + eror);
					else {
						span.dirty = false;
						clog.log('<<TRANSACTION {time}>>', clog.Reverse+ clog.FgGreen, "Transaction committed >>> "+sql); 
						//console.log("Transaction committed >>> " + sql);
					}
				})
			})
		});
	}
}

module.exports = new ConnectorDB();
module.exports.users = users;

