var PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "<>": 7,
    "|":8,"^":8,
    "&":9,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
    "or":10,
    "and":20
};

var ARITY = {
    "max":["int","int"],
    "abs":["int"],
    "neg":["int"],
    "low":["int"],
    "high":["int"],
    "peek":["int"],
    "in":["int"],
    "fn":["int","int"],
    "dpeek":["int"],
    "sgn":["int"],
    "rnd":[],
    "len":["str"],
    "val":["str"],
    "chrS":["int"]
}





var exprType = function(expr,ln) {
    var type = "undefined";
    var type = expr.type;
    if (type=="num") {
        return "int"
    }
    if (type=="str") {
        return "str"
    }
    if (type=="var") {
        return "int"
    }
    if (type=="var[]") {
        return "int"
    }
    if (type=="var$") {
        return "str"
    }
    if (type=="slice$") {
        return "str"
    }
    if (type=="binary") {
        var left = exprType(expr.left,ln);
        var right = exprType(expr.right,ln);
        if (left == right) return left
        croak("Mismatched types in expression",ln);
    }
    
    if (type=="fn") {
        var fn =expr.value;

        return fn[fn.length-1]=="S"?"str":"int";
    }
    croak("Invalid expression type",ln);
}



var compute = function (l,r,op) {
    switch(op) {
        case "+": return l+r;
        case "-": return l-r;
        case "*": return l*r;
        case "/": return l/r;
    }
}

var expr = function(tokens, ln, bool) {
    var expectPunctuation = function(punc) {
        var n = tokens.shift();
        if (!n) croak(punc+" is missing",ln)
        if (n.type!="punc") croak(punc+" is missing, "+n.type+"instead",ln)
        if (n.value!=punc) croak(punc+" is missing, "+n.value+" instead",ln)
    }

    var parse_atom = function() {
        var n = tokens.shift();
        //if (!n) return n
        if (n.type=="op" && n.value=="-") {
            //negative number
            n = tokens.shift();
            n.value = n.value * -1
            return n
        }

        if (n.type=="var" && tokens.length && tokens[0].type=="punc" && tokens[0].value=="(") {
            //it should be an array

            if (ENV.fns[n.value]==n.value) {
                //it's a function, dude!
                var op=[{type:"var",value:n.value}];
                expectPunctuation("(")
                var ex = expr(tokens,ln,bool)
                //var et = exprType(ex,ln);
                op.push(ex)
                if (tokens[0].type=="punc"&&tokens[0].value==",") {
                    expectPunctuation(",")
                    ex = expr(tokens,ln,bool)
                    op.push(ex)
                }
                expectPunctuation(")")
                return {type:"fn",value:"fn",operands:op}
            }
            expectPunctuation("(")
//            console.log(JSON.parse(JSON.stringify(tokens)))
            var ex = expr(tokens,ln,bool)
            var et = exprType(ex,ln);
//            console.log(ex,et)
//            console.log(JSON.parse(JSON.stringify(tokens)))
            expectPunctuation(")")
            return {type:"var[]",value:n.value,index:ex}
        }

        if (n.type=="var$" && tokens.length && tokens[0].type=="punc" && tokens[0].value=="(") {
            //it should be an string slice
            //console.log(JSON.parse(JSON.stringify(tokens)))
            expectPunctuation("(")
//            console.log(JSON.parse(JSON.stringify(tokens)))
            if (tokens[0].type=="kw" && tokens[0].value=="to") {
                tokens.shift();
                var ex = {type:"num",value:0}
                if (tokens[0].type=="punc" && tokens[0].value==")") {
                    var ex2 = {type:"num",value:32767}
                } else {
                    var ex2 = expr(tokens,ln,bool)
                    //var et2 = exprType(ex2,ln);
                }
                //var et2 = exprType(ex2,ln);
            } else {
                var ex = expr(tokens,ln,bool)
                //var et = exprType(ex,ln);
                if (tokens.length) {
                    if (tokens[0].type=="kw" && tokens[0].value=="to") {
                        tokens.shift();
                        
                        if (tokens[0].type=="punc" && tokens[0].value==")") {
                            var ex2 = {type:"num",value:32767}
                        } else {
                            var ex2 = expr(tokens,ln,bool)
                            //var et2 = exprType(ex2,ln);
                        }
                    }
                }
            }
            //console.log(ex2)
            //console.log(JSON.parse(JSON.stringify(tokens)))
            expectPunctuation(")")
            return {type:"slice$",value:n.value,from:ex, to:ex2}
        }


        if (n.type=="fn") {
            var nn = ARITY[n.value].length;
            var op=[];
            expectPunctuation("(")
            var argNum=0;
            while(nn>0) {
                var ex = expr(tokens,ln,bool)
                var et = exprType(ex,ln);
                if (ARITY[n.value][argNum]!=et) croak("Argument type mismatch, given:"+et+", expected: "+ARITY[n.value][argNum],ln)
                op.push(ex)
                if (n.value=="fn") {
                    //multiparameter!
                    if (tokens[0].type=="punc"&&tokens[0].value==")") break;
                    if (tokens[0].type=="punc"&&tokens[0].value==",") {
                        //dalsi parametr
                        nn++
                    }
                }
                nn--
                if (nn) expectPunctuation(",")
            }
            expectPunctuation(")")
            return {type:"fn",value:n.value,operands:op}
        }
        if (n.type=="punc" && n.value=="(") {
            var exp=expr(tokens,ln,bool);
            expectPunctuation(")")
            return exp;
        }

        return n;
    }
    var maybe_binary = function(left,my_prec) {
        if (!tokens.length) return left;
        var tok = tokens[0];
        if (tok.type!="op") return left;
        
        var his_prec = PRECEDENCE[tok.value];
        if (his_prec>my_prec) {
               tokens.shift();
            var right = maybe_binary(parse_atom(), his_prec);
            
            var binary = {
                type     : (tok.value == "=" && !bool) ? "assign" : "binary",
                operator : tok.value,
                left     : left,
                right    : right
            };

            //can evaluate number?
            if (left.type=="num" && right.type=="num") {
                //console.log(left.value, right.value, tok.value)
                binary = {
                    type     : "num",
                    value: compute(left.value, right.value, tok.value)
                };	
            }

            //can evaluate strings?
            if (left.type=="str" && right.type=="str" && tok.value=="+") {
                //console.log(left.value, right.value, tok.value)
                binary = {
                    type     : "str",
                    value: left.value + right.value
                };	
            }

           
            return maybe_binary(binary,my_prec)
        } else {
            
           
        }
        return left;
    }
    //var n = tokens.shift();

    var ex = maybe_binary(parse_atom(),0);
    
    return ex;
}