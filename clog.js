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
// See https://stackoverflow.com/questions/9781218/how-to-change-node-jss-console-font-color
// https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
const Reset = "\x1b[0m";
const Bright = "\x1b[1m";
const Dim = "\x1b[2m";
const Underscore = "\x1b[4m";
const Blink = "\x1b[5m";
const Reverse = "\x1b[7m";
const Hidden = "\x1b[8m";

const FgBlack = "\x1b[30m";
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const FgYellow = "\x1b[33m";
const FgBlue = "\x1b[34m";
const FgMagenta = "\x1b[35m";
const FgCyan = "\x1b[36m";
const FgWhite = "\x1b[37m";
const FgGray = "\x1b[38;5;244m";
const FgOrange = "\x1b[38;5;214m";
const FgLightOrange = "\x1b[38;5;220m";
const FgPurple = "\x1b[38;5;125m";
const FgLightPurple = "\x1b[38;5;128m";


var BgBlack = "\x1b[40m";
var BgRed = "\x1b[41m";
var BgGreen = "\x1b[42m";
var BgYellow = "\x1b[43m";
var BgBlue = "\x1b[44m";
var BgMagenta = "\x1b[45m";
var BgCyan = "\x1b[46m";
var BgWhite = "\x1b[47m";

function log(header, headerColor, text) {
	
	var options = {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "numeric",		
    };
    var count = Object.keys(text).length;
    //if(count > 10000) text = "Object too large to display";
	var date = new Date();
	var strTime = date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+':'+ date.getMilliseconds();
	var str = headerColor + header + '========================================================='+ Reset+ ' \n';
	str = str.replace('{time}',date.toLocaleDateString("en", options) + ' ' +strTime);
	str = str + text+'\n';
	console.log(str);
}

module.exports = Object.assign({
    Reset,
   Bright,
   Dim,
   Underscore,
   Blink,
   Reverse,
   Hidden,

   FgBlack,
   FgRed,
   FgGreen,
   FgYellow,
   FgBlue,
   FgMagenta,
   FgCyan,
   FgWhite,
   FgGray,
   FgOrange,
   FgLightOrange,
   FgPurple,
   FgLightPurple,
   log
  }, module.exports);
 
