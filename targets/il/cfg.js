var CONFIG = CONFIG || {};
CONFIG.IL = {
        org:"0000h",
        ramstart:"08000h",
        ramtop:"08400h",
        goback:"RST 0",
        cpu:"IL",
        init:"\tLXI SP,RAMTOP\n\tDI\n",
        system: {
            "serout": {
                uses:null,
                sysdb:["prtchan"],
                code: "\tPUSH PSW\n"+
                "so_wait: IN 0deh ;acias\n"+
                "\tani 2\n"+
                "\tjz so_wait\n"+
                "\tpop psw ;aciad\n"+
                "\tout 0dfh\n"+
                "\tRET\n"
            },
            "serin": {
                uses:["serout"],
                sysdb:["prtchan","inpchan"],
                code: "\tIN 0deh ;acias\n"+
                "\tani 1\n"+
                "\trz\n"+
                "\tin 0dfh ;aciad\n"+
                "\tcall serout\n"+
                "\tora a\n"+
                "\tRET\n"
            }
        },
        xp:{},
        asm:{}
    }

if (typeof module != 'undefined') module.exports=CONFIG
