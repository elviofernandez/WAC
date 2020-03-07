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
	time := DateTime fromMilliseconds: (self).
	^time asDatePrintString ! !

! String methodsFor: #converting !
asDOMObject
	" Return the DOM object represented by receiver. "
	
	| elem |
	elem := DOM document createElement: #template.
	elem innerHTML: self trimBlanks.
	^elem content ! !
	
! HTMLElement methodsFor: #accessing !
scrollTop: pixels
	" Return the scrollTop of the receiver. "

	self handle basicAt: #scrollTop put: pixels ! !
	
	
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

	^HTMLElement @ (self handle basicAt: #content)! !
	
EventManager
	subclass: #Messenger
	instanceVariableNames: 'socket channels user targetUser'
	category: 'Messenger' !

Messenger buildAccessors: #( 
	user targetUser
).!	

! Messenger class methodsFor: #events !
constructEventsTriggered
	" Private - Return the events managed by instances of the receiver. "

	^#(	#connected #gotMessage: #newMessageSet: #acquiredSession #messageChanged: #spanExpired: )
	, super constructEventsTriggered! !

! Messenger class methodsFor: #instantiation !
with: params
	
	^self new 
		initializeWith: (params at: #userid)
		targetUser: (params at: #tuserid);
		yourself ! !

! Messenger methodsFor: #initialize !
channels 
	
	channels isNil ifTrue: [ channels := PoolDictionary new ].
	^channels! !
	
! Messenger methodsFor: #initialize !
initializeWith: userId targetUser: targetId
	
	self configureSocketDoing: [
		self acquireSessionFor: userId 
			target: targetId 
	]! !
	
! Messenger methodsFor: #private !
acquireSessionFor: userId target: targetId

	| data | 
	data := (#type -> #CCmdSessionUser), 
		(#id -> userId),
		(#tid -> targetId).
	socket send: data asJSON! !

! Messenger methodsFor: #configuring !
configureSocketDoing: block 

	|nHost|
	nHost :=  'ws://', DOM window location hostname , ':3001'.
	socket := WebSocket url: nHost.
	socket
		when: #open do: [ block value. self connected. ];
		when: #close: do: [:evt| self print: #disconnected ];
		when: #message: do: [:evt| self receive: (WSMessageEvent @ evt) data ];
		when: #error do: [:evt| self print: 'WebSocket error: ',(WSMessageEvent @ evt) data ].
! !

! Messenger methodsFor: #initialize !
connected
	self log: #Connected.
	self triggerEvent: #connected ! !
	

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
		(#id -> self user id),
		(#phoneNumber -> self user phoneNumber),
		(#tid -> self targetUser id),
		(#targetPhoneNumber -> self targetUser phoneNumber ).
	socket send: data asJSON! !
	
! Messenger methodsFor: #private !
getMessages
	
	| data number |
	data := (#type -> #CCmdMessages), 
		(#id -> self user id),
		(#phoneNumber -> self user phoneNumber ),
		(#tid -> self targetUser id),
		(#targetPhoneNumber -> self targetUser phoneNumber ).
	self print: #getMessages.
	self send: data asJSON! !

! Messenger methodsFor: #private !
sessionActiveFor: aWAUser target: tWAUser

	self user: aWAUser; targetUser: tWAUser.
	self triggerEvent: #acquiredSession ! !

! Messenger methodsFor: #private !
sendMessage: body to: channel

	| data |
	data := (#type -> #CCmdSendMessage), 
		(#body -> body),
		(#from -> self user phoneNumber),
		(#to -> channel chatId).
	socket send: data asJSON! !

! Messenger methodsFor: #private !
receive: data
	
	self processData: data 	! !

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
processData: data

	data := self asJSONObject: data.
	data#command = #CmdMessageSet ifTrue: [ self processCmdMessageSet: data ].
	data#command = #CmdMessageReponse ifTrue: [ self proccesCmdIncomingMessage: data ].
	data#command = #CmdMessageAck ifTrue: [ self proccesCmdIncomingMessage: data ].	
	data#command = #CmdSessionUserResponse ifTrue: [ self proccesCmdUserResponse: data ].
	data#command = #CmdSpanExpiration ifTrue: [ self proccesCmdSpanExpiration: data ].
	data#command = #CmdMessageStatus ifTrue: [ self proccesCmdMessageStatus: data ].
	
	! !
	
! Messenger methodsFor: #private !
processMessage: jsonMsg
	
	| channel chName json msg |	
	json := Smalltalk jsObjectAt: #JSON.
	(jsonMsg#fromMe) ifTrue: [
		chName := jsonMsg#to.		
	] ifFalse: [ chName := jsonMsg#from ].	
	channel := self channels at: chName ifAbsent: [
		channel := WAChannel new.
		channel name: chName.
		channel chatId: chName.
		self channels at: chName put: channel.
	].
	msg := WAMessage fromJSON: jsonMsg.
	^channel add: msg! !

! Messenger methodsFor: #private !
proccesCmdSpanExpiration: json
	self log: #expiredSpan.
	self triggerEvent: #spanExpired: with: json.
! !


! Messenger methodsFor: #private !
proccesCmdUserResponse: json
	
	self sessionActiveFor: (WAUser fromJSON: json#user)
		target: (WAUser fromJSON: json#targetUser).	! !


! Messenger methodsFor: #private !
proccesCmdMessageStatus: json
	
	self messageFor: json ifPresent:[:msg|
		msg status: json#status.
		self triggerEvent: #messageChanged: with: msg.
	] ! !

! Messenger methodsFor: #private !
messageFor: json ifPresent: block

	| allMessage msg |	
	allMessage := Array new.
	self channels do:[:each| allMessage := allMessage, each messages ].
	msg := allMessage detect:[:each| each id = json#id ] ifNone:[ nil ].
	msg notNil ifTrue:[ block value: msg ]! !
		
! Messenger methodsFor: #private !
updateChannels

	self channels keysAndValuesDo:[:channelId :channel| 
		channel basicUpdate
	] ! !


! Messenger methodsFor: #private !
processCmdMessageSet: json

	| msgs |
	msgs := json#messages.	
	msgs do:[:jsonMsg|
		self processMessage: jsonMsg					
	].
	self updateChannels.
	self triggerEvent: #newMessageSet: with: json#messages ! !

! Messenger methodsFor: #private !
proccesCmdIncomingMessage: json

	| msg |
	
	msg := self processMessage: json.
	
	self triggerEvent: #newMessage.
	self triggerEvent: #gotMessage: with: msg ! !

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
		id: json#userId;
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
	messages := messages sorted:[:msgA :msgB| | res |
			msgA time < msgB time
	].
	^messages! !


! WAChannel class methodsFor: #events !
constructEventsTriggered
	" Private - Return the events managed by instances of the receiver. "

	^#(	#newMessage: #channelUpdated: )
	, super constructEventsTriggered! !

! WAChannel methodsFor: #initialize !
initialize
	" Private - Return the events managed by instances of the receiver. "

	self name: ''! !

! WAChannel methodsFor: #adding !
add: aWAMessage
	
	| msg |
	^self messages detect:[:each| each id = aWAMessage id ] ifNone: [
		self messages add: aWAMessage.
		aWAMessage channel: self.
		"self triggerEvent: #newMessage with: aWAMessage."
		aWAMessage		
	]! !

! WAChannel methodsFor: #private !
basicUpdate
	
	messages := messages sorted:[:msgA :msgB| 
			msgA time < msgB time ].
	! !

! WAChannel methodsFor: #testing !
size
	
	^self messages size ! !

! WAChannel methodsFor: #testing !
lastMessageTime

	| last cur |
	last := DateTime fromString: '2000/01/01 00:00:00'.
	self messages do:[:msg|
		cur :=  DateTime fromMilliseconds: (msg time).
		last := (cur time > last time) ifTrue: [ cur ] ifFalse: [ last ].
	].
	^last ! !

"====================================================================================="	 
EventManager
	subclass: #WAMessage
	instanceVariableNames: 'id author body chatId fromMe messageNum sender time type channel status'
	category: 'Messenger' !
	
WAMessage buildAccessors: #( 
	id author body chatId 
	fromMe messageNum sender 
	time type channel status
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
		status: msg#status;
		fromMe: msg#fromMe;
		messageNum: msg#messageNumber;
		sender: msg#senderName;
		time: (DateTime fromMilliseconds: (msg#time));
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

! MessengerUI  methodsFor: #accesing !
currentChannel
	
	^currentChannel ! !

! MessengerUI  methodsFor: #private !
initMessenger
	
	self messenger 
		when: #acquiredSession do: [ self log: #messages. self messages ]; 
		when: #gotMessage: do:[:msg| self log: #gotMessage. self updateChannel: msg channel with: msg ];
		when: #messageChanged: do:[:msg| self updateMesssageStatus: msg ];
		when: #spanExpired: do:[:spanId| self showExpiredSpan: spanId ];
		when: #newMessageSet: do:[ self log: #newMessage. self updateChannels ] ! !

! MessengerUI  methodsFor: #private !
messages
	
	self messenger getMessages ! !


! MessengerUI  methodsFor: #ui !
initUI

	container := DOM document.	
	self hookEvents ! !

! MessengerUI  methodsFor: #ui !
hookEvents

	| btn textBox |
	btn := DOM document getElementById: #sendBtn.
	textBox := DOM document getElementById: #comment.
	btn addEventListener: #click doing: [:evt|
		textBox value notEmpty ifTrue: [
			self sendMessage: textBox value.	
		]
	] useCapture: false.
	textBox addEventListener: #keypress doing: [:evt|
	
		(evt#keyCode = 13) ifTrue: [
			textBox value notEmpty ifTrue: [
				self sendMessage: textBox value.	
		] ]
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
		self messenger sendMessage: text to: currentChannel.
		self cleanTextbox.
	] ! !

! MessengerUI  methodsFor: #comunication !
cleanTextbox
	
	| textArea |
	textArea := DOM document getElementById: #comment.
	textArea value: ''! !

! MessengerUI  methodsFor: #comunication !
sendTemplate
	
	self log: 'sending template...'.
	self messenger sendTemplate ! !
	
! MessengerUI  methodsFor: #private !
container
	
	^container ! !

! MessengerUI  methodsFor: #private !
messenger
	
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
	
	messenger := Messenger with: self urlParameters.
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
updateChannel: channel with: aWAMessage

	| elem |
	"elem := DOM document getElementById: (channel name, #Quantity)."
	elem := DOM document getElementById: #channelQuantity.
	elem innerHTML: channel size.
	( currentChannel name = channel name) ifTrue: [
		self showRecentlyMessage: aWAMessage.			
	].
! !
		
! MessengerUI  methodsFor: #ui !
updateChannels

	| phone chn |
	phone := self messenger targetUser phoneNumber.
	chn := self messenger channels at: phone.
	self activateChannel: chn ! !	

! MessengerUI  methodsFor: #ui !
activateChannel: channel

	currentChannel := channel.
	self showReplyPane.
	self showChannelMessages: channel ! !

	
! MessengerUI  methodsFor: #ui !
showReplyPane
	
	| elem |
	elem := DOM document getElementById: #replyPane.
	elem style visibility: #visible ! !

! MessengerUI  methodsFor: #ui !
updateMesssageStatus: msg

	| statusDOM |
	statusDOM := (DOM document getElementById: ('statusMsg', msg id)).
	(msg status = #READ ) ifTrue: [
		statusDOM style
			color: #blue;
			visibility: #visible;
			fontWeight: #bolder.				
	]! !	


! MessengerUI  methodsFor: #ui !		
showExpiredSpan: json
	
	| msgTpl msgHTML  msgContainer  |
	msgTpl := self expiredSpanRowTemplate.
	self log: json.
	msgContainer := DOM document getElementById: #conversation.
	msgHTML := msgTpl replace: '{text}' with: 'Span [',json#spanId,'] closed.  ', json#init asDatePrintString, '<->', json#end asDatePrintString.
	msgContainer appendChild: (msgHTML asDOMObject).
	self scrollMessagesToBottom ! !

! MessengerUI  methodsFor: #ui !		
showRecentlyMessage: msg
	
	| msgTpl msgHTML clsStyle btn msgContainer statusDOM |
	msgTpl := self messageRowTemplate.
	msgContainer := DOM document getElementById: #conversation.
	clsStyle := (msg fromMe) ifTrue: [ #sender ] ifFalse: [ #receiver ].
	msgHTML := msgTpl replace: '{time}' with: (msg time asDatePrintString).
	msgHTML := msgHTML replace: '{type}' with: clsStyle.
	msgHTML := msgHTML replace: '{bodyText}' with: (msg body).
	
	msgHTML := msgHTML replace: '{msgNumber}' with: ('#', msg id).
	msgHTML := msgHTML replace: '{channelId}' with: (msg channel chatId).
	msgHTML := msgHTML replace: '{messageId}' with: (msg id).
	msgHTML := msgHTML replace: '{author}' with: (msg authorPrintString).
	
	msgContainer appendChild: (msgHTML asDOMObject).
	statusDOM := (DOM document getElementById: ('statusMsg', msg id)).
	(msg fromMe) ifTrue: [
			statusDOM style 
				visibility: #visible;
				fontWeight: #normal.				
	].
		
	btn := DOM document getElementById: ('btnMsg', msg id).
	btn addEventListener: #click doing: [:evt|
		self messageInfo: msg.	
	] useCapture: false.	
	self scrollMessagesToBottom ! !

! MessengerUI  methodsFor: #ui !
scrollMessagesToBottom	
	
	| msgContainer|
	msgContainer := DOM document getElementById: #conversation.
    msgContainer scrollTop: msgContainer scrollHeight  ! !

! MessengerUI  methodsFor: #ui !
showChannelMessages: channel

	| msgTpl msgHTML msgContainer document clsStyle btn statusDOM|
	document := container.
    (document getElementById: #currentChannelName) 
		innerHTML: channel name.
	(document getElementById: #channelQuantity) 
		innerHTML: '[', channel size asString ,']'.
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
		
		msgHTML := msgHTML replace: '{msgNumber}' with: ('#', msg id).
		msgHTML := msgHTML replace: '{channelId}' with: (channel chatId).
		msgHTML := msgHTML replace: '{messageId}' with: (msg id).
		msgHTML := msgHTML replace: '{author}' with: (msg authorPrintString).
			
		msgContainer appendChild: msgHTML asDOMObject.
		statusDOM := (document getElementById: ('statusMsg', msg id)).
		(msg fromMe) ifTrue: [
			statusDOM style 
				visibility: #visible;
				fontWeight: #bolder;
				color: #blue
		].
		btn := document getElementById: ('btnMsg', msg id).
		btn addEventListener: #click doing: [:evt|
		
				"self messageInfo: msg.	"
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

	^'<div id="rowMessage{messageId}" class="row message-body" >
		<div class="col-sm-12 message-main-receiver">
		<div class="{type}">
			<div style="font-size:10px;align:left; color:gray">{msgNumber}</div>
			<div style="font-size:10px;align:left; color:gray">{author}</div>
			<div class="message-text">{bodyText}</div>
			<button id="btnMsg{messageId}" type="button" style="float:right" data-channelId="{channelId}" data-messageId="{messageId}" data-body="{bodyText}" data-phone="{author}">Seguir en CRM</button>
			<span class="message-time pull-right" style="font-size:10px">{time}</span>
			<span  class="message-time pull-right" style="float:right;font-size:8px; visibility:hidden" id="statusMsg{messageId}">@@</span>
		</div>
		</div>
	</div>' ! !

! MessengerUI  methodsFor: #ui !
expiredSpanRowTemplate

	^'<div style="display:block;background-color:darkgray;margin:7px;height:25px" >
		<div>
			<div style="margin:5px; color:LightYellow;float:left; font-size:10px;align:left;">{text}</div>			
		</div>
		
	</div>' ! !
	
MessengerUI open !