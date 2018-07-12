var BASIC = {
    "I8080": {
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

            sliceS: function(expr,line, ENV, exprAsm) {
                //console.log(expr)
                ENV.addUse("mkslice")
                var out="\tPUSH D\n\tPUSH H\n"
                out += exprAsm(expr.from,line,"int")
                out+="\tMOV C,L\n\tMOV B,H\n"
                out += exprAsm(expr.to,line,"int",true)
                //out+="\tXCHG\n"
                out+="\tPOP H\n"
                out+="\tCALL mkslice\n"
                out+="\tPOP D\n"
                return out
            },

            sliceSL: function(expr,line, ENV, exprAsm) {
                //console.log(expr)
                ENV.addUse("mkslice")
                var out="\tPUSH H\n"
                out += exprAsm(expr.from,line,"int")
                out+="\tMOV C,L\n\tMOV B,H\n"
                out += exprAsm(expr.to,line,"int",true)
                //out+="\tXCHG\n"
                out+="\tPOP H\n"
                out+="\tCALL mkslice\n"
                out+="\tXCHG\n"
                return out
            },

            userfn: function(expr,line,ENV,exprAsm,target) {
                var out = "\tPUSH D\n";
                out += exprAsm(expr.operands[1],line,"int")
                if(expr.operands.length==3) {
                    out += exprAsm(expr.operands[2],line,"int",true)
                }
                out+="\tCALL CMD"+target+"\n"
                out += "\tPOP D\n";
                return out;
            },
            userfnL: function(expr,line,ENV,exprAsm,target) {
                var out = "\tPUSH H\n";
                out += exprAsm(expr.operands[1],line,"int")
                if(expr.operands.length==3) {
                    out += exprAsm(expr.operands[2],line,"int",true)
                }
                out+="\tCALL CMD"+target+"\n"
                out += "\tPOP D\n\tXCHG\n";
                return out;
            },

            fn: function(expr,line,ENV, exprAsm, LIB) {
                var out="";
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
                if (LIB["f_"+expr.value].inline) {
                    out+=LIB["f_"+expr.value].code
                    return out;
                }
                out += "\tCALL f_"+expr.value+"\n"
                return out;
            },
            fnL: function(expr,line,ENV, exprAsm,LIB) {
                var out=";[*DD*]\n";
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
                if (LIB["f_"+expr.value].inline) {
                    out+=LIB["f_"+expr.value].code
                    return out+"\tXCHG\n";
                }
                out += "\tCALL f_"+expr.value+"\n\tXCHG\n"
                return out;
            },

            //shortcuts for some binary expressions e.g. +1,+2,-1,*2,...
            shortcuts: function(expr,line,etype,ENV, exprAsm) {
                var out="";
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
                var out=""
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
                if (!LIB[opfn]) croak("Not implemented operator "+opfn,line)
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

        },

        asm:{
            jmp: function(target) {
                return "\tJMP "+target+"\n"
            },
            jmpNZ: function(target) {
                return "\tJNZ "+target+"\n"
            },
            jmpZ: function(target) {
                return "\tJZ "+target+"\n"
            },
            jmpEx0: function(target) {
                return "\tMOV A,H\n\tORA L\n\tJZ "+target+"\n"
            },
            docall: function(target) {
                return "\tCALL "+target+"\n"
            },
            ret: function() {
                return "\tRET\n"
            },
            end: function() {
                return "\tRST 0\n"
            },
            dopush: function() {
                return "\tPUSH H\n"
            },
            dopop: function() {
                return "\tPOP H\n"
            },
            stackSwap: function() {
                return "\tXTHL\n"
            },
            swap: function() {
                return "\tXCHG\n"
            },
            varplus1: function(name) {
                return "\tLHLD v_"+name+"\n\tINX H\n\tSHLD v_"+name+"\n"
            },
            varminus1: function(name) {
                return "\tLHLD v_"+name+"\n\tDCX H\n\tSHLD v_"+name+"\n"
            },
            varplus2: function(name) {
                return "\tLHLD v_"+name+"\n\tINX H\n\tINX H\n\tSHLD v_"+name+"\n"
            },
            varminus2: function(name) {
                return "\tLHLD v_"+name+"\n\tDCX H\n\tDCX H\n\tSHLD v_"+name+"\n"
            },
            vartimes2: function(name) {
                return "\tLHLD v_"+name+"\n\tDAD H\n\tSHLD v_"+name+"\n"
            },

            storeInt: function(name) {
                return "\tSHLD v_"+name+"\n"
            },
            storeStr: function(name) {
                return "\tSHLD vs_"+name+"\n\tCALL hp_assign\n\tcall hp_gc\n"
            },

            storeSlice: function(name,expr,line, ENV, exprAsm) {
                //console.log(expr)
                ENV.addUse("stslice")
                ENV.addUse("strclone")
                ENV.addUse("stcpy")
                var out="\tPUSH H\n"
                out+="\tLHLD vs_"+name+"\n"
                out+="\tCALL strclone\n" //kopie řetězce v prac. oblasti
                out+="\tSHLD vs_"+name+"\n\tPUSH H\n\tCALL hp_assign\n\tcall hp_gc\n"
                //ještě to přepsat
                out+=""
                out += exprAsm(expr.from,line,"int")
                out+="\tMOV C,L\n\tMOV B,H\n"
                out += exprAsm(expr.to,line,"int",true)
                out+="\tPOP H\n"
                out+="\tCALL stslice\n" //v HL bude adresa, kam kopírovat
                out+="\tPOP D\n" //co kopírovat
                out+="\tCALL stcpy\n" //max BC

                return out
            },   

            storeStrNoGC: function(name) {
                return "\tSHLD vs_"+name+"\n\tCALL hp_assign\n"
            },
            storeA: function(par,line,et, ENV, exprAsm) {
                var out="";
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
                return out;
            },

            storeAI: function(name,index) {
                if (index) {
                    return "\tSHLD vai_"+name+"+"+(index*2)+"\n";
                } else {
                    return "\tSHLD vai_"+name+"\n";
                }
            },
            storeAnyInt: function(name) {
                return "\tSHLD "+name+"\n"
            },

            ioOut: function(addr,addrT,value,valueT,exprAsm,line, ENV) {
                var out=""
                if (addr.type=="num") {
                    //constant out
                    out+=exprAsm(value,line,valueT);  //value is not a constant
                    out+="\tMOV A,L\n"
                    out+="\tOUT "+addr.value+"\n"
                    return out;
                }
                ENV.addVar("iofix","sysdq")

                out+="\tLXI H,00d3h\n"
                out+="\tSHLD sv_iofix\n"
                out+="\tMVI L,c9h\n"
                out+="\tSHLD sv_iofix+2\n"

                out+=exprAsm(addr,line,addrT);  
                out+="\tMOV A,L\n"
                out+="\tSTA sv_iofix+1\n"


                out+=exprAsm(value,line,valueT);  //value is not a constant
                out+="\tMOV A,L\n"
                out+="\tCALL sv_iofix\n"


                return out;
            },

            poke: function(addr,addrT,value,valueT,exprAsm,line) {
                var out=""
                if (value.type!="num") {
                    out+=exprAsm(value,line,valueT);  //value is not a constant
                    out+="\tpush h\n"
                }
                out+=exprAsm(addr,line,addrT);  
                if (value.type!="num") {
                    out+="\tpop d\n"
                    out+="\tmov m,e\n"
                } else {
                    out+="\tmvi m,"+(value.value % 256)+"\n"
                }
                return out;
            },

            dpoke: function(addr,addrT,value,valueT,exprAsm,line) {
                var out=""
                if(addr.type=="num") {
                    //constant address
                    out+=exprAsm(value,line,valueT);
                    out+="\tSHLD "+addr.value+"\n"
                    return out;
                }
                if (value.type!="num") {
                    out+=exprAsm(value,line,valueT);  //value is not a constant
                    out+="\tpush h\n"
                }
                out+=exprAsm(addr,line,addrT);  
                if (value.type!="num") {
                    out+="\tpop d\n"
                    out+="\tmov m,e\n"
                    out+="\tinx h\n"
                    out+="\tmov m,d\n"
                } else {
                    out+="\tmvi m,"+(value.value % 256)+"\n"
                    out+="\tinx h\n"
                    out+="\tmvi m,"+(value.value >> 8)+"\n"
                }
                return out;
            },

            _forstep: function(loops) {
                var out = "";
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
                return out    
            },
            _fortest: function(loops) {
                var out = "";
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
      
                return out    
            },

            ongoto: function(list) {
                var out = ""
                out += "\tinr l\n"
                while(list.length) {
                    out += "\tdcr l\n"
                    out += "\tjz CMD"+list[0]+"\n"
                    list.shift();
                }
                return out
            },
            ongosub: function(list,i) {
                var out = ""
                out += "\tlxi h,onsub_"+i+"\n"
                out += "\tpush h\n"
                out += "\tinr l\n"
                while(list.length) {
                    out += "\tdcr l\n"
                    out += "\tjz CMD"+list[0]+"\n"
                    list.shift();
                }
                out += "\tpop h\n"
                out += "onsub_"+i+":\n"
                return out
            },


            strUnassign: function(name) {
                return "\tLHLD vs_"+name+"\n\tCALL hp_unass\n"
            },

        }
    }
}
