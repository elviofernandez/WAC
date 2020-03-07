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
var express = require('express');
var app = express();
var path = require('path');
var util = require('util');
var bodyParser = require('body-parser');
var qryString = require('querystring');
var https = require('https');

//var msgRepo = require('./msgRepo.js');

var waC = require('./waConnector.js');
var waE = require('./waEngage.js');
var clog = require('./clog.js');

const WebSocket = require('ws');

/** 
 * EngageModel represent a specific system
 */
class WACConnectorServer {

	/**
     * Create a WACConnectorServer.
     */
	constructor() {
		
		var system =  new waE.EngageModel();
		this._connector = new waC.WACConnector(system);
		this._wss = new WebSocket.Server({ port: 3001 });
		this.init();	
	}

	/**
     * Initializes a WACConnectorServer.
     */
	init() {		

		this._wss.on('connection', (ws, req) => {
			var resp = null;
			var ip = req.connection.remoteAddress;
			ws.on('message', (message) => {
				clog.log('<<RECEIVE {time}>>', clog.Reverse, message); 
				
				this._connector.processWSMessage(message, ip, (resp) => {
					clog.log('<<SEND {time}>', clog.Reverse + clog.FgGray, resp);			
					ws.send(resp);			
				});		
			}); 
			ws.send('Conectado al socket port 3001');
			console.log('Client connected from IP: '+ req.connection.remoteAddress);	
		});

		this._connector.on('#mustNotifySpanExpiration', (resp, targetIP) => {
			this._wss.clients.forEach(function each(client) {
				if ( (client.readyState === WebSocket.OPEN) && ( client._socket.remoteAddress == targetIP)) {
					clog.log('<<SEND {time}>',  clog.Reverse +  clog.FgOrange, JSON.stringify(resp));
					client.send(JSON.stringify(resp));				
				}
			});
		});

		app.use(express.static(path.join(__dirname, "/public/")));
		app.use(bodyParser.urlencoded({ extended: true }));
		app.get('/messenger', (req, res) => {
			res.status(200)
				.sendFile(path.join(__dirname, "/public/", "index.html"))
		})
		app.get('/waConnector', (req, res) => {
			res.status(200)
				.sendFile(path.join(__dirname, "/public/", "index_iframe.html"))
		})
		.post('/webhook', (req, res) => {    
			
			clog.log('<<RECEIVEWEBHOOK {time}>>',  clog.Reverse +  clog.FgPurple, util.inspect(req.body));
			this._connector.processWHMessage(req.body, (resp, targetIP) => {
				console.log(targetIP);
				this._wss.clients.forEach(function each(client) {
					if ( (client.readyState === WebSocket.OPEN) && ( client._socket.remoteAddress == targetIP)) {
						clog.log('<<SEND {time}>',  clog.Reverse +  clog.FgLightPurple, JSON.stringify(resp));
						//registerReceive(resp);
						client.send(JSON.stringify(resp));				
					}
				});
				
			});
			res.status(200).end();
		})
		.post('/status', (req, res) => {	
			clog.log('<<RECEIVEStatus {time}>>',  clog.Reverse +  clog.FgLightOrange, util.inspect(req.body));
			this._connector.processWHStatus(req.body,(resp, targetIP) =>{
				this._wss.clients.forEach(function each(client) {			
					//console.log('targetIP:'+ targetIP);			
					if ( (client.readyState === WebSocket.OPEN) && ( client._socket.remoteAddress == targetIP)) {
						clog.log('<<SENDStatus {time}>',  clog.Reverse + clog.FgOrange, JSON.stringify(resp));
						//registerOrUpdateStatus(resp);
						client.send(JSON.stringify(resp));				
					}
				});
				
			});
			res.status(200).end();
		});
		app.listen(3000);
		console.log('Iniciando WhatsappConnector en puerto 3000');

	}
}

var wacServer = new WACConnectorServer();



 



