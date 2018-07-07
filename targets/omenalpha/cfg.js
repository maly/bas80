var CONFIG = {
    "OMENALPHA": {
        org:"8000h",
        ramtop:"0f800h",
        goback:"RST 0",
        xp: {
                //CPU helpers
            // ;[*DD*]\n - D dirty flag
            _dirty:function(asm) {
                return asm.indexOf("[*DD*]">=0)
            },
            _exprAsm:function(that,exprAsm,expr,line,etype,left){
                var out = exprAsm(expr,line,etype,left)
                if (out.indexOf("[*DD*]")<0) {return out;}
                //dirty, so push/pop is needed
                out=out.replace(";[*DD*]\n","")
                out = "\tPUSH D\n"+out+"\tPOP D\n";
                return out;
            },
            num: function(expr,line) {
                return "\tLXI H,"+expr.value+"\n"
            },
            numL: function(expr,line) {
                return ";[*DD*]\n\tLXI D,"+expr.value+"\n"
            },
            str: function(expr,line,cs) {
                return "\tLXI H,cs_"+cs+"\t;"+expr.value+"\n"
            },
            strL: function(expr,line) {
                return ";[*DD*]\n\tLXI D,"+expr.value+"\n"
            },
            var: function(expr,line) {
                return "\tLHLD v_"+expr.value+"\n"
            },
            varL: function(expr,line) {
                return ";[*DD*]\n\tXCHG\n\tLHLD v_"+expr.value+"\n\tXCHG\n"
            },
            varS: function(expr,line) {
                return "\tLHLD vs_"+expr.value+"\n"
            },
            varSL: function(expr,line) {
                return ";[*DD*]\n\tXCHG\n\tLHLD vs_"+expr.value+"\n\tXCHG\n"
            },

            //get value for array element, indexed by an expression
            varA: function(expr,line, ENV, exprAsm) {
                ENV.addUse("s_check");
                var out = ";[*DD*]\n"+exprAsm(expr.index,line,"int")
                out += "\tLXI D,vai_"+expr.value+"\n"
                out += "\tLXI B,"+ENV.intarr[expr.value]+"\n";
                out += "\tCALL s_check\n";
                out += "\tMOV E,M\n\tINX H\n\tMOV D,M\n\tXCHG\n"
                return out
            },

            //get value for array element, indexed by constant
            varAI: function(expr,line) {
                if (expr.index.value) {
                    return "\tLHLD vai_"+expr.value+"+"+(expr.index.value*2)+"\n";
                } else {
                    return "\tLHLD vai_"+expr.value+"\n";
                }
            },

            //get value for array element, indexed by an expression
            varAL: function(expr,line, ENV, exprAsm) {
                ENV.addUse("s_check");
                var out = "\tPUSH H\n"+exprAsm(expr.index,line,"int")
                out += "\tLXI D,vai_"+expr.value+"\n"
                out += "\tLXI B,"+ENV.intarr[expr.value]+"\n";
                out += "\tCALL s_check\n";
                out += "\tMOV E,M\n\tINX H\n\tMOV D,M\n\tPOP H\n"
                return out
            },

            //get value for array element, indexed by constant
            varAIL: function(expr,line) {
                if (expr.index.value) {
                    return ";[*DD*]\n\tXCHG\n\tLHLD vai_"+expr.value+"+"+(expr.index.value*2)+"\n\tXCHG\n";
                } else {
                    return ";[*DD*]\n\tXCHG\n\tLHLD vai_"+expr.value+"\n\tXCHG\n";
                }
            },

            fn: function(expr,line,ENV, exprAsm) {
                out="";
                if (expr.operands.length==1) {
                    out += exprAsm(expr.operands[0])
                } else if (expr.operands.length==2) {
                    out += exprAsm(expr.operands[0],true)
                    out += exprAsm(expr.operands[1])
                } else
                for(var i=0;i<expr.operands.length;i++) {
                    out += exprAsm(expr.operands[i])+"\tPUSH H\n"
                }
                ENV.addUse("f_"+expr.value);
                out += "\tCALL f_"+expr.value+"\n"
                return out;
            },
            fnL: function(expr,line,ENV, exprAsm) {
                out=";[*DD*]\n";
                if (expr.operands.length==1) {
                    out += exprAsm(expr.operands[0])
                } else if (expr.operands.length==2) {
                    out += exprAsm(expr.operands[0],true)
                    out += exprAsm(expr.operands[1])
                } else
                for(var i=0;i<expr.operands.length;i++) {
                    out += exprAsm(expr.operands[i])+"\tPUSH H\n"
                }
                ENV.addUse("f_"+expr.value);
                out += "\tCALL f_"+expr.value+"\n\tXCHG\n"
                return out;
            },

            //shortcuts for some binary expressions e.g. +1,+2,-1,*2,...
            shortcuts: function(expr,line,etype,ENV, exprAsm) {
                if (expr.right.type=="num" && expr.right.value==1 && expr.operator=="+") {
                    out = exprAsm(expr.left,line,etype)+"\tINX H\n"
                    return out
                }
                if (expr.left.type=="num" && expr.left.value==1 && expr.operator=="+") {
                    out = exprAsm(expr.right,line,etype)+"\tINX H\n"
                    return out
                }
                if (expr.right.type=="num" && expr.right.value==1 && expr.operator=="-") {
                    out = exprAsm(expr.left,line,etype)+"\tDCX H\n"
                    return out
                }
                if (expr.right.type=="num" && expr.right.value==2 && expr.operator=="*") {
                    out = exprAsm(expr.left,line,etype)+"\tDAD H\n"
                    return out
                }
                if (expr.right.type=="num" && expr.right.value==4 && expr.operator=="*") {
                    out = exprAsm(expr.left,line,etype)+"\tDAD H\n\tDAD H\n"
                    return out
                }   
                return false;             
            },

            binary: function(expr,line,etype,ENV,exprAsm,LIB) {
                if (expr.left.type=="num" && expr.right.type=="binary") {
                    out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
                } else if (expr.left.type=="num" && expr.right.type=="fn") {
                    out = exprAsm(expr.right,line,etype)+exprAsm(expr.left,line,etype,true)
                } else {
                    //console.log(expr.operator,expr.left,expr.right)
                    out = exprAsm(expr.left,line,etype,true)+this._exprAsm(this,exprAsm,expr.right,line,etype)
                    out = out.replace(";[*DD*]\n",""); //Maybe?
                }
                var opfn = "o_"+opAsm(expr.operator,line,etype);
                if (LIB[opfn].inline) {
                    out+=LIB[opfn].code
                    return out;
                }
                ENV.addUse(opfn);
                out += "\tCALL "+opfn+"\n"
                return out;
            },
            binaryL:function(expr,line,etype,ENV,exprAsm,LIB) {
                //console.log(this)
                return this.binary(expr,line,etype,ENV,exprAsm,LIB) + "\tXCHG\n"
            }

        }
    }
}