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

	^self asLocaleString ! !

! Number methodsFor: #converting !
asDatePrintString
	" Return the locale string of the receiver. "

	| time |
	time := DateTime fromMilliseconds: (self * 1000).
	^time asDatePrintString ! !

! String methodsFor: #converting !
asDOMObject
	" Return the DOM object represented by receiver. "
	
	| elem |
	elem := DOM document createElement: #template.
	elem innerHTML: self trimBlanks.
    ^elem content firstChild ! !

! U8DOM methodsFor: #accessing !
loggedUserDo: aBlock onError: errorBlock
	" Private - Evaluate aBlock with user currently loggedOn (or an error response). "
! !
	
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
	instanceVariableNames: 'socket channels user'
	category: 'Messenger' !


! Messenger class methodsFor: #events !
constructEventsTriggered
	" Private - Return the events managed by instances of the receiver. "

	^#(	#connected #newMessage #acquiredSession )
	, super constructEventsTriggered! !

! Messenger class methodsFor: #instantiation !
with: userId 
	
	^self new 
		initialize: userId;
		yourself ! !

	
! Messenger methodsFor: #initialize !
channels 
	
	channels isNil ifTrue: [ channels := PoolDictionary new ].
	^channels! !
	
! Messenger methodsFor: #initialize !
initialize: userId
	
	self configureSocketDoing: [ self acquireSessionFor: userId ]! !

! Messenger methodsFor: #configuring !
configureSocketDoing: block 

	socket := WebSocket url: 'ws://localhost:3001'.
	socket
		when: #open do: [ block value. self connected. ];
		when: #close: do: [:evt| self print: #disconnected ];
		when: #message: do: [:evt| self receive: (WSMessageEvent @ evt) data ];
		when: #error do: [:evt| self print: 'WebSocket error: ',(WSMessageEvent @ evt) data ].
! !

! Messenger methodsFor: #private !
acquireSessionFor: userId

	| data |
	self log: #aquireSessionFor.	
	data := (#type -> #CCmdSessionUser), 
		(#id -> userId).
	self log: data asJSON. 
	socket send: data asJSON! !


! Messenger methodsFor: #initialize !
connected
	self log: #Connected.
	self triggerEvent: #connected! !
	

! Messenger methodsFor: #private !
send: data
	
	(socket state = #closed) ifTrue: [
		self initSocket.
	].
	socket send: data! !

! Messenger methodsFor: #private !
sendTemplate
	
	| data |
	data := (#type -> #CCmdSendTemplate), 
		(#id -> nil),
		(#phoneNumber -> '+5492215455520').
	socket send: data asJSON! !
	
! Messenger methodsFor: #private !
getMessages
	
	| data number |
	self log: '\n\n ////////////////////', user asJSON.
	data := (#type -> #CCmdMessages), 
		(#body -> nil),
		(#phoneNumber -> 1 ).
	self print: #getMessages.
	self send: data asJSON! !

! Messenger methodsFor: #private !
sessionActiveFor: aWAUser

	user := aWAUser.
	self triggerEvent: #acquiredSession ! !

! Messenger methodsFor: #private !
sendMessage: body to: phoneNumber

	| data |
	data := (#type -> #CCmdSendMessage), 
		(#body -> body),
		(#phoneNumber -> phoneNumber).
	socket send: data asJSON! !
	
! Messenger methodsFor: #private !
receive: data
	
	self processMessage: data 	! !

! Messenger methodsFor: #private !
config
	| config |	
	config := PoolDictionary new.
	config
		at: #url put: 'ws://localhost:3001';
		at: #token put: 'twilioToken';
		at: #selfPhone put: '+14155238886';
		at: #waPrefix put: '[DemoWhatsapp] ';
		at: #urlSendMessageFragment put: #message;
		at: #urlGetMessageFragment put: #messages;
	yourself! !

! Messenger methodsFor: #default !
url

	 ^self config at: #url! !

! Messenger methodsFor: #actions !
asJSONObject: data

	| json res |	
	data isString ifTrue: [ 
		json := Smalltalk jsObjectAt: #JSON.
		res := json #parse: data.
	] ifFalse: [ res := data asJSONObject ].	
	^res! !

! Messenger methodsFor: #actions !
processMessage: data

	data := self asJSONObject: data.
	data#command = #CmdMessageSet ifTrue: [ self processCmdMessageSet: data ].
	data#command = #CmdMessageReponse ifTrue: [ self proccesCmdIncomingMessage: data ].
	data#command = #CmdSessionUserResponse ifTrue: [ self proccesCmdUserResponse: data ].
	
	! !
	
! Messenger methodsFor: #private !
proccesCmdUserResponse: json
	
	self sessionActiveFor: 
		(WAUser fromJSON: json).	! !

! Messenger methodsFor: #private !
processCmdMessageSet: json

	| msgs channel |
	msgs := json#messages.
	msgs do:[:jsonMsg|		
		channel := self channels at: jsonMsg#chatId ifAbsent: [
			channel := WAChannel new.
			channel name: jsonMsg#senderName.
			self channels at: jsonMsg#chatId put: channel ].
		channel add: (WAMessage fromJSON: jsonMsg).
	].
	self triggerEvent: #newMessage ! !

! Messenger methodsFor: #private !
proccesCmdIncomingMessage: json

	self log:json
	! !

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
	subclass: #WAUser
	instanceVariableNames: 'name id phoneNumber'
	category: 'Messenger' !
	
WAUser buildAccessors: #( 
	name id phoneNumber 
).!	

! WAUser class methodsFor: #instantiation !
fromJSON: json

	^self new	
		id: json#id;
		name: json#name;
		phoneNumber: json#phoneNumber;
		yourself ! !	
	
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
	
	^self messages size ! !

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
	waMsg := self new.
	waMsg 
		id: msg#id;
		author: msg#author;
		body: msg#body;
		chatId: msg#chatId;
		fromMe: msg#fromMe;
		messageNum: msg#messageNumber;
		sender: msg#senderName;
		time: msg#time;
		type: msg#type.
	^waMsg! !
	 
! WAMessage methodsFor: #printing !
authorPrintString

	^(self author asArrayOfSubstringsSeparatedBy:'@') 
		first ! !
	
Object
	subclass: #MessengerUI
	instanceVariableNames: 'messenger container currentChannel'
	category: 'Messenger' !

! MessengerUI class methodsFor: #ui !
maximized
	
	(DOM document 
		getElementById: 'waContainer')
		style position: #absolute! !

! MessengerUI class methodsFor: #ui !
minimized
	
	(DOM document getElementById: 'waContainer')
		style position: #relative ! !

	
! MessengerUI class methodsFor: #actions !
open
	| msng |
	msng := self new.
	msng open.
	^msng! !

! MessengerUI  methodsFor: #actions !
open
	" Starts a whatsapp client "
	self log: 'client started...'.
	self initUI; hookTimer; initMessenger ! !

! MessengerUI  methodsFor: #private !
hookTimer
	" Hooks timer "	
! !

! MessengerUI  methodsFor: #private !
initMessenger
	
	self log: #initMessenger.
	self messenger 
		when: #acquiredSession do: [ self messages ]; 
		"when: #connected do:[ self messages ];"
		when: #newMessage do:[ self updateChannels ] ! !

! MessengerUI  methodsFor: #private !
messages
	self log: #messages.
	self messenger getMessages ! !


! MessengerUI  methodsFor: #ui !
initUI

	container := DOM document.	
	self hookEvents ! !

! MessengerUI  methodsFor: #ui !
hookEvents

	| btn textBox |
	self log: 'hookEvents'.
	btn := DOM document getElementById: #sendBtn.
	textBox := DOM document getElementById: #comment.
	btn addEventListener: #click doing: [:evt|
		textBox value notEmpty ifTrue: [
			self sendMessage: textBox value.	
		]
	] useCapture: false.
	
	btn := DOM document getElementById: #optionsBtn.
	btn addEventListener: #click doing: [:evt|
		self class minimized.
	] useCapture: false.

	btn := DOM document getElementById: #infoBtn.
	btn addEventListener: #click doing: [:evt|
		self sendTemplate.
	] useCapture: false.
	! !

! MessengerUI  methodsFor: #comunication !
sendMessage: text
	
	self currentChannel notNil ifTrue: [
	
	] ! !

! MessengerUI  methodsFor: #comunication !
sendTemplate
	
	self log: 'sending template...'.
	self messenger sendTemplate ! !
	
! MessengerUI  methodsFor: #private !
container
	
	^container ! !

! MessengerUI  methodsFor: #private !
messenger
	self log: #messenger.
	messenger isNil ifTrue:[ self initializeMessenger ].
	^messenger ! !

! MessengerUI  methodsFor: #initialize !
urlParameters
	
	| qry queries params pair |
	qry := DOM window location search.	
	qry := qry copyFrom: 2 to: qry size.
	queries := qry asArrayOfSubstringsSeparatedBy: '&'.	
	params := PoolDictionary new.	
	queries do:[:each| 
		pair := each asArrayOfSubstringsSeparatedBy: '='.
		params at: pair first put: pair second.
	].	
	^params ! !
	
! MessengerUI  methodsFor: #initialize !
initializeMessenger

	| param |
	param := self urlParameters at: #id.
	self log: #initializeMessenger.
	messenger := Messenger with: param.
	^messenger ! !

! MessengerUI  methodsFor: #initialize !
channelRowTemplate

	^'<div class="row sideBar-body" id="{channelNameId}"> 
        <div style="padding-left:50px"></div>
        <div class="col-sm-9 col-xs-9 sideBar-main">
			<div class="row">
				<div class="col-sm-8 col-xs-8 sideBar-name">
					<span class="name-meta"><b>{channelName}</b>
						<span style="font-size: 9px; color: gray" id="{channelSymbol}Quantity">[{quantity}]</span>
					</span>
					<button id="btnChn{channelInfoNameId}" type="button" class="btn btn-outline-secondary btn-sm">Agregar contacto</button>
				</div>
                  <div class="col-sm-4 col-xs-4 pull-right sideBar-time">
					<span class="time-meta pull-right" style="font-size:11px">{timelastMessage}</span>
                  </div>
             </div>
        </div>
        </div></div>'! !

! MessengerUI  methodsFor: #ui !
updateChannels
	
	| chanTpl channelHTML document elem cont btn div |
	chanTpl := self channelRowTemplate.
	document := container.
	
	self messenger channels keysAndValuesDo:[:channelId :channel|
	
		elem := document getElementById: (channelId, #Quantity).
		elem notNil ifTrue: [
			elem innerHTML: channel size.
		] ifFalse: [
			channelHTML := chanTpl replace:'{channelName}' with: channel name.
			channelHTML := channelHTML replace:'{channelNameId}' with: channelId trimBlanks.
			channelHTML := channelHTML replace: '{channelSymbol}' with: channelId trimBlanks.
			channelHTML := channelHTML replace: '{channelInfoNameId}' with: channelId trimBlanks.
			channelHTML := channelHTML replace: '{channelContactId}' with: channelId trimBlanks.            
			channelHTML := channelHTML replace: '{timelastMessage}' with:  channel lastMessageTime asDatePrintString.
			channelHTML := channelHTML replace: '{quantity}' with: channel size.
			"elem := document createElement: #template.
			elem innerHTML: channelHTML trimBlanks."
			elem := channelHTML asDOMObject.
			cont := document getElementById: #channelContainer.
			cont appendChild: elem.
			btn := document getElementById: ('btnChn', channelId).
			btn addEventListener: #click doing: [:evt|
				self channelInfo: channel.	
			] useCapture: false.
			div := document getElementById: channelId.
			div addEventListener: #click doing: [:evt|
				self activateChannel: channel.	
			] useCapture: false.
		] 
	] ! !

! MessengerUI  methodsFor: #ui !
activateChannel: channel

	currentChannel := channel.	
	self showChannelMessages: channel ! !

! MessengerUI  methodsFor: #ui !
showChannelMessages: channel

	| msgTpl msgHTML msgContainer document clsStyle btn |
	document := container.
    (document getElementById: #currentChannelName) 
		innerHTML: channel name.
    msgTpl := self messageRowTemplate.
    msgContainer := document getElementById: #conversation.
	
	[ msgContainer hasChildNodes ] whileTrue: [
		msgContainer removeChild: msgContainer lastChild
	].
	
    channel messages do:[:msg|
	
		clsStyle := (msg fromMe) ifTrue: [ #sender ] ifFalse: [ #receiver ].
		msgHTML := msgTpl replace: '{time}' with: (msg time asDatePrintString).
		msgHTML := msgHTML replace: '{type}' with: clsStyle.
		msgHTML := msgHTML replace: '{bodyText}' with: (msg body).
		
		msgHTML := msgHTML replace: '{msgNumber}' with: ('#', msg messageNum).
		msgHTML := msgHTML replace: '{channelId}' with: (channel chatId).
		msgHTML := msgHTML replace: '{messageId}' with: (msg id).
		msgHTML := msgHTML replace: '{author}' with: (msg authorPrintString).
		
		msgContainer appendChild: (msgHTML asDOMObject).
		btn := document getElementById: ('btnMsg', msg id).
		btn addEventListener: #click doing: [:evt|
				self messageInfo: msg.	
		] useCapture: false.
	] ! !

! MessengerUI  methodsFor: #ui !
channelInfo: channel

	self log: channel json! !
	
! MessengerUI  methodsFor: #ui !
messageInfo: message

	self log: message json! !

! MessengerUI  methodsFor: #ui !
messageRowTemplate

	^'<div class="row message-body" >
		<div class="col-sm-12 message-main-receiver">
		<div class="{type}">
			<div style="font-size:10px;align:left; color:gray">{msgNumber}</div>
			<div style="font-size:10px;align:left; color:gray">{author}</div>
			<div class="message-text">{bodyText}</div>
			<button id="btnMsg{messageId}" type="button" style="float:right" data-channelId="{channelId}" data-messageId="{messageId}" data-body="{bodyText}" data-phone="{author}">Seguir en CRM</button>
			<span class="message-time pull-right" style="font-size:10px">{time}</span>
		</div>
		</div>
	</div>' ! !
MessengerUI open !