HTML5Structure
 subclass: #WebSocket
 instanceVariableNames: ''
 category: 'WebSocket'!
WebSocket  comment: '
	Implement the WebSocket protocol API (defined by the IETF) for two-way communication with a remote host.
	@2012 Alejandro Reimondo - aleReimondo@smalltalking.net
	http://dev.w3.org/html5/websockets/
'!

WebSocket buildGetters: #( url extensions protocol )!
WebSocket buildNumberGetters: #( readyState bufferedAmount )!
WebSocket buildAccessors: #( binaryType )!
WebSocket buildFunctions: #(
	#(#close:reason: #( code reason ))
	#(#close: #( code ))
	#close
)!
WebSocket buildHTML5Events: #( open #close: #error: #message: )!

! WebSocket class methodsFor: #instantiation !
url: url protocols: protocols
	" Return an instance of the receiver. "

	^self new initialize: url protocols: protocols! !

! WebSocket class methodsFor: #instantiation !
url: url
	" Return an instance of the receiver. "

	^self new initialize: url! !

! WebSocket class methodsFor: #constants !
binaryTypes
	" Private - Return the binary type copnstants names. "

	^#( blob arraybuffer )! !

! WebSocket methodsFor: #private !
constructor
	" Private - Return the constructor of the receiver. "

	^Smalltalk jsObjectAt: #WebSocket ifAbsent: [
		Smalltalk jsObjectAt: #MozWebSocket ifAbsent: [
			self error: 'Missing support for WebSockets'
		]
	] ! !

! WebSocket methodsFor: #initialize !
initialize: url protocols: protocols
	" Private - Initialize the receiver. "

	| constructor |
	constructor := self constructor.
	handle := {' new constructor(url, protocols); '} ! !

! WebSocket methodsFor: #initialize !
initialize: url
	" Private - Initialize the receiver. "

	| constructor |
	constructor := self constructor.
	handle := {' new constructor(url); '} ! !

! WebSocket methodsFor: #query !
state
	" Return the current state (symbol). "

	^#( connecting open closing closed ) at: self readyState + 1! !

! WebSocket methodsFor: #transfer !
send: data
	" Transmits data using the connection.
	Ref. http://dev.w3.org/html5/websockets/#dom-websocket-send
	"

	| arg |
	arg := (self isObject: data) ifTrue: [
			data isString ifTrue: [ data ]
			ifFalse: [ data handle ]
		] ifFalse: [ data ].
	^self handle #send: arg! !

HTML5EventModel
	subclass: #WSCloseEvent
	instanceVariableNames: ''
	category: 'WebSocket'!
WSCloseEvent buildGetters: #( wasClean code reason )!

HTML5EventModel
	subclass: #WSMessageEvent
	instanceVariableNames: ''
	category: 'WebSocket'!
WSMessageEvent buildGetters: #( type data )!
