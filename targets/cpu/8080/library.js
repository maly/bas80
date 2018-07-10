// a big library

var LIB = {
    "__heap": {
        uses:["erroom"],
        code:
        ";heap management 1.1\n"+
        "\tHP_INIT:\n"+
        "\nlxi h,heap\n"+
        "\nlxi b,ramtop-heap\n"+
        "\nmvi e,0\n"+
        "hp_iclr:\n"+
        "\nmov m,e\n"+
        "\ninx h\n"+
        "\ndcx b\n"+
        "\nmov a,b\n"+
        "\nora c\n"+
        "\njnz hp_iclr\n"+
        "\tLXI     H,((RAMTOP-HEAP)&0xfffe)-4 \n"+
        "\tSHLD    HEAP \n"+
        "\tLXI     H,HEAP \n"+
        "\tCALL    hp_n \n"+
        "\tMVI     A,0FFh \n"+
        "\tMOV     m,a \n"+
        "\tINX     h \n"+
        "\tMOV     m,a \n"+
        "\tRET \n"+
        "HP_F: LXI     H,HEAP+1 \n"+
        "HP_F2:\n"+
        "\tMOV     d,m \n"+
        "\tDCX     h \n"+
        "\tMOV     e,m \n"+
        "\tMOV     A,E \n"+
        "\tANI     01h ;0=empty,1=full\n"+
        "\tRET     \n"+
        "HP_N:   \n"+
        "\tMOV     A,M \n"+
        "\tANI     0FEh\n"+
        "\tMOV     E,A \n"+
        "\tINX     H \n"+
        "\tMOV     D,M \n"+
        "\tDCX     H \n"+
        "\tDAD     D \n"+
        "\tINX     H \n"+
        "\tINX     H \n"+
        "\tINX     H \n"+
        "\tJMP     HP_F2 \n"+
        "\n"+
        "HP_FE:\n"+
        "\tCALL    hp_f \n"+
        "HP_FE2: \n"+
        "\tRZ\n"+
        "\tMOV     a,d \n"+
        "\tANA     e \n"+
        "\tINR     a \n"+
        "\tJZ      ERROOM \n"+
        "HP_FEN: \n"+
        "\tCALL    hp_n \n"+
        "\tJMP     hp_fe2 \n"+
        "HP_FREE:\n"+
        "\tMOV     a,m \n"+
        "\tANI     0feh \n"+
        "\tMOV     m,a \n"+
//        "HP_FRE2:    CALL    hp_join \n"+
//        "\tJNZ     hp_fre2 \n"+
        "\tRET     \n"+
        "HP_JOIN:\n"+
        "\tCALL    hp_fe \n"+
        "HP_J0:  \n"+
        "\tPUSH    h \n"+
        "\tCALL    hp_n \n"+
        "\tJZ      hp_j \n"+
        "\tMOV     a,e \n"+
        "\tANA     d \n"+
        "\tINR     a \n"+
        "\tPOP     d \n"+
        "\tRZ      \n"+
        "\tCALL    hp_fe2 \n"+
        "\tJMP     hp_j0 \n"+
        "HP_J:   \n"+
        "\tPOP     h \n"+
        "\tMOV     a,e \n"+
        "\tADD     m \n"+
        "\tMOV     e,a \n"+
        "\tINX     h \n"+
        "\tMOV     a,d \n"+
        "\tADC     m \n"+
        "\tMOV     d,a \n"+
        "\tINX     d \n"+
        "\tINX     d \n"+
        "\tMOV     m,d \n"+
        "\tDCX     h \n"+
        "\tMOV     m,e \n"+
        "\tORI     1 ; Z=0\n"+
        "\tRET     \n"+
        "HP_A:\n"+
        "\tINX     b \n"+
        "\tMOV     a,c \n"+
        "\tRRC     \n"+
        "\tJNC     hp_aeven \n"+
        "\tINX     b \n"+
        "HP_AEVEN:           \n"+
        "\tCALL    hp_fe \n"+
        "HP_ALOP:\n"+
        "\tMOV     a,d \n"+
        "\tCMP     b \n"+
        "\tJC      hp_alow \n"+
        "\t;JNZ     hp_amore \n"+
        "\tMOV     a,e \n"+
        "\tCMP     c \n"+
        "\tjz hp_aexact\n"+
        "\t;porovnat, jestli zbývá alespoň n+6\n"+
        "\tpush b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tmov a,d\n"+
        "\tcmp b\n"+
        "\tjc hp_alow6        \n"+
        "\tjnz hp_amore6\n"+
        "\tmov a,e\n"+
        "\tcmp c\n"+
        "\tjnc hp_amore6\n"+
        "hp_alow6:\n"+
        "\tpop b\n"+
        "HP_ALOW:\n"+
        "\tCALL    hp_fen \n"+
        "\tJMP     hp_alop \n"+
        "hp_amore6:\n"+
        "\tpop b\n"+
        "HP_AMORE:           \n"+
        "\tMOV     a,e \n"+
        "\tSUB     c \n"+
        "\tMOV     e,a \n"+
        "\tMOV     a,d \n"+
        "\tSBB     b \n"+
        "\tMOV     d,a \n"+
        "\tDCX     d \n"+
        "\tDCX     d \n"+
        "\tPUSH    h \n"+
        "\tDAD     b\n"+
        "\tINX     h \n"+
        "\tINX     h \n"+
        "\tMOV     m,e \n"+
        "\tINX     h \n"+
        "\tMOV     m,d \n"+
        "\tPOP     h \n"+
        "hp_aexact:\n"+
        "\tINX     b \n"+
        "\tMOV     m,c \n"+
        "\tINX     h \n"+
        "\tMOV     m,b \n"+
        "\tINX     h\n"+
        "\tMVI     m,0aah \n"+
        "\tINX     h\n"+
        "\tRET     \n"+
        "hp_test:\n"+
        "\tpush d\n"+
        "\tlxi d,HEAP\n"+
        "\tmov a,h\n"+
        "\tcmp d\n"+
        "\tjc hp_noheap\n"+
        "\tjnz hp_noheap\n"+
        "\tmov a,l\n"+
        "\tcmp e\n"+
        "hp_noheap: \n"+
        "\tpop d\n"+
        "\tret        \n"+
        "hp_unass: \n"+
        "\tcall hp_test\n"+
        "\trc\n"+
        "\tdcx h\n"+
        "\tMVI     m,0aah \n"+
        "\tINX     h\n"+
        "\tret        \n"+
        "hp_assign: \n"+
        "\tcall hp_test\n"+
        "\trc\n"+
        "\tdcx h\n"+
        "\tMVI     m,055h \n"+
        "\tINX     h\n"+
        "\tret        \n"+
        "hp_gc:\n"+
        "\tCALL    hp_f \n"+
        "HP_gc1: \n"+
        "\tJZ hp_gcn\n"+
        "hp_gc2:        \n"+
        "\tMOV     a,d \n"+
        "\tANA     e \n"+
        "\tINR     a \n"+
        "\tJZ hp_gcf\n"+
        "\tinx h\n"+
        "\tinx h\n"+
        "\tmov a,m\n"+
        "\tdcx h\n"+
        "\tdcx h\n"+
        "\tcpi 0aah ;unassigned\n"+
        "\tjnz hp_gcn\n"+
        "\tpush h\n"+
        "\tcall hp_free\n"+
        "\tpop h\n"+
        "HP_gcN: \n"+
        "\tCALL    hp_n \n"+
        "\tJMP     hp_gc2 	\n"+
        "\t\n"+
        "HP_gcf:    CALL    hp_join \n"+
        "\tJNZ     hp_gcf\n"+
        "\tret        \n"+
        "HP_DONE:\n"

    },
    "printstr": {
        uses:["serout"],
        code: "\tMOV A,M\n"+
        "\tORA A\n"+
        "\tRZ\n"+
        "\tCALL serout\n"+
        "\tINX H\n"+
        "\tJMP printstr\n"
    },
    /*
    "printint": {
        uses:["s_div10","serout","f_abs"],
        code: ""+
        "\tMOV     a,h \n"+
        "\tORA     a \n"+
        "\tJP      pipos \n"+
        "\tMVI     a,2Dh ;- \n"+
        "\tCALL serout\n"+
        "\tCALL    f_abs \n"+
        "pipos:\tCALL  s_div10 \n"+
        "\tPUSH    psw \n"+
        "\tMOV     a,h \n"+
        "\tORA     l \n"+
        "\tJZ      pilast \n"+
        "\tCALL    pipos \n"+
        "pilast:\tPOP     psw \n"+
        "\tADI 30h\n"+  
        "\tCALL serout\n"+  
        "\tRET\n"
    },
    */
   "printint": {
    uses:["serout","f_abs"],
    code: ""+
    "\tMOV     a,h \n"+
    "\tORA     a \n"+
    "\tJP      pipos \n"+
    "\tMVI     a,2Dh ;- \n"+
    "\tCALL serout\n"+
    "\tCALL    f_abs \n"+
    "pipos:\tLXI D,-10000\n"+
    "\tCALL  prt10 \n"+
    "\tLXI D,-1000\n"+
    "\tCALL  prt10 \n"+
    "\tLXI D,-100\n"+
    "\tCALL  prt10 \n"+
    "\tLXI D,-10\n"+
    "\tCALL  prt10 \n"+
    "\tMOV A,L\n"+  
    "\tADI 30h\n"+  
    "\tJMP serout\n"+  
    "prt10:\n"+
    "\tmvi c,0\n"+
    "prt10l:\n"+
    "\tdad d\n"+
    "\tjnc prt10o\n"+
    "\tinr c\n"+
    "\tjmp prt10l\n"+
    "prt10o:\n"+
    "\tmov a,d\n"+
    "\tcma\n"+
    "\tmov d,a\n"+
    "\tmov a,e\n"+
    "\tcma\n"+
    "\tmov e,a\n"+
    "\tinx d\n"+
    "\tdad d\n"+
    "\tMOV A,C\n"+  
    "\tORA A\n"+  
    "\tRZ\n"+  
    "\tADI 30h\n"+  
    "\tJMP serout\n"
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
        code: "\tMVI A,20h\n"+
        "\tCALL SEROUT\n"+
        "\tMVI A,09h\n"+
        "\tCALL SEROUT\n"+
        "\tRET\n"
    },
    "printcomma": {
        uses:["serout"],
        code: "\tMVI A,2ch ;comma\n"+
        "\tCALL SEROUT\n"+
        "\tRET\n"
    },
    "printquot": {
        uses:["serout"],
        code: "\tMVI A,22h ;quot\n"+
        "\tCALL SEROUT\n"+
        "\tRET\n"
    },

    "input": {
        uses:["serin"],
        code:
        "    lxi h,i_buffer\n"+
        "    mvi c,0\n"+
        "i_rd_l:\n"+
        "    call serin\n"+
        "    jz i_rd_l\n"+
        "    cpi 0dh\n"+
        "    jz i_eol\n"+
        "    cpi 0ah\n"+
        "    jz i_eol\n"+
        "    mov m,a\n"+
        "    inx h\n"+
        "    inr c\n"+
        "    jnz i_rd_l\n"+
        "i_eol:\n"+
        "    mvi m,0\n"+
        "    ret \n"
    },
    "inputint": {
        uses:["input","f_val"],
        code:
        "    call input\n"+
        "    lxi h,i_buffer\n"+
        "    call f_val\n"+
        "    ret        \n"
    },
    "inputstr": {
        uses:["input","__heap","s_strcpy"],
        code:
        "    call input\n"+
        "    inx b\n"+
        "    call hp_a\n"+
        "    lxi d,i_buffer\n"+
        "    jmp s_strcpy\n"
    },

    //ERROR management
    "errovfl": {
        uses:["printstr"],
        code:
        "\tlxi h,errovfl_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "errovfl_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### MULT OVFL\",0dh,0ah\n"
    },
    "erridx": {
        uses:["printstr"],
        code:
        "\tlxi h,erridx_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "erridx_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### INDEX OUT OF LIMITS\",0dh,0ah\n"
    },
    "errdiv": {
        uses:["printstr"],
        code:
        "\tlxi h,errdiv_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "errdiv_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### DIVISION BY ZERO\",0dh,0ah\n"
    },
    "erroom": {
        uses:["printstr"],
        code:
        "\tlxi h,erroom_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "erroom_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### OUT OF MEMORY\",0dh,0ah\n"
    },
    "errstop": {
        uses:["printstr"],
        code:
        "\tlxi h,errstop_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "errstop_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### STOP\",0dh,0ah\n"

    },
    "errnodata": {
        uses:["printstr"],
        code:
        "\tlxi h,errnodata_m\n"+
        "\tcall printstr\n"+
        "\tjmp errgo\n"+
        "errnodata_m:\n"+
        "\tdb 0ah,0dh\n"+
        "\t.cstr \"### NO DATA\",0dh,0ah\n"

    },

    //SYSTEM
    "mul16": {
        uses:null,
        code: 
            "    push h\n"+
            "    pop b\n"+
            "    lxi h,0\n"+
            "    mvi a,16\n"+
            "mul16loop:\n"+
            "    dad h\n"+
            "    push psw\n"+
            "    mov a,e\n"+
            "    ral\n"+
            "    mov e,a\n"+
            "    mov a,d\n"+
            "    ral\n"+
            "    mov d,a\n"+
            "    jnc mul16no\n"+
            "    dad b\n"+
            "    jnc mul16no\n"+
            "    inx d\n"+
            "mul16no:\n"+
            "    pop psw\n"+
            "    dcr a\n"+
            "    jnz mul16loop\n"+
            "    ret\n"
    },

    "div16": {  
        uses:null,
        code:
            "    push d\n"+
            "    push h\n"+
            "    pop d\n"+
            "    pop b\n"+
            "    mvi a,16\n"+
            "    lxi h,0\n"+
            "    jmp div16_skip\n"+
            "div16_loop:\n"+
            "    dad b\n"+
            "div16_lop2:   \n"+
            "    pop psw\n"+
            "    dcr a\n"+
            "    rz\n"+
            "div16_skip:\n"+
            "    push psw\n"+
            "    xchg\n"+
            "    dad h\n"+
            "    xchg\n"+
            "    jnc div16_adc\n"+
            "    dad h\n"+
            "    inx h\n"+
            "    jmp div16_adskip\n"+
            "div16_adc:\n"+
            "    dad h\n"+
            "div16_adskip:    \n"+
            "    ;sbc hl,bc\n"+
            "    mov a,l\n"+
            "    sub c\n"+
            "    mov l,a\n"+
            "    mov a,h\n"+
            "    sbb b\n"+
            "    mov h,a\n"+
            "    jc div16_loop\n"+
            "    inr e\n"+
            "    jmp div16_lop2        \n"
    },

    "s_lut":{
        uses:null,
        code:
        "\txchg\n"+
        "\tlxi b,datatable+2\n"+
        "lut_l:\n"+
        "\tldax b\n"+
        "\tmov l,a\n"+
        "\tinx b\n"+
        "\tldax b\n"+
        "\tmov h,a\n"+
        "\tora l\n"+
        "\tjz lut_prev\n"+
        "\tmov a,h\n"+
        "\tcmp d\n"+
        "\tjc lut_prev\n"+
        "\tmov a,l\n"+
        "\tcmp e   \n"+
        "\tjnc lut_next\n"+
        "lut_prev:\n"+
        "\tdcx b\n"+
        "\tdcx b\n"+
        "\tldax b\n"+
        "\tmov h,a\n"+
        "\tdcx b\n"+
        "\tldax b\n"+
        "\tmov l,a\n"+
        "\tora h\n"+
        "\tret\n"+
        "lut_next:\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tinx b\n"+
        "\tjmp lut_l\n"
    },

    "s_read": {
        uses:null,
        code:
        "\tlhld datapoint\n\tmov e,m\n\tinx h\n\tmov d,m\n\tinx h\n"+
        "\tshld datapoint\n\txchg\n"+
        "\tret\n"
    },

    "s_strcpy": {
        uses:null,
        code:
    "    push h\n"+
    "s_strcpy2:\n"+
    "    ldax d\n"+
    "    mov m,a\n"+
    "    ora a\n"+
    "    jz strcpe\n"+
    "    inx d\n"+
    "    inx h\n"+
    "    jmp s_strcpy2\n"+
    "strcpe:\n"+
    "    pop h\n"+
    "    ret        \n"
    },
    "s_div10": {
        uses:null,
        code: ""+
        "\tmvi c,10\n"+

        "\tmvi b,16\n"+
        "\txra a\n"+
        "s_d10_1:dad h\n"+
        "\tral\n"+
        "\tcmp c\n"+
        "\tjc s_d10_2\n"+
        "\tinr l\n"+
        "\tsub c\n"+
        "s_d10_2: dcr b\n"+

        "\tjnz s_d10_1\n"+     
        "\tRET\n"
    },  

    "s_mul10": {
        uses:null,
        code: ""+
        "    push d\n"+
        "    dad h\n"+
        "    mov d,h\n"+
        "    mov e,l\n"+
        "    dad h\n"+
        "    dad h\n"+
        "    dad d\n"+
        "    pop d\n"+
        "    ret\n"
    },  
    "s_mul10add": {
        uses:null,
        code: ""+
        "    push d\n"+
        "    dad h\n"+
        "    mov d,h\n"+
        "    mov e,l\n"+
        "    dad h\n"+
        "    dad h\n"+
        "    dad d\n"+
        "    pop d\n"+
        "    dad d\n"+
        "    ret\n"
    },  

    "s_check": {
        uses:["erridx"],
        code: ""+
        "    mov a,h\n"+
        "    cmp b\n"+
        "    jc s_c_g\n"+
        "    mov a,l\n"+
        "    cmp c\n"+
        "    jnc erridx\n"+
        "s_c_g:\n"+
        "    dad h\n"+
        "    dad d\n"+
        "    ret\n"
    },  


    //operators
    "o_logic": {
        uses:null,
        code: "olofix: LXI B,8000h\n\tDAD B\n\tXCHG\n\tDAD B\n\tXCHG\n\tRET\n"+
        "dofalse: LXI H,0\n\tRET\n"+
        "dotrue: LXI H,1\n"+
        "\tRET\n"
    },    
    "o_lt": {
        uses:["o_logic"],
        code: "\tCALL olofix\n"+
        "\tMOV A,H\n"+
        "\tCMP D\n"+
        "\tJC dofalse\n"+
        "\tJNZ dotrue\n"+
        "\tMOV A,L\n"+
        "\tCMP E\n"+
        "\tJZ dofalse\n"+
        "\tJC dofalse\n"+
        "\tJMP dotrue\n"
    },
    "o_ge": {
        uses:["o_logic"],
        code: "\tCALL olofix\n"+
        "\tMOV A,H\n"+
        "\tCMP D\n"+
        "\tJC dotrue\n"+
        "\tJNZ dofalse\n"+
        "\tMOV A,L\n"+
        "\tCMP E\n"+
        "\tJZ dotrue\n"+
        "\tJC dotrue\n"+
        "\tJMP dofalse\n"
    },
    "o_gt": {
        uses:["o_logic"],
        code: "\tCALL olofix\n"+
        "\tMOV A,D\n"+
        "\tCMP H\n"+
        "\tJC dofalse\n"+
        "\tJNZ dotrue\n"+
        "\tMOV A,E\n"+
        "\tCMP L\n"+
        "\tJZ dofalse\n"+
        "\tJC dofalse\n"+
        "\tJMP dotrue\n"
    },
    "o_le": {
        uses:["o_logic"],
        code: "\tCALL olofix\n"+
        "\tMOV A,D\n"+
        "\tCMP H\n"+
        "\tJC dotrue\n"+
        "\tJNZ dofalse\n"+
        "\tMOV A,E\n"+
        "\tCMP L\n"+
        "\tJZ dotrue\n"+
        "\tJC dotrue\n"+
        "\tJMP dofalse\n"
    },
    "o_eq": {
        uses:["o_logic"],
        code: "\tMOV A,L\n"+
        "\tCMP E\n"+
        "\tJNZ dofalse\n"+
        "\tMOV A,H\n"+
        "\tCMP D\n"+
        "\tJNZ dofalse\n"+
        "\tJMP dotrue\n"
    },
    "o_neq": {
        uses:["o_logic"],
        code: "\tMOV A,L\n"+
        "\tCMP E\n"+
        "\tJNZ dotrue\n"+
        "\tMOV A,H\n"+
        "\tCMP D\n"+
        "\tJNZ dotrue\n"+
        "\tJMP dofalse\n"
    },

    "o_streq": {
        uses:["o_logic"],
        code: "\tLDAX D\n"+
        "\tCMP M\n"+
        "\tJNZ dofalse\n"+
        "\tORA A\n"+
        "\tJZ dotrue\n"+
        "\tINX D\n"+
        "\tINX H\n"+
        "\tJMP o_streq\n"
    },


    "o_add": {
        uses:null,
        inline:true,
        code: "\tDAD D\t;o_add\n"+
        ""+
        ""
    },
    "o_mul": {
        uses:["mul16","errovfl","f_abs"],
        code: 
            "    mov a,h\n"+
            "    xra d\n"+
            "    ani 80h\n"+
            "    jm o_mul_minus\n"+
            "    call o_mulabs\n"+
            "    mov a,d\n"+
            "    ora e\n"+
            "    jnz errovfl\n"+
            "    RET\n"+
            "o_mul_minus:\n"+
            "    call o_mulabs\n"+
            "    mov a,d\n"+
            "    ora e\n"+
            "    jnz errovfl\n"+
            "    mov a,h\n"+
            "    cma\n"+
            "    mov h,a\n"+
            "    mov a,l\n"+
            "    cma\n"+
            "    mov l,a\n"+
            "    inx h\n"+
            "    RET\n"+
            "o_mulabs:\n"+
            "    call f_abs\n"+
            "    xchg \n"+
            "    call f_abs\n"+
            "    jmp mul16\n"
        },
    "o_sub": {
        uses:null,
        inline:true,
        code: ""+
        "\tMOV A, E\n"+
        "\tSUB L\n"+
        "\tMOV L, A\n"+
        "\tMOV A, D\n"+
        "\tSBB H\n"+
        "\tMOV H, A\n"
    },

    "o_div": {
        uses:["div16","errdiv","f_abs"],
        code: 
            "    mov a,h\n"+
            "    ora l\n"+
            "    jz errdiv\n"+
            "    mov a,h\n"+
            "    xra d\n"+
            "    ani 80h\n"+
            "    jm o_div_minus\n"+
            "    call o_divabs\n"+
            "    xchg\n"+
            "    RET\n"+
            "o_div_minus:\n"+
            "    call o_divabs\n"+
            "    xchg\n"+
            "    mov a,h\n"+
            "    cma\n"+
            "    mov h,a\n"+
            "    mov a,l\n"+
            "    cma\n"+
            "    mov l,a\n"+
            "    inx h\n"+
            "    RET\n"+
            "o_divabs:\n"+
            "    call f_abs\n"+
            "    xchg \n"+
            "    call f_abs\n"+
            "    jmp div16\n"
        },
        "o_mod": {
            uses:["div16","errdiv","f_abs"],
            code: 
                "    mov a,h\n"+
                "    ora l\n"+
                "    jz errdiv\n"+
                "    mov a,h\n"+
                "    xra d\n"+
                "    ani 80h\n"+
                "    jm o_mod_minus\n"+
                "    call o_modabs\n"+
                "    RET\n"+
                "o_mod_minus:\n"+
                "    call o_modabs\n"+
                "    mov a,h\n"+
                "    cma\n"+
                "    mov h,a\n"+
                "    mov a,l\n"+
                "    cma\n"+
                "    mov l,a\n"+
                "    inx h\n"+
                "    RET\n"+
                "o_modabs:\n"+
                "    call f_abs\n"+
                "    xchg \n"+
                "    call f_abs\n"+
                "    jmp div16\n"
            },
        "o_concat": {
        uses:["__heap"],
        code: ""+
            "        push h\n"+
            "        push d\n"+
            "        lxi b,0\n"+
            "    o_cc_cnt:\n"+
            "        mov a,m\n"+
            "        inx h\n"+
            "        ora a\n"+
            "        jz o_cc_cnt1\n"+
            "        inx b\n"+
            "        jmp o_cc_cnt\n"+
            "    o_cc_cnt1:\n"+
            "        ldax d\n"+
            "        inx d\n"+
            "        ora a\n"+
            "        jz o_cc_a\n"+
            "        inx b\n"+
            "        jmp o_cc_cnt1\n"+
            "    o_cc_a:\n"+
            "        inx b\n"+
            "        call hp_a\n"+
            "        push h\n"+
            "        pop b\n"+
            "        pop d\n"+
            "    o_cc_l1:\n"+
            "        ldax d\n"+
            "        ora a\n"+
            "        jz o_cc_l2\n"+
            "        mov m,a\n"+
            "        inx d\n"+
            "        inx h\n"+
            "        jmp o_cc_l1\n"+
            "    o_cc_l2:\n"+
            "        pop d\n"+
            "    o_cc_l3:\n"+
            "        ldax d\n"+
            "        ora a\n"+
            "        mov m,a\n"+
            "        jz o_cc_l4\n"+
            "        inx d\n"+
            "        inx h\n"+
            "        jmp o_cc_l3\n"+
            "    o_cc_l4:\n"+
            "        push b\n"+
            "        pop h\n"+
        "\tRET\n"
    },

    "mkslice": {
        uses:["__heap"],
        code:
        "\tMOV A,B\n"+
        "\tORA C\n"+
        "\tJZ mks_skip\n"+
        "\tDCX B\n"+
        "\tDCX D\n"+
        "\tINX H\n"+
        "\tJMP mkslice\n"+
        "mks_skip:\n"+
        "\tINX D\n"+
        "\t;maximum\n"+
        "\tpush h\n"+
        "\t;lxi b,0\n"+
        "mks_fix:\n"+
        "\tmov a,m\n"+
        "\tora a\n"+
        "\tjz mks_m\n"+
        "\tinx h\n"+
        "\tinx b\n"+
        "\tdcx d\n"+
        "\tmov a,d\n"+
        "\tora e\n"+
        "\tjnz mks_fix\n"+
        "mks_m:\n"+
        "\tpop h\n"+
        "\tPUSH B\n"+
        "\tPUSH H\n"+
        "\tCALL hp_a\n"+
        "\tPOP D\n"+
        "\tPOP B\n"+
        "\tPUSH H\n"+
        "mks_loop:\n"+
        "\tMOV A,B\n"+
        "\tORA C\n"+
        "\tJZ mks_end0\n"+
        "\tLDAX D\n"+
        "\tMOV M,A\n"+
        "\tORA A\n"+
        "\tJZ mks_end\n"+
        "\tDCX B\n"+
        "\tINX D\n"+
        "\tINX H\n"+
        "\tJMP mks_loop\n"+
        "mks_end0:\n"+
        "\tMVI M,0\n"+
        "mks_end:\n"+
        "\tPOP H\n"+
        "\tRET\n"

    },

    "stslice": {
        uses:["__heap"],
        code:
        "\tMOV A,B\n"+
        "\tORA C\n"+
        "\tJZ sts_skip\n"+
        "\tDCX B\n"+
        "\tDCX D\n"+
        "\tINX H\n"+
        "\tJMP stslice\n"+
        "sts_skip:\n"+
        "\tINX D\n"+
        "\tpush h\n"+
        "\t;lxi b,0\n"+
        "sts_fix:\n"+
        "\tmov a,m\n"+
        "\tora a\n"+
        "\tjz sts_m\n"+
        "\tinx h\n"+
        "\tinx b\n"+
        "\tdcx d\n"+
        "\tmov a,d\n"+
        "\tora e\n"+
        "\tjnz sts_fix\n"+
        "sts_m:\n"+
        "\tpop h\n"+
        "\tRET\n"
    },

    "stcpy": {
        uses:["__heap"],
        code: 
            "\tMOV A,M\n"+
            "\tORA A\n"+
            "\tJZ stcp_d\n"+
            "\tLDAX D\n"+
            "\tORA A\n"+
            "\tJZ stcp_d\n"+
            "\tMOV M,A\n"+
            "\tINX H\n"+
            "\tINX D\n"+
            "\tDCX B\n"+
            "\tMOV A,B\n"+
            "\tORA C\n"+
            "\tJNZ stcpy\n"+
            "stcp_d: RET\n"

    },

    //clone string to the heap
    //input h:origin
    //output h:clone
    "strclone": {
        uses:["__heap"],
        code: 
        "\tLXI B,0\n"+
        "\tPUSH H\n"+
        "strc_len: MOV A,M\n"+
        "\tORA A\n"+
        "\tJZ strc_g\n"+
        "\tINX B\n"+
        "\tINX H\n"+
        "\tJMP strc_len\n"+
        "strc_g: MOV A,B\n"+
        "\tORA C\n"+
        "\tRZ\n"+
        "\tCALL hp_a\n"+
        "\tPOP D\n"+
        "\tPUSH H\n"+
        "strc_c: LDAX D\n"+
        "\tORA A\n"+
        "\tJZ strc_f\n"+
        "\tMOV M,A\n"+
        "\tINX H\n"+
        "\tINX D\n"+
        "\tJMP strc_c\n"+
        "strc_f: POP H\n"+
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
        code: "\tMOV A,H\n"+
        "\tORA A\n"+
        "\tRP\n"+
        "\tCMA\n"+
        "\tMOV H,A\n"+
        "\tMOV A,L\n"+
        "\tCMA\n"+
        "\tMOV L,A\n"+
        "\tINX H\n"+
        "\tRET\n"
    },
    "f_neg": {
        uses:null,
        code: "\tMOV A,H\n"+
        "\tCMA\n"+
        "\tMOV H,A\n"+
        "\tMOV A,L\n"+
        "\tCMA\n"+
        "\tMOV L,A\n"+
        "\tINX H\n"+
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
    "s_getaddr":{
        uses:null,
        code: "\tDAD D\t;o_add\n"+
        "\tMOV E,M\n"+
        "\tINX H\n"+
        "\tMOV D,M\n"+
        "\tXCHG\n"+
        "\tRET\n"
    },
    "f_peek":{
        uses:null,
        code: "\tMOV A,M\n"+
        "\tMVI H,0\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },
    "f_in":{
        uses:null,
        sysdq:["iofix"],
        code: "\tMOV A,L\n"+
        "\tLXI H,00dbh\n"+
        "\tSHLD sv_iofix\n"+
        "\tMVI L,0c9h\n"+
        "\tSHLD sv_iofix+2\n"+
        "\tSTA sv_iofix+1\n"+
        "\tCALL sv_iofix\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },
    "f_dpeek":{
        uses:null,
        code: "\tMOV A,M\n"+
        "\tINX H\n"+
        "\tMOV H,M\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },
    "f_len": {
        uses:[],
        code: "\tPUSH D\n"+
        "\tLXI D,0\n"+
        "f_ll:MOV A,M\n"+
        "\tORA A\n"+
        "\tJZ f_le\n"+
        "\tINX D\n"+
        "\tINX H\n"+
        "\tJMP f_ll\n"+
        "f_le:\tXCHG\n"+
        "\tPOP D\n"+
        "\tRET\n"
    },        
    "f_val": {
        uses:["s_mul10add","f_neg"],
        code: "\tpush d\n"+
        "    mvi c,0 ;sign\n"+
        "    lxi d,0\n"+
        "    mov a,m\n"+
        "    cpi 2Dh ;-\n"+
        "    jnz f_v_c1\n"+
        "    inx h\n"+
        "    mvi c,1 ;sign\n"+
        "f_v_c:    \n"+
        "    mov a,m\n"+
        "f_v_c1:    \n"+
        "    ora a\n"+
        "    jz f_v_ret\n"+
        "    cpi 30h ;0\n"+
        "    jc f_v_ret\n"+
        "    cpi 3ah\n"+
        "    jnc f_v_ret\n"+
        "    push h\n"+
        "    xchg\n"+
        "    sui 30h\n"+
        "    mov e,a\n"+
        "    mvi d,0\n"+
        "    call s_mul10add\n"+
        "    xchg\n"+
        "    pop h\n"+
        "    inx h\n"+
        "    jmp f_v_c\n"+
        "f_v_ret:\n"+
        "    xchg\n"+
        "\tpop d\n"+
        "    mov a,c\n"+
        "    ora a\n"+
        "    rz\n"+
        "    jmp f_neg\n"
    },  
    "f_low": {
        uses:null,
        inline:true,
        code: "\tMVI H,0\n"
    },            
    "f_high": {
        uses:null,
        inline:true,
        code: "\tMOV L,H\n\tMVI H,0\n"
    },            
    "f_chrS": {
        uses:["__heap"],
        code: "\tMOV A,L\n"+
        "\tpush psw\n"+
        "\tlxi b,2\n"+
        "\tcall hp_a\n"+
        "\tpop psw\n"+
        "\tmov m,a\n"+
        "\tinx h\n"+
        "\tmvi m,0\n"+
        "\tdcx h\n"+
        "\tRET\n"
    },      
}
