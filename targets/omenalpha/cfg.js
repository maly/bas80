var CONFIG = {
    "OMENALPHA": {
        org:"8000h",
        ramtop:"0f800h",
        goback:"RST 0",
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
}
