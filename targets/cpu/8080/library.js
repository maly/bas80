// a big library

var LIB = {
    /***
     * Methods:
     * hp_init initialize the heap
     *
     * hp_a allocate at least bc bytes on heap,
     * returns address of the first free byte in hl
     *
     * hp_free frees the allocated space (hl)
     *
     * hp_assign sets hl space as assigned to variable
     * hp_unass sets hl space as unassigned
     *
     * hp_gc marks all unallocated spaces as free and join them
     *
     */
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
    /**
     * Prints ASCIIZ string from hl to serial port (chan #0)
     */
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
   /**
    * Print signed int from hl to serial #0
    */
   "printint": {
    uses:["serout","f_abs"],
    code: ""+
    "\tMOV a,h \n"+
    "\tORA a \n"+
    "\tJP  pipos \n"+
    "\tMVI a,2Dh ;- \n"+
    "\tCALL serout\n"+
    "\tCALL f_abs \n"+
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
    /**
     * set print channel
     */
    "prtchan": {
        uses:null,
        sysdb:["prtchan"],
        code: "\tMOV A,L\n"+
        "\tSTA sv_prtchan\n"+
        "\tRET\n"
    },
    /**
     * Print newline to serial port
     */
    "println": {
        uses:["serout"],
        code: "\tMVI A,0Dh\n"+
        "\tCALL SEROUT\n"+
        "\tMVI A,0Ah\n"+
        "\tJMP SEROUT\n"
        //"\tCALL SEROUT\n"+
        //"\tRET\n"
    },
    "printtab": {
        uses:["serout"],
        code: "\tMVI A,20h\n"+
        "\tCALL SEROUT\n"+
        "\tMVI A,09h\n"+
        "\tJMP SEROUT\n"
        //"\tCALL SEROUT\n"+
        //"\tRET\n"
    },
    "printcomma": {
        uses:["serout"],
        code: "\tMVI A,2ch ;comma\n"+
        "\tJMP SEROUT\n"
        //"\tCALL SEROUT\n"+
        //"\tRET\n"
    },
    "printquot": {
        uses:["serout"],
        code: "\tMVI A,22h ;quot\n"+
        "\tJMP SEROUT\n"
        //"\tCALL SEROUT\n"+
        //"\tRET\n"
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

    //EXCEPTION mgmt

    "exception": {
      uses:["printstr"],
      code:
      "\tLHLD savesp\n"+
      "\tSPHL\n"+
      "\tPUSH B\n"+
      "\tINR B\n"+
      "\tLXI H,emsg\n"+
      "ex_again: MOV E,M\n"+
      "\tINX H\n"+
      "\tMOV D,M\n"+
      "\tINX H\n"+
      "\tMOV A,E\n"+
      "\tORA D\n"+
      "\tJZ exc_out\n"+
      "\tDCR B\n"+
      "\tJNZ ex_again\n"+
      "\tXCHG\n"+
      "\tcall printstr\n"+
      "\tjmp errgo\n"+
      "exc_out: POP B\n"+
      "\tJMP errgo\n"+
      "emsg: DW e_ovfl, e_idx, e_div, e_oom, e_data,e_stop\n"+
      "\tDW 0\n"+
      "e_ovfl: .cstr \"MULT OVFL\"\n"+
      "e_idx: .cstr \"INDEX OUT OF LIMITS\"\n"+
      "e_div: .cstr \"DIV BY ZERO\"\n"+
      "e_oom: .cstr \"OUT OF MEMORY\"\n"+
      "e_data: .cstr \"NO DATA\"\n"+
      "e_stop: .cstr \"STOP\"\n"
    },

    //ERROR management
/*
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
    */
    "errovfl": {
      uses:["exception"],
      code:
      "\tmvi b,0\n"+
      "\tjmp exception\n"
  },


    "erridx": {
        uses:["exception"],
        code:
        "\tmvi b,1\n"+
        "\tjmp exception\n"
    },
    "errdiv": {
        uses:["exception"],
        code:
        "\tmvi b,2\n"+
        "\tjmp exception\n"
    },
    "erroom": {
        uses:["exception"],
        code:
        "\tmvi b,3\n"+
        "\tjmp exception\n"
    },
    "errnodata": {
        uses:["exception"],
        code:
        "\tmvi b,4\n"+
        "\tjmp exception\n"

    },
    "errstop": {
      uses:["exception"],
      code:
      "\tmvi b,5\n"+
      "\tjmp exception\n"

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

    /**
     * BASIC operators
     * HL, DE are operands
     */

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

    "o_bitand": {
        uses:null,
        code:
        "\tMOV A,H\n"+
        "\tANA D\n"+
        "\tMOV H,A\n"+
        "\tMOV A,L\n"+
        "\tANA E\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },

    "o_bitor": {
        uses:null,
        code:
        "\tMOV A,H\n"+
        "\tORA D\n"+
        "\tMOV H,A\n"+
        "\tMOV A,L\n"+
        "\tORA E\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },

    "o_bitxor": {
        uses:null,
        code:
        "\tMOV A,H\n"+
        "\tXRA D\n"+
        "\tMOV H,A\n"+
        "\tMOV A,L\n"+
        "\tXRA E\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },

    "o_and":{
        uses:null,
        code:
        "\tMOV A,H\n"+
        "\tORA L\n"+
        "\tRZ\n"+
        "\tXCHG\n"+
        "\tRET\n"
    },

    "o_or":{
        uses:null,
        code:
        "\tMOV A,H\n"+
        "\tORA L\n"+
        "\tRNZ\n"+
        "\tXCHG\n"+
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
        uses:["mul16","errovfl","f_abs"],
        code:
            "\tmov a,h\n"+
            "\txra d\n"+
            "\tani 80h\n"+
            "\tjm o_mul_minus\n"+
            "\tcall o_mulabs\n"+
            "\tmov a,d\n"+
            "\tora e\n"+
            "\tjnz errovfl\n"+
            "\tRET\n"+
            "o_mul_minus:\n"+
            "\tcall o_mulabs\n"+
            "\tmov a,d\n"+
            "\tora e\n"+
            "\tjnz errovfl\n"+
            "\tmov a,h\n"+
            "\tcma\n"+
            "\tmov h,a\n"+
            "\tmov a,l\n"+
            "\tcma\n"+
            "\tmov l,a\n"+
            "\tinx h\n"+
            "\tRET\n"+
            "o_mulabs:\n"+
            "\tcall f_abs\n"+
            "\txchg \n"+
            "\tcall f_abs\n"+
            "\tjmp mul16\n"
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
            "\tmov a,h\n"+
            "\tora l\n"+
            "\tjz errdiv\n"+
            "\tmov a,h\n"+
            "\txra d\n"+
            "\tani 80h\n"+
            "\tjm o_div_minus\n"+
            "\tcall o_divabs\n"+
            "\txchg\n"+
            "\tRET\n"+
            "o_div_minus:\n"+
            "\tcall o_divabs\n"+
            "\txchg\n"+
            "\tmov a,h\n"+
            "\tcma\n"+
            "\tmov h,a\n"+
            "\tmov a,l\n"+
            "\tcma\n"+
            "\tmov l,a\n"+
            "\tinx h\n"+
            "\tRET\n"+
            "o_divabs:\n"+
            "\tcall f_abs\n"+
            "\txchg \n"+
            "\tcall f_abs\n"+
            "\tjmp div16\n"
    },
    "o_mod": {
        uses:["div16","errdiv","f_abs"],
        code:
            "\tmov a,h\n"+
            "\tora l\n"+
            "\tjz errdiv\n"+
            "\tmov a,h\n"+
            "\txra d\n"+
            "\tani 80h\n"+
            "\tjm o_mod_minus\n"+
            "\tcall o_modabs\n"+
            "\tRET\n"+
            "o_mod_minus:\n"+
            "\tcall o_modabs\n"+
            "\tmov a,h\n"+
            "\tcma\n"+
            "\tmov h,a\n"+
            "\tmov a,l\n"+
            "\tcma\n"+
            "\tmov l,a\n"+
            "\tinx h\n"+
            "\tRET\n"+
            "o_modabs:\n"+
            "\tcall f_abs\n"+
            "\txchg \n"+
            "\tcall f_abs\n"+
            "\tjmp div16\n"
        },

    /**
     * Concatenate two strings DE, HL to one new at heap
     */
    "o_concat": {
    uses:["__heap"],
    inlinable:true,
    code: ""+
        "\tpush h\n"+
        "\tpush d\n"+
        "\tlxi b,0\n"+
        "o_cc_cnt:\n"+
        "\tmov a,m\n"+
        "\tinx h\n"+
        "\tora a\n"+
        "\tjz o_cc_cnt1\n"+
        "\tinx b\n"+
        "\tjmp o_cc_cnt\n"+
        "o_cc_cnt1:\n"+
        "\tldax d\n"+
        "\tinx d\n"+
        "\tora a\n"+
        "\tjz o_cc_a\n"+
        "\tinx b\n"+
        "\tjmp o_cc_cnt1\n"+
        "o_cc_a:\n"+
        "\tinx b\n"+
        "\tcall hp_a\n"+
        "\tpush h\n"+
        "\tpop b\n"+
        "\tpop d\n"+
        "o_cc_l1:\n"+
        "\tldax d\n"+
        "\tora a\n"+
        "\tjz o_cc_l2\n"+
        "\tmov m,a\n"+
        "\tinx d\n"+
        "\tinx h\n"+
        "\tjmp o_cc_l1\n"+
        "o_cc_l2:\n"+
        "\tpop d\n"+
        "o_cc_l3:\n"+
        "\tldax d\n"+
        "\tora a\n"+
        "\tmov m,a\n"+
        "\tjz o_cc_l4\n"+
        "\tinx d\n"+
        "\tinx h\n"+
        "\tjmp o_cc_l3\n"+
        "o_cc_l4:\n"+
        "\tpush b\n"+
        "\tpop h\n"+
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
    /**
     * Raw string copy from HL to DE
     */
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

    /**
     * clone string to the heap
     * input h:origin
     * output h:clone
     */
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
    /**
     * BASIC functions
     * String functions has suffix S
     */
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
        //sysdw:["seed1","seed2"],
        inlinable:true,
        code: ""+
        "\tLHLD sv_seed1\n"+
        "\tMOV b,h\n"+
        "\tMOV c,l\n"+
        "\tdad h\n"+
        "\tdad h\n"+
        "\tinr l\n"+
        "\tdad b\n"+
        "\tshld sv_seed1\n"+
        "\tlhld sv_seed2\n"+
        "\tdad h\n"+
        "\tsbb a\n"+
        "\tani 00101101b\n"+
        "\txra l\n"+
        "\tmov l,a\n"+
        "\tshld sv_seed2\n"+
        "\tdad b\n"+
        "\tRET\n"
    },
    /*
    "s_getaddr":{
        uses:null,
        code: "\tDAD D\t;o_add\n"+
        "\tMOV E,M\n"+
        "\tINX H\n"+
        "\tMOV D,M\n"+
        "\tXCHG\n"+
        "\tRET\n"
    },
    */
    "f_peek":{
        uses:null,
        code: "\tMOV A,M\n"+
        "\tMVI H,0\n"+
        "\tMOV L,A\n"+
        "\tRET\n"
    },
    "f_malloc":{
      uses:["__heap"],
      code: "\tMOV C,L\n"+
      "\tMOV B,H\n"+
      "\tJMP hp_a\n"
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
    "f_asc": {
        uses:[],
        code: "\tMOV L,M\n"+
        "\tMVI H,0\n"+
        "\tRET\n"
    },
    "f_val": {
        uses:["s_mul10add","f_neg"],
        code: "\tpush d\n"+
        "\nmvi c,0 ;sign\n"+
        "\nlxi d,0\n"+
        "\nmov a,m\n"+
        "\ncpi 2Dh ;-\n"+
        "\njnz f_v_c1\n"+
        "\ninx h\n"+
        "\nmvi c,1 ;sign\n"+
        "f_v_c:\n"+
        "\nmov a,m\n"+
        "f_v_c1:\n"+
        "\nora a\n"+
        "\njz f_v_ret\n"+
        "\ncpi 30h ;0\n"+
        "\njc f_v_ret\n"+
        "\ncpi 3ah\n"+
        "\njnc f_v_ret\n"+
        "\npush h\n"+
        "\nxchg\n"+
        "\nsui 30h\n"+
        "\nmov e,a\n"+
        "\nmvi d,0\n"+
        "\ncall s_mul10add\n"+
        "\nxchg\n"+
        "\npop h\n"+
        "\ninx h\n"+
        "\njmp f_v_c\n"+
        "f_v_ret:\n"+
        "\nxchg\n"+
        "\tpop d\n"+
        "\nmov a,c\n"+
        "\nora a\n"+
        "\nrz\n"+
        "\njmp f_neg\n"
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
    }
}

if (typeof module != 'undefined') module.exports = LIB
