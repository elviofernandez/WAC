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

var wa = require('./waConnector.js');
var db = require('./users.js');
var clog = require('./clog.js');

/** 
 * EngageModel represent a specific system
 */
class EngageModel extends wa.WACSystem {

	/**
 	* Incoming message from telecomunication network received
 	* @param {json} rawdata - Raw data incoming message
	* @param {string} body - Body text.
	* @param {string} from - phone number.
	* @param {string} to - phone number.
 	*/
	whReceivedMessage(rawdata, body, from, to) {

		var msg = null;
		var span = this.sessionManager.sessionSpanForNumber(from, to);
		if (span == null) {
			span = new wa.WACSpan();
			span.phoneNumber1 = from;
			span.phoneNumber2 = to;
			this.addSpan(span);
			this.spanAdded(span);
		}
		msg = new wa.WACMessage(rawdata);
		span.add(msg);

		db.saveMessage(span, rawdata);
	}


	/**
 	* Incoming status message from telecomunication network received
 	* @param {json} rawdata - Raw data incoming message
	*/
	whStatusReceived(rawdata) {
		db.updateMessageStatus(rawdata);
	}

	/**
	 * Outgoing message to telecomunication network has been sent
	 * 
	 * @author Elvio Fernandez <elvio.fernandez@gmail.com>
	* @param {json} rawdata - Raw data incoming message
 	* @param {string} body - Body text.
	* @param {string} from - phone number.
	* @param {string} to - phone number.
	*/
	sentMessage(rawdata, body, from, to) {

		clog.log('<<{time}>>', clog.FgGreen, '#sentMessage');
		var msg = null;
		var span = this.sessionManager.sessionSpanForNumber(from, to); // hacer que mensaje cree un span si no existe y que emita in evento de spanAdded escuchado por WACSystem
		if (span == null) {
			span = new wa.WACSpan();
			span.phoneNumber1 = from;
			span.phoneNumber2 = to;
			this.addSpan(span);
			this.spanAdded(span);
		}
		msg = new wa.WACMessage(rawdata);
		span.add(msg);
		db.saveMessage(span, rawdata);
	}

	// Outgoing message to telecomunication network
	getMessages(phoneNumber, tPhoneNumber, page, callback) {
		db.getMessages(phoneNumber, tPhoneNumber, null, callback);
	}

	/**
	* A span session has exprired. 
	* See WACSpan for details
 	* @param {WACSpan} wacSpan - Body text.
	*/
	spanExpired(wacSpan, wacSessionOrNull) {
		clog.log('<<{time}>', clog.Reverse + clog.FgLightPurple, '#expiredSpan');
		console.dir(wacSpan);
		db.updateSpan(wacSpan);
		this.connector.wsNotifySpanExpiration(wacSpan, wacSessionOrNull);
	}

	/**
	* A span session has been added. 
	* See WACSpan for details
 	* @param {WACSpan} wacSpan - Body text.
	*/
	spanAdded(wacSpan) {

		db.triggerSPForNewSpan(wacSpan);
	}
}




module.exports = { EngageModel };