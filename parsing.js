var PRECEDENCE = {
    "=": 1,
    "||": 2,
    "&&": 3,
    "<": 7, ">": 7, "<=": 7, ">=": 7, "==": 7, "!=": 7,
    "+": 10, "-": 10,
    "*": 20, "/": 20, "%": 20,
};

var ARITY = {
    "max":2,
    "abs":1,
    "rnd":0
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
    if (type=="var$") {
        return "str"
    }
    if (type=="binary") {
        var left = exprType(expr.left,ln);
        var right = exprType(expr.right,ln);
        if (left == right) return left
        croak("Mismatched types in expression",ln);
    }
    
    if (type=="fn") {
        return "int";
    }
    croak("Invalid expression type",ln);
}

var exprAsm = function(expr,line,etype,left) {
    if (typeof etype=="undefined") etype="int";
    if (typeof left=="undefined") left=false;
    var type = expr.type;
    if (type=="num" && !left) {
        return "\tLXI H,"+expr.value+"\n"
    }
    if (type=="str" && !left) {
        var cs=ENV.addStr(expr.value);
        return "\tLXI H,cs_"+cs+"\t;"+expr.value+"\n"
    }
    if (type=="num" && left) {
        return "\tLXI D,"+expr.value+"\n"
    }
    if (type=="str" && left) {
        var cs=ENV.addStr(expr.value);
        return "\tLXI D,cs_"+cs+"\t;"+expr.value+"\n"
    }
    if (type=="var" && !left) {
        ENV.addVar(expr.value,"int")
        return "\tLHLD v_"+expr.value+"\n"
    }
    if (type=="var" && left) {
        ENV.addVar(expr.value,"int")
        return "\tXCHG\n\tLHLD v_"+expr.value+"\n\tXCHG\n"
    }
    if (type=="var$" && !left) {
        ENV.addVar(expr.value,"str")
        return "\tLHLD vs_"+expr.value+"\n"
    }
    if (type=="var$" && left) {
        ENV.addVar(expr.value,"str")
        return "\tXCHG\n\tLHLD vs_"+expr.value+"\n\tXCHG\n"
    }
    if (type=="binary") {
        if (expr.left.type=="num" && expr.right.type=="binary") {
            out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
        } else if (expr.left.type=="num" && expr.right.type=="fn") {
            out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
        } else {
            out = exprAsm(expr.left,line,etype,true)+exprAsm(expr.right,line,etype)
        }
        var opfn = "o_"+opAsm(expr.operator,line,etype);
        ENV.addUse(opfn);
        out += "\tCALL "+opfn+"\n"+(left?"\tXCHG\n":"")
        return out;
    }
    
    if (type=="fn") {
        out="";
        if (expr.operands.length==1) {
            out += exprAsm(expr.operands[0])
        } else if (expr.operands.length==2) {
            out += exprAsm(expr.operands[0],true)
            out += exprAsm(expr.operands[1])
        } else
        for(var i=0;i<expr.operands.length;i++) {
            out += exprAsm(expr.operands[i])+"\tPUSH\n"
        }
        ENV.addUse("f_"+expr.value);
        out += "\tCALL f_"+expr.value+"\n"+(left?"\tXCHG\n":"")
        return out;
    }
    
    return "\tUNKNOWN "+JSON.stringify(expr)+"\n"

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
        if (n.type!="punc") croak(punc+" is missing",ln)
        if (n.value!=punc) croak(punc+" is missing",ln)
    }

    var parse_atom = function() {
        var n = tokens.shift();
        //if (!n) return n
        if (n.type=="fn") {
            var nn = ARITY[n.value];
            var op=[];
            expectPunctuation("(")
            while(nn>0) {
                op.push(expr(tokens,ln,bool))
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