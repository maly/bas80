
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
        if(labels[label]!==undefined) return labels[label];
        //find 
        return null
    }

    var croak = function(msg,ln) {
    	throw new Error(msg + " ("+ln._numline+":"+ln._cmd+")");
    }




    



    var opAsm = function(op,line,etype) {
        if (etype=="str") {
            switch(op) {
                case "+": return "concat"
                case "=": return "streq"
            }
            croak ("Invalid string operator",line)
        }

        
        switch(op) {
            case "+": return "add"
            case "-": return "sub"
            case "*": return "mul"
            case "/": return "div"
            case "%": return "mod"
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
            var name = k.split("_")[0]
            switch (type) {
                case "int":
                    out +="v_"+name+":\t DS 2\n";
                    continue
                case "str":
                    out +="vs_"+name+":\t DS 2\n";
                    continue
                case "sysdb":
                    out +="sv_"+name+":\t DS 1\n";
                    continue
                case "sysdw":
                    out +="sv_"+name+":\t DS 2\n";
                    continue
            }
        }
        for(var k in ENV.intarr) {
            var size = ENV.intarr[k];
            out +="vai_"+k+":\t DS "+(2*size)+"\n";
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

    var fnAsm = function() {
        out = "";
        var fname;
        while(fname = ENV.uses.shift()) {
            var fn = LIB[fname]
            if (!fn) throw new Error("Cannot link "+fname)
    
            if (fn.sysdb) {
                var sv;
                for(var i=0;i<fn.sysdb.length;i++){
                    ENV.addVar(fn.sysdb[i],"sysdb")
                }
            }
            if (fn.sysdw) {
                var sv;
                for(var i=0;i<fn.sysdw.length;i++){
                    ENV.addVar(fn.sysdw[i],"sysdw")
                }
            }
            out+=";---"+fname+"---\n"
            out+=fname+":\n"
            out += fn.code
            out+=";---"+fname+"-end---\n\n"
        }
        return out;
    
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
        if (type=="var[]") {
            if (!ENV.intarr[expr.value])  croak("You have to DIM array first",line)
            if (expr.index.type=="num" && expr.index.value>=ENV.intarr[expr.value]) croak("Index out of bound",line)
            ENV.addUse("s_check");
        }
        if (type=="var[]" && !left) {
            var out = "\tPUSH D\n"+exprAsm(expr.index,line,"int")
            out += "\tLXI D,vai_"+expr.value+"\n"
            out += "\tLXI B,"+ENV.intarr[expr.value]+"\n";
            out += "\tCALL s_check\n";
                out += "\tMOV E,M\n\tINX H\n\tMOV D,M\n\tXCHG\n\tPOP D\n"
            return out
        }

        if (type=="var[]" && left) {
            var out = "\tPUSH H\n"+exprAsm(expr.index,line,"int")
            out += "\tLXI D,vai_"+expr.value+"\n"
            out += "\tLXI B,"+ENV.intarr[expr.value]+"\n";
            out += "\tCALL s_check\n";
            out += "\tMOV E,M\n\tINX H\n\tMOV D,M\n\tPOP H\n"
            return out
        }
        if (type=="binary") {
            //spec ops, optimalised
            if (expr.right.type=="num" && expr.right.value==1 && expr.operator=="+") {
                out = exprAsm(expr.left,line,etype)+"\tINX H\n"
                return out
            }
            if (expr.left.type=="num" && expr.left.value==1 && expr.operator=="+") {
                out = exprAsm(expr.right,line,etype)+"\tINX H\n"
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
                out = exprAsm(expr.left,line,etype,true)+"\tpush d\n"+exprAsm(expr.right,line,etype)+"\tpop d\n"
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
        ENV.vars[name+"_"+type] = type
    },
    intarr:{},
    addArrInt:function(name,limit) {
        ENV.intarr[name] = limit
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

var generator = function(basic, CFG) {

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
    var isOp = function(op,token) {
        if (!token) return false
        if (token.type!="op") return false
        if (token.value!=op) return false
        tokens.shift()
        return true;
    }

    var out="";
    out+=";----CODE SEGMENT (ROMable)\n"
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
                    par = tokens[0];
                    var target = findLabel(par.value,labels);
                    if (target===null) croak("Target line not found",line)
    				out+="\tJMP CMD"+target+"\n";
    				continue;
                case "gosub":
    				par = tokens[0];
                    var target = findLabel(par.value,labels);
                    if (target===null) croak("Target line not found",line)
    				out+="\tCALL CMD"+target+"\n";
    				continue;
                case "return":
    				out+="\tRET\n";
    				continue;
                case "end":
                    out+="\tRST 0\n";
                    continue;
                case "stop":
                    ENV.addUse("errstop");
    				out+="\tJMP ERRSTOP\n";
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
                case "dim":
                    var epar = expr(tokens,line)
                    //console.log(epar)
                    if (epar.type!="var[]") croak("DIM needs a variable name",line);
                    if (epar.index.type!="num") croak("DIM needs a constant size",line);
                    ENV.addArrInt(epar.value,epar.index.value)
                    continue
    			case "let":
                    //par = tokens.shift();
                    var epar = expr(tokens,line)
//                    console.log(epar)
                    if (epar.type=="var") {
                        //inc,dec
                        if (!tokens.length) croak("LET should assign something",line)
                        if(isOp("++",tokens[0])) {
                            //INC short
                            ENV.addVar(epar.value,"int")
                            out+="\tLHLD v_"+epar.value+"\n"
                            out+="\tINX H\n"
                            out+="\tSHLD v_"+epar.value+"\n"
                            tokens.shift();
                            continue
                        }
                        if(isOp("--",tokens[0])) {
                            //DEC short
                            ENV.addVar(epar.value,"int")
                            out+="\tLHLD v_"+epar.value+"\n"
                            out+="\tDCX H\n"
                            out+="\tSHLD v_"+epar.value+"\n"
                            tokens.shift();
                            continue
                        }
                        if(isOp("**",tokens[0])) {
                            //*2 short
                            ENV.addVar(epar.value,"int")
                            out+="\tLHLD v_"+epar.value+"\n"
                            out+="\tDAD H\n"
                            out+="\tSHLD v_"+epar.value+"\n"
                            tokens.shift();
                            continue
                        }
                        if(isOp("+++",tokens[0])) {
                            //INC short
                            ENV.addVar(epar.value,"int")
                            out+="\tLHLD v_"+epar.value+"\n"
                            out+="\tINX H\n"
                            out+="\tINX H\n"
                            out+="\tSHLD v_"+epar.value+"\n"
                            tokens.shift();
                            continue
                        }
                        if(isOp("---",tokens[0])) {
                            //DEC short
                            ENV.addVar(epar.value,"int")
                            out+="\tLHLD v_"+epar.value+"\n"
                            out+="\tDCX H\n"
                            out+="\tDCX H\n"
                            out+="\tSHLD v_"+epar.value+"\n"
                            tokens.shift();
                            continue
                        }
                        console.log(tokens)
                        croak("LET syntax mismatch",line)
                    }
                    if (epar.type!=="assign") croak("LET should assign",line)
                    par = epar.left
    				if (par.type!="var" && par.type!="var[]" && par.type!="var$") croak("No variable name",line)
//                    next = tokens.shift();
//                    if (next.type!="op" || next.value!="=") croak("LET without an assignment",line)
                    if (par.type=="var$") {
                        ENV.addVar(par.value,"str")
                        ENV.addUse("__heap")
                        out+="\tlhld vs_"+par.value+"\n\tcall hp_unass\n"

                    }
//                    var ex = expr(tokens,line);
                    var ex = epar.right
                    var et = exprType(ex,line);
    				out+=exprAsm(ex,line,et);
    				if (par.type=="var") {
                        if (et!="int") croak("Cannot assign this to int variable",line)
                        ENV.addVar(par.value,"int")
    					out+="\tSHLD v_"+par.value+"\n";
    				} else if (par.type=="var[]") {
                        if (et!="int") croak("Cannot assign this to int variable",line)
                        if (!ENV.intarr[par.value])  croak("You have to DIM array first",line)
                        if (par.index.type=="num" && par.index.value>=ENV.intarr[par.value]) croak("Index out of bound",line)
                        ENV.addUse("s_check");
                        out += "\tPUSH H\n"
                        out+=exprAsm(par.index,line,et);
                        //out += "\tDAD H\n"
                        out += "\tLXI D,vai_"+par.value+"\n";
                        out += "\tLXI B,"+ENV.intarr[par.value]+"\n";
                        out += "\tCALL s_check\n";
                        //out += "\tDAD D\n"
                        out += "\tPOP D\n"
                        out += "\tMOV M,E\n"
                        out += "\tINX H\n"
                        out += "\tMOV M,D\n"
    					//out+="\tSHLD v_"+par.value+"\n";
    				} else if (par.type=="var$") {
                        if (et!="str") croak("Cannot assign this to string variable",line)
                        //heap test - old one
                        //out+="\tpush h\n\tlhld vs_"+par.value+"\n\tcall hp_test\n\tpop h\n"
                        out+="\tSHLD vs_"+par.value+"\n\tcall hp_assign\n";
                        out+="\tcall hp_gc\n"; //poor man optimalization - garbage on LET
    				}
                    continue;
                case "poke":
                    var ex = expr(tokens,line);
                    var et = exprType(ex,line);
                    next = tokens.shift();
                    if (next.type!="punc" || next.value!=",") croak("Syntax error",line)
                    var ex2 = expr(tokens,line);
                    var et2 = exprType(ex2,line);
                    if (ex2.type!="num") {
                        out+=exprAsm(ex2,line,et2);  
                        out+="\tpush h\n"
                    }
                    out+=exprAsm(ex,line,et);  
                    if (ex2.type!="num") {
                        out+="\tpop d\n"
                        out+="\tmov m,e\n"
                    } else {
                        out+="\tmvi m,"+(ex2.value % 256)+"\n"
                    }
                    continue
                case "dpoke":
                    var ex = expr(tokens,line);
                    var et = exprType(ex,line);
                    next = tokens.shift();
                    if (next.type!="punc" || next.value!=",") croak("Syntax error",line)
                    var ex2 = expr(tokens,line);
                    var et2 = exprType(ex2,line);
                    if (ex2.type!="num") {
                        out+=exprAsm(ex2,line,et2);  
                        out+="\tpush h\n"
                    }
                    out+=exprAsm(ex,line,et);  
                    if (ex2.type!="num") {
                        out+="\tpop d\n"
                        out+="\tmov m,e\n"
                        out+="\tinx h\n"
                        out+="\tmov m,d\n"
                    } else {
                        out+="\tmvi m,"+(ex2.value % 256)+"\n"
                        out+="\tinx h\n"
                        out+="\tmvi m,"+(ex2.value >> 8)+"\n"
                    }
                    continue

                
                case "for":
                    //out+="RP"+i+":\n";
    				par = tokens.shift();
    				if (par.type!="var") croak("No usable variable name",line)
    				next = tokens.shift();
    				if (next.type!="op" || next.value!="=") croak("FOR without an initial assignment",line)
                    var exi = expr(tokens,line);
                    var eti = exprType(exi,line);
                    next = tokens.shift();
    				if (next.type!="kw" || next.value!="to") croak("FOR without TO",line)

                    var limit = "ex"
                    var ex = expr(tokens,line);
                    var et = exprType(ex,line);
                    if (ex.type=="num") {
                        //step constant
                        limit = ex.value;
                    } else {
                        //step counted
                        out+=exprAsm(ex,line,et);  
                        out+="\tSHLD sv_forL"+i+"\n"; 
                        ENV.addVar("forL"+i,"sysdw")
                    }

                    //step variants
                    var step = 1

                    if (tokens.length) {
                        next = tokens.shift();
                        if (next.type!="kw" || next.value!="step") croak("Did you mean STEP?",line)
                        var ex = expr(tokens,line);
                        var et = exprType(ex,line);
                        if (ex.type=="num") {
                            //step constant
                            step = ex.value;
                        } else {
                            //step counted
                            out+=exprAsm(ex,line,et);  
                            out+="\tSHLD sv_forS"+i+"\n"; 
                            ENV.addVar("forS"+i,"sysdw")
                            step="ex"
                        }
                    }

                    //Initial value defined here
                    out+=exprAsm(exi,line,eti);  
                    ENV.addVar(par.value,"int")
                    out+="\tSHLD v_"+par.value+"\n";                        

                    out+="\tJMP FTCMD"+i+"\n"; 
                    out+="FLCMD"+i+":\n"; 
                                                      
                    loops.unshift(["CMD"+i,"F",i,par.value,step,limit]);
                    continue;
                case "next":
                    if (!loops.length) croak("NEXT without FOR",line)
                    if (loops[0][1]!="F") croak("Loops mismatched",line)
                    par = tokens.shift();
                    if (par.type!="var") croak("No usable variable name",line)
                    if (par.value!=loops[0][3]) croak("FOR / NEXT variable mismatch",line)
                    out+="FC"+loops[0][0]+":\n"
                    out+="\tLHLD v_"+par.value+"\n"
                    var step = loops[0][4];
                    if (step=="ex") {
                        out+="\tXCHG\n"
                        out+="\tLHLD sv_forS"+loops[0][2]+"\n"
                        out+="\tDAD D\n"
                    } else if (step==1) {
                        out+="\tINX H\n"
                    } else {
                        out+="\tLXI D,"+step+"\n"
                        out+="\tDAD D\n"
                    }
                    out+="\tSHLD v_"+par.value+"\n"
                    
                    out+="FT"+loops[0][0]+":\n" //test
                    var limit = loops[0][5];
                    if (limit=="ex") {
                        out+="\tXCHG\n"
                        out+="\tLHLD sv_forL"+loops[0][2]+"\n"
                    } else {
                        out+="\tLXI D,"+limit+"\n"
                    }
                    out+="\tMOV A,L\n"
                    out+="\tCMP E\n"
                    out+="\tJNZ FLCMD"+loops[0][2]+"\n"
                    out+="\tMOV A,H\n"
                    out+="\tCMP D\n"
                    out+="\tJNZ FLCMD"+loops[0][2]+"\n"
                    out+="FB"+loops[0][0]+":\n"

                    loops.shift()
                    continue
    			case "if":
                    var ex = expr(tokens,line,true);
                    var et = exprType(ex,line);
    				skipMark(i,basic)
					out+=exprAsm(ex,line,et);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ SKIP"+i+"\n";
    				continue;

                case "until":
                    if (!loops.length) croak("UNTIL without REPEAT",line)
                    if (loops[0][1]!="R") croak("UNTIL / REPEAT mismatched",line)
                    var ex = expr(tokens,line,true);
                    out+="RC"+loops[0][0]+":\n"
					out+=exprAsm(ex,line);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ "+loops[0][0]+"\n";
                    out+="RB"+loops[0][0]+":\n"
                    loops.shift()
    				continue;

                case "while":
                    loops.unshift(["CMD"+i,"W"])
                    var ex = expr(tokens,line,true);
                    out+="WC"+loops[0][0]+":\n"
					out+=exprAsm(ex,line);
    				out+="\tMOV A,H\n\tORA L\n";
    				out+="\tJZ WB"+loops[0][0]+"\n";
    				continue;
                    

                case "input":
                    var hasstr = false;
                    while(tokens.length) {
                        par = tokens[0]
                        if (isPunc("#",tokens[0])) {
                            //channel swap
                            var chan = expr(tokens,line,true);
                            out+=exprAsm(chan,line,"int");
                            ENV.addUse("inpchan")
                            out+="\tCALL inpchan\n"
                            if (!isPunc(",",tokens[0])) croak("Syntax error",line)
                            continue;
                        }
                        if (par.type=="var") {
                            //good, lets input a number
                            ENV.addUse("inputint")
                            out+="\tCALL inputint\n"
                            ENV.addVar(par.value,"int")
                            out+="\tSHLD v_"+par.value+"\n";
                            //consume remainder
                            tokens.shift();
                            if (!tokens.length) break; //the last one
                            if (!isPunc(",",tokens[0])) croak("Syntax error",line)
                            continue;
                        } else if (par.type=="var$") {
                            //good, lets input a string
                            ENV.addVar(par.value,"str")
                            out+="\tlhld vs_"+par.value+"\n\tcall hp_unass\n"
        
                            ENV.addUse("inputstr")
                            out+="\tCALL inputstr\n"
                            ENV.addUse("__heap")
                            hasstr = true
                            //heap test
                            //out+="\tpush h\n\tlhld vs_"+par.value+"\n\tcall hp_test\n\tpop h\n"
                            out+="\tSHLD vs_"+par.value+"\n\tcall hp_assign\n";
                            tokens.shift();
                            if (!tokens.length) break; //the last one
                            if (!isPunc(",",tokens[0])) croak("Syntax error",line)
                            tokens.shift();                            
                            continue;
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
                    if (hasstr) out+="\tcall hp_gc\n";
                    continue
    

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

    if (loops.length) croak ("Non-closed loops", line)

    var appendInput = false
    if(ENV.uses.indexOf("inputint")>=0) appendInput=true;
    if(ENV.uses.indexOf("inputstr")>=0) appendInput=true;


    //prepend
    if (ENV.uses.indexOf("__heap")>=0) {
        out = "\tCALL HP_INIT\n" + out;
    }

    out ="\tORG "+CFG.org+"\n\t.ent $\n\n" + out; //zahlavi

    //append
    out+="ERRGO:\t"+CFG.goback+"\n"; //error handling poor man

    //fndump
    out+=fnAsm();


    //strdump
    out+=";----DATA SEGMENT\n"
    out+=strAsm();

    //vardump
    out+=";----BSS SEGMENT\n"
    out+=varAsm();

    //append
    if (appendInput) {
        out += "i_buffer: ds 257\n";
    }


    out +="\n\nHEAP EQU $\nRAMTOP EQU "+CFG.ramtop+"\nds RAMTOP-$\n\n"; //zapati


    return out;
}