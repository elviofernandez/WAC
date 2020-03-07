// fileIn("html5/WebSocket.st");
smalltalk.addClass("WebSocket",smalltalk.HTML5Structure,[],'WebSocket');

smalltalk.bind(smalltalk.WebSocket,"url",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["url"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("url%0D%0A%09%22%20Return%20the%20url%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23url"));

smalltalk.bind(smalltalk.WebSocket,"extensions",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["extensions"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("extensions%0D%0A%09%22%20Return%20the%20extensions%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23extensions"));

smalltalk.bind(smalltalk.WebSocket,"protocol",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["protocol"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("protocol%0D%0A%09%22%20Return%20the%20protocol%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23protocol"));

smalltalk.bind(smalltalk.WebSocket,"readyState",0
,function (){var self=this;
return (self['@handle'].readyState || (0));;}
,"accessing",unescape("readyState%0D%0A%09%22%20Return%20the%20readyState%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Ehandle%23readyState%20%7C%7C%200"));

smalltalk.bind(smalltalk.WebSocket,"bufferedAmount",0
,function (){var self=this;
return (self['@handle'].bufferedAmount || (0));;}
,"accessing",unescape("bufferedAmount%0D%0A%09%22%20Return%20the%20bufferedAmount%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Ehandle%23bufferedAmount%20%7C%7C%200"));

smalltalk.bind(smalltalk.WebSocket,"binaryType",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["binaryType"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("binaryType%0D%0A%09%22%20Return%20the%20binaryType%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23binaryType"));

smalltalk.bind(smalltalk.WebSocket,"binaryType:",0
,function (anObject){var self=this;
(self.handle()["binaryType"]=(anObject));
return self;;}
,"accessing",unescape("binaryType%3A%20anObject%0D%0A%09%22%20Set%20the%20binaryType%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09self%20handle%20basicAt%3A%20%23binaryType%20put%3A%20anObject"));

smalltalk.bind(smalltalk.WebSocket,"close:reason:",0
,function (code,reason){var self=this;
return self.handle().close(code, reason);;}
,"wrappers",unescape("close%3A%20code%20reason%3A%20reason%20%0D%0A%09%22%20Delegate%20close%3Areason%3A%20to%20handle.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20%23close%3A%20code%20reason%3A%20reason%20"));

smalltalk.bind(smalltalk.WebSocket,"close:",0
,function (code){var self=this;
return self.handle().close(code);;}
,"wrappers",unescape("close%3A%20code%20%0D%0A%09%22%20Delegate%20close%3A%20to%20handle.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20%23close%3A%20code%20"));

smalltalk.bind(smalltalk.WebSocket,"close",0
,function (){var self=this;
return self.handle().close();;}
,"wrappers",unescape("close%0D%0A%09%22%20Delegate%20close%20to%20handle.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20%23close"));

smalltalk.bind(smalltalk.WebSocket.$klass,"html5Events",0
,function (){var self=this;
return ["open", "close:", "error:", "message:"]._comma(smalltalk.superImplementor(smalltalk.WebSocket.$klass,'html5Events').apply(self, []));;}
,"events",unescape("html5Events%0D%0A%09%22%20Private%20-%20Return%20the%20html5%20events%20managed%20by%20instances%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5E%23%28%20%23open%20%23close%3A%20%23error%3A%20%23message%3A%20%29%20%2C%20super%20html5Events"));

smalltalk.bind(smalltalk.WebSocket,"onopen",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["onopen"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("onopen%0D%0A%09%22%20Return%20the%20onopen%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23onopen"));

smalltalk.bind(smalltalk.WebSocket,"onclose",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["onclose"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("onclose%0D%0A%09%22%20Return%20the%20onclose%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23onclose"));

smalltalk.bind(smalltalk.WebSocket,"onerror",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["onerror"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("onerror%0D%0A%09%22%20Return%20the%20onerror%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23onerror"));

smalltalk.bind(smalltalk.WebSocket,"onmessage",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["onmessage"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("onmessage%0D%0A%09%22%20Return%20the%20onmessage%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23onmessage"));

smalltalk.bind(smalltalk.WebSocket.$klass,"url:protocols:",0
,function (url,protocols){var self=this;
return self.$$new().initialize_protocols_(url, protocols);;}
,"instantiation",unescape("url%3A%20url%20protocols%3A%20protocols%0D%0A%09%22%20Return%20an%20instance%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20new%20initialize%3A%20url%20protocols%3A%20protocols"));

smalltalk.bind(smalltalk.WebSocket.$klass,"url:",0
,function (url){var self=this;
return self.$$new().initialize_(url);;}
,"instantiation",unescape("url%3A%20url%0D%0A%09%22%20Return%20an%20instance%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20new%20initialize%3A%20url"));

smalltalk.bind(smalltalk.WebSocket.$klass,"binaryTypes",0
,function (){var self=this;
return ["blob", "arraybuffer"];;}
,"constants",unescape("binaryTypes%0D%0A%09%22%20Private%20-%20Return%20the%20binary%20type%20copnstants%20names.%20%22%0D%0A%0D%0A%09%5E%23%28%20blob%20arraybuffer%20%29"));

smalltalk.bind(smalltalk.WebSocket,"constructor",0
,function (){var self=this;
return smalltalk.Smalltalk.jsObjectAt_ifAbsent_("WebSocket", (function(){return smalltalk.Smalltalk.jsObjectAt_ifAbsent_("MozWebSocket", (function(){return self.error_("Missing support for WebSockets");}));}));;}
,"private",unescape("constructor%0D%0A%09%22%20Private%20-%20Return%20the%20constructor%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5ESmalltalk%20jsObjectAt%3A%20%23WebSocket%20ifAbsent%3A%20%5B%0D%0A%09%09Smalltalk%20jsObjectAt%3A%20%23MozWebSocket%20ifAbsent%3A%20%5B%0D%0A%09%09%09self%20error%3A%20%27Missing%20support%20for%20WebSockets%27%0D%0A%09%09%5D%0D%0A%09%5D%20"));

smalltalk.bind(smalltalk.WebSocket,"initialize:protocols:",0
,function (url,protocols){var self=this;
var constructor=nil;constructor=self.constructor();
self['@handle']= new constructor(url, protocols); ;
return self;;}
,"initialize",unescape("initialize%3A%20url%20protocols%3A%20protocols%0D%0A%09%22%20Private%20-%20Initialize%20the%20receiver.%20%22%0D%0A%0D%0A%09%7C%20constructor%20%7C%0D%0A%09constructor%20%3A%3D%20self%20constructor.%0D%0A%09handle%20%3A%3D%20%7B%27%20new%20constructor%28url%2C%20protocols%29%3B%20%27%7D%20"));

smalltalk.bind(smalltalk.WebSocket,"initialize:",0
,function (url){var self=this;
var constructor=nil;constructor=self.constructor();
self['@handle']= new constructor(url); ;
return self;;}
,"initialize",unescape("initialize%3A%20url%0D%0A%09%22%20Private%20-%20Initialize%20the%20receiver.%20%22%0D%0A%0D%0A%09%7C%20constructor%20%7C%0D%0A%09constructor%20%3A%3D%20self%20constructor.%0D%0A%09handle%20%3A%3D%20%7B%27%20new%20constructor%28url%29%3B%20%27%7D%20"));

smalltalk.bind(smalltalk.WebSocket,"state",0
,function (){var self=this;
return ["connecting", "open", "closing", "closed"].at_(self.readyState()._plus((1)));;}
,"query",unescape("state%0D%0A%09%22%20Return%20the%20current%20state%20%28symbol%29.%20%22%0D%0A%0D%0A%09%5E%23%28%20connecting%20open%20closing%20closed%20%29%20at%3A%20self%20readyState%20+%201"));

smalltalk.bind(smalltalk.WebSocket,"send:",0
,function (data){var self=this;
var arg=nil;arg=((self.isObject_(data)).mustBeBoolean()==true ? (function(){return ((data.isString()).mustBeBoolean()==true ? (function(){return data;})() : (function(){return data.handle();})());})() : (function(){return data;})());
return self.handle().send(arg);;}
,"transfer",unescape("send%3A%20data%0D%0A%09%22%20Transmits%20data%20using%20the%20connection.%0D%0A%09Ref.%20http%3A//dev.w3.org/html5/websockets/%23dom-websocket-send%0D%0A%09%22%0D%0A%0D%0A%09%7C%20arg%20%7C%0D%0A%09arg%20%3A%3D%20%28self%20isObject%3A%20data%29%20ifTrue%3A%20%5B%0D%0A%09%09%09data%20isString%20ifTrue%3A%20%5B%20data%20%5D%0D%0A%09%09%09ifFalse%3A%20%5B%20data%20handle%20%5D%0D%0A%09%09%5D%20ifFalse%3A%20%5B%20data%20%5D.%0D%0A%09%5Eself%20handle%20%23send%3A%20arg"));

smalltalk.addClass("WSCloseEvent",smalltalk.HTML5EventModel,[],'WebSocket');

smalltalk.bind(smalltalk.WSCloseEvent,"wasClean",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["wasClean"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("wasClean%0D%0A%09%22%20Return%20the%20wasClean%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23wasClean"));

smalltalk.bind(smalltalk.WSCloseEvent,"code",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["code"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("code%0D%0A%09%22%20Return%20the%20code%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23code"));

smalltalk.bind(smalltalk.WSCloseEvent,"reason",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["reason"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("reason%0D%0A%09%22%20Return%20the%20reason%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23reason"));

smalltalk.addClass("WSMessageEvent",smalltalk.HTML5EventModel,[],'WebSocket');

smalltalk.bind(smalltalk.WSMessageEvent,"type",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["type"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("type%0D%0A%09%22%20Return%20the%20type%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23type"));

smalltalk.bind(smalltalk.WSMessageEvent,"data",0
,function (){var self=this;
return ((function(){var $1$=(self.handle()["data"]);if(nil.isNil_($1$))return nil;return $1$;})());;}
,"accessing",unescape("data%0D%0A%09%22%20Return%20the%20data%20of%20the%20receiver.%20%22%0D%0A%0D%0A%09%5Eself%20handle%20basicAt%3A%20%23data"));
