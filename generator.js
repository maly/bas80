
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
        if (!basic[i]) return null
      var thisLine = basic[i]._numline;
      while(i<basic.length) {
            i++;
            if (!basic[i]) return null
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
      ln.error = msg;
      throw new Error(JSON.stringify(ln));
      //throw new Error(msg + " ("+ln._numline+":"+ln._cmd+")", ln);
    }








    var opAsm = function(op,line,etype) {
        if (etype=="str") {
            switch(op) {
                case "+": return "concat"
                case "=": return "streq"
            }
            croak("Invalid string operator",line)
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

            case "&": return "bitand"
            case "|": return "bitor"
            case "^": return "bitxor"

            case "and": return "and"

        }
        return null
    }

    var varAsm = function() {
        var out = ""
        var k;
        var type,size;
        for(k in ENV.vars) {
            type = ENV.vars[k];
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
                case "sysdq":
                    out +="sv_"+name+":\t DS 4\n";
                    continue
            }
        }
        for(k in ENV.intarr) {
            size = ENV.intarr[k];
            out +="vai_"+k+":\t DS "+(2*size)+"\n";
        }
        for(k in ENV.staticstructs) {
          type = ENV.staticstructs[k];
          var metas = ENV.structs[type];
          size = metas[metas.length-1].offset
          out +="vss_"+k+":\t DS "+(size)+"\n";
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

/* global LIB */
/* embedding into main ASM */
    var fnAsm = function(oldAsm) {
        var out = "";
        var fname,i;
        fname = ENV.uses.shift()
        while(fname) {
          console.log(fname, ENV.usesCount[fname], ENV.callCount[fname])
            var fn = LIB[fname]
            if (!fn) throw new Error("Cannot link "+fname)

            if (fn.sysdb) {
                for(i=0;i<fn.sysdb.length;i++){
                    ENV.addVar(fn.sysdb[i],"sysdb")
                }
            }
            if (fn.sysdw) {
                for(i=0;i<fn.sysdw.length;i++){
                    ENV.addVar(fn.sysdw[i],"sysdw")
                }
            }
            if (fn.sysdq) {
                for(i=0;i<fn.sysdq.length;i++){
                    ENV.addVar(fn.sysdq[i],"sysdq")
                }
            }

            if (fn.inlinable && ENV.callCount[fname]==1) {
              //hledat CALL
              //console.log(fname)

              oldAsm = oldAsm.replace("CALL "+fname,
                ";---"+fname+" INLINED ---\n"+
                fname+":\n"+
                fn.code.replace("RET\n","; RET disabled\n\t; RET\n")+
                ";---"+fname+"-end---\n\n"
              )
              fname = ENV.uses.shift()
              continue;
            }

            out+=";---"+fname+"---\n"
            out+=fname+":\n"
            out += fn.code
            out+=";---"+fname+"-end---\n\n"

            fname = ENV.uses.shift()
        }
        return oldAsm + out;

    }






var ENV= {
    vars:{},
    addVar:function(name,type) {
        ENV.vars[name+"_"+type] = type
    },
    fns:{},
    addFn:function(name) {
        name=name.toLowerCase()
        ENV.fns[name] = name
    },
    procs:{},
    addProc:function(name) {
        name=name.toLowerCase()
        ENV.procs[name] = name
    },
    structs:{},
    addStruct:function(name,value) {
        name=name.toLowerCase()
        ENV.structs[name] = value
    },
    intarr:{},
    addArrInt:function(name,limit) {
        ENV.intarr[name] = limit
    },
    staticstructs:{},
    addStaticStruct:function(name,type) {
        ENV.staticstructs[name] = type
    },
    strs:[],
    addStr:function(s) {
        if (ENV.strs.indexOf(s)<0) ENV.strs.push(s)
        return ENV.strs.indexOf(s)
    },
    datas:[],
    datalabels:[],
    addData:function(s,label) {
        if (label) {
            ENV.datas.push("dt_"+label+":\n");
            ENV.datalabels.push(label)
        }
        ENV.datas.push("\t DW "+s+"\n")
    },
    addDataB:function(s,label) {
      if (label) {
          ENV.datas.push("dt_"+label+":\n");
          ENV.datalabels.push(label)
      }
      ENV.datas.push("\t DB "+s+"\n")
    },
    syslabels:{},
    lDef: function(label) {
      if (!ENV.syslabels[label]) ENV.syslabels[label]=0;
    },
    lUse: function(label) {
      ENV.syslabels[label]=1;
    },
    uses:[],
    usesCount:{},
    callCount:{},
    called: function(s) {
      //console.log("callcount",s)
      ENV.callCount[s]++
    },
    addUse:function(s) {
        if (ENV.uses.indexOf(s)<0) {
            ENV.uses.push(s)
            var fn = LIB[s]
            if (!fn) throw new Error("Cannot link "+s)
            ENV.usesCount[s] = 1;
            ENV.callCount[s] = 0;
            if (fn.uses) {
                for (var i=0;i<fn.uses.length;i++) {
                    var use = fn.uses[i]
                    ENV.addUse(use)
                }
            }
        } else {
          ENV.usesCount[s]++;
        }
        return ENV.uses.indexOf(s)
    }
};

var generator = function(basic, CFG, PROC) {

    ENV.vars={}
    ENV.strs=[]
    ENV.uses=[]
    ENV.fns={}
    ENV.procs={}
    ENV.structs={}
    ENV.staticstructs={}
    ENV.datas=[]
    ENV.datalabels=[]
    ENV.syslabels={}

    var k;

    //library uses some system routines
    //so copy them there
    for (k in CFG.system) {
        LIB[k]=CFG.system[k]
    }

    //Copy BASIC snippets, if needed
    for (k in PROC.xp) {
        if (!CFG.xp[k]) {
            CFG.xp[k] = PROC.xp[k]
        }
    }
    for (k in PROC.asm) {
        if (!CFG.asm[k]) {
            CFG.asm[k] = PROC.asm[k]
        }
    }

    var getStructItemOffset = function (varName,varIndex,line){
      var structName = ENV.staticstructs[varName];
      if (!structName) croak("Not a static struct",line)
      var struct = ENV.structs[structName];
      if (!struct) croak("Structure not defined",line)
      if (varIndex=="") return {offset:0};
      var el = struct.filter(function(v){return v.name==varIndex})
      if (!el) croak("Struct member not defined",line)
      return el[0]
    }

    var getStructMember = function(struct,member) {
      if (struct) {
        return ENV.structs[struct].filter(function(v){return v.name==member})
      }
      //struct name not given
      var gsm = null;
      for(var sn in ENV.structs) {
        var el = getStructMember(sn,member);
        //console.log(el)
        if (!el || el.length===0) continue;
        if (gsm) croak("Cannot decide which struct should be used for "+member,line)
        gsm=el;
      }
      return gsm;
    }
    //CFG.ENV = ENV
    var exprAsm = function(expr,line,etype,left) {
      var cs, member, el;

        if (typeof etype=="undefined") etype="int";
        if (typeof left=="undefined") left=false;
        var type = expr.type;
        if (type=="num" && !left) {
            return CFG.xp.num(expr,line)
        }
        if (type=="str" && !left) {
            cs=ENV.addStr(expr.value);
            return CFG.xp.str(expr,line,cs);
        }
        if (type=="num" && left) {
            return CFG.xp.numL(expr,line)
        }
        if (type=="str" && left) {
            cs=ENV.addStr(expr.value);
            return CFG.xp.strL(expr,line,cs);
        }
        if (type=="var" && !left) {
            ENV.addVar(expr.value,"int")
            return CFG.xp.var(expr,line)
        }
        if (type=="var." && !left) {
          if (!ENV.staticstructs[expr.value])  croak("You have to DIM structure first",line)
          return CFG.xp.varStruct(expr,line,ENV,croak)
        }
        if (type=="var." && left) {
          if (!ENV.staticstructs[expr.value])  croak("You have to DIM structure first",line)
          return CFG.xp.varStructL(expr,line,ENV,croak)
        }
        if (type=="var{}" && !left) {
          member = getStructMember(expr.struct,expr.member)
          if (!member) croak("Invalid struct pointer",line)
          el=member[0]
          return CFG.xp.varStructPointer(expr,el,line,ENV,croak)
        }
        if (type=="var{}" && left) {
          member = getStructMember(expr.struct,expr.member)
          if (!member) croak("Invalid struct pointer",line)
          el=member[0]
          return CFG.xp.varStructPointerL(expr,el,line,ENV,croak)
        }
        if (type=="var" && left) {
            ENV.addVar(expr.value,"int")
            return CFG.xp.varL(expr,line)
        }
        if (type=="ptr" && !left) {
          //console.log(expr)
            if (expr.ex.type=="str") {
                cs=ENV.addStr(expr.value);
                return CFG.xp.str(expr,line,cs);
            }
            if (expr.ex.type=="var[]") {
                if (!ENV.intarr[expr.value])  croak("You have to DIM array first",line)
                if (expr.ex.index.type=="num" && expr.ex.index.value>=ENV.intarr[expr.value]) croak("Index out of bound",line)
                if (expr.ex.index.type=="num") {
                    //precompute
                    return CFG.xp.varAIIndirect(expr,line)
                }
                return CFG.xp.varAIndirect(expr,line,ENV, exprAsm);
            }
            //console.log(expr.ex)
            if (expr.ex.type=="var.") {
             // console.log(expr.ex)
              el= getStructItemOffset(expr.ex.value,expr.ex.index,line)
              return CFG.xp.varIndirect(expr,line,el.offset);
            }
            if (expr.ex.type=="var") {
              ENV.addVar(expr.value,expr.varType)
              return CFG.xp.varIndirect(expr,line)
            }
        }
        if (type=="ptr" && left) {
            if (expr.ex.type=="str") {
                cs=ENV.addStr(expr.value);
                return CFG.xp.strL(expr,line,cs);
            }
            if (expr.ex.type=="var[]") {
                if (!ENV.intarr[expr.value])  croak("You have to DIM array first",line)
                if (expr.ex.index.type=="num" && expr.ex.index.value>=ENV.intarr[expr.value]) croak("Index out of bound",line)
                if (expr.ex.index.type=="num") {
                    //precompute
                    return CFG.xp.varAIIndirectL(expr,line)
                }
                return CFG.xp.varAIndirectL(expr,line,ENV, exprAsm);
            }

            ENV.addVar(expr.value,expr.varType)
            return CFG.xp.varIndirectL(expr,line)
        }

        if (type=="var$" && !left) {
            ENV.addVar(expr.value,"str")
            return CFG.xp.varS(expr,line)
        }
        if (type=="slice$" && !left) {
            ENV.addVar(expr.value,"str")
            return CFG.xp.varS(expr,line)+CFG.xp.sliceS(expr,line, ENV, exprAsm)
        }
        if (type=="slice$" && left) {
            ENV.addVar(expr.value,"str")
            return CFG.xp.varS(expr,line)+CFG.xp.sliceSL(expr,line, ENV, exprAsm)
        }
        if (type=="var$" && left) {
            ENV.addVar(expr.value,"str")
            return CFG.xp.varSL(expr,line)
        }
        if (type=="var[]") {
            if (!ENV.intarr[expr.value])  croak("You have to DIM array first",line)
            if (expr.index.type=="num" && expr.index.value>=ENV.intarr[expr.value]) croak("Index out of bound",line)

        }
        if (type=="var[]" && !left) {
            if (expr.index.type=="num") {
                //precompute
                return CFG.xp.varAI(expr,line)
            }
            return CFG.xp.varA(expr,line,ENV, exprAsm);
        }
        if (type=="var[]" && left) {
            if (expr.index.type=="num") {
                //precompute
                return CFG.xp.varAIL(expr,line)
            }
            return CFG.xp.varAL(expr,line,ENV, exprAsm);
        }
        if (type=="binary") {
            //spec ops, optimalised
            var shortcut = CFG.xp.shortcuts(expr,line,etype, ENV, exprAsm);
            if (shortcut) {return shortcut}

            if (left) return CFG.xp.binaryL(expr,line,etype,ENV,exprAsm,opAsm,croak,LIB)
            return CFG.xp.binary(expr,line,etype,ENV,exprAsm,opAsm,croak,LIB)

        }

        var call,target;

        if (type=="fn" && !left) {
            //console.log("E",LIB)
            //special call
            if (expr.value == "fn") {
                call = expr.operands[0]
                target = findLabel(call.value,ENV.labels);
                if (target===null) croak("Target line not found",line)
               return CFG.xp.userfn(expr,line,ENV,exprAsm, target)
            }
            if(expr.value=="lptr") {
              target = findLabel(expr.operands[0].value,labels)
              if (!target) croak("LPTR needs a valid line label",line)
              ENV.lUse("CMD"+target)
              return CFG.xp.num({type:"num",value:"CMD"+target},line)
            }
            if(expr.value=="dptr") {
              target = findLabel(expr.operands[0].value,labels)
              if (!target) croak("DPTR needs a valid line label",line)
              return CFG.xp.num({type:"num",value:"dt_"+expr.operands[0].value},line)
            }
            return CFG.xp.fn(expr,line,ENV,exprAsm, LIB);
        }
        if (type=="fn" && left) {

            if (expr.value == "fn") {
                call = expr.operands[0]
                //console.log(call.value,ENV.labels)
                target = findLabel(call.value,ENV.labels);
                if (target===null) croak("Target line not found",line)
               return CFG.xp.userfnL(expr,line,ENV,exprAsm, target)
            }
            if(expr.value=="lptr") {
              target = findLabel(expr.operands[0].value,labels)
              if (!target) croak("LPTR needs a valid line label",line)
              ENV.lUse("CMD"+target)
              return CFG.xp.numL({type:"num",value:"CMD"+target},line)
            }
            if(expr.value=="dptr") {
              target = findLabel(expr.operands[0].value,labels)
              if (!target) croak("DPTR needs a valid line label",line)
              return CFG.xp.numL({type:"num",value:"dt_"+expr.operands[0].value},line)
            }
            return CFG.xp.fnL(expr,line,ENV,exprAsm, LIB);
        }
        croak("Cannot evaluate "+JSON.stringify(expr),line)
        return null
    }

//----------------------------------------------------

    var isPunc = function(punc) {
        if (!tokens.length) return false
        if (tokens[0].type!="punc") return false
        if (tokens[0].value!=punc) return false
        tokens.shift()
        return true;
    }
    var isOp = function(op) {
        if (!tokens.length) return false
        if (tokens[0].type!="op") return false
        if (tokens[0].value!=op) return false
        tokens.shift()
        return true;
    }
    var isKw = function(kw) {
        if (!tokens.length) return false
        if (tokens[0].type!="kw") return false
        if (tokens[0].value!=kw) return false
        tokens.shift()
        return true;
    }
    var isVar = function() {
        if (!tokens.length) return false
        if (tokens[0].type!="var") return false
        return tokens.shift();
    }
    var isVarVarS = function() {
        if (!tokens.length) return false
        if (tokens[0].type!="var" && tokens[0].type!="var$") return false
        return tokens.shift();
    }

    var out="";
    out+=";----CODE SEGMENT (ROMable)\n"
    var labels = labelIndex(basic);
    ENV.labels = labels;
    var loops=[];
    var ifskip = [];
    var ifMultiline = [];
    var target;

    var ex,et,ex2,et2,pex;

    var list,epar;

    var hasstr,chan;

    var label,cast;

    /* global expr, exprType */
    for(var i=0;i<basic.length;i++) {
      var par,next;
      var line = basic[i];
      basic[i]._index = i;
      out+="CMD"+i+":\n"
      ENV.lDef("CMD"+i);
      if (line._skip) {
            while (ifskip.length) {
                out+="ELSKIP"+ifskip[0]+":\n"
                ifskip.shift()
            }
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
                    target = findLabel(par.value,labels);
                    if (target===null) croak("Target line not found",line)
                    ENV.lUse("CMD"+target)
                    out+=CFG.asm.jmp("CMD"+target);
            break;
          case "gosub":
                    par = tokens.shift();
                    target = findLabel(par.value,labels);
                    if (target===null) croak("Target line not found",line)
                    ENV.lUse("CMD"+target)
                    out+=CFG.asm.docall("CMD"+target, ENV)
            break;
          case "return":
                    if (tokens.length) {
                        //return expr.
                        ex = expr(tokens,line)
                        et = exprType(ex,line);
                        out+=exprAsm(ex,line,et);
                        //pops?
                        if (isPunc(";")){
                            out+=CFG.asm.swap()
                            while(tokens.length) {
                                ex = isVar()
                                if (!ex) croak("POP needs a variable name",line)
                                ENV.addVar(ex.value,"int")
                                out+=CFG.asm.dopop();
                                out+=CFG.asm.storeInt(ex.value,line)
                                if (!tokens.length) continue;
                                if (!isPunc(",")) croak("Separate names with a comma",line)
                            }
                            out+=CFG.asm.swap()
                        }
                    }
            out+=CFG.asm.ret();
            break;
                case "end":
                    out+=CFG.asm.end();
                    break;
                case "stop":
                    ENV.addUse("errstop");
                    out+=CFG.asm.jmp("ERRSTOP");
            break;
                case "repeat":
                    loops.unshift(["CMD"+i,"R"]);
                    break;
                case "endwhile":
                case "wend":
                    if (!loops.length) croak("ENDWHILE without WHILE",line)
                    if (loops[0][1]!="W") croak("WHILE / ENDWHILE mismatched",line)
                    out+=CFG.asm.jmp(loops[0][0]);
                    out+="WB"+loops[0][0]+":\n"
                    loops.shift()
                    break;
                case "break":
                    if (!loops.length) croak("BREAK outside the loop",line);
                    out+=CFG.asm.jmp(loops[0][1]+"B"+loops[0][0]);
                    break;
                case "continue":
                    if (!loops.length) croak("CONTINUE outside the loop",line);
                    out+=CFG.asm.jmp(loops[0][1]+"C"+loops[0][0]);
                    break;
                case "dim":
                    epar = expr(tokens,line)
                    if (epar.type=="var" && ENV.structs[epar.value]!==undefined) {
                      while(tokens.length) {
                        ENV.addStaticStruct(tokens.shift().value,epar.value)
                        if (!tokens.length) break;
                        if (!isPunc(",")) croak("Separate variables by comma",line)
                      }
                      break;
                    }
                    if (epar.type!="var[]") croak("DIM needs a variable name",line);
                    if (epar.index.type!="num") croak("DIM needs a constant size",line);
                    ENV.addArrInt(epar.value,epar.index.value)
                    break;

                case "alloc":
                    epar = expr(tokens,line)
                    if (epar.type=="var" && ENV.structs[epar.value]!==undefined) {
                      var sx = ENV.structs[epar.value];
                      var slen = sx[sx.length-1].offset;
                      ENV.addUse("__heap")
                      while(tokens.length) {
                        //ENV.addStaticStruct(tokens.shift().value,epar.value)
                        out+=CFG.asm.malloc(slen)
                        ex = tokens.shift();
                        //console.log("Alloc",epar.value,)
                        ENV.addVar(ex.value,"int")
                        out+=CFG.asm.storeInt(ex.value,line)
                        if (!tokens.length) break;
                        if (!isPunc(",")) croak("Separate variables by comma",line)
                      }
                      break;
                    }
                    else croak("ALLOC needs a struct name",line);

                    break;
                case "free":
                    while (tokens.length) {
                      ex = tokens.shift()
                      out += exprAsm(ex,line,"int")
                      // free
                      out += CFG.asm.free();
                      if (!tokens.length) break;
                      if (!isPunc(",")) croak("Separate variables by comma",line)
                    }
                    out+=CFG.asm.docall("hp_gc", ENV)
                    break;
                case "data":
                    label = line.label
                    par = tokens.shift()
                    while(par) {
                      if (par.type=="num") {
                          //console.log(par.value,label)
                          ENV.addData(par.value,label)
                          if(!isPunc(",")) break
                      } else if (par.type=="str") {
                          //console.log(par.value,label)
                          ENV.addData("cs_"+ENV.addStr(par.value),label)
                          if(!isPunc(",")) break
                      } else {
                          croak("Invalid data",line)
                      }
                      label = null;
                      par = tokens.shift()
                    }
                    break;
                case "byte":
                    label = line.label
                    par = tokens.shift()
                    while(par) {
                      if (par.type=="num") {
                          //console.log(par.value,label)
                          ENV.addDataB(par.value,label)
                          if(!isPunc(",")) break
                      } else {
                          croak("Invalid data",line)
                      }
                      label = null;
                      par = tokens.shift()
                    }
                    break;
                case "restore":
                    if (tokens.length) {
                        ENV.addUse("s_lut")
                        ENV.addUse("errnodata")
                        ex = expr(tokens,line);
                        et = exprType(ex,line);
                        out+=exprAsm(ex,line,et)
                        out+=CFG.asm.docall("s_lut", ENV)
                        out+=CFG.asm.jmpZ("errnodata");
                        out+=CFG.asm.storeAnyInt("datapoint")
                        break;
                    }
                    out+=CFG.xp.num({value:"databegin"},line)
                    out+=CFG.asm.storeAnyInt("datapoint")

                    break;

                case "read":
                    ENV.addUse("s_read")
                    while(tokens.length) {
                        ex = isVarVarS()
                        if (!ex) croak("READ needs a variable name",line)
                        if (ex.type=="var") {
                            ENV.addVar(ex.value,"int")
                            out+=CFG.asm.docall("s_read", ENV)
                            out+=CFG.asm.storeInt(ex.value,line)
                        } else {
                            //read string
                            ENV.addUse("__heap")
                            ENV.addVar(ex.value,"int")
                            out+=CFG.asm.strUnassign(ex.value)
                            out+=CFG.asm.docall("s_read", ENV)
                            out+=CFG.asm.storeStr(ex.value,line)
                        }
                        if (!tokens.length) continue;
                        if (!isPunc(",")) croak("Separate names with a comma",line)
                    }
                    break;
                case "readptr":
                    ex = isVar()
                    if (!ex) croak("READPTR needs a variable name",line)
                    if (!isPunc(",")) croak("READPTR needs two parameters",line)
                    ex2 = expr(tokens,line)
                    if (ex.type=="var") {
                        //console.log(ex,ex2)

                        ENV.addVar(ex.value,"int")
                        out+=CFG.asm.readptr(line);
                        out+=CFG.asm.storeInt(ex.value,line)
                        if (ex2.type=="num" && ex2.value===0) break;
                        out+=exprAsm(ex2,line,"int")
                        out+=CFG.asm.setptr(line);
                    }
                    break;
                case "def":
                    par = tokens[0];
                    if (par.type=="fn" && par.value=="fn") {
                        //def fn
                        tokens.shift()
                        par = tokens.shift();
                        target = findLabel(par.value,labels);
                        if (target===null) croak("Target line not found",line)

                        ENV.addFn(par.value)
                        break;
                    }
                    if (par.type=="var" && par.value=="proc") {
                        //def proc
                        tokens.shift()
                        par = tokens.shift();
                        target = findLabel(par.value,labels);
                        if (target===null) croak("Target line not found",line)
                        ENV.addProc(par.value)
                        break;
                    }
                  if (par.type=="var" && par.value=="struct") {
                      //def proc
                      tokens.shift()
                      par = tokens.shift(); //struct name

                      if (ENV.structs[par.value]) croak("Structure is already defined",line)

                      var structure = [];
                      var bytes=0;
                      while(tokens.length) {
                        var sname = tokens.shift();
                        if (!isPunc("(")) croak("Syntax error: element(type)",line)
                        var stype=tokens.shift();
                        if (!isPunc(")")) croak("Syntax error: element(type)",line)
                        if (tokens.length && !isPunc(",")) croak("Syntax error: comma is missing",line)
                        structure.push({name:sname.value,type:stype.value,offset:bytes})
                        if (stype.value=="byte") bytes+=1;
                        if (stype.value=="int") bytes+=2;
                        if (stype.value=="str") bytes+=2;
                      }
                      structure.push({name:null,type:null,offset:bytes})

                      //console.log(par.value,structure)
                      ENV.addStruct(par.value,structure)
                      break;
                  }
                  croak("DEF without an usable entity",line)
                    break;
                case "ramtop":
                    par = tokens[0];
                    if (par.type!="num") croak("RAMTOP needs a constant value",line);
                    CFG.ramtop = par.value
                    break;

                case "swap":
                    ex = isVar()
                    if (!ex) croak("SWAP needs a variable name",line)
                    out+=CFG.xp.var(ex,line)
                    ENV.addVar(ex.value,"int")
                    if (!tokens.length) break;
                    if (!isPunc(",")) croak("Separate names with a comma",line)
                    ex2 = isVar()
                    if (!ex2) croak("SWAP needs two variables",line)
                    ENV.addVar(ex2.value,"int")
                    out+=CFG.asm.swap()
                    out+=CFG.xp.var(ex2,line)
                    out+=CFG.asm.storeInt(ex.value)
                    out+=CFG.asm.swap()
                    out+=CFG.asm.storeInt(ex2.value)

                    break;

                case "on":

                  // on error?


                    ex = isVar()
                    if (!ex) croak("ON needs a variable name",line)


                    if (ex.value.toLowerCase()=="error") {
                      var forError = null;

                      if (tokens[0].type=="num") {
                        //error number specification
                        forError = tokens[0].value;
                        tokens.shift();
                      }

                      var go = isKw("goto");
                      if (!go) croak("ON ERROR needs a GOTO",line)
                      if (!tokens.length) croak("ON ERROR needs a GOTO line/label",line)
                      target = findLabel(tokens[0].value,labels);
                      tokens.shift();
                      ENV.lUse("CMD"+target)
                      //console.log(go, target, forError)
                      //toDo
                      if (forError===null) {
                        out += CFG.asm.onerrorAll(target)
                      } else {
                        out += CFG.asm.onerrorNum(target,forError)
                      }

                      break;
                    }

                    out+=CFG.xp.var(ex,line)
                    ENV.addVar(ex.value,"int")
                    if (!tokens.length) croak("ON needs a GOTO/GOSUB",line)

                    if (isKw("goto")) {
                        //get a list of command line numbers
                        list = [];
                        while (tokens.length) {
                            target = findLabel(tokens[0].value,labels);
                            if (target===null) croak("Target line "+tokens[0].value+" not found",line)
                            list.push(target)
                            tokens.shift();
                            if (tokens.length) {
                                if (!isPunc(",")) croak("Syntax error", line)
                            }
                        }
                        if (list.length>127) croak("Too much targets", line)
                        out += CFG.asm.ongoto(list)
                        break;
                    }
                    if (isKw("gosub")) {
                        //get a list of command line numbers
                        list = [];
                        while (tokens.length) {
                            target = findLabel(tokens[0].value,labels);
                            if (target===null) croak("Target line "+tokens[0].value+" not found",line)
                            list.push(target)
                            tokens.shift();
                            if (tokens.length) {
                                if (!isPunc(",")) croak("Syntax error", line)
                            }
                        }
                        if (list.length>127) croak("Too much targets", line)
                        out += CFG.asm.ongosub(list,i)


                        break;
                    }

                    croak("Syntax error: ON without GOTO/GOSUB",line)
                    break;

                case "push":
                    while(tokens.length) {
                        ex = isVar()
                        if (!ex) croak("PUSH needs a variable name",line)
                        out+=CFG.xp.var(ex,line)
                        ENV.addVar(ex.value,"int")
                        out+=CFG.asm.dopush();
                        if (!tokens.length) continue;
                        if (!isPunc(",")) croak("Separate names with a comma",line)
                    }
                    break;
                case "pop":
                    while(tokens.length) {
                        ex = isVar()
                        if (!ex) croak("POP needs a variable name",line)
                        ENV.addVar(ex.value,"int")
                        out+=CFG.asm.dopop();
                        out+=CFG.asm.storeInt(ex.value,line)
                        if (!tokens.length) continue;
                        if (!isPunc(",")) croak("Separate names with a comma",line)
                    }
                    break;
                case "take":
                    ex = isVar()
                    if (!ex) croak("TAKE needs a variable name",line)
                    ENV.addVar(ex.value,"int")
                    //
                    if (!tokens.length) {
                        out+=CFG.asm.storeInt(ex.value,line)
                        break;
                    }
                    //pushs?
                    if (isPunc(";")){
                        while(tokens.length) {
                            out+=CFG.asm.dopush()
                            pex = isVar()
                            if (!pex) croak("TAKE PUSH needs a variable name",line)
                            ENV.addVar(pex.value,"int")
                            out+=CFG.xp.var(pex,line)
                            out+=CFG.asm.stackSwap()
                            if (!tokens.length) continue;
                            if (!isPunc(",")) croak("Separate names with a comma",line)
                        }

                        out+=CFG.asm.storeInt(ex.value,line)
                        break
                    }
                    var firstPar = CFG.asm.storeInt(ex.value,line)+CFG.asm.swap()
                    if (!isPunc(",")) croak("Separate names with a comma",line)

                    //second take
                    ex = isVar()
                    if (!ex) croak("Second TAKE needs a variable name",line)
                    ENV.addVar(ex.value,"int")
                    if (!tokens.length) {
                        out+=firstPar+CFG.asm.storeInt(ex.value,line)
                        break;
                    }
                    //pushs?
                    if (isPunc(";")){
                        while(tokens.length) {
                            out+=CFG.asm.dopush()
                            pex = isVar()
                            if (!pex) croak("TAKE PUSH needs a variable name",line)
                            ENV.addVar(pex.value,"int")
                            out+=CFG.xp.var(pex,line)
                            out+=CFG.asm.stackSwap()
                            if (!tokens.length) continue;
                            if (!isPunc(",")) croak("Separate names with a comma",line)
                        }

                        out+=firstPar+CFG.asm.storeInt(ex.value,line)
                        break
                    }
                    out+=firstPar+CFG.asm.storeInt(ex.value,line)
                    if (!tokens.length) break;
                    croak("TAKE has 2 parameters max",line)

                    break
                case "call":
                    par = tokens[0];
                    target = findLabel(par.value,labels);
                    if (target===null) croak("Target line not found",line)
                    tokens.shift()
                    if (!isPunc(",")) croak("Syntax error",line)
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    out+=exprAsm(ex,line,et)
                    if (isPunc(",")) {
                        ex2 = expr(tokens,line);
                        et = exprType(ex2,line);
                        out+=exprAsm(ex2,line,et2,true)
                    }
                    //console.log(ex,ex2)
                    ENV.lUse("CMD"+target)
                    out+=CFG.asm.docall("CMD"+target, ENV)

                    break
                case "let":
                    if (tokens[0].type=="var" && ENV.procs[tokens[0].value]==tokens[0].value) {
                        //Procedure call in fact
                        par = tokens[0];
                        target = findLabel(par.value,labels);
                        if (target===null) croak("Target line not found",line)
                        tokens.shift()
                        ex = expr(tokens,line);
                        et = exprType(ex,line);
                        out+=exprAsm(ex,line,et)
                        if (isPunc(",")) {
                            ex2 = expr(tokens,line);
                            et = exprType(ex2,line);
                            out+=exprAsm(ex2,line,et2,true)
                        }
                        ENV.lUse("CMD"+target)
                        out+=CFG.asm.docall("CMD"+target, ENV)

                        break
                    }
                    var multiassign = [];
                    epar = expr(tokens,line)
                    if (epar.type=="var") {
                        //inc,dec
                        if (!tokens.length) croak("LET should assign something",line)
                        if(isOp("++")) {
                            //INC short
                            ENV.addVar(epar.value,"int")
                            out+=CFG.asm.varplus1(epar.value)
                            tokens.shift();
                            break
                        } else if(isOp("--")) {
                            //DEC short
                            ENV.addVar(epar.value,"int")
                            out+=CFG.asm.varminus1(epar.value)
                            tokens.shift();
                            break
                        } else if(isOp("**")) {
                            //*2 short
                            ENV.addVar(epar.value,"int")
                            out+=CFG.asm.vartimes2(epar.value)
                            tokens.shift();
                            break
                        } else if(isOp("+++")) {
                            //INC short
                            ENV.addVar(epar.value,"int")
                            out+=CFG.asm.varplus2(epar.value)
                            tokens.shift();
                            break
                        } else if(isOp("---")) {
                            //DEC short
                            ENV.addVar(epar.value,"int")
                            out+=CFG.asm.varminus2(epar.value)
                            tokens.shift();
                            break
                        } else if (tokens[0].type=="punc" && tokens[0].value==",") {
                            while(isPunc(",")) {
                                //let x,x,x = something
                                if (epar.type!="var") {
                                    croak("Multiassigning needs a scalar int",line)
                                }
                                multiassign.push(epar)
                                epar = expr(tokens,line)
                            }
                        } else {
                            croak("LET syntax mismatch",line)
                        }
                    }
                    if (epar.type!=="assign") croak("LET should assign",line)
                    par = epar.left
                    //console.log(epar)
                    if (par.type!="var" && par.type!="var[]" && par.type!="var{}" && par.type!="var$" && par.type!="slice$" && par.type!="var.") croak("No variable name",line)
                    if (par.type=="var$") {
                        ENV.addVar(par.value,"str")
                        ENV.addUse("__heap")
                        out+=CFG.asm.strUnassign(par.value)
                    }
                    if (par.type=="slice$") {
                        ENV.addVar(par.value,"str")
                        ENV.addUse("__heap")
                        out+=CFG.asm.strUnassign(par.value)
                    }
                    ex = epar.right
                    et = exprType(ex,line);
                    //console.log(et)

                    out+=exprAsm(ex,line,et);
                    if (et=="byte") {
                      et="int"
                      out+="\tMVI H,0\n"; //cast byte to int
                    }
                    if (par.type=="var") {
                        if (et!="int") croak("Cannot assign this to int variable",line)
                        ENV.addVar(par.value,"int")
                        out+=CFG.asm.storeInt(par.value);
                        while(multiassign.length) {
                            par = multiassign.pop()
                            out+=CFG.asm.storeInt(par.value);
                        }
                    } else if (par.type=="var.") {
                      var el = getStructItemOffset(par.value,par.index,line)
                      cast = false;
                      if (el.type=="byte") {
                        //el.type="int";
                        cast = true;
                      }
                      if (et!=el.type && (cast && et!="int")) croak("Cannot assign this (type mismatch)",line)
                      //ENV.addVar(par.value,"int")
                      out+=CFG.asm.storeIntOffset(par.value,el.offset,cast);
                      while(multiassign.length) {
                          par = multiassign.pop()
                          out+=CFG.asm.storeIntOffset(par.value,el.offset,cast);
                      }
                    } else if (par.type=="var{}") {
                      var member = getStructMember(par.struct,par.member)
                      if (!member) croak("Invalid struct pointer",line)
                      el=member[0]
                      cast = false;
                      if (el.type=="byte") {
                        cast = true;
                      }
                      //et = member[0].type;
                      if (et!=el.type && (cast && et!="int")) croak("Cannot assign this (type mismatch)",line)
                      //console.log(par.value,el.offset,cast)
                      out+=CFG.asm.storeIntOffsetPointer(par.value,el.offset,cast);

                  } else if (par.type=="var[]") {
                        if (et!="int") croak("Cannot assign this to int variable",line)
                        if (!ENV.intarr[par.value])  croak("You have to DIM array first",line)
                        if (par.index.type=="num" && par.index.value>=ENV.intarr[par.value]) croak("Index out of bound",line)

                        if (par.index.type=="num") {
                            //precompute
                            out+=CFG.asm.storeAI(par.value,par.index.value)
                        } else {
                            out += CFG.asm.storeA(par,line,et,ENV,exprAsm);
                        }
                    } else if (par.type=="var$") {
                        if (et!="str") croak("Cannot assign this to string variable",line)
                        out+=CFG.asm.storeStr(par.value)
                    } else if (par.type=="slice$") {
                        if (et!="str") croak("Cannot assign this to string slice",line)
                        out+=CFG.asm.storeSlice(par.value,par,line,ENV,exprAsm)
                    }
                    break;
                case "poke":
                    //addr
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    if (!isPunc(",")) croak("Syntax error",line)
                    //value
                    ex2 = expr(tokens,line);
                    et2 = exprType(ex2,line);
                    out+=CFG.asm.poke(ex,et,ex2,et2,exprAsm,line)
                    break;
                case "dpoke":
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    if (!isPunc(",")) croak("Syntax error",line)
                    ex2 = expr(tokens,line);
                    et2 = exprType(ex2,line);
                    out+=CFG.asm.dpoke(ex,et,ex2,et2,exprAsm,line)
                    break;

                case "syscall":
                    //addr
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    var parcall = [];
                    while (tokens.length) {
                      if (!isPunc(",")) croak("Syntax error",line);
                      ex2 = expr(tokens,line);
                      et2 = exprType(ex2,line);
                      parcall.push([ex2,et2])
                    }
                    //value

                    out+=CFG.asm.syscall(ex,et,parcall,exprAsm,line,croak)
                    break;


                case "out":
                    //addr
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    if (!isPunc(",")) croak("Syntax error",line)
                    //value
                    ex2 = expr(tokens,line);
                    et2 = exprType(ex2,line);
                    out+=CFG.asm.ioOut(ex,et,ex2,et2,exprAsm,line,ENV)
                    break

                case "wait":
                    //addr
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    if (!isPunc(",")) croak("Syntax error",line)
                    //value
                    ex2 = expr(tokens,line);
                    et2 = exprType(ex2,line);
                    var ex3 = {type:"num",value:0}
                    if (isPunc(",")) {
                        ex3 = expr(tokens,line);
                    }
                    var et3 = exprType(ex2,line);
                    out+=CFG.asm.wait(ex,et,ex2,et2,ex3,et3,i,exprAsm,line,ENV)
                    break

                case "for":
                    par = tokens.shift();
                    if (par.type!="var") croak("No usable variable name",line)
                    next = tokens.shift();
                    if (next.type!="op" || next.value!="=") croak("FOR without an initial assignment",line)
                            var exi = expr(tokens,line);
                            var eti = exprType(exi,line);
                            next = tokens.shift();
                    if (next.type!="kw" || next.value!="to") croak("FOR without TO",line)

                    var limit = "ex"
                    ex = expr(tokens,line);
                    et = exprType(ex,line);
                    if (ex.type=="num") {
                        //step constant
                        limit = ex.value;
                    } else {
                        //step counted
                        out+=exprAsm(ex,line,et);
                        out+=CFG.asm.storeAnyInt("sv_forL"+i)
                        ENV.addVar("forL"+i,"sysdw")
                    }

                    //step variants
                    var step = 1

                    if (tokens.length) {
                        next = tokens.shift();
                        if (next.type!="kw" || next.value!="step") croak("Did you mean STEP?",line)
                        ex = expr(tokens,line);
                        et = exprType(ex,line);
                        if (ex.type=="num") {
                            //step constant
                            step = ex.value;
                        } else {
                            //step counted
                            out+=exprAsm(ex,line,et);
                            out+=CFG.asm.storeAnyInt("sv_forS"+i)
                            ENV.addVar("forS"+i,"sysdw")
                            step="ex"
                        }
                    }

                    //Initial value defined here
                    out+=exprAsm(exi,line,eti);
                    ENV.addVar(par.value,"int")
                    out+=CFG.asm.storeInt(par.value)

                    out+=CFG.asm.jmp("FTCMD"+i);
                    out+="FLCMD"+i+":\n";

                    loops.unshift(["CMD"+i,"F",i,par.value,step,limit]);
                    break;
                case "next":
                    if (!loops.length) croak("NEXT without FOR",line)
                    if (loops[0][1]!="F") croak("Loops mismatched",line)
                    par = tokens.shift();
                    if (par.type!="var") croak("No usable variable name",line)
                    if (par.value!=loops[0][3]) croak("FOR / NEXT variable mismatch",line)
                    out+="FC"+loops[0][0]+":\n"
                    out+=CFG.xp.var(par.value)
                    out+=CFG.asm._forstep(loops);
                    out+=CFG.asm.storeInt(par.value)

                    out+="FT"+loops[0][0]+":\n" //test
                    out+=CFG.asm._fortest(loops);

                    out+="FB"+loops[0][0]+":\n"

                    loops.shift()
                    break
          case "if":
                    ex = expr(tokens,line,true);
                    et = exprType(ex,line);
                    if (!isKw("then")) croak("IF without THEN", line)
                    //console.log(basic[i]._numline,basic[i+1]._numline)
                    if (basic[i]._numline == basic[i+1]._numline) { //continue on the same line
                        skipMark(i,basic)
                    } else {
                        ifMultiline.unshift(i)
                    }
                    out+=exprAsm(ex,line,et);
                    out+=CFG.asm.jmpEx0("ELSKIP"+i);
                    ifskip.unshift(i)
                    break;

                case "endif":
                    if (!ifMultiline.length) croak("ENDIF without IF", line)
                    if (ifskip.length) {
                        out+="ELSKIP"+ifskip[0]+":\n"
                        ifskip.shift();
                    }
                    out+="SKIP"+ifMultiline[0]+":\n"

                    ifMultiline.shift()
                    break;

                case "until":
                    if (!loops.length) croak("UNTIL without REPEAT",line)
                    if (loops[0][1]!="R") croak("UNTIL / REPEAT mismatched",line)
                    ex = expr(tokens,line,true);
                    out+="RC"+loops[0][0]+":\n"
                    out+=exprAsm(ex,line);
                    out+=CFG.asm.jmpEx0(loops[0][0]);
                    out+="RB"+loops[0][0]+":\n"
                    loops.shift()
            break;

                case "while":
                    loops.unshift(["CMD"+i,"W"])
                    ex = expr(tokens,line,true);
                    out+="WC"+loops[0][0]+":\n"
                    out+=exprAsm(ex,line);
                    out+=CFG.asm.jmpEx0("WB"+loops[0][0]);
            break;

            case "throw":
                par = tokens[0];
                if (par.type!="num") croak("THROW needs a constant value",line);
                if (par.value<0) croak("THROW needs a value between 0 and 7",line);
                if (par.value>7) croak("THROW needs a value between 0 and 7",line);

                out += CFG.asm.throwN(par.value);
                tokens.shift(); //drop

            break;
            case "run":
                out += CFG.asm.run();
            break;
                case "input":
                    hasstr = false;
                    while(tokens.length) {
                        if (isPunc("#")) {
                            //channel swap
                            chan = expr(tokens,line,true);
                            out+=exprAsm(chan,line,"int");
                            ENV.addUse("inpchan")
                            out+=CFG.asm.docall("inpchan", ENV)
                            if (!isPunc(",")) croak("Syntax error",line)
                            continue;
                        }
                        par = expr(tokens,line)

                        if (par.type=="var") {
                            //good, lets input a number
                            ENV.addUse("inputint")
                            ENV.addVar(par.value,"int")
                            out+=CFG.asm.docall("inputint", ENV)
                            out+=CFG.asm.storeInt(par.value)
                            //consume remainder
                            if (!tokens.length) break; //the last one
                            if (!isPunc(",")) croak("Syntax error",line)
                            continue;
                        } else if (par.type=="var[]") {
                            //good, lets input a number into an array
                            if (!ENV.intarr[par.value])  croak("You have to DIM array first",line)
                            if (par.index.type=="num" && par.index.value>=ENV.intarr[par.value]) croak("Index out of bound",line)
                            ENV.addUse("inputint")
                            out+=CFG.asm.docall("inputint", ENV)

                            if (par.index.type=="num") {
                                //precompute
                                out += CFG.asm.storeAI(par.value,par.index.value)
                            } else {
                                out += CFG.asm.storeA(par,line,et,ENV,exprAsm)
                            }
                            //consume remainder
                            if (!tokens.length) break; //the last one
                            if (!isPunc(",")) croak("Syntax error",line)
                            continue;
                        } else if (par.type=="var$") {
                            //good, lets input a string
                            ENV.addVar(par.value,"str")
                            out+=CFG.asm.strUnassign(par.value)

                            ENV.addUse("inputstr")
                            out+=CFG.asm.docall("inputstr", ENV)
                            ENV.addUse("__heap")
                            hasstr = true
                            //heap test
                            out+=CFG.asm.storeStrNoGC(par.value)
                            if (!tokens.length) break; //the last one
                            if (!isPunc(",")) croak("Syntax error",line)
                            tokens.shift();
                            continue;
                        }

                        ex = par
                        et = exprType(ex,line);
                        out+=exprAsm(ex,line,et);
                        ENV.addUse("print"+et)
                        out+=CFG.asm.docall("print"+et, ENV)
                        println = true;
                        if (isPunc(";")) {
                            println = false;
                            continue;
                        }
                        if (isPunc(",")) {
                            ENV.addUse("printtab")
                            out+=CFG.asm.docall("printtab", ENV)
                            println = false;
                            continue;
                        }
                    }
                    if (hasstr) out+=CFG.asm.docall("hp_gc"), ENV;
                    break;

                case "write":
                    hasstr = false;
                    while(tokens.length) {
                        if (isPunc("#")) {
                            //channel swap
                            chan = expr(tokens,line,true);
                            out+=exprAsm(chan,line,"int");
                            ENV.addUse("prtchan")
                            out+=CFG.asm.docall("prtchan", ENV)
                            out+="\tCALL prtchan\n"
                            if (!isPunc(",")) croak("Syntax error",line)
                            continue
                        }
                        ex = expr(tokens,line);
                        et = exprType(ex,line);
                        //console.log(ex,et)
                        out+=exprAsm(ex,line,et);
                        ENV.addUse("print"+et)
                        if (et=="str") {
                            ENV.addUse("printquot")
                            out+=CFG.asm.docall("printquot", ENV)
                        }
                        out+=CFG.asm.docall("print"+et, ENV)
                        if (et=="str") {
                            out+=CFG.asm.docall("printquot", ENV)
                            hasstr=true
                        }
                        println = true;
                        if (isPunc(",")) {
                            ENV.addUse("printcomma")
                            out+=CFG.asm.docall("printcomma", ENV)
                            continue;
                        }

                    }
                    ENV.addUse("println")
                    out+=CFG.asm.docall("println", ENV)
                    //if (hasstr) out+=CFG.asm.docall("hp_gc"), ENV;

                    break;

                case "print":
                    var println = true;
                    hasstr = false;
                    while(tokens.length) {
                        if (isPunc("#")) {
                            //channel swap
                            chan = expr(tokens,line,true);
                            out+=exprAsm(chan,line,"int");
                            ENV.addUse("prtchan")
                            out+=CFG.asm.docall("prtchan", ENV)
                            out+="\tCALL prtchan\n"
                            if (!isPunc(",")) croak("Syntax error",line)
                            continue
                        }
                        ex = expr(tokens,line);
                        et = exprType(ex,line);
                        //console.log(ex,et)
                        out+=exprAsm(ex,line,et);
                        ENV.addUse("print"+et)
                        out+=CFG.asm.docall("print"+et, ENV)
                        if (et=="str") hasstr=true
                        println = true;
                        if (isPunc(";")) {
                            println = false;
                            continue;
                        }
                        if (isPunc(",")) {
                            ENV.addUse("printtab")
                            out+=CFG.asm.docall("printtab", ENV)
                            println = false;
                            continue;
                        }

                    }
                    if (println) {
                        ENV.addUse("println")
                        out+=CFG.asm.docall("println", ENV)
                    }
                    //if (hasstr) out+=CFG.asm.docall("hp_gc"), ENV;

                    break;

                    default:
                        croak("Keyword '"+cmd+"' not implemented", line)

            }

            //console.log("E",line)
            if (line.hasElse) {
                //out+="HASELSE\n"
                out+=CFG.asm.jmp("SKIP"+ifskip[0]);
                out+="ELSKIP"+ifskip[0]+":\n"
                ifskip.shift();
            }

            if (tokens.length) croak("Extra characters "+JSON.stringify(tokens), line)

        } else if (tokens.length>0 && tokens[0].type=="remark") {
          //That's OK
        } else {
          //console.log(line)
          croak("Line should start with a statement",line)
        }


    }

    if (ifMultiline.length) croak("Non-closed multiline IF", basic[ifMultiline[0]])

    if (loops.length) croak("Non-closed loops", line)

    var appendInput = false
    var appendSeed = false
    if(ENV.uses.indexOf("inputint")>=0) appendInput=true;
    if(ENV.uses.indexOf("inputstr")>=0) appendInput=true;
    if (ENV.uses.indexOf("f_rnd")>=0) appendSeed=true;


    //prepend
    if (ENV.uses.indexOf("__heap")>=0) {
        out = "\tCALL HP_INIT\n" + out;
    }

    if (ENV.uses.indexOf("errovfl")>=0) {
      out = "\tLXI H,errovfl\n\tSHLD ex_table+0\n" + out;
    }
    if (ENV.uses.indexOf("erridx")>=0) {
      out = "\tLXI H,erridx\n\tSHLD ex_table+2\n" + out;
    }
    if (ENV.uses.indexOf("errdiv")>=0) {
      out = "\tLXI H,errdiv\n\tSHLD ex_table+4\n" + out;
    }
    if (ENV.uses.indexOf("erroom")>=0) {
      out = "\tLXI H,erroom\n\tSHLD ex_table+6\n" + out;
    }
    if (ENV.uses.indexOf("errstop")>=0) {
      out = "\tLXI H,errstop\n\tSHLD ex_table+8\n" + out;
    }
    if (ENV.uses.indexOf("errnodata")>=0) {
      out = "\tLXI H,errnodata\n\tSHLD ex_table+10\n" + out;
    }

    if (CFG.init) {
      out = CFG.init + out;
  }


    out ="\tORG "+CFG.org+"\n\t.ent $\n\n" + out; //zahlavi

    //append
    out+="ERRGO:\t"+CFG.goback+"\n"; //error handling poor man

    //fndump
    out=fnAsm(out);


    //strdump
    out+=";----DATA SEGMENT (ROM)\n"
    out+=strAsm();

    //datadump
    out+=";----INITIALIZED DATA SEGMENT (RAM)\n"
    if (CFG.ramstart) {
      out+="\torg "+CFG.ramstart+"\n";
    }
    if (ENV.datas.length) {
        out+="datapoint: dw $+2\n"
        out+="databegin:\n"
        out+=ENV.datas.join("")
        out+="datatable: dw 0\n"
        ENV.datalabels = ENV.datalabels.sort(function(a,b){return b-a;})
        for (i=0;i<ENV.datalabels.length;i++) {
            var l =ENV.datalabels[i];
            out+="\tdw "+l+",dt_"+l+"\n"
        }
        out+="\tdw 0\n"
    }

    if (appendSeed) {
        out+="sv_seed1: dw "+Math.floor(Math.random()*65535+1)+"\n"
        out+="sv_seed2: dw "+Math.floor(Math.random()*65535+1)+"\n"

    }

    //vardump
    out += ";----BSS SEGMENT\n"
    out += "ex_table: DS 16\n"

    out += varAsm();

    //append
    if (appendInput) {
        out += "i_buffer: ds 257\n";
    }
    out += "\nSAVESP: DS 2\n"

    out +="\n\nHEAP EQU $\nRAMTOP EQU "+CFG.ramtop+"\nds RAMTOP-$\n\n"; //zapati

    //console.log(ENV.syslabels)
    for (k in ENV.syslabels) {
      if (ENV.syslabels[k]===0) {
        //console.log("remove",k+":\n")
        out = out.replace(k+":\n","")
      }
    }

    return out;
}
if (typeof module != 'undefined') module.exports = generator
