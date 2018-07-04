
    var labelIndex = function(basic) {
    	var out={};
    	for (var i=0;i<basic.length;i++) {
    		if (basic[i].label) {
    			var label = basic[i].label;
    			out[label] = i;
    		}
    	}
    	return out
    }

    var findNewLine = function(i,basic) {
    	var thisLine = basic[i]._numline;
    	while(i<basic.length) {
    		i++;
    		if (basic[i]._numline>thisLine) return i;
    	}
    	return null;
    }

    var skipMark = function(i,basic) {
    	var idx = findNewLine(i,basic);
    	if (idx) {
    		if (!basic[idx]._skip) basic[idx]._skip=[];
    		basic[idx]._skip.push(i)
    	}
    }

    var findLabel = function(label,labels) {
    	if(labels[label]) return labels[label];
    }

    var croak = function(msg,ln) {
    	throw new Error(msg + " ("+ln._numline+":"+ln._cmd+")");
    }




    



    var opAsm = function(op,line,etype) {
        if (etype=="str") {
            switch(op) {
                case "+": return "concat"
            }
            croak ("Invalid string operator",line)
        }

        
        switch(op) {
            case "+": return "add"
            case "-": return "sub"
            case "*": return "mul"
            case "/": return "div"
            case "=": return "eq"
            case "<>": return "neq"
            case "<": return "lt"
            case ">": return "gt"
            case "<=": return "le"
            case ">=": return "ge"
        }
    }

    var varAsm = function() {
        var out = ""
        for(var k in ENV.vars) {
            var type = ENV.vars[k];
            switch (type) {
                case "int":
                    out +="v_"+k+":\t DS 2\n";
                    continue
                case "str":
                    out +="vs_"+k+":\t DS 2\n";
                    continue
                case "sysdb":
                    out +="sv_"+k+":\t DS 1\n";
                    continue
                case "sysdw":
                    out +="sv_"+k+":\t DS 2\n";
                    continue
            }
        }
        return out
    }

    var strAsm = function() {
        var out = ""
        for(var i=0;i<ENV.strs.length;i++) {
            var s = ENV.strs[i];
            out +="cs_"+i+":\t DB \""+s+"\",0\n"
        }
        return out
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

            //spec ops, optimalised
            if (expr.right.type=="num" && expr.right.value==1 && expr.operator=="+") {
                out = exprAsm(expr.left,line,etype,)+"\tINX H\n"
                return out
            }
            if (expr.left.type=="num" && expr.left.value==1 && expr.operator=="+") {
                out = exprAsm(expr.right,line,etype,)+"\tINX H\n"
                return out
            }
            if (expr.right.type=="num" && expr.right.value==1 && expr.operator=="-") {
                out = exprAsm(expr.left,line,etype,)+"\tDCX H\n"
                return out
            }
            if (expr.right.type=="num" && expr.right.value==2 && expr.operator=="*") {
                out = exprAsm(expr.left,line,etype,)+"\tDAD H\n"
                return out
            }
            if (expr.right.type=="num" && expr.right.value==4 && expr.operator=="*") {
                out = exprAsm(expr.left,line,etype,)+"\tDAD H\n\tDAD H\n"
                return out
            }
            if (expr.left.type=="num" && expr.right.type=="binary") {
                out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
            } else if (expr.left.type=="num" && expr.right.type=="fn") {
                out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
            } else {
                out = exprAsm(expr.left,line,etype,true)+exprAsm(expr.right,line,etype)
            }
            var opfn = "o_"+opAsm(expr.operator,line,etype);
            if (LIB[opfn].inline) {
                out+=LIB[opfn].code
                return out;
            }
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


var ENV= {
    vars:{},
    addVar:function(name,type) {
        ENV.vars[name] = type
    },
    strs:[],
    addStr:function(s) {
        if (ENV.strs.indexOf(s)<0) ENV.strs.push(s)
        return ENV.strs.indexOf(s)
    },
    uses:[],
    addUse:function(s) {
        if (ENV.uses.indexOf(s)<0) {
            ENV.uses.push(s)
            var fn = LIB[s]
            if (!fn) throw new Error("Cannot link "+s)
            if (fn.uses) {
                for (var i=0;i<fn.uses.length;i++) {
                    var use = fn.uses[i]
                    ENV.addUse(use)
                }
            }
        }
        return ENV.uses.indexOf(s)
    }
};

var generator = function(basic) {

    ENV.vars={}
    ENV.strs=[]
    ENV.uses=[]


    var isPunc = function(punc,token) {
        if (!token) return false
        if (token.type!="punc") return false
        if (token.value!=punc) return false
        tokens.shift()
        return true;
    }

    var out="";
    var labels = labelIndex(basic);
    ENV.labels = labels;
    var loops=[];
    for(var i=0;i<basic.length;i++) {
    	var par,next;
    	var line = basic[i];
    	out+="CMD"+i+":\n"
    	if (line._skip) {
    		out+="SKIP"+line._skip[0]+":\n"
    	}
    	var tokens = [].concat(line.tokens);
    	if (tokens[0].type=="kw") {
    		var cmd = tokens[0].value;
    		tokens.shift();
    		out+="; "+cmd+"\n"
    		switch(cmd) {
    			case "goto":
    				par = tokens.shift();
    				out+="\tJMP CMD"+findLabel(par.value,labels)+"\n";
    				continue;
                case "gosub":
    				par = tokens.shift();
    				out+="\tCALL CMD"+findLabel(par.value,labels)+"\n";
    				continue;
                case "return":
    				out+="\tRET\n";
    				continue;
                case "end":
                case "stop":
    				out+="\tRST 0\n";
    				continue;
                case "repeat":
                    //out+="RP"+i+":\n";
                    loops.unshift(["CMD"+i,"R"]);
                    continue;
                case "endwhile":
                    if (!loops.length) croak("ENDWHILE without WHILE",line)
                    if (loops[0][1]!="W") croak("WHILE / ENDWHILE mismatched",line)
                    //loops.unshift(["CMD"+i,"R"]);
    				out+="\tJMP "+loops[0][0]+"\n";
                    out+="WB"+loops[0][0]+":\n"
                    loops.shift()                    
                    continue;
                case "break":
                    if (!loops.length) croak("BREAK outside the loop",line);
                    out+="\tJMP "+loops[0][1]+"B"+loops[0][0]+"\n"
                    continue;                    
                case "continue":
                    if (!loops.length) croak("CONTINUE outside the loop",line);
                    out+="\tJMP "+loops[0][1]+"C"+loops[0][0]+"\n"
                    continue;                    
    			case "let":
    				par = tokens.shift();
    				if (par.type!="var" && par.type!="var$") croak("No variable name",line)
    				next = tokens.shift();
    				if (next.type!="op" || next.value!="=") croak("LET without an assignment")
                    var ex = expr(tokens,line);
                    var et = exprType(ex,line);
    				out+=exprAsm(ex,line,et);
    				if (par.type=="var") {
                        if (et!="int") croak("Cannot assign this to int variable",line)
                        ENV.addVar(par.value,"int")
    					out+="\tSHLD v_"+par.value+"\n";
    				} else if (par.type=="var$") {
                        if (et!="str") croak("Cannot assign this to string variable",line)
                        ENV.addVar(par.value,"str")
    					out+="\tSHLD vs_"+par.value+"\n";
    				}
    				continue;

    			case "if":
    				var ex = expr(tokens,line,true);
    				skipMark(i,basic)
					out+=exprAsm(ex);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ SKIP"+i+"\n";
    				continue;

                case "until":
                    if (!loops.length) croak("UNTIL without REPEAT",line)
                    if (loops[0][1]!="R") croak("UNTIL / REPEAT mismatched",line)
                    var ex = expr(tokens,line,true);
                    out+="RC"+loops[0][0]+":\n"
					out+=exprAsm(ex);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ "+loops[0][0]+"\n";
                    out+="RB"+loops[0][0]+":\n"
                    loops.shift()
    				continue;

                case "while":
                    loops.unshift(["CMD"+i,"W"])
                    var ex = expr(tokens,line,true);
                    out+="WC"+loops[0][0]+":\n"
					out+=exprAsm(ex);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ WB"+loops[0][0]+"\n";
    				continue;
                    

                case "print":
                var println = true;
                    while(tokens.length) {
                        if (isPunc("#",tokens[0])) {
                            //channel swap
                            var chan = expr(tokens,line,true);
                            out+=exprAsm(chan,line,"int");
                            ENV.addUse("prtchan")
                            out+="\tCALL prtchan\n"
                            if (!isPunc(",",tokens[0])) croak("Syntax error",line)
                            continue
                        }
                        var ex = expr(tokens,line,true);
                        var et = exprType(ex,line);
                        out+=exprAsm(ex,line,et);
                        ENV.addUse("print"+et)
                        out+="\tCALL print"+et+"\n"
                        println = true;
                        if (isPunc(";",tokens[0])) {
                            println = false;
                            continue;
                        }
                        if (isPunc(",",tokens[0])) {
                            ENV.addUse("printtab")
                            out+="\tCALL printtab\n"
                            println = false;
                            continue;
                        }

                    }
                    if (println) {
                        ENV.addUse("println")
                        out+="\tCALL println\n"
                    }
                    

                    continue

            }
            if (tokens.length) croak ("Extra characters", line)
    	}

    }

    if (loops.length) croak ("REPEAT without UNTIL", line)

    //fndump
    out+=fnAsm();


    //strdump
    out+=strAsm();

    //vardump
    out+=varAsm();

    return out;
}