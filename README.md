# BASIC80

The BASIC compiler for 8bit CPUs

Version 0

## Features:

- Numbers can be decimal (123, -456) or hexadecimal ($BEEF)
- You can omit the line number, if it is not necessary
- The output is compatible with ASM80 syntax
- Case insensitive (you can write PRINT as well as print or Print)

## Limitations:

- Integer numbers only
- Two bytes integer, i.e. -32768 to +32767
- No computed GOTO, GOSUB

## Commands:

### LET var = expression
### LET var$ = string expression

The LET keyword can be omitted.

### PRINT

Can has one or more parameters, delimited with semicolon or comma.

PRINT a,b,c
PRINT a$,b$
PRINT a+b*c
PRINT "Hello,";
PRINT " world."

### INPUT

Allows combine more variables as well as PRINT expressions

INPUT a
INPUT a,b
INPUT "Your name:",a$

### GOTO

Needs a constant target: GOTO 100. No "computed GOTOs"

### GOSUB

Call subroutine at given label. 

### RETURN 

Return from subroutine.

### REM

Remark. Compiler ignores everything after this keyword until the end of line.

### END

End of program, return to the monitor.

### STOP

End of program with a "STOPPED" message.

### FOR var = from TO limit [STEP step]

The essential loop in BASIC.

### NEXT var

Next iteration for the FOR loop.

### REPEAT

The begin of REPEAT - UNTIL loop

### UNTIL cond

If cond is false, jump to the appropriate REPEAT command. Otherwise continues.

### WHILE cond

If cond is false, skip after the appropriate ENDWHILE command. Otherwise continues into the loop.

### ENDWHILE

Goes immediately back to the appropriate WHILE command...

### CONTINUE

Usable in the FOR, REPEAT or WHILE loops. Invoke the next iteration.

### BREAK

Usable in the FOR, REPEAT or WHILE loops. Properly exits the loop.

### POKE addr,val

Store one byte to given address

### DPOKE addr,val

Store two bytes to given address

## FUNCTIONS

### int ABS (int)

Returns the absolute value

### int NEG (int)

Returns the negative value (*-1)

### int RND ()

Returns a pseudorandom number

### int SGN (int)

Number sign. 1 if positive, -1 if negative

### int LEN (string)

Returns the length of string.

### int PEEK (addr)

Returns the byte value at given address

### int DPEEK (addr)

Returns the word value (two bytes) at given address

### int VAL (string)

Returns the decimal value of string.
