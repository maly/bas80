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


/// a big library

var LIB = {
    "printstr": {
        uses:["serout"],
        code: "\tMOV A,M\n"+
        "\tORA A\n"+
        "\tRZ\n"+
        "\tCALL serout\n"+
        "\tINX H\n"+
        "\tJMP printstr\n"
    },
    "printint": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "prtchan": {
        uses:null,
        sysdb:["prtchan"],
        code: "\tMOV A,L\n"+
        "\tSTA sv_prtchan\n"+
        "\tRET\n"
    },
    "println": {
        uses:["serout"],
        code: "\tMVI A,0Dh\n"+
        "\tCALL SEROUT\n"+
        "\tMVI A,0Ah\n"+
        "\tCALL SEROUT\n"+
        "\tRET\n"
    },
    "printtab": {
        uses:["serout"],
        code: "\tMVI A,09h\n"+
        "\tCALL SEROUT\n"+
        "\tRET\n"
    },
    //SYSTEM
    "serout": {
        uses:null,
        sysdb:["prtchan"],
        code: ""+
        "\tRST 8\n"+
        "\tRET\n"
    },

    //operators
    "o_lt": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "o_gt": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "o_eq": {
        uses:null,
        code: "\tMOV A,L\n"+
        "\tORA E\n"+
        "\tRNZ\n"+
        "\tMOV A,H\n"+
        "\tORA D\n"+
        "\tRET\n"
    },
    "o_add": {
        uses:null,
        inline:true,
        code: "\tDAD D\t;o_add\n"+
        ""+
        ""
    },
    "o_mul": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "o_sub": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "o_div": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "o_concat": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },

    //functions
    "f_max": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "f_abs": {
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
    },
    "f_sgn": {
        uses:null,
        code: "\tMOV A,H\n"+
        "\tRLCA\n"+
        "\tJC f_sgn_m\n"+
        "\tLXI H,1\n"+
        "\tRET\n"+
        "f_sgn_m: LXI H,0FFFFh\n"+
        "\tRET\n"
    },
    "f_rnd": {
        uses:null,
        sysdw:["rndseed"],
        code: ""+
        ""+
        "\tRET\n"
    },    
    "f_chrS": {
        uses:null,
        sysdw:["chrS"],
        code: "\tMOV A,L\n"+
        "\tSTA sv_chrS\n"+
        "\tXRA A\n"+
        "\tSTA sv_chrS+1\n"+
        "\tLXI H,sv_chrS\n"+
        "\tRET\n"
    },      
}