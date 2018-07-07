function InputStream(input) {
    var pos = 0, line = 1, col = 0;
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : croak,
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
        throw new Error(msg + " (" + line + ":" + col + ")");
    }
 }


 function TokenStream(input) {
    var current = null;
    var keywords = " if then else rem print input goto let for to next step "+
            "gosub return end stop data read restore repeat until continue break "+
            "poke dpoke dim ramtop "+
            "while endwhile ";
    var functions = " abs neg rnd max chr$ sgn len val peek dpeek low high ";
    return {
        next  : next,
        peek  : peek,
        eof   : eof,
        croak : input.croak
    };
    function is_keyword(x) {
        return keywords.indexOf(" " + x.toLowerCase() + " ") >= 0;
    }
    function is_function(x) {
        return functions.indexOf(" " + x.toLowerCase() + " ") >= 0;
    }
    function is_digit(ch) {
        return /[0-9]/i.test(ch);
    }
    function is_hexdigit(ch) {
        return /[0-9a-fA-F]/i.test(ch);
    }
    function is_id_start(ch) {
        return /[a-z_]/i.test(ch);
    }
    function is_id(ch) {
        return is_id_start(ch) || "?!0123456789".indexOf(ch) >= 0;
    }
    function is_op_char(ch) {
        return "+-*/%=&|<>!".indexOf(ch) >= 0;
    }
    function is_colon(ch) {
        return ":".indexOf(ch) >= 0;
    }
    function is_punc(ch) {
        return ",;#(){}[]".indexOf(ch) >= 0;
    }
    function is_whitespace(ch) {
        return " \t\n\r".indexOf(ch) >= 0;
    }
    function read_while(predicate) {
        var str = "";
        while (!input.eof() && predicate(input.peek()))
            str += input.next();
        return str;
    }
    function read_number() {
        var has_dot = false;
        var number = read_while(function(ch){
            if (ch == ".") {
                if (has_dot) return false;
                has_dot = true;
                return true;
            }
            return is_digit(ch);
        });
        return { type: "num", value: parseFloat(number) };
    }
    function read_hexnumber() {
        input.next()
        var number = read_while(function(ch){
            return is_hexdigit(ch);
        });
        return { type: "num", value: parseInt(number,16) };
    }
    function read_ident() {
        var id = read_while(is_id);
        var s = input.peek();
        if (s=="$") {
            input.next();
            if (is_function(id+"$")) {
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
            type  : is_keyword(id) ? "kw" : is_function(id) ? "fn" : "var",
            value : id.toLowerCase()
        };
    }
    function read_escaped(end) {
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
    function read_string() {
        return { type: "str", value: read_escaped('"') };
    }
    function skip_comment() {
        read_while(function(ch){ return ch != "\n" });
        input.next();
    }
    function read_next() {
        read_while(is_whitespace);
        if (input.eof()) return null;
        var ch = input.peek();

        if (ch == '"') return read_string();
        if (ch == '$') return read_hexnumber();
        if (is_digit(ch)) return read_number();
        if (is_id_start(ch)) {
            var ident = read_ident();
            if (ident.type == "kw" && ident.value=="rem") {
                ;
                return {type:"remark",value:read_while(function(ch){ return ch != "\n" })}
            }
            return ident
        }
        if (is_colon(ch)) return {
            type  : "colon",
            value : input.next()
        };
        if (is_punc(ch)) return {
            type  : "punc",
            value : input.next()
        };
        if (is_op_char(ch)) return {
            type  : "op",
            value : read_while(is_op_char)
        };
        input.croak("Can't handle character: " + ch);
    }
    function peek() {
        return current || (current = read_next());
    }
    function next() {
        var tok = current;
        current = null;
        return tok || read_next();
    }
    function eof() {
        return peek() == null;
    }
}




function parse(source) {
    var lines = source.split("\n");

    var basic = []

    for (var i=0;i<lines.length;i++) {
        var line = lines[i];
        var out = {source:line,rawTokens:[],label:null,_numline:i,_cmd:1}
        var input = InputStream(line);
        var tok = TokenStream(input);
        while(!tok.eof()) {
            var t = tok.next()
            out.rawTokens.push(t)
        }
        if (!out.rawTokens.length) continue; //neni co ukladat
        out.tokens = [].concat(out.rawTokens)
        if (out.tokens[0].type=="num") { //line number
            out.label = out.tokens.shift().value;
            if (!out.tokens.length) continue
        }

        //decolonization
        var nout = [];
        while (out.tokens.length) {
            var t = out.tokens.shift()
            if (t.type=="colon" || (t.type=="kw" && t.value=="then")) {
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
                    tokens:nout
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
        if (nout[0].type=="var") {
            nout.unshift({type:"kw",value:"let"})
        }
        if (nout[0].type=="var$") {
            nout.unshift({type:"kw",value:"let"})
        }
        out.tokens = nout
        basic.push(out);
    }
    return basic
}
