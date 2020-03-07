"/*----------------------------------------------------------------------------------------------------
/ Copyright (C) 2018 SQUAD <info@squad.com> http:/squad.com
/ 
/ Permission is hereby granted, free of charge, to any person obtaining
/  a copy of this software and associated documentation files (the 'Software'),
/  to deal in the Software without restriction, including without limitation
/  the rights to use, copy, modify, merge, publish, distribute, sublicense,
/  and/or sell copies of the Software, and to permit persons to whom the
/  Software is furnished to do so, subject to the following conditions:
/ 
/ The above copyright notice and this permission notice shall be included
/  in all copies or substantial portions of the Software.
/ 
/ THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
/  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
/  OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
/  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
/  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
/  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE
/  OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
/ Based on https://codepen.io/ankitjain28/pen/WRvaZG
----------------------------------------------------------------------------------------------------*/"
! Object methodsFor: #logging !
log: obj
	
	#{console} #log: obj ! !

! DateTime methodsFor: #converting !
asDatePrintString
	" Return the locale string of the receiver. "

	^self asLocaleString, ' ', self hours , ' ', self minutes, ' ', self seconds ! !

	
HTMLElement
	subclass: #HTMLTemplate
	instanceVariableNames: ''
	category: 'Messenger-Support' !	
	
! HTMLTemplate class methodsFor: #HTML !
tagName
	" Return the tag of the receiver. "

	^'TEMPLATE'! !

! HTMLTemplate methodsFor: #accessing !
content
	" Return the content of the receiver. "

	^DOMNode @ (self handle basicAt: #content)! !
	
EventManager
	subclass: #Messenger
	instanceVariableNames: 'socket channels'
	category: 'Messenger' !


! Messenger class methodsFor: #events !
constructEventsTriggered
	" Private - Return the events managed by instances of the receiver. "

	^#(	#connected #newMessage )
	, super constructEventsTriggered! !
	
! Messenger methodsFor: #initialize !
channels 
	
	channels isNil ifTrue: [ channels := PoolDictionary new ].
	^channels! !
	
! Messenger methodsFor: #initialize !
initialize 
	
	self initSocket! !

! Messenger methodsFor: #initialize !
initSocket 

	socket := WebSocket url: 'ws://localhost:3001'.
	socket
		when: #open do: [ self connected. ];
		when: #close: do: [:evt| self print: #disconnected ];
		when: #message: do: [:evt| self receive: (WSMessageEvent @ evt) data ];
		when: #error do: [:evt| self print: 'WebSocket error: ',(WSMessageEvent @ evt) data ].
! !

! Messenger methodsFor: #initialize !
connected
	"self send: #Connected."
	self triggerEvent: #connected! !
	

! Messenger methodsFor: #private !
send: data
	
	(socket state = #closed) ifTrue: [
		self initSocket.
	].
	socket send: data! !

! Messenger methodsFor: #private !
getMessagesFor: phoneNumber
	
	| data |
	data := (#type -> #getMessages), 
		(#id -> nil),
		(#phoneNumber -> phoneNumber).
	self send: data asJSON! !

! Messenger methodsFor: #private !
receive: data
	
	self processMessage: data 	! !

! Messenger methodsFor: #private !
config
	| config |	
	config := PoolDictionary new.
	config
		at: #url put: 'ws://localhost:3001';
		at: #token put: 'lhhv9m40sz43jl0k';
		at: #selfPhone put: '5491169417984';
		at: #waPrefix put: '[DemoWhatsapp] ';
		at: #urlSendMessageFragment put: #message;
		at: #urlGetMessageFragment put: #messages;
	yourself! !

! Messenger methodsFor: #default !
url

	 ^self config at: #url! !

! Messenger methodsFor: #actions !
processMessage: data

	data := self asJSONObject: data.
	data#command = #CmdMessageSet ifTrue: [ self processCmdMessageSet: data ].
	data#command = #CmdIncommingMessage ifTrue: [ self proccesCmdIncomingMessage: data ].
	! !

! Messenger methodsFor: #actions !
asJSONObject: data

	| json res |	
	data isString ifTrue: [ 
		json := Smalltalk jsObjectAt: #JSON.
		res := json #parse: data.
	] ifFalse: [ res := data asJSONObject ].	
	^res! !

! Messenger methodsFor: #private !
processCmdMessageSet: json

	 | msgs channel |
	msgs := json#messages.
	msgs do:[:jsonMsg |
		
		channel := self channels at: jsonMsg#chatId ifAbsent: [
			channel := WAChannel new.
			channel name: jsonMsg#senderName.
			self channels at: jsonMsg#chatId put: channel ].
		channel add: (WAMessage fromJSON: jsonMsg).
	].
	self triggerEvent: #newMessage ! !

"====================================================================================="
Object
	subclass: #CmdMessage
	instanceVariableNames: 'data'
	category: 'Messenger' ! 

CmdMessage buildAccessors: #( data ) !

! CmdMessage methodsFor: #default !
valueWith: messenger
	
	self subclassResponsibility! !

! CmdMessage class methodsFor: #instantiation !
with: data
	
	self new data: data! !

"====================================================================================="
CmdMessage
	subclass: #CmdMessageSet
	instanceVariableNames: ''
	category: 'Messenger' ! 

! CmdMessageSet methodsFor: #default !
valueWith: messenger
	
	data messages do:[ ] ! ! 

"====================================================================================="
EventManager
	subclass: #WAChannel
	instanceVariableNames: 'name chatId messages'
	category: 'Messenger' ! 

WAChannel buildAccessors: #( 
	name chatId messages 
).!

! WAChannel methodsFor: #accesing !
messages

	messages isNil ifTrue: [ messages := Array new ].
	^messages! !


! WAChannel class methodsFor: #events !
constructEventsTriggered
	" Private - Return the events managed by instances of the receiver. "

	^#(	#newMessage: )
	, super constructEventsTriggered! !

! WAChannel methodsFor: #initialize !
initialize
	" Private - Return the events managed by instances of the receiver. "

	self name: ''! !

! WAChannel methodsFor: #adding !
add: aWAMessage
	
	| msg |
	self messages detect:[:each| each id = aWAMessage id ] ifNone: [
		self messages add: aWAMessage.
		"self triggerEvent: #newMessage with: aWAMessage."
	]! !

! WAChannel methodsFor: #testing !
size
	
	self messages size ! !
! WAChannel methodsFor: #testing !
lastMessageTime

	| last cur |
	last := DateTime fromString: '2000/01/01 00:00:00'.
	self messages do:[:msg|
		cur :=  DateTime fromMilliseconds: (msg time * 1000).
		last := (cur time > last time) ifTrue: [ cur ] ifFalse: [ last ].
	].
	^last ! !

"====================================================================================="	 
EventManager
	subclass: #WAMessage
	instanceVariableNames: 'id author body chatId fromMe messageNum sender time type'
	category: 'Messenger' !
	
WAMessage buildAccessors: #( 
	id author body chatId 
	fromMe messageNum sender 
	time type
).!

! WAMessage class methodsFor: #instantiation !
fromJSON: msg

	| waMsg |	
	waMsg := WAMessage new.
	waMsg 
		id: msg#id;
		author: msg#author;
		body: msg#body;
		chatId: msg#chatId;
		fromMe: msg#fromMe;
		messageNum: msg#messageNum;
		sender: msg#senderName;
		time: msg#time;
		type: msg#type.
	^waMsg! !
	 

Object
	subclass: #MessengerUI
	instanceVariableNames: 'messenger container'
	category: 'Messenger' !

! MessengerUI class methodsFor: #actions !
init
	| msng |
	msng := self new.
	msng init.
	^msng! !

! MessengerUI  methodsFor: #actions !
init
	" Starts a whatsapp client "
	self initUI; hookTimer; initMessenger ! !

! MessengerUI  methodsFor: #private !
hookTimer
	" Hooks timer "	
! !

! MessengerUI  methodsFor: #private !
initMessenger
	
	self messenger 
		when: #connected do:[ self messages ];
		when: #newMessage do:[ self updateChannels ] ! !

! MessengerUI  methodsFor: #private !
messages
	
	self messenger getMessagesFor: nil ! !


! MessengerUI  methodsFor: #ui !
initUI
	container := DOM document! !

! MessengerUI  methodsFor: #private !
container
	
	^container ! !

! MessengerUI  methodsFor: #private !
messenger
	
	messenger isNil ifTrue:[ self initializeMessenger ].
	^messenger ! !

! MessengerUI  methodsFor: #initialize !
initializeMessenger
	
	messenger := Messenger new.
	^messenger ! !

! MessengerUI  methodsFor: #initialize !
channelRowTemplate

	^'<div class="row sideBar-body" id="{channelNameId}" onclick="channelClicked(this)"> 
        <div style="padding-left:50px"></div>
        <div class="col-sm-9 col-xs-9 sideBar-main">
			<div class="row">
				<div class="col-sm-8 col-xs-8 sideBar-name">
					<span class="name-meta"><b>{channelName}</b>
						<span style="font-size: 9px; color: gray" id="{channelSymbol}Quantity">[{quantity}]</span>
					</span>
					<button type="button" class="btn btn-outline-secondary btn-sm" onclick="channelInfo(\"{channelInfoNameId}\")">Agregar contacto</button>
				</div>
                  <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
					<span class="time-meta pull-right">{timelastMessage}</span>
                  </div>
             </div>
        </div>
        </div></div>'! !
	
! MessengerUI  methodsFor: #initialize !
updateChannels
	
	| chanTpl channelHTML document elem cont |
	chanTpl := self channelRowTemplate.
	document := container.
	
	self messenger channels keysAndValuesDo:[:channelId :channel|
	
		elem := document getElementById: (channelId, #Quantity).
		elem notNil ifTrue: [
			elem innerHTML: channel size.
		] ifFalse: [
			channelHTML := chanTpl replace:'{channelName}' with: channel name.
			channelHTML := channelHTML replace:'{channelNameId}' with: channelId.
			channelHTML := channelHTML replace: '{channelSymbol}' with: channelId.
			channelHTML := channelHTML replace: '{channelInfoNameId}' with: channelId.
			channelHTML := channelHTML replace: '{channelContactId}' with: channelId.            
			channelHTML := channelHTML replace: '{timelastMessage}' with:  channel lastMessageTime asDatePrintString.
			channelHTML := channelHTML replace: '{quantity}' with: channel size.
			elem := document createElement: #template.
			elem innerHTML: channelHTML trimBlanks.
			cont := document getElementById: #channelContainer.
			cont appendChild: (elem content firstChild).   
		] 
	] ! !
