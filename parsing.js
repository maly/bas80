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
    "lptr":["int"],
    "len":["str"],
    "asc":["str"],
    "val":["str"],
    "chrS":["int"]
}


/* global croak */

var findStructElement = function(elName) {
  for(var k in ENV.structs) {
    for (var i=0;i<ENV.structs[k].length;i++) {
      if (ENV.structs[k][i].name==elName) return ENV.structs[k][i].type
    }
  }
  return null
}

var exprType = function(expr,ln) {
    //var type = "undefined";
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
    if (type=="var.") {
      var t = findStructElement(expr.index)
      if (t) return t
    }
    if (type=="var{}") {
      var t = findStructElement(expr.member)
      if (t) return t
    }
    if (type=="ptr") {
        return "int"
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
    return false
}



var compute = function (l,r,op) {
    switch(op) {
        case "+": return l+r;
        case "-": return l-r;
        case "*": return l*r;
        case "/": return l/r;
    }
    return null
}

/* global ENV */
var expr = function(tokens, ln, bool) {
    var expectPunctuation = function(punc) {
        var n = tokens.shift();
        if (!n) croak(punc+" is missing",ln)
        if (n.type!="punc") croak(punc+" is missing, "+n.type+"instead",ln)
        if (n.value!=punc) croak(punc+" is missing, "+n.value+" instead",ln)
    }

    var parseAtom = function() {
        var n = tokens.shift();
        var ex,et,ex2,op;
        //if (!n) return n
        if (n.type=="op" && n.value=="-") {
            //negative number
            n = tokens.shift();
            n.value = n.value * -1
            return n
        }

        if (n.type=="var" && (n.value.indexOf(".")>0)) {
          //dot notation
          var dedot = n.value.split(".");
//          console.log(n,n.value.indexOf("."),dedot)
          return {type:"var.",value:dedot[0],index:dedot[1]}
        }

        if (n.type=="punc" && n.value=="[") {
            //expectPunctuation("[");
            ex = expr(tokens,ln,bool)
            //console.log(ex)
            if (ex.type!="var" && ex.type!="var." && ex.type!="var[]" && ex.type!="var$" && ex.type!="str") croak("You cannot get pointer to this!",ln)
            if (ex.type=="var.") {
              et="int"
            } else {
              et = exprType(ex,ln);
            }
            //console.log(ex,et)
            expectPunctuation("]");
            return {type:"ptr",value:ex.value,varType:et,ex:ex}
        }

        if (n.type=="var" && tokens.length && tokens[0].type=="punc" && tokens[0].value=="{") {
          //it should be an struct denominator
          tokens.shift();
          ex = tokens.shift().value.split(".");
          expectPunctuation("}")
          if (ex.length==1) {return {type:"var{}",value:n.value,struct:null,member:ex[0]}}
          return {type:"var{}",value:n.value,struct:ex[0],member:ex[1]}
        }

        if (n.type=="var" && tokens.length && tokens[0].type=="punc" && tokens[0].value=="(") {
            //it should be an array

            if (ENV.fns[n.value]==n.value) {
                //it's a function, dude!
                op=[{type:"var",value:n.value}];
                expectPunctuation("(")
                ex = expr(tokens,ln,bool)
                //et = exprType(ex,ln);
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
            ex = expr(tokens,ln,bool)
            et = exprType(ex,ln);
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
                ex = {type:"num",value:0}
                if (tokens[0].type=="punc" && tokens[0].value==")") {
                    ex2 = {type:"num",value:32767}
                } else {
                    ex2 = expr(tokens,ln,bool)
                    //var et2 = exprType(ex2,ln);
                }
                //var et2 = exprType(ex2,ln);
            } else {
                ex = expr(tokens,ln,bool)
                //var et = exprType(ex,ln);
                if (tokens.length) {
                    if (tokens[0].type=="kw" && tokens[0].value=="to") {
                        tokens.shift();

                        if (tokens[0].type=="punc" && tokens[0].value==")") {
                            ex2 = {type:"num",value:32767}
                        } else {
                            ex2 = expr(tokens,ln,bool)
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
            op=[];
            expectPunctuation("(")
            var argNum=0;
            while(nn>0) {
                ex = expr(tokens,ln,bool)
                et = exprType(ex,ln);
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
    var maybeBinary = function(left,myPrec) {
        if (!tokens.length) return left;
        var tok = tokens[0];
        if (tok.type!="op") return left;

        var hisPrec = PRECEDENCE[tok.value];
        if (hisPrec>myPrec) {
               tokens.shift();
            var right = maybeBinary(parseAtom(), hisPrec);

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


            return maybeBinary(binary,myPrec)
        }
        return left;
    }
    //var n = tokens.shift();

    var ex = maybeBinary(parseAtom(),0);

    return ex;
}
