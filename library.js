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
    "__heap": {
        code:
        ";heap management 1.0\n"+
        "        HP_INIT:            \n"+
        "\n"+
        "        LXI     H,((RAMTOP-HEAP)&0xfffe)-4 \n"+
        "        SHLD    HEAP \n"+
        "        LXI     H,HEAP \n"+
        "        CALL    hp_n \n"+
        "        MVI     A,0FFh \n"+
        "        MOV     m,a \n"+
        "        INX     h \n"+
        "        MOV     m,a \n"+
        "        RET \n"+
        "HP_F:       LXI     H,HEAP+1 \n"+
        "HP_F2:              \n"+
        "        MOV     d,m \n"+
        "        DCX     h \n"+
        "        MOV     e,m \n"+
        "        MOV     A,E \n"+
        "        ANI     01h ;0=empty,1=full\n"+
        "        RET     \n"+
        "HP_N:               \n"+
        "        MOV     A,M \n"+
        "        ANI     0FEh\n"+
        "        MOV     E,A \n"+
        "        INX     H \n"+
        "        MOV     D,M \n"+
        "        DCX     H \n"+
        "        DAD     D \n"+
        "        INX     H \n"+
        "        INX     H \n"+
        "        INX     H \n"+
        "        JMP     HP_F2 \n"+
        "\n"+
        "HP_FE:\n"+
        "        CALL    hp_f \n"+
        "HP_FE2:             \n"+
        "        RZ\n"+
        "        MOV     a,d \n"+
        "        ANA     e \n"+
        "        INR     a \n"+
        "        JZ      ERRGO \n"+
        "HP_FEN:             \n"+
        "        CALL    hp_n \n"+
        "        JMP     hp_fe2 \n"+
        "HP_FREE:\n"+
        "        MOV     a,m \n"+
        "        ANI     0feh \n"+
        "        MOV     m,a \n"+
        "HP_FRE2:    CALL    hp_join \n"+
        "        JNZ     hp_fre2 \n"+
        "        RET     \n"+
        "HP_JOIN:            \n"+
        "        CALL    hp_fe \n"+
        "HP_J0:              \n"+
        "        PUSH    h \n"+
        "        CALL    hp_n \n"+
        "        JZ      hp_j \n"+
        "        MOV     a,e \n"+
        "        ANA     d \n"+
        "        INR     a \n"+
        "        POP     d \n"+
        "        RZ      \n"+
        "        CALL    hp_fe2 \n"+
        "        JMP     hp_j0 \n"+
        "HP_J:               \n"+
        "        POP     h \n"+
        "        MOV     a,e \n"+
        "        ADD     m \n"+
        "        MOV     e,a \n"+
        "        INX     h \n"+
        "        MOV     a,d \n"+
        "        ADC     m \n"+
        "        MOV     d,a \n"+
        "        INX     d \n"+
        "        INX     d \n"+
        "        MOV     m,d \n"+
        "        DCX     h \n"+
        "        MOV     m,e \n"+
        "        ORI     1 ; Z=0\n"+
        "        RET     \n"+
        "HP_A:\n"+
        "        MOV     a,c \n"+
        "        RRC     \n"+
        "        JNC     hp_aeven \n"+
        "        INX     b \n"+
        "HP_AEVEN:           \n"+
        "        CALL    hp_fe \n"+
        "HP_ALOP:            \n"+
        "        MOV     a,d \n"+
        "        CMP     b \n"+
        "        JC      hp_alow \n"+
        "        JNZ     hp_amore \n"+
        "        MOV     a,e \n"+
        "        CMP     c \n"+
        "        JNC     hp_amore \n"+
        "HP_ALOW:\n"+
        "        CALL    hp_fen \n"+
        "        JMP     hp_alop \n"+
        "HP_AMORE:           \n"+
        "        MOV     a,e \n"+
        "        SUB     c \n"+
        "        MOV     e,a \n"+
        "        MOV     a,d \n"+
        "        SBB     b \n"+
        "        MOV     d,a \n"+
        "        DCX     d \n"+
        "        DCX     d \n"+
        "        PUSH    h \n"+
        "        DAD     b\n"+
        "        INX     h \n"+
        "        INX     h \n"+
        "        MOV     m,e \n"+
        "        INX     h \n"+
        "        MOV     m,d \n"+
        "        INX     b \n"+
        "        POP     h \n"+
        "        MOV     m,c \n"+
        "        INX     h \n"+
        "        MOV     m,b \n"+
        "        INX     h\n"+
        "        RET     \n"+
        "hp_test:\n"+
        "        push d\n"+
        "        lxi d,HEAP\n"+
        "        mov a,h\n"+
        "        cmp d\n"+
        "        jc hp_noheap\n"+
        "        mov a,l\n"+
        "        cmp e\n"+
        "        jc hp_noheap\n"+
        "        dcx h\n"+
        "        dcx h\n"+
        "        call hp_free\n"+
        "        \n"+
        "hp_noheap: \n"+
        "        pop d\n"+
        "        ret        \n"+
        "HP_DONE:            \n"

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
    "printtab": {
        uses:["serout"],
        code: "\tMVI A,20h\n"+
        "\tCALL SEROUT\n"+
        "\tMVI A,09h\n"+
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

    //SYSTEM
    "serout": {
        uses:null,
        sysdb:["prtchan"],
        code: ""+
        "\tRST 1\n"+
        "\tRET\n"
    },
    "serin": {
        uses:null,
        sysdb:["prtchan"],
        code: "\tIN 0deh ;acias\n"+
        "\tani 1\n"+
        "\trz\n"+
        "\tin 0dfh ;aciad\n"+
        "\tora a\n"+
        "\tRET\n"
    },
    "s_strcpy": {
        uses:null,
        code:
    "    ldax d\n"+
    "    mov m,a\n"+
    "    ora a\n"+
    "    jz strcpe\n"+
    "    inx d\n"+
    "    inx h\n"+
    "    jmp s_strcpy\n"+
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
        "\tCMP D\n"+
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
        "\tCMP D\n"+
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
        uses:null,
        code: ""+
        ""+
        "\tRET\n"
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
        uses:["s_mul10add"],
        code: "\tpush d\n"+
        "    lxi d,0\n"+
        "f_v_c:    \n"+
        "    mov a,m\n"+
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
        "    ret\n"
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
