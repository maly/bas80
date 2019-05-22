# BASIC80

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/83676d919c364c1fbabb32bc33c0d30d)](https://www.codacy.com/app/maly/bas80?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=maly/bas80&amp;utm_campaign=Badge_Grade)

The BASIC compiler for 8bit CPUs

Version 1 - beta. Use on your own risk.

[A live compiler](https://bas80.com/basic.html)

## Features:

- Numbers can be decimal (123, -456) or hexadecimal ($BEEF)
- You can omit the line number, if it is not necessary
- The output is compatible with ASM80 syntax
- Case insensitive (you can write PRINT as well as print or Print)
- Label can be an integer ("line number") or string (ended with a colon, e.g. `hello:`)
- String slices (like a ZX Spectrum BASIC)
- Data structures
- Named subroutines
- Pointers
- Local variables (very limited)
- Data push and pop (for recursion)
- Heap allocation / free

## Limitations:

- Integer numbers only
- Two bytes integer, i.e. -32768 to +32767
- No computed GOTO, GOSUB

## To do

- Files
- Graphics
- Sound
- Basic objects
- Exceptions

## Commands:

### LET var = expression
### LET var$ = string expression

The LET keyword can be omitted.
Multiple assignment is allowed, just use `LET var[,var,var...]=expr`. Vars have to be scalar int for multiassignment


### PRINT

Can has one or more parameters, delimited with semicolon or comma.

```
PRINT a,b,c
PRINT a$,b$
PRINT a+b*c
PRINT "Hello,";
PRINT " world."
```

[Example](./test/ex01.bas80)

### INPUT

Allows combine more variables as well as PRINT expressions

```
INPUT a
INPUT a,b
INPUT "Your name:",a$
```

[Example](./test/ex02.bas80)


### GOTO

Needs a constant target: `GOTO 100`. No "computed GOTOs" allowed.

[Example](./test/ex03.bas80)


### GOSUB

Call subroutine at given label.

[Example](./test/ex04.bas80)


### RETURN [expr]

Return from subroutine. Expression value is, if used, returned as from function

[Example](./test/ex04.bas80)

### IF expr THEN command[s]

Evaluate expression. If its value is zero, then skip to the next line. If nonzero, continues.

[Example](./test/ex05.bas80)

### IF expr THEN label

Shortcut for `IF expr THEN GOTO label`

### IF expr THEN command[s] ELSE command[s]

Evaluate expression. If its value is zero, then skip to the ELSE part. If nonzero, continues until the ELSE part, then skip to the next line.

`THEN label` and `ELSE label` are the shortcuts for `THEN GOTO label` or `ELSE GOTO label`

### IF expr THEN ... [ELSE ...] ENDIF

A multiline variant of IF-THEN[-ELSE]. E.g.

```
IF a=10 THEN
 ... do something for a=10
ENDIF
```
or
```
IF a=10 THEN
 ... do something for a=10
ELSE
 ... do something for a is not 10
ENDIF
```

### ON expr GOTO l0[,l1...]

Evaluate an expression and GOTO to n-th label. Indexed from 0, so if expr=0, then goto to l0, if expr=1 then goto to l1 etc. You can use up to 128 labels at once. If expr > num of labels, then no goto is performed.

_ON takes only the lower part of expression value. So expr=256 is the same as expr=0._

[Example](./test/ex06.bas80)

### ON expr GOSUB l0[,l1...]

The same as ON expr GOTO, but this time it is calling a subroutine instead the jump.

[Example](./test/ex07.bas80)

### ON ERROR [errnum] GOTO label

It allows overrule the error handling. Instead of message output, it will catch the error and performs GOTO to specified label. There are no warranty about anything (especially the stack), so the safest way is do what is necessary and re-initialization the whole program.

You can specify the error number:

- 0 is for overflow during multiplication
- 1 is for index out of bounds
- 2 is for division by zero
- 3 is for out of memory errror
- 4 is for out of data error
- 5 is for STOP command (it has no common sense at all)
- 6 and 7 are for user-specified exceptions (to be implemented)

[Example](./test/ex20.bas80)

### THROW errnum

Throw an error. Errnum should be in range (0..7), for detail description see above (ON ERROR)

E.g. `THROW 2` simulate the "division by 0" error.

### REM

Remark. Compiler ignores everything after this keyword until the end of line.

### END

End of program, return to the monitor.

### STOP

End of program with a "STOPPED" message.

### FOR var = from TO limit [STEP step]

The essential loop in BASIC.

[Example](./test/ex08.bas80)

### NEXT var

Next iteration for the FOR loop.

### DATA value[,value...]

Define some data and store them into memory

[Example](./test/ex09.bas80)

### READ variable[,variable...]

Reads some data from DATAs

### RESTORE label

Set pointer for READ to the first line with DATA after given label

### READPTR variable, N

Store actual DATA pointer into a variable and move pointer forward by N items.

```
READPTR object, 4
...
sprite:
DATA 1,2,4,4
sprite2:
DATA 10,11,15,27
```

[Example](./test/ex10.bas80)


### BYTE value[,value...]

A non-standard DATA equivalent. Given values are stored as a byte (not two bytes like standard data). So it's not suitable for READ etc. Its aim is to DPTR function to have a method for defining some data tables.

### REPEAT

The begin of REPEAT - UNTIL loop

[Example](./test/ex11.bas80)

### UNTIL cond

If cond is false, jump to the appropriate REPEAT command. Otherwise continues.

### WHILE cond

If cond is false, skip after the appropriate ENDWHILE command. Otherwise continues into the loop.

[Example](./test/ex12.bas80)

### ENDWHILE (alias: WEND)

Goes immediately back to the appropriate WHILE command...

### CONTINUE

Usable in the FOR, REPEAT or WHILE loops. Invoke the next iteration.

[Example](./test/ex13.bas80)

### BREAK

Usable in the FOR, REPEAT or WHILE loops. Properly exits the loop.

### POKE addr,val

Store one byte to given address

[Example](./test/ex14.bas80)

### DPOKE addr,val

Store two bytes to given address

### SYSCALL addr[,HL[,DE[,BC[,A]]]]

System call invoke a subroutine at the given address. You can specify the contents for register pairs HL, DE, BC and A (8080-based and Z80-based systems only)

### OUT port,val

Send one byte to the given I/O port

### WAIT port,value[,xorvalue]

The WAIT statement stops execution until a specific port matches a specific bit pattern. The data read at the port is XORed with the value xorVAL, and then ANDed with the desired value. If result is zero, read is repeated until value is nonzero.

### SWAP var1,var2

Swaps values for two scalar variables

### DIM var(length)

Prepare an array of int. Arrays are indexed from 0, so DIM A(10) prepares an array with 10 items, denotes as A(0) .. A(9)

DIM should appears in the source code prior to the first using of array! Not in program flow, so this won't work:
```
10 GOTO 50
20 A(5) = 5
...
50 DIM A(10)
60 GOTO 20
```
You have to place DIM at the top of code. DIM does nothing in code, it just inform the compiler about the array limits.

Array length has to be a constant, so no computed DIMs allowed!

[Example](./test/ex15.bas80)


### RAMTOP const

Sets the first unused addr to given constant expression. BASIC will not use any memory above the RAMTOP (stack is not affected)

Should be used only once (It takes the last value, ramtop is not dynamic)

### TAKE var
### TAKE var1,var2
### FN(label,expr)
### FN(label,expr1,expr2)
### PUSH var[,var...]
### POP var[,var...]

This is an attempt to bring a FUNCTION concept into BASIC. Yopu can write function as a regular subroutine (like one for the GOSUB) and begin it with TAKE command.

TAKE takes one or two integers from calling environment and store them into given variables.
FN() acts like a GOSUB - the first argument is a label (line number or string), the second argument (and the third, if given) acts like a parameters. They are passed to the subroutine. Subroutine can take them with the TAKE command.

```
print "10+20=",fn(adding,10,20)
end

adding: take p1,p2
 return p1+p2
```

TAKE does not any variable checking, so if you use the same name for parameter and a regular variable, it takes the same place, i.e. TAKE overwrites the global variable...

PUSH and POP helps to simulate local variables for recursion. PUSH just store the values of given variables somewhere to the LIFO structure (on the stack in fact), POP takes the values from the same structure (i.e. from the stack) and assigned them back to the variables. Caution: it works only with scalar int variables (no arrays, no strings) and the orders of POP must be reversed (remember: LIFO!). So `PUSH a,b,c` needs `POP c,b,a`

```
print fn(factorial,5)

factorial: take fact
    if fact=1 then return 1
    push fact
    temp = fn(factorial,fact-1)
    pop fact
    return temp*fact
```

### RETURN expr;var[,var...]

A syntactic sugar for the case you need compute some return value and THEN pop some variables. Good for tail recursion.

```
factorial: take fact
    if fact=1 then return 1
    push fact
    return fact*fn(factorial,fact-1);fact
```

### TAKE p[,p2];var[,var...]

If you want to PUSH some variables PRIOR to taking a value, use this syntax.

```
factorial: take fact;fact
   if fact=1 then return 1;fact
   return fn(factorial,fact-1)*fact;fact
```

Or with more sugar:
```
DEF FN factorial

factorial: take fact;fact
    if fact=1 then return 1;fact
    return factorial(fact-1)*fact;fact
```
[Example](./test/ex16.bas80)


### CALL label,par
### CALL label,par1,par2

Like FN(label,par) or FN(label,par1,par2), but drops the return value and acts just like a command. Useful when you need just to invoke a function with parameters, but ignore the result.

### DEF FN funcLabel

It's a syntactic sugar again. If you annotate function with DEF FN on the beginning of a source code, you can use the function name without FN(funcLabel,...), just directly like funcLabel(...)

So you can use both of those variants:

```
PRINT fn(factorial,5)
```

or

```
DEF FN factorial
...
PRINT factorial(5)
```

[Example](./test/ex17.bas80)

### DEF PROC funcLabel

Another sugar for you. If you annotate function with DEF PROC on the beginning of a source code, you can use the function name as a procedure without CALL funcLabel,..., just directly like funcLabel par[,par]

So you can use both of those variants:

```
CALL myproc,5,10*a
```

or

```
DEF PROC myproc
...
myproc 5,10*a
```
Of course you can use one label as FN and PROC.

## BUILT-IN FUNCTIONS

### int ABS (int)

Returns the absolute value

### int NEG (int)

Returns the negative value (*-1)

### int RND ()

Returns a pseudorandom number (-32768 .. 32767)

### int SGN (int)

Number sign. 1 if positive, -1 if negative

### int LEN (string)

Returns the length of string.

### int PEEK (addr)

Returns the byte value at given address

### int DPEEK (addr)

Returns the word value (two bytes) at given address

### int IN (port)

Returns the byte value from given port number

### int VAL (string)

Returns the decimal value of string.

### int ASC (string)

Returns the ASCII code of the first character in a string.


### int HIGH (int)
### int LOW (int)

Returns upper / lower byte of int

### int LPTR(label)

Gets a pointer to the given label (pointer lead to a code area!)

### int DPTR(label)

Gets a pointer to the first DATA after the given label (pointer lead to a data area!)

### int MALLOC(size)

Allocates SIZE bytes on the heap memory. Returns a pointer to this area. You can free this area by FREE command (see below).


## Pointers

You can get a pointer (an unsigned int) to a variable, an array, a string variable or a string constant. Use angle braces around the element, e.g. `LET a = [b]` to get an address to a memory place where the B variable resides.

## Structures

### DEF STRUCT member[,member...]

Member is a record in the form name(type), e.g. value(int) or name(str). Structures can use a "byte" type. It takes only one byte. The order of struct members is preserved. E.g. structure defined by `def struct mydata key(int),value(int),flag(byte)` has following footprint:

key: bytes 0, 1
value: bytes 2, 3
flag: byte 4

and it is 5 bytes long.

Structure has to be declared before its first use!

[Example](./test/ex18.bas80)


### DIM structure variable[,variable...]

Allocates memory for given struct type in a static memory area. `DIM mydata a,b,c` allocates three areas, 5 bytes each, for three structured variable, named a, b and c

Static structure has to be dimensed before its first use!

### Structure element access

Use dot notation as in other languages, e.g. a.key, b.value, ... You can use this notation in expression and in LET command:

`LET a.key = 15`

`LET n = a.value * 3`

### Structure pointers

You can get a pointer to structure member by [] notation, see above. So:

`LET ptr = [a.key]` assign pointer to member `key` of structure `a`.

`LET ptr = [a.]` is a syntactic sugar - takes a pointer to the first structure member.

### Work with structure pointers

Lets assume that `ptr` is a pointer to the first member of a structure. E.g.`LET ptr = [c.]`. Now you can work with member values by a curly braces notation:

`PRINT ptr{mydata.value}` takes a variable "ptr" and assumes that ptr contains a pointer to some structure of type `mydata`. Then prints a `value` member (in fact, it takes bytes 2 and 3).

`PRINT ptr{value}` is a shorthand form, but it assumes that there is a only one structure with member named "value". If there are more than one structure with a "value" member, it throws an error.

`LET ptr{key} = ptr{key} + 5` - structure pointer can be used on a both sides of an assign.

*WARNING!* Structure pointers has no checks! If you use a pointer to an invalid area, results will be unpredictable and it can crash or destroy data!

## Dynamic allocation of structures

You can dynamic allocate the structure on a heap memory and free this memory back.

### ALLOC structure variable[,variable...]

It allocates enough memory for a structure and store the address of memory (i.e. pointer) to the given variable. You can allocate more structs with single ALLOC.

`ALLOC mydata p,q` allocates two areas in a memory. Both areas has size equal to the size of the mydata struct.

### FREE [variable,...]

Free memory area, previously allocated by ALLOC (or MALLOC) command. FREE always performs a garbage collection, so you can use simple FREE (without any variables) to force garbage collecting.

## String slices

String variable can be "sliced" (like with LEFT$, MID$, RIGHT$), but in a more flexible way. Just use the string slice syntax as described below.

Lets assume A$ = "Hello world". Then

`A$(3 TO 5)` = "lo "
`A$( TO 5)` = "Hello "
`A$(5 TO )` = "world"

Syntax is `var$(first TO last)`. If `first` is omitted it assumes first=0. If `last` is omitted it assumes last=LEN(var$)-1. Slice returns characters from FIRST to LAST (included).

Slice can be used as left side of assign command (LET):

A$ = "Hello world"
A$(3 TO 4) = "p,"
A$ -> "Help, world"

[Example](./test/ex19.bas80)


## Operators

=, <>, <, >, <=, >= as usual

& - bitwise AND
| - bitwise OR
^ - bitwise XOR

AND, OR - logic AND, OR

### Shorthands

- var++ increment
- var+++ var+=2
- var-- decrement
- var--- var-=2
- var** var*=2
