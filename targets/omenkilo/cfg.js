var CONFIG = CONFIG || {};
CONFIG.OMENKILO= {
        org:"0100h",
        ramtop:"07f00h",
        goback:"JMP [$FFFE]",
        cpu:"M6809",
        init:"; BASIC for KILO\n",
        system: {
            "serout": {
                uses:null,
                sysdb:["prtchan"],
                code: "\tPSHS    a,b \n"+
            "SEROUTL:            \n"+
            "\tLDB     ACIAS \n"+
            "\tANDB    #ACIA_TDRE \n"+
            "\tBEQ     seroutl \n"+
            "\tSTA     ACIAD \n"+
            "\tPULS    a,b \n"+
            "\tRTS  \n"
            },
            "serin": {
                uses:["serout"],
                sysdb:["prtchan","inpchan"],

                code:
                "\tLDA     ACIAS \n"+
                "\tANDA    #ACIA_RDRF \n"+
                "\tBEQ     serin \n"+
                "\tLDA     ACIAD \n"+
                "\tRTS  \n"
            }
        },
        xp:{},
        asm:{}
    }

if (typeof module != 'undefined') module.exports=CONFIG
