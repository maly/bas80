function InputStream(input) {
    var pos = 0, line = 1, col = 0;
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : croak
    };
    function next() {
        var ch = input.charAt(pos++);
        if (ch == "\n") line++, col = 0; else col++;
        return ch;
    }
    function peek() {
        return input.charAt(pos);
    }
    function eof() {
        return peek() == "";
    }
    function croak(msg) {
        throw new Error(JSON.stringify({source:"",error:msg,_numline:line,_cmd:col}));
    }
 }


 function TokenStream(input) {
    var current = null;
    var keywords = " if then else endif rem print input goto let for to next step "+
            "gosub return end stop data byte read restore readptr repeat until continue break "+
            "poke dpoke dim ramtop push pop syscall take def call swap out on write wait "+
            "alloc free "+
            "while endwhile wend ";
    var functions = " abs neg rnd max chr$ sgn len val peek dpeek low high fn in asc lptr dptr ";
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : input.croak
    };
    function isKeyword(x) {
        return keywords.indexOf(" " + x.toLowerCase() + " ") >= 0;
    }
    function isFunction(x) {
        return functions.indexOf(" " + x.toLowerCase() + " ") >= 0;
    }
    function isDigit(ch) {
        return (/[0-9]/i).test(ch);
    }
    function isHexDigit(ch) {
        return (/[0-9a-fA-F]/i).test(ch);
    }
    function isIdStart(ch) {
        return (/[a-z_]/i).test(ch);
    }
    function isId(ch) {
        return isIdStart(ch) || "?!.0123456789".indexOf(ch) >= 0;
    }
    function isOpChar(ch) {
        return "+-*/%=&|^<>!".indexOf(ch) >= 0;
    }
    function isColon(ch) {
        return ":".indexOf(ch) >= 0;
    }
    function isPunc(ch) {
        return ",;#(){}[]".indexOf(ch) >= 0;
    }
    function isWhitespace(ch) {
        return " \t\n\r".indexOf(ch) >= 0;
    }
    function readWhile(predicate) {
        var str = "";
        while (!input.eof() && predicate(input.peek()))
            str += input.next();
        return str;
    }
    function readNumber() {
        var hasDot = false;
        var number = readWhile(function(ch){
            if (ch == ".") {
                if (hasDot) return false;
                hasDot = true;
                return true;
            }
            return isDigit(ch);
        });
        return {type: "num", value: parseFloat(number)};
    }
    function readHexNumber() {
        input.next()
        var number = readWhile(function(ch){
            return isHexDigit(ch);
        });
        return {type: "num", value: parseInt(number,16)};
    }
    function readIdent() {
        var id = readWhile(isId);
        var s = input.peek();
        if (s=="$") {
            input.next();
            if (isFunction(id+"$")) {
                return {
                    type  : "fn",
                    value : id.toLowerCase()+"S"
                };
            }
            return {
                type  : "var$",
                value : id.toLowerCase()
            };

        }
        return {
            type  : isKeyword(id) ? "kw" : isFunction(id) ? "fn" : "var",
            value : id.toLowerCase()
        };
    }
    function readEscaped(end) {
        var escaped = false, str = "";
        input.next();
        while (!input.eof()) {
            var ch = input.next();
            if (escaped) {
                str += ch;
                escaped = false;
            } else if (ch == "\\") {
                escaped = true;
            } else if (ch == end) {
                break;
            } else {
                str += ch;
            }
        }
        return str;
    }
    function readString() {
        return {type: "str", value: readEscaped('"')};
    }
    function readNext() {
        readWhile(isWhitespace);
        if (input.eof()) return null;
        var ch = input.peek();

        if (ch == '"') return readString();
        if (ch == '$') return readHexNumber();
        if (isDigit(ch)) return readNumber();
        if (isIdStart(ch)) {
            var ident = readIdent();
            if (ident.type == "kw" && ident.value=="rem") {
              return {type:"remark",value:readWhile(function(ch){ return ch != "\n" })}
            }
            return ident
        }
        if (isColon(ch)) return {
            type  : "colon",
            value : input.next()
        };
        if (isPunc(ch)) return {
            type  : "punc",
            value : input.next()
        };
        if (isOpChar(ch)) return {
            type  : "op",
            value : readWhile(isOpChar)
        };
        input.croak("Can't handle character: " + ch);
        return null
    }
    function peek() {
        return current || (current = readNext());
    }
    function next() {
        var tok = current;
        current = null;
        return tok || readNext();
    }
    function eof() {
        return peek() === null;
    }
}




function parse(source) {
    var lines = source.split("\n");

    var basic = []
    var hasEnd = false;

    var t;

    for (var i=0;i<lines.length;i++) {
        var line = lines[i];
        var out = {source:line,rawTokens:[],label:null,_numline:i,_cmd:1}
        var input = InputStream(line);
        var tok = TokenStream(input);
        while(!tok.eof()) {
            t = tok.next()
            out.rawTokens.push(t)
        }
        if (!out.rawTokens.length) continue; //neni co ukladat
        out.tokens = [].concat(out.rawTokens)
        if (out.tokens[0].type=="num") { //line number
            out.label = out.tokens.shift().value;
            if (!out.tokens.length) continue
        }


        if (out.tokens[0].type=="var") { //line label?
            if (out.tokens.length>1 && out.tokens[1].type=="colon" && out.tokens[1].value==":") {
                out.label = out.tokens.shift().value;
                out.tokens.shift();
                if (!out.tokens.length) continue
            }
        }

        //decolonization
        var nout = [];
        while (out.tokens.length) {
            t = out.tokens.shift()
            if (t.type=="kw" && t.value=="end") hasEnd = true;
            if (t.type=="var" && t.value=="and") t.type="op"
            if (t.type=="var" && t.value=="or") t.type="op"
            if ((t.type=="kw" && t.value=="else")&&nout.length==0) {
                basic[basic.length-1].hasElse=true
                continue;
            }
            if (t.type=="colon" || (t.type=="kw" && t.value=="then") || (t.type=="kw" && t.value=="else")) {
                if (nout[0].type=="var") {
                    nout.unshift({type:"kw",value:"let"})
                }
                if (nout[0].type=="var$") {
                    nout.unshift({type:"kw",value:"let"})
                }
                if (t.type=="kw" && t.value=="then") {
                    nout.push(t)
                    if (out.tokens.length) {
                        if (out.tokens[0].type=="num") {
                          /*
                            basic.push(nout)
                            nout = [];
                            out.label=null;
                            out._cmd++;
                            */
                           // nout.push({type:"kw",value:"goto"})
                        }
                    }
                }
                if (t.type=="kw" && t.value=="else") {
                    //nout.push(t)
                    if (out.tokens.length) {
                        if (out.tokens[0].type=="num") {
                            nout.push({type:"kw",value:"goto"})
                        }
                    }
                }
                basic.push({
                    source:line,
                    rawTokens:out.rawTokens,
                    label:out.label,
                    _numline:out._numline,
                    _cmd:out._cmd,
                    tokens:nout,
                    hasElse:(t.type=="kw" && t.value=="else")
                });
                nout=[];
                out.label=null;
                out._cmd++;

                if (t.type=="kw" && t.value=="then") {
                    if (out.tokens.length) {
                        if (out.tokens[0].type=="num") {
                            nout.push({type:"kw",value:"goto"})
                        }
                    }
                }


                continue;
            }

            nout.push(t)


        }
        if (!nout.length) continue
        if (nout[0].type=="var") {
            nout.unshift({type:"kw",value:"let"})
        }
        if (nout[0].type=="var$") {
            nout.unshift({type:"kw",value:"let"})
        }
        out.tokens = nout
        basic.push(out);
    }
    if (!hasEnd) {
        basic.push({
            source:"END",
            rawTokens:[{type:"kw",value:"end"}],
            label:out.label,
            _numline:out._numline,
            _cmd:out._cmd,
            tokens:[{type:"kw",value:"end"}]
        });
    }
    return basic
}

if (typeof module != 'undefined') module.exports = parse
