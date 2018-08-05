;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Busy soft ;;; Konverzia ASCII na 5-bajtovy format ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 26.07.2018 verzia 2 ;; Pre Adent ;; Licencia: MIT ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Pouzity kompiler:  SjASMPlus v1.10.1 (15.05.2018) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Riadok s komentarom v tvare ";; #XXXX ..."
;; je povodny nezmeneny kod zo ZX ROMky.

;; Akceptovany format cisel:
;;
;;   <celociselna_cast> <desatinna_bodka> <desatinna_cast> <pismenko_E> <+/-> <exponent>
;;
;; Priklady:
;;
;;   123
;;   123.
;;   123.456
;;   0.456
;;   .456
;;   123.456e12
;;   123456E+23
;;   12345.E-34
;;   .45678e+10
;;
;; Znamienko plus v exponente je nepovinne.
;;
;; Cislo musi obsahovat v mantise aspon jednu cislicu (zapis ".e10" je neplatny)
;; a ak je za mantisou pismenko E tak exponent musi mat aspon jednu cislicu.
;;
;; Rozsah cisel je 2^-128 az 2^127. V pripade cisla mensieho ako 2^-128 vrati nulu
;; a v pripade ak bude cislo vecsie ako 2^127 tak ohlasi chybu "Number to big".
;;
;; Akceptuje iba kladne cisla => unarne minus je v ZX basicu
;; riadna matematicka operacia ktory sa vyhodnocuje v ramci vyhodnocovania vyrazu.

	OUTPUT	"ConvertAsciiToValue.cod"

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Nejake rutinky z romky ktore bude treba nahradit ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Restart #08 - vypis chyboveho hlasenia (cislo hlasenia je za instrukciou RST #08)

	org	#08
ERROUT	jp	CHYBA			;; Skok na vypis chyboveho hlasenia

;; Restart #18 - vrati aktualny znak na ktory ukazuje pointer CHADD

	org	#18
GETACT	ld	HL,(CHADD)		;; #0018  prisune aktualni znak z pgmu
	ld	A,(HL)			;; #001B  nebo pri zadani
BLOWUP	call	H007D			;; #001C  testuje zda jde o ridici znak
	ret	NC			;; #001F  tisknutelny znak/token:navrat

;; Restart #20 - posunie pointer CHADD na nasledujuci znak a tento znak vrati

GETNXT	call	NXTZNK			;; #0020  prisune nasledujici znak
	jp	BLOWUP			;; #0023
	DEFB	#FF,#FF			;; #0025

;; Volanie kalkulacky

CALSW	jp	CALC			;; #0028  prepnuti na kalkulator

NXTZNK	ld	HL,(CHADD)		;; #0074  ukazatel do pgmu
H0077	inc	HL			;; #0077  posunut o 1 misto
H0078	ld	(CHADD),HL		;; #0078
	ld	A,(HL)			;; #007B  prevzeti noveho znaku
	ret				;; #007C

;; Preskocenie roznych riadiacich kodov (napr. pre farby) v basic programe

H007D	cp	#21			;; #007D  pokud >=#21,tedy tisknutelny znak
	ret	NC			;; #007F  pak navrat
	cp	#0D			;; #0080  taktez pri 'ENTER'
	ret	Z			;; #0082

H0083	cp	#10			;; #0083  pri #00..#0F
	ret	C			;; #0085  navrat s nastavenym CARRY

H0086	cp	#18			;; #0086
	ccf				;; #0088  pri #18..#20
	ret	C			;; #0089  navrat s nastavenym CARRY

H008A	inc	HL			;; #008A  zde pri #10..#17 inkrementace
	cp	#16			;; #008B  vykryti #16..#17
	jp	C,H0090			;; #008D
	inc	HL			;; #008F  pri nich preskoci jeste 1 bajt
H0090	scf				;; #0090
	ld	(CHADD),HL		;; #0091  ukazuje na aktualni znak
	ret				;; #0094  navrat s nastavenym CARRY

;; Toto treba samozrejme v konkretnej implementacii nahradit niecim inym vhodnym

SPACE5		;; Kontrola ci je este aspon 5 bajtov volneho miesta v systeme
CALC		;; Volanie kalkulacky
CHYBA	di	;; Vypis chybeho hlasenia
	halt

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Konvertor ASCII => Floating point ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

test	db	'9876.5432e-10'		;; Pokusne cislo na prevod
	db	'...'			;; Dalsi text za cislom

	ld 	hl,test			;; Nastavenie pointra
	ld	(CHADD),hl		;; pre nacitavanie znakov cisla

;; Hlavny vstup do konvertora
;;
;; CHADD musi ukazovat na prvy znak textoveho zapisu cisla
;; Na konci bude CHADD ukazovat na prvy znak za cislom

DECFLO	jp	H2CB8			;; #2C9D

;; Rutinka pre nacitanie 16-bitoveho cisla do BC s kontrolou pretecenia
;; Pouziva sa pre:
;;  - cisla basicovych riadkov
;;  - exponenty po pismene E vo vedeckych cislach

getint	call	dec2bc		;; Zavolame nacitanie cisla
	ret	nc		;; Ak cislo <= 65535 tak navrat
decbig	rst	ERROUT		;; Inak bude chyba
	DEFB	#05		;; 'Number too big'

;; Rutinka na rychle nacitanie integeru 0..65535 do BC
;; Dekrementuje tiez pocitadlo nacitanych cislic v MEMBOT
;; Pouziva sa aj pre zaciatok nacitavania cisel v basicu
;; Vystup:
;;   BC = nacitana hodnota
;;   CY=0 dalsi znak uz nie je cislica
;;   CY=1 hodnota cisla pri aktualnej cislici prekroci rozsah 16 bitov

dec2bc	ld	bc,#00
dec2ll	call	NUMBER
	ccf	
	ret	nc		;; Navrat po spracovani celeho cisla
	ld	hl,MEMBOT	;; Vystup: BC=hodnota, *HL=dalsi znak, A=dalsi znak-'0'
	dec	(hl)
	sub	'0'
	ld	d,#00
	ld	e,a
	ld	h,b
	ld	l,c
	add	hl,hl
	ret	c		;; Navraty v pripade pretecenia
	add	hl,hl		;; Vtedy: BC=hodnota, DE=cislica
	ret	c
	add	hl,bc
	ret	c
	add	hl,hl
	ret	c
	add	hl,de		;; HL = 10 * HL + cislica
	ret	c
	ld	b,h
	ld	c,l
	call	NXTZNK
	jp	dec2ll

;; Program pre nacitanie hodnoty cisla pre 32+ bitove hodnoty
;; Dekrementuje tiez pocitadlo nacitanych cislic v MEMBOT
;; Vstup:
;;   DE = nasledujuca cislica z dec2bc
;;   BC = zatial nacitana hodnota z dec2bc
;; Vystup:
;;   ABCDE = nacitana hodnota
;;   CY=1 dalsi znak uz nie je cislica
;;   CY=0 hodnota cisla prekrocila 32 bitov

dec32s	ex	de,hl		;; Nasledujucu cislicu dame do HL
	ld	d,b
	ld	e,c		;; Zvysime sirku hodnoty na 32 bitov
	ld	bc,#00		;; BCDE = doteraz nacitana hodnota
	jp	dec32i		;; A pokracujeme v nacitavani celeho cisla

;; Vstup pre pokracovanie citania hodnoty v BCDE

dec32z	call	NXTZNK		;; Nasledujuci znak
	call	NUMBER		;; Je to cislica 0..9 ?
	ret	c		;; Ak nie tak navrat s CY=1
	ld	hl,MEMBOT	;; Znizenie predbezneho exponentu
	dec	(hl)		;; (potrebne pre desatinnu cast cisla)
	sub	'0'
	ld	l,a
	ld	h,#00		;; HL = hodnota cislice
dec32i	push	hl
	call	krat10		;; ABCDE = 10 * BCDE
	pop	hl
	add	hl,de		;; Pripocitanie cislice k hodnote cisla
	ex	de,hl
	jp	nc,dec32o	;; Ak spodne slovo v DE pretieklo
	inc	bc		;; inkrementujeme horne slovo v BC
	ld	h,a
	ld	a,b
	or	c
	ld	a,h
	jp	nz,dec32o	;; Ak aj to pretieklo
	inc	a		;; inkrementujeme najvyssi bajt hodnoty
dec32o	and	a		;; ABCDE = 10 * BCDE + cislica
	jp	z,dec32z	;; Ak je najvyssi bajt stale nulovy, citame cislo dalej
	ret			;; Ak je nenulovy, mame uz 33+ bitov a hned navrat

;; Vynasobenie 32 bit cisla desiatimi
;; Robi vypocet: ABCDE = 10 * BCDE

krat10	xor	a
	ld	h,d		;; ABCDE = 10 * BCDE
	ld	l,e		;;
	add	hl,hl		;;     mno = 10*DE
	adc	a,a		;;   prq.. = 10*BC
	add	hl,hl		;;   =====
	adc	a,a		;;   tuvwx = 10*BCDE
	add	hl,de
	adc	a,#00
	add	hl,hl		;; HL = no
	adc	a,a		;;  A = m
	ld	e,a
	ld	d,#00		;; DE = m
	push	de		;; Stack = m
	ex	de,hl		;; DE = no
	xor	a
	ld	h,b
	ld	l,c
	add	hl,hl
	adc	a,a
	add	hl,hl
	adc	a,a
	add	hl,bc
	adc	a,#00
	add	hl,hl		;; HL = rq
	adc	a,a		;;  A = p
	pop	bc		;; BC = m
	add	hl,bc		;; HL = rq+m
	ld	b,h
	ld	c,l		;; BC = rq+m
	adc	a,#00		;;  A = p + pretecenie(rq+m)
	ret

;; Nacitanie celej mantisy desiatkoveho cisla AAAA.AAAA
;; Vystup:
;;  - Predbezna hodnota exponentu v MEMBOT
;;  - Celociselna hodnota mantisy v rozsahu 0 .. 2^32-1 na zasobniku kalkulacky

decmns	cp	'.'		;; Desatinna bodka hned na zaciatku ?
	jp	nz,deccel	;; Ak nie, tak cislo ma aj celu cast
	xor	a
	ld	b,a
	ld	c,a
	ld	(MEMBOT),a
	rst	GETNXT		;; (tu by sa ideologicky hodilo call NXTZNK)
	call	NUMBER		;; Ak za zaciatocnou bodkou nasleduje cislica
	jp	nc,decdes	;; tak skok na spracovanie desatinnej casti
decerr	rst	ERROUT		;; Inak bude chyba
	db	#0B		;; tak bude chyba "Nonsense in basic"

;; 16 bitova mantisa - celociselna cast

deccel	call	dec2bc		;; Nacitaj kolko sa vojde do BC
	ld	hl,MEMBOT	;; Predbezne vynulujeme exponent
	ld	(hl),#00	;; pre pripad ze cislo je uz hotove
	jp	c,decmce	;; Ak sa uz nevojde, skok na 32 bitove nacitavanie
	cp	'.'		;; Ak posledny znak nie je desatinna bodka
	jp	nz,H2D2B	;; tak to bude uplny koniec mantisy a cislo v BC ulozime

;; 16 bitova mantisa - desatinna cast

	call	NXTZNK
decdes	call	dec2ll		;; Pokracujeme v nacitavani cislic do 16 bit hodnoty cisla
	jp	nc,H2D2B	;; Ak je koniec cisla, mantisu cisla v BC ulozime.
	jp	decmds		;; Ak sa uz nevojde, skok na 32 bitove nacitavanie

;; 32 bitova mantisa - celociselna cast

decmce	call	dec32s		;; Pokracujeme v nacitavani celej casti cisla
	ld	hl,MEMBOT	;; Predbezne vynulujeme exponent
	ld	(hl),#00	;; pre pripad ze cislo je uz hotove
	jp	c,decdot	;; Ak dalsi znak nie je cislica tak skok
	push	af		;; Este nasleduju cislice ale mantisa uz ma viac ako 32 bitov
decsk1	ld	hl,MEMBOT	;; Vsetky nasledujuce cislice preskocime
	inc	(hl)		;; Pocet preskocenych cislic bude exponent hodnoty
	ld	a,(hl)
	cp	#40		;; Ak sa uz preskocilo privela cislic
	jp	nc,decbig	;; potom bude chyba 'Number too big'
	call	NXTZNK
	cp	'.'		;; Ak sme pritom narazili na desatinnu bodku
	jp	z,decsk2	;; preskocime vsetky desatinne miesta v inej slucke
	call	NUMBER
	jp	nc,decsk1
	pop	af
	jp	decrot

;; 32 bitova mantisa - desatinna cast

decdot	cp	'.'		;; Nasleduje desatinna ciarka ?
	jp	nz,decset	;; Ak nie tak je koniec cisla a ulozime jeho hodnotu
	call	dec32z		;; Ak ano pokracujeme v nacitavani desatinnej casti
	jp	dectst		;; Skok na test vysledku 32 bitoveho nacitavania cisla

decmds	call	dec32s		;; Pokracujeme v nacitavani desatinnej casti cisla
dectst	jp	c,decset	;; Ak je koniec cisla, mantisu v BCDE ulozime
	push	af		;; Nasledujucu este cislice ale mantisa uz ma viac ako 32 bitov
decsk2	call	NXTZNK		;; Kedze sme uz za desatinnou ciarkou
	call	NUMBER		;; vsetky nasledujuce cislice mozeme zvysoka odignorovat
	jp	nc,decsk2	;; bez toho aby nam akokolvek ovplyvnili celkovy vysledok
	pop	af

;; Ulozenie viac ako 32 bitovej mantisy v ABCDE
;; Mantisu je potrebne osekat a zaokruhlit na 32 bit

decrot	ld	l,#A0		;; Predbezny exponent
	ld	h,a		;; Mantisa v HBCDE
decrts	ld	a,h		;; Rotacia celeho HBCDE vpravo
	or	a
	rra
	ld	h,a
	call	mnsrgh		;; Rotacia BCDE vpravo
	inc	l		;; Inkrement predbezneho exponentu
decrtu	inc	h
	dec	h		;; Ak su v H este nejake nenulove bity
	jp	nz,decrts	;; tak skok a rotujeme dalej
	inc	h
	call	c,mnsrnd	;; Zaokruhlenie mantisy BCDE podla CY
	ld	a,l		;; A = upraveny exponent
	jp	nz,decsto	;; Ak mantisa nepretiekla tak skok
	inc	a		;; Ak pretiekla tak zvysime exponent
	ld	b,#80		;; a pretecenu (BCDE=0) mantisu nastavime na #80 00 00 00
	db	#21		;; LD HL,... preskocenie nasledujuceho LD A,#A0

decset	ld	a,#A0		;; Predbezny exponent ak sa cislo voslo do 32 bitov
decsto	push	bc		;; Ulozenie exponentu v A a 32-bitovej mantisy v BCDE
	call	SPACE5		;; na zasobnik kalkulacky
	pop	bc
	ld	hl,(STKEND)
	ld	(hl),a		;; Exponent
	inc	hl
	ld	(hl),#00	;; Ulozenie znamienka mantisy #00
	dec	hl
	call	norma		;; Normalizacia a ulozenie mantisy BCDE
	ld	bc,5
	add	hl,bc
	ld	(STKEND),HL
	ret

;; podpgm pro test,zda cislice; pokud ano:nastavi CARRY

NUMBER	cp	'0'			;; #2D1B
	ret	C			;; #2D1D
	cp	':'			;; #2D1E  v ASCII '9' +1
	ccf				;; #2D20
	ret				;; #2D21

;; podpgm pro ulozeni hodnoty cislice na calcstack

;;H2D22	call	NUMBER			;; #2D22  kdyz nejde o cislici,hned navrat
;;	ret	C			;; #2D25
;;	sub	'0'			;; #2D26  ze znaku cislo

;; podpgm ulozi binarni cislo v _A na calcstack

H2D28	ld	C,A			;; #2D28  kopie do _BC
	ld	B,0			;; #2D29  (_B je 0)

;; podpgm pro ulozeni celeho cisla v _BC na calcstack ve
;; formatu cisla v plovouci tecce
;; 1. a 5. bajt jsou vzdy 0
;; 2. obsahuje znamenko (0:kladne,#FF:zaporne)
;; 3. bajt je LSB, 4. je MSB

H2D2B	;;ld	IY,ERRNR		;; #2D2B  znovu iniciace _IY
H2D2F	xor	A			;; #2D2F  _A=0
	ld	E,A			;; #2D30  _E take pro kladne
	ld	D,C			;; #2D31  LSB do _D
	ld	C,B			;; #2D32  MSB do _C
	ld	B,A			;; #2D33  _B=0
	call	H2AB6			;; #2D34  ulozeni cisla na calcstack
	rst	CALSW			;; #2D37  kalkulator volan kvuli
	DEFB	#38			;; #2D38  nastaveni _HL na >STKEND< -5
	and	A			;; #2D39  smazani CARRY
	ret				;; #2D3A

;; Ulozenie 5-bajtovej hodnoty na zasobnik kalkulacky

H2AB6	push	BC			;; #2AB6
	call	SPACE5			;; #2AB7  test,zda je jeste volnych 5 bajtu
	pop	BC			;; #2ABA
	ld	HL,(STKEND)		;; #2ABB  konec calcstacku=1.volne misto
	ld	(HL),A			;; #2ABE  parametry postupne zapsany
	inc	HL			;; #2ABF
	ld	(HL),E			;; #2AC0  zacatek retezce
	inc	HL			;; #2AC1
	ld	(HL),D			;; #2AC2
	inc	HL			;; #2AC3
	ld	(HL),C			;; #2AC4  delka retezce
	inc	HL			;; #2AC5
	ld	(HL),B			;; #2AC6
	inc	HL			;; #2AC7
	ld	(STKEND),HL		;; #2AC8  nova hodnota
	ret				;; #2ACB

;; Hlavny vstup pre nacitanie desiatkoveho cisla AAAA.BBBeCC

H2CB8	call	decmns		;; Nacitanie mantisy AAAA.BBBB

;; Spracovanie exponentu po pismenku E

	ld	hl,MEMBOT
	ld	d,(hl)		;; D = exponent z mantisy
	ld	e,#00		;; Znacka: E=0 znamena kladny exponent
	ld	c,e		;; Predbezna hodnota exponentu C = 0
	rst	GETACT		;; Zistime prvy znak za mantisou
	or	#20		;; 'E' => 'e'
	cp	'e'		;; Nasleduje pismenko E ?
	jp	nz,expnie	;; Ak nie tak nemame exponent a skok
	rst	GETNXT		;; Co nasleduje po pismenku E ?
	cp	'+'
	jp	z,expnxt
	cp	'-'
	jp	nz,expget
	dec	e		;; Znacka: E=-1 znamena zaporny exponent
expnxt	rst	GETNXT		;; Ak nasledoval + alebo - tak posun na dalsi znak
expget	call	NUMBER		;; Musi to byt nejaka cislica
	jp	c,decerr	;; lebo ak nie tak bude chyba 'Nonsense in basic'
	push	de
	call	getint		;; Nacitanie hodnoty exponentu do BC
	pop	de
	ld	a,#C0
	and	c
	or	b		;; Exponent musi byt v rozsahu +/-63
	jp	nz,decbig	;; Ak nie tak bude chyba 'Number too big'
expnie	ld	a,c		;; C = absolutna hodnota exponentu
	xor	e		;; E = znamienko exponentu
	sub	e		;; A = hodnota so znamienkom -63..+63
	add	a,d		;; Pripocitanie predbezneho exponentu z mantisy

;; aritmeticke rutiny

;; premena dec.cisla ve tvaru mantisa,exponent (x E n)
;; na cislo v plovouci tecce
;;  X jiz lezi na zasobniku kalkulatoru

H2D4F	ld	hl,expmul	;; Tabulka konstant pre kladny exponent
	or	a
	jp	p,explop	;; Pri kladnom exponente skok
	cpl			;; Exponent zmenime na kladny
	inc	a
	ld	hl,low expdiv	;; Tabulka konstant pre zaporny exponent

explop	and	a		;; Ak uz nemame ziadne bity v exponente
	ret	z		;; tak je vsetko hotove a navrat
	rra
	jp	c,expmat	;; Pre jednotkovy bit exponentu skok
	ld	bc,#05
	add	hl,bc		;; Pre nulovy bit exponentu
	jp	explop		;; sa iba posunieme na dalsiu konstantu

expmat	push	af
	call	H33B4		;; Prenesenie konstanty na zasobnik
	push	hl
	rst	CALSW		;; Vynasobenie mantisy konstantou
	db	#04		;; krat
	db	#38
	pop	hl		;; HL = nasledujuca konstanta
	pop	af		;; A = zvysne bity z exponentu
	jp	explop

;; Tabulky konstant pre upravu hodnoty cisla podla exponentu X*10^Y

expmul	db	#00,#00,#0A,#00,#00	;; 10^1    Kladne exponenty
	db	#00,#00,#64,#00,#00	;; 10^2
	db	#00,#00,#10,#27,#00	;; 10^4
	db	#9B,#3E,#BC,#20,#00	;; 10^8
	db	#B6,#0E,#1B,#C9,#BF	;; 10^16
	db	#EB,#1D,#C5,#AD,#A8	;; 10^32
	db	#FF,#7F,#FF,#FF,#FF	;; Pretecenie (Number to big)

expdiv	db	#7D,#4C,#CC,#CC,#CD	;; 10^-1   Zaporne exponenty
	db	#7A,#23,#D7,#0A,#3D	;; 10^-2
	db	#73,#51,#B7,#17,#59	;; 10^-4
	db	#66,#2B,#CC,#77,#12	;; 10^-8
	db	#4B,#66,#95,#94,#BF	;; 10^-16
	db	#16,#4F,#B1,#1E,#AD	;; 10^-32
	db	#00,#00,#00,#00,#00	;; Podtecenie (nulovy vysledok)

;; podpgm pro preneseni cisla na zasobnik

H33B4	;:ld	DE,(STKEND)		;; #33B4  od bajtu v >STKEND<
	ex	de,hl
	ld	hl,(STKEND)
	ex	de,hl
	call	DOUBLE			;; #33B8  probehne prevedeni
	;:ld	(STKEND),DE		;; #33BB  nove nastaveni >STKEND<
setstk	ex	de,hl
	ld	(STKEND),hl
	ex	de,hl
	ret				;; #33BF

;; podpgm pro ulozeni cisla na zasobnik
;; (take pro kod #31)

DOUBLE	call	SPACE5			;; #33C0  test,zda je misto
	jp	ldir			;; #33C3  probehne prevedeni

;; Rotacia mantisy BCDE vpravo
;; BCDE = BCDE / 2

mnsrgh	ld	a,b
	rra
	ld	b,a
	ld	a,c
	rra
	ld	c,a
	ld	a,d
	rra
	ld	d,a
	ld	a,e
	rra
	ld	e,a
	ret

;; Nasledujuce rutinky by mali byt tie iste ako v "Rutinky-FP-1.asm"

;; Zaokruhlenie mantisy BCDE podla carry
;; BCDE = BCDE + Carry

mnszao	ret	nc
mnsrnd	inc	e
	ret	nz
	inc	d
	ret	nz
	inc	c
	ret	nz
	inc	b
	ret

;; Rotacia mantisy BCDE vlavo alebo zdvojnasobenie delenca
;; BCDE = 2 * BCDE

mnslft	ex	de,hl
	add	hl,hl
	ex	de,hl
bc2x1c	ld	a,c
	adc	a,a
	ld	c,a
	ld	a,b
	adc	a,a
	ld	b,a
	ret

;; Normalizacia mantisy, jej ulozenie do pameti a uprava exponentu
;; Vstup: HL=pamet s exponentom a znamienkom, BCDE=mantisa

norma	push	hl
	xor	a
	xor	b
	jp	nz,no1xxx
	ld	b,#08
	xor	c
	jp	nz,no01xx
	ld	b,#10
	xor	d
	jp	nz,no001x
	ld	b,#18
	xor	e
	jp	nz,no0001
	ex	de,hl
nornux	ex	de,hl
nornul	ld	(hl),a		;; Ak je cela mantisa nulova, vysledok bude nula
	inc	hl
	jp	norst2

no1xxx	xor	a
	xor	e
	jp	nz,nor32s
no1xx0	ld	e,d
	ld	d,c
	ld	c,b
	ld	b,#00
	xor	e
	jp	nz,nor24s
no1x00	xor	d
	jp	nz,nor16x
no1000	jp	no0100

no01xx	xor	a
	xor	e
	jp	nz,nor24s
no01x0	xor	d
	jp	nz,nor16x
no0100	ld	e,c
	jp	nor08s

no001x	xor	a
	xor	e
	jp	nz,nor16s
no0010	ld	e,d

no0001
nor08s	ld	a,(hl)		;; Vstup: B=korekcia, E=mantisa
	sub	b
	jp	c,nornul
	ld	b,a
	ld	a,e
	db	#0E		;; ld c,...
nor08r	dec	b
	jp	z,nornul
	add	a,a
	jp	nc,nor08r
	ld	(hl),b
	ld	c,#00
	ld	d,c
	ld	e,c
	jp	norst0

nor16x	ld	e,d
	ld	d,c

nor16s	ld	a,(hl)		;; Vstup: B=korekcia, DE=mantisa
	sub	b
	jp	c,nornul
	ld	b,a
	ex	de,hl
	db	#0E		;; ld c,...
nor16r	dec	b
	jp	z,nornux
	add	hl,hl
	jp	nc,nor16r
	ex	de,hl
	ld	(hl),b
	ld	a,d
	rrca
	ld	a,e
	rra
	ld	c,a
	ld	a,d
	rra
norzde	ld	de,#00
	jp	norst1

nor24s	ld	a,(hl)		;; Vstup: B=korekcia, CDE=mantisa
	sub	b
	jp	c,nornul
	jp	z,nornul
	ld	b,a
	ld	a,c
	ex	de,hl
	jp	nor24t
nor24r	dec	b
	jp	z,nornux
	add	hl,hl
	ld	a,c
	adc	a,a
	ld	c,a
nor24t	add	a,a
	jp	nc,nor24r
	ex	de,hl
	ld	(hl),b
	ld	c,d
	ld	d,e
	ld	e,#00
	jp	norst0

nor32s	ld	a,b		;; Vstup: BCDE = mantisa
	jp	nor32t

nor32r	dec	(hl)		;; Dekrement exponentu
	jp	z,nornul
	call	mnslft		;; Vynasobenie mantisy 2x
nor32t	add	a,a
	jp	nc,nor32r
norst0	rrca
norst1	inc	hl		;; Prvy bajt mantisy
	or	(hl)		;; aj so znamienkom
norst2	ld	(hl),a
	inc	hl
	ld	(hl),c
	inc	hl
	ld	(hl),d
	inc	hl
	ld	(hl),e
	pop	hl
	ret

;; Simulacia niektorych Z80 instrukcii

ldir	push	af
ldilop	ld	a,(hl)
	ld	(de),a
	inc	hl
	inc	de
	dec	bc
	ld	a,b
	or	c
	jp	nz,ldilop
	pop	af
	ret

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Koniec rutiniek konvetora ASCII => FP hodnota ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

CHADD	dw	0	;; Pointer na nacitavane cislo
STKEND	dw	0	;; Koniec zasobnika kalkulacky (pointer na prazdne miesto nad zasobnikom)
MEMBOT	db	0	;; Pomocna premenna pre pocitanie interneho exponentu
