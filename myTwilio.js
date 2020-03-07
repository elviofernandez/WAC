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
//Get twilio messages "https://api.twilio.com/2010-04-01/Accounts/{AccountSid}/Messages.json"
var https = require('https');
var qryString = require('querystring');
const accountSid = 'AC2b32140c93093c30dd1064d1aa036927';
const authToken = 'f154057d3767be12f3433e494742aa8a';
const baseURL = 'api.twilio.com';

class TwilioAPI {

    constructor() {}
	

    listMessagesBetween(phone, tPhone, callback) {
	
		var number = 1;
		var data = '';
		var msg = null;
		var message = null;
		var fromNum = '';
		var toNum = '';
		var dateCreated = '';
		var dateSent ='';
		var dateUpdated ='';
		var cmdData = {
			"command" : "CmdMessageSet",	
			"messages": []
		};
		const options = {
			hostname: baseURL,
			path: '/2010-04-01/Accounts/'+accountSid+'/Messages.json?PageSize=1000',
			method: 'GET',
			auth: accountSid + ':' + authToken
		};
		
		var req = https.request(options, (res) => {
			
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
					data = data + chunk;
			});
			res.on('end', () => { 	
				
				data = data.replace('[object Object]','');
				data = JSON.parse(data);
				for(var i in data.messages) {
					message = data.messages[i];
					fromNum = message.from.split(':')[1];
					toNum = message.to.split(':')[1];
					
					if( (phone == fromNum && tPhone == toNum) || (tPhone == fromNum && phone == toNum)) {
						dateCreated = new Date(message.date_created).getTime();
						dateSent = new Date(message.date_sent).getTime();
						dateUpdated = new Date(message.date_updated).getTime();
						msg = {
							"body": message.body,
							"id": message.sid,
							"author": message.from.split(':')[1],
							"time": new Date(Date.parse(message.date_created)).getTime(),
							"dateCreated": dateCreated,
							"dateUpdated": dateUpdated,
							"dateSent": dateSent,
							"direction": message.direction,
							"status": message.status,
							"chatId": message.from.split(':')[1],
							"type":"chat",
							"senderName": message.from.split(':')[1],
							"to":  toNum,
							"from": fromNum,			
							"fromMe": (phone == message.from.split(':')[1]),
							"messageNumber": number
						};
						number++;
						//console.log(msg);
						//console.log("========================================================================");
						cmdData.messages.push(msg);
					}
				}			
				callback(cmdData); 
			});
		});
		req.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		});
		req.end();	
	}

    sendMessage(body, phone, tPhone, callback) {
		
		const postData = qryString.stringify({
			'From': 'whatsapp:'+phone,
			'To': 'whatsapp:'+tPhone,
			'Body': body
		});
		const options = {
			hostname: 'api.twilio.com',
			path: '/2010-04-01/Accounts/'+accountSid+'/Messages.json',
			method: 'POST',
			auth: accountSid + ':' + authToken,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': Buffer.byteLength(postData)
			}
		};
		
		var req = https.request(options, (res) => {
			var data = '';
			//console.log(`STATUS: ${res.statusCode}`);
			//console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
			res.setEncoding('utf8');
			res.on('data', (chunk) => {
				data = data + chunk;
			});
			res.on('end', () => { 
				callback(data);
			});
		});
		req.on('error', (e) => {
			console.error(`problem with request: ${e.message}`);
		});
		req.write(postData);
		req.end();	
	}	
		
	sendTemplateMessage(phone, tPhone, out) {
		this.sendMessage('Your verification code is {{1}}', phone, tPhone, out);
	}

	
}


module.exports = new TwilioAPI();
module.exports.accountSid = accountSid;
module.exports.authToken = authToken;

