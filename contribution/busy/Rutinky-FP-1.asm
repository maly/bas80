;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Busy soft ;; FP rutinky pre ZX ROM port pre PMD85 ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; 06.07.2018 verzia 2 ;; Pre Adent ;; Licencia: MIT ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;; Pouzity kompiler:  SjASMPlus v1.10.1 (15.05.2018) ;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;; Riadok s komentarom v tvare ";; #XXXX ..."
;; je povodny nezmeneny kod zo ZX ROMky.


;; Spracovavane cisla su vzdy 5-bajtove a mozu
;; byt vo formate integer alebo floating point.
;; Kedze hodnotu 0 nie je mozne vyjadrit
;; ako FP cislo, je vzdy ulozena ako integer.


;; Format cisla floating point
;;
;;   Byte 0 ... Exponent v "predpetom" kode - zvecseny o hodnotu 128
;;   Byte 1 ... Prvy (najvyssi) bajt 32bit mantisy + bit.7 je znamienko: 0=kladne, 1=zaporne
;;   Byte 2 ... Druhy bajt mantisy
;;   Byte 3 ... Treti bajt mantisy
;;   Byte 4 ... Stvrty (najnizsi) bajt mantisy
;;
;; Exponent je cislo od 1 do 255. Hodnota 0 je vyhradena pre integer cisla.
;;
;; Mantisa je vzdy v normovanom tvare a predstavuje hodnotu od 0.5 do 0.999999999..
;; Kedze najvyssi bit mantisy (bit 7 prveho bajtu) by tym padom vzdy bol 1,
;; tak je v nom ulozene znamienko cisla.
;;
;; Hodnota cisla = 2^(exponent-128) * mantisa
;;
;; Priklady:
;;   81 00 00 00 00 ... +1.0
;;   81 80 00 00 00 ... -1.0
;;   90 7F FF 00 00 ... +65535.0


;; Format cisla integer
;;
;;   Byte 0 ... Vzdy 00  (podla nuloveho exponentu sa pozna ze je to integer cislo)
;;   Byte 1 ... Znamienko cisla: 00=kladne, FF=zaporne
;;   Byte 2 ... Nizsi bajt hodnoty cisla
;;   Byte 3 ... Vyssi bajt hodnoty cisla
;;   Byte 4 ... Vzdy 00  (inak bez vyznamu) 
;;
;; Dvojbajtova hodnota je v dvojkovom doplnku,
;;   t.j. pre zaporne cisla plati ze   hodnota = 65536-cislo
;;
;; Priklady:
;;   00 00 00 00 00 = nula .... same nulove bajty, lahko sa testuje
;;   00 00 02 01 00 = +258
;;   00 FF FF FF 00 = -1 ... pozor, dvojkovy doplnok
;;   00 FF 01 00 00 = -65535
;;   00 FF 00 00 00 = -65536


;; Poznamka k bajtu "seting"
;;
;; Bit 4 v tomto bajte nastaveny na jednotku povoluje
;; simulaciu chyb povodnych matematickych rutiniek v ZX romke.
;;
;; Simulovane chyby su tieto dve:
;;
;;  - Chyba zaokruhlenia mantisy po deleni (zakruhli vzdy dole)
;;  - Chyba -65536, napriklad INT -65536 alebo -1-65535 davaju zle vysledky
;;
;; Ak bude tento bit nulovy, rutinky budu pocitat spravne bez tychto chyb.


	OUTPUT	"Rutinky-FP-1.cod"


;; Nasleduju rutinky pre zakladne matematicke operacie a porovnanie
;; Vsetky rutinky ocakavaju dve 5-bajtove cisla (na calc stacku)
;; Rutinky si obe cisla precitaju a namiesto prveho zapisu vysledok
;;
;;   ADDIER = scitanie
;;   SUBTRA = odcitanie
;;    MULTI = nasobenie
;;   DIVIDE = delenie
;;   SPDCMP = porovnanie
;;
;; Vstup: HL=adresa prveho cisla, DE=adresa druheho cisla


;; rozdil dvou cisel v plovouci tecce

SUBTRA	ex	DE,HL			;; #300F  zamena ukazatelu
	call	NEGIER			;; #3010  znamenko druheho cisla invertovano
	ex	DE,HL			;; #3013  ukazatele zpet a scitani

;; podpgm pro secteni dvou cisel

ADDIER	ld	A,(DE)			;; #3014  test zda prvni bajt obou
	or	(HL)			;; #3015  cisel je 0
	jp	NZ,addflt		;; #3016  Ak nie tak skok na FP scitanie

;; scitani celych cisel <=65535

	push	DE			;; #3018  ukazatel na 2.cislo uschovan
	inc	HL			;; #3019  ukazuje na 2.bajt 1.cisla
	push	HL			;; #301A  a uschova
	inc	HL			;; #301B  3.bajt 1.cisla
	ld	E,(HL)			;; #301C  LSB do _E
	inc	HL			;; #301D  4.bajt 1.cisla
	ld	D,(HL)			;; #301E  MSB do _D
	inc	HL			;; #301F  posunuti na 2.bajt 2.cisla
	inc	HL			;; #3020  (tj. na znamenko)
	inc	HL			;; #3021
	ld	A,(HL)			;; #3022  prevzat do _A
	inc	HL			;; #3023  3.bajt 2.cisla
	ld	C,(HL)			;; #3024  LSB do _C
	inc	HL			;; #3025  4.bajt 2.cisla
	ld	B,(HL)			;; #3026  MSB do _B
	pop	HL			;; #3027  ukazatel na znamenko 1.cisla
	ex	DE,HL			;; #3028  do _DE, 1.cislo do _HL
	add	HL,BC			;; #3029  obe cisla sectena
	ex	DE,HL			;; #302A  vysledek do _DE (_HL ukazuje na
					;; #302B  znamenko 1.cisla
	adc	(HL)			;; #302B  secteni obou znamenek a CARRY
	rrca				;; #302C  _A musi byt 0
	adc	0			;; #302D  jinak je vysledek >65536
	jp	NZ,addmoc		;; #302F  coz je preteceni:skok
	sbc	A			;; #3031  spocteno znamenko vysledku

	jp	z,addoki	;; Kladny vysledok je vzdy OK
	ld	a,d		;; Inak test ci vysledok bol -65536
	or	e
	ld	a,#FF		;; Ak vysledok nie je -65536 tak
	jp	nz,addoki	;; skok na jeho normalne ulozenie

	ld	a,(seting)	;; Simulacia chyby scitania -65536
	and	#10		;; Ak chybu netreba simulovat
	jp	z,addowe	;; tak ulozime -65536 ako floating point
	ld	a,#FF		;; Inak ulozime chybny vysledok #FF #00 #00

addoki	ld	(HL),A			;; #3032  a zapsano
	inc	HL			;; #3033
	ld	(HL),E			;; #3034  LSB
	inc	HL			;; #3035
	ld	(HL),D			;; #3036  a MSB zapsan
	dec	HL			;; #3037  ukazatel na 1.bajt vysledku
	dec	HL			;; #3038
	dec	HL			;; #3039
	pop	DE			;; #303A  >STKEND< do _DE
	ret				;; #303B

;; Scitanie integerov pretieklo => vysledok ulozime ako floaing point

addmoc	ld	a,(seting)	;; Simulacia chyby scitania -65536
	and	#10		;; Ak sa ma chyba simulovat
	jp	nz,H303C	;; tak rovno skok na floating point scitanie

addowe	ld	a,(hl)		;; Znamienko
	ld	c,#00		;; Casto potrebna nula
	add	a,a
	jp	nc,addpos
	ld	a,c		;; Dvojkovy doplnok vysledku
	sub	e		;; pre zaporne hodnoty
	ld	e,a
	ld	a,c
	sbc	a,d
	ld	d,a
	scf			;; Zaporne znamienko
addpos	ld	a,d		;; Vyssi bajt suctu
	rra
	ld	(hl),a		;; Mantisa bajt 1 so znamienkom v bite 7
	push	hl
	inc	hl
	ld	a,e		;; Nizsi bajt suctu
	rra
	ld	(hl),a		;; Mantisa bajt 2
	inc	hl
	ld	a,c
	rra
	ld	(hl),a		;; Mantisa bajt 3 = #80/#00
	inc	hl
	ld	(hl),c		;; Mantisa bajt 4 = #00 vzdy
	pop	hl
	dec	hl
	ld	(hl),#91	;; Exponent
	pop	de
	ret

H303C	dec	HL			;; #303C  ukazatel na 1.bajt 1.cisla
	pop	DE			;; #303D  ukazatel na 1.bajt 2.cisla obnoveny

;; Scitanie floating point + floating point	;; #303E

addflt	call	int2fp		;; Prevod prveho scitanca na FP (ak uz nie je)
	jp	nz,add1nz	;; Ak nie je nulovy, tak skok

addcpy	push	hl		;; Ak je nulovy,
	push	de		;; vysledok bude druhy scitanec
	ex	de,hl		;; a potom hned navrat
	ld	bc,#05		;; a potom hned navrat
	call	ldir
	pop	de
	pop	hl
	ret

add1nz	ex	de,hl		;; HL ukazuje na druheho scitanca
	call	int2fp		;; Prevod prveho cinitena na FP (ak uz nie je)
	ex	de,hl		;; Ak je nulovy, tak rovno navrat
	ret	z		;; a prvy scitanec bude vysledok

	push	de		;; Adresa STKEND
	push	hl		;; Adresa vysledku

	ld	a,(de)		;; Porovnanie exponentov
	sub	(hl)		;; Ak je prvy scitanec mensi
	jp	nc,addce1	;; tak skok
	cpl
	inc	a		;; Inak zaporny rozdiel exponentov
	ex	de,hl		;; a vymena scitancov

addce1	cp	#21
	jp	c,addm33	;; Ak je rozdiel mensi ako 33 tak skok

	pop	hl		;; Ak je rozdiel vecsi, mensi scitanec mozeme zanedbat
	pop	de		;; a vysledkom scitania bude vecsi scitanec
	ld	a,(de)
	cp	(hl)		;; Este raz porovnanie exponentov
	ret	c		;; Ak je prvy scitanec vecsi tak to bude vysledok
	jp	addcpy		;; Inak bude vysledok druhy scitanec

addm33	ld	(addrze+1),a	;; Ulozime si rozdiel exponentov
	or	a
	jp	nz,addce2	;; Ak su exponenty rozne tak skok
	push	hl
	push	de
	call	mnscmp		;; Inak porovname aj mantisy
	pop	de
	pop	hl
	jp	nc,addce2
	ex	de,hl		;; DE = cislo s urcite nie mensou absolutnou hodnotou

addce2	pop	bc		;; BC = adresa vysledku
	inc	hl		;; HL = aresa mantisy mensieho scitanca
	inc	de		;; DE = adresa mantisy vecsieho scitanca
	ld	a,(de)
	and	#80
	push	af		;; Znamienko vecsieho ulozime na zasobnik
	dec	de
	ld	a,(de)
	inc	de
	push	af		;; Exponent vecsieho ulozime na zasobnik
	push	bc		;; Adresa vysledku
	push	de		;; Adresu mantisy vecsieho tiez ulozime
	ld	a,(de)
	xor	(hl)
	and	#80		;; Porovnanie znamienok scitancov
	push	af		;; Na zasobnik odlozime info ci su zhodne
	ld	a,(de)
	or	#80
	ld	(de),a		;; Uprava mantisy vecsieho scitanca
addrze	ld	a,#55		;; Uprava mantisy mensieho scitanca
	call	mnsrot
	pop	af		;; BCDE = zarotovana zaokruhlena mantisa
	pop	hl		;; HL = adresa mantisy vecsieho scitanca
	inc	hl
	inc	hl
	inc	hl
	jp	nz,addsub	;; Skok ak maju scitance rozne znamienka

addadd	ld	a,(hl)		;; Scitance mali rovnake znamienka
	add	e		;; budeme robit klasicky sucet mantis
	ld	e,a
	dec	hl		;; Z toho ta z vecsieho cisla je normalizovana
	ld	a,(hl)		;; takze vysledok nebude treba normalizovat
	adc	d		;; (maximalne iba 1x rotnut vpravo ak pretecie)
	ld	d,a
	dec	hl
	ld	a,(hl)
	adc	c
	ld	c,a
	dec	hl
	ld	a,(hl)
	adc	b
	ld	b,a		;; Carry.BCDE = sucet mantis scitancov

	pop	hl		;; HL = adresa vysledku
	jp	nc,addsto	;; Ak sucet nepretiekol, skok

	ld	a,b		;; Ak sucet pretiekol
	rra			;; musime mantisu zarotovat vpravo
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
	call	mnszao		;; Zaokruhlenie mantisy
	pop	af
	inc	a		;; A tiez musime zvysit exponent vysledku
	jp	z,chyba		;; Ak pretiekol tak bude chyba  Number too big
	push	af

addsto	ld	a,b		;; Vymaskovanie najvyssieho bitu mantisy
	and	#7F		;; lebo sem pride znamienko mantisy
	ld	b,a
	pop	af		;; A = exponent vysledku
	ld	(hl),a		;; Ulozenie exponentu do vysledku
	pop	af		;; A = znamienko mantisy #80/#00
	or	b
	push	hl		;; Adresa vysledku
	inc	hl
	ld	(hl),a		;; Mantisa bajt 1 so znamienkom
	inc	hl
	ld	(hl),c		;; Mantisa bajt 2
	inc	hl
	ld	(hl),d		;; Mantisa bajt 3
	inc	hl
	ld	(hl),e		;; Mantisa bajt 4
	pop	hl		;; HL = adresa vysledku
	pop	de		;; DE = adresa STKEND
	ret

addsub	ld	a,(hl)		;; Scitance mali rozne znamienka
	sub	e		;; budeme robit rozdiel mantis
	ld	e,a
	dec	hl
	ld	a,(hl)		;; Kedze vzdy odcitavame mensie cislo
	sbc	d		;; od vecsieho a mantisy su zrovnane
	ld	d,a		;; tak rozdiel nikdy nebude zaporny
	dec	hl		;; a netreba ho negovat
	ld	a,(hl)
	sbc	c
	ld	c,a
	dec	hl
	ld	a,(hl)
	sbc	b
	ld	b,a		;; BCDE = rozdiel mantis scitancov

	pop	hl		;; HL = adresa vysledku
	pop	af		;; A = exponent vysledku
	ld	(hl),a		;; Ulozenie exponentu do vysledku
	pop	af		;; A = znamienko mantisy #80/#00
	inc	hl
	ld	(hl),a		;; Ulozenie znamienka mantisy
	dec	hl
	call	norma		;; BCDE = mantisa pripravena na normalizaciu a zapis
	pop	de
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
	ex	de,hl		;; Vynasobenie mantisy 2x
	add	hl,hl
	ex	de,hl
	ld	a,c
	adc	a,a
	ld	c,a
	ld	a,b
	adc	a,a
	ld	b,a
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

;; Nacitanie mantisy z pameti a jej rotacia o dany pocet bitov doprava
;; Vstup: HL = adresa mantisy v pameti, A = pocet bitov rotacie 0..32
;; Vystup: BCDE = zarotovana a zaokruhlena mantisa

mnsrot	push	af
	ld	a,#80		;; Uprava mantisy mensieho scitanca
	or	(hl)
	ld	b,a		;; Mantisa bajt 1 bit 7 = 1
	inc	hl
	ld	c,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	e,(hl)		;; BCDE = mantisa mensieho scitanca
	ld	h,#00		;; H = pomocny bajt pre rozsirenie mantisy
	pop	af		;; A = rozdiel exponentov
	jp	addbtx

addbts	ld	h,e
	ld	e,d		;; Rotacia mantisy BCDE.H
	ld	d,c		;; po celych bajtoch
	ld	c,b		;; vpravo
	ld	b,#00
addbtx	sub	#08
	jp	nc,addbts

	cp	#FD		;; Ak treba rotovat viac ako 4x vpravo
	jp	nc,addlll	;; tak skok na max. 3 rotacie vlavo
	add	a,#08		;; Ak treba vobec rotovat
	jp	nz,addrrr	;; tak skok na rotacie vpravo
	ld	a,h
	add	a,a		;; Ak nic netreba rotovat
	jp	mnszao		;; rovno skok na zaokruhlenie

addrrr	ld	l,a		;; Rotacia mantisy
addrrx	ld	a,b		;; po bitoch vpravo
	or	a
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
	dec	l
	jp	nz,addrrx
	jp	mnszao		;; Po rotacii skok na zaokruhlenie

addlll	ld	h,#00
	ld	l,a		;; Rotacia mantisy H.BCDE
	ex	de,hl		;; po bitoch vlavo
addllx	add	hl,hl
	ld	a,c
	adc	a,c		;; X vlavo = 8-X vpravo
	ld	c,a
	ld	a,b
	adc	a,b
	ld	b,a
	ld	a,d
	adc	a,d
	ld	d,a
	inc	e
	jp	nz,addllx
	ex	de,hl
	ld	a,e		;; HBCD.E => BCDE.carry
	ld	e,d
	ld	d,c
	ld	c,b
	ld	b,h
	add	a,a

;; Zaokruhlenie mantisy BCDE podla carry
;; BCDE = BCDE + Carry

mnszao	ret	nc
	inc	e
	ret	nz
	inc	d
	ret	nz
	inc	c
	ret	nz
	inc	b
	ret

;; Rutinky pre rychle nasobenie

MULTIP	ld	a,(de)		;; #30CA
	or	(hl)		;; Test ci su obe cisla integer
	jp	nz,mulflt	;; Ak nie, skok na floating point nasobenie

;; Nasobenie integer * integer ... +/-65535

mulint	push	de		;; Adresa druheho cisla a buduca hodnota STKEND
	push	hl		;; Adresa  prveho cisla a sem sa ulozi vysledok nasobenia

	push	de		;; DE = adresa druheho cisla
	call	H2D7F		;; Nacitaj prve cislo do DE
	jp	c,m65536	;; Ak je -65536 tak skok na FP nasobenie
	ex	de,hl		;; HL = hodnota prveho cisla
	ex	(sp),hl		;; Prve cislo na stack
	ld	b,c		;; Znamienko cisla do B
	call	H2D7F		;; Nacitaj druhe cislo do DE
	jp	c,m65536	;; Ak je -65536 tak skok na FP nasobenie
	ld	a,b		;; B=znamienko  prveho cisla
	xor	c		;; C=znamienko druheho cisla
	and	#80		;; Urcenie vysledneho znamienka
	ld	b,a		;; B = znamienko vysledku #00 / #80
	pop	hl		;; HL = prve cislo

	ld	a,d
	or	e
	jp	z,mulnul	;; Ak je prve cislo nulove
	ld	a,h
	or	l		;; alebo
	jp	nz,mixxxx	;; Ak je druhe cislo nulove
	ex	de,hl
mulnul	pop	hl		;; tak ho rovno zapiseme
	jp	mulsde		;; ako vysledok nasobenia

;;HLDE
mixxxx	xor	a		;;   HL  *  DE
	xor	h		;; #XXXX * #XXXX
	jp	nz,mi1xxx
mi01xx	xor	d		;; #00FF * #XXXX
	jp	nz,mi011x
mi0101	ld	h,l		;; #00FF * #00FF
	call	m8x8		;; Nasobenie HL=H*E
	ex	de,hl		;; Vysledok do DE
	pop	hl
	jp	mul0de		;; Vzdy bude integer

mi011x	xor	a		;; #00FF * #FFXX
	xor	e
	jp	nz,mi0111
mi0110	ex	de,hl		;; #00FF * #FF00
	jp	mi1001

mi1xxx	xor	a
	xor	l
	jp	nz,mi11xx
mi10xx	xor	d
	jp	nz,mi101x
mi1001	call	m8x8		;; Nasobenie HL=H*E
	ld	a,h		;; #00FF * #FF00 alebo #FF00 * #00FF
	ld	h,l
	ld	l,#00		;; Vysledok HL0 => AHL
	jp	mulahl		;; Spracovanie vysledku v AHL

mi101x	xor	a		;; #FF00 * #FFXX
	xor	e
	jp	nz,mi1011
	ld	e,d		;; #FF00 * #FF00
	push	bc		;; Uschova znamienka
	call	m8x8		;; Nasobenie HL=H*E
	ld	de,#00		;; Mantisa HLDE
	jp	muliff		;; Vzdy bude floating point

mi11xx	xor	a		;; #FFFF * #XXXX
	xor	d
	jp	nz,mi111x
mi1101	ld	a,e		;; #FFFF * #00FF
	ex	de,hl
	jp	muli8a

mi111x	xor	a		;; #FFFF * #FFXX
	xor	e
	jp	nz,muli32
mi1110	ld	a,d		;; #FFFF * #FF00
	ex	de,hl
	jp	muli8b

mi0111	ld	a,l		;; #00FF * #FFFF
				;; #FFFF * #00FF alebo #00FF * #FFFF
muli8a	call	m8x16		;; Nasobenie A:HL = A * DE
mulahl	ex	de,hl		;; A:DE = vysledok nasobenia
	pop	hl		;; HL = adresa kam treba dat vysledok
	or	a
	jp	nz,muli24	;; Ak vyslo viac ako 65535 tak skok

mul0de	ld	a,b		;; B = znamienko #00/#80
	add	a,a
	sbc	a,a
mulsde	ld	c,a		;; C = znamienko #00/#FF
	call	H2D8E		;; Ulozenie cisla DE na stack
	pop	de
	ret			;; Koniec nasobenia s integer vysledkom

mi1011	ld	a,h		;; #FF00 * #FFFF
				;; #FFFF * #FF00 alebo #FF00 * #FFFF
muli8b	call	m8x16		;; Nasobenie A:HL = A * DE
	ld	e,b		;; Znamienko do E
	ld	b,a		;; Vysledok AHL do BCD
	ld	c,h
	ld	d,l
	ld	a,e		;; Znamienko do A
	ld	e,#00		;; Mantisa BCDE
	jp	muliss

muli24	ld	c,a		;; Treti bajt mantisy
	ld	a,b		;; Znamienko vysledku
	ld	b,#00		;; Najvyssi bajt mantisy bude 0
	jp	mulist

muli32	push	bc		;; Uschova znamienka
	call	m16x16		;; Nasobenie HLDE = HL * DE
muliff	ld	b,h
	ld	c,l		;; BCDE = buduca mantisa
	pop	af		;;    A = znamienko
muliss	pop	hl

mulist	ld	(hl),#A0	;; Ulozenie predbezneho exponentu
	inc	hl
	ld	(hl),a		;; Ulozenie znamienka mantisy
	dec	hl
	call	norma		;; BCDE = mantisa pripravena na normalizaciu a zapis
	pop	de
	ret

m65536	pop	af		;; Obnovenie adries cisel v pripade
	pop	hl		;; ze niektore bolo integer -65536
	pop	de

;; Nasobenie floating point * floating point

mulflt	call	int2fp		;; Prevod prveho cinitena na FP (ak uz nie je)
	ret	z		;; Ak je nulovy, tak hned navrat (bude to vysledok)
	ex	de,hl		;; HL ukazuje na druheho cinitela
	call	int2fp		;; Prevod druheho cinitena na FP (ak uz nie je)
	ex	de,hl
	jp	z,nulset	;; Ak je nulovy, tak rovno nastavime vysledok na nulu

	ld	a,(de)
	call	chkund		;; Predbezna kontrola podtecenia

	push	de		;; Adresa druheho cisla a buduca hodnota STKEND
	push	hl		;; Adresa  prveho cisla a sem sa ulozi vysledok nasobenia
	inc	hl
	inc	de		;; HL,DE ukazuju na mantisu
	ld	a,(de)
	xor	(hl)
	and	#80		;; Znamienko vysledku
	call	getmns		;; Uloz znamienko a daj mantisu prveho cisla
	push	hl
	ld	h,b
	ld	l,c
	ld	(num1+2),hl	;; Vyssie slovo cisla 1
	ex	de,hl
	ld	(num1+0),hl	;; Nizsie slovo cisla 1
	ex	(sp),hl		;; Stack: nizsie slovo, HL = adresa druheho cinitela
	inc	hl
	call	getmns		;; Daj mantisu druheho cisla
	ld	h,b		;;        (aj tu sa znamienko ulozi ale nepouzije)
	ld	l,c
	ld	(num2+2),hl
	ex	de,hl		;; DE = vyssie slovo cisla 2
	ld	(num2+0),hl	;; HL = nizsie slovo cisla 2
	ex	de,hl		;; DE = nizsie slovo cisla 2
	ld	b,h		;; HL = vyssie slovo cisla 2
	ld	c,l		;; BC = vyssie slovo cisla 2
	pop	hl		;; HL = nizsie slovo cisla 1

;; Cislo1: ..HL
;; Cislo2: BCDE

;; muMNOP vyznam pismen v labeloch: x=nevieme, 0=nulove, 1=nenulove
;;
;;   M ...... druhy bajt prveho cisla (num1+1)
;;    N ..... nizsie slovo prveho cisla  BC
;;     O ..... druhy bajt druheho cisla   E
;;      P ... nizsie slovo druheho cisla HL
;;
;; Prve bajty normalizovanych mantis su vzdy nenulove a v rozsahu #80..#FF

muxxxx	ld	a,d		;; Rozhodovanie ake bitovo siroke nasobenie treba pouzit
	or	e
	jp	z,muxxx0
muxx11	ld	a,h
	or	l
	jp	nz,mu1111
	ld	hl,(num1+2)	;; HL = vyssie slovo cisla 1 (nizsie je nulove)
mux011	xor	l
	jp	nz,mu1011
	jp	mu0011

muxxx0	ld	a,h		;; DE = 0
	or	l
	jp	z,mux0x0	
mu11x0	ex	de,hl		;; DE = nizsie slovo cisla 1
	ld	hl,(num1+2)	;; HL = vyssie slovo cisla 1
	push	hl
	ld	h,b
	ld	l,c
	pop	bc		;; Cislo1 = BCDE
	xor	a		;; Cislo2 = HL00
	xor	l
	jp	nz,mu1110
	jp	mu1100

mux0x0	ld	hl,(num1+2)	;; HL = vyssie slovo cisla 1
	ld	d,b		;; DE = vyssie slovo cisla 2
	ld	e,c
	xor	e
	jp	nz,mux010
mux000	ex	de,hl		;; HL = vyssie slovo cisla 2
	xor	e		;; DE = vyssie slovo cisla 1
	jp	nz,mu1000

mu0000	ld	e,d
	call	m8x8		;; Nasobenie HL=H*E
	ld	b,h
	ld	c,l
	xor	a
	ld	d,a
	ld	e,a
	jp	mulset

mux010	xor	a
	xor	l
	jp	nz,mu1010
mu0010
mu1000	ld	a,h
s8x16	call	m8x16		;; Nasobenie A:HL = A * DE
	ld	b,a
	ld	c,h
	ld	d,l
	xor	a
	ld	e,a
	jp	mulset
mu1100
mu0011	ld	a,h
s8x32	call	m8x32		;; Nasobenie ABCDE = A * BCDE
	ld	h,a		;;        => BCDEA
	ld	a,e
	ld	e,d
	ld	d,c
	ld	c,b
	ld	b,h
	jp	mulset
mu1110
mu1011
s16x32	call	m16x32		;; Nasobenie DEHLBC = HL * BCDE
	jp	mulss1
mu1111
s32x32	call	m32x32		;; Nasobenie DEHLBCxx = num1 x num2
mulss1	ex	de,hl		;; HLDEBxxx
	ld	a,b		;; HLDEAxxx
	ld	b,h
	ld	c,l		;; BCDEA = vysledok 40 bitov
	jp	mulset		;; (posledny bajt v A je pre normalizaciu a zaokruhlenie)
mu1010
s16x16	call	m16x16		;; Nasobenie HLDE = HL * DE
	ld	b,h
	ld	c,l
	xor	a

mulset	ld	l,a		;; Tu bude mantisa BCDEA (A=pomocne bity ak treba)
	ld	a,b
	add	a,a
	jp	c,mulmok	;; Je najvyssi bit mantisy jednotkovy ?
	ld	a,l		;; Ak nie, mantisu treba normalizovat
	pop	hl
	dec	(hl)		;; Dekrement exponentu - zatial dovolime aj nulovy
	push	hl
	add	a,a
	ld	l,a		;; Rotacia celej mantisy
	ld	a,e		;; o jeden bit vlavo
	adc	a,a
	ld	e,a
	ld	a,d
	adc	a,a
	ld	d,a
	call	bc2x1c		;; BC = BC << 1 + carry

mulmok	ld	a,l
	pop	hl		;; HL = adresa vysledku nasobenia
	add	a,a
	jp	nc,mulsto	;; Ak je 33-ty bit mantisy jednotkovy
	inc	e		;; potom 32 bitov mantisy zaokruhlime smerom hore
	jp	nz,mulsto
	inc	d
	jp	nz,mulsto
	inc	c
	jp	nz,mulsto
	inc	b
	jp	nz,mulsto	;; Mantisa pri zaokruhlovani pretiekla
	inc	(hl)		;; musime preto zvysit exponent
	jp	nz,mulsto
	dec	(hl)		;; Ak pretiekol, vratime ho nazad
	ex	(sp),hl		;; a skusime zvysit druhy exponent
	inc	(hl)
	ex	(sp),hl		;; Ak aj ten pretiekol,
	jp	z,chyba		;; bude chyba  Number too big

mulsto	push	hl
	inc	hl
	ld	a,b
	and	#7F		;; Namiesto najvyssieho bitu mantisy
	or	(hl)		;; bude znamienko cisla
	ld	(hl),a
	inc	hl
	ld	(hl),c		;; Ulozenie ostatnych bajtov mantisy
	inc	hl
	ld	(hl),d
	inc	hl
	ld	(hl),e
	pop	hl
	pop	de

	ld	a,(de)
	call	matexp		;; Urcenie exponentu vysledku (osetri aj pod/pretecenie)
	ld	(hl),a		;; Ulozenie exponentu vysledku
	ret			;; Koniec nasobenia floating point * floating point

;; Sada rutiniek pre rychle bitove nasobenie
;; optimalizovanych pre rozne sirky cinitelov
;; (kvoli miestu sa tu nepouzivaju tabulky)

;; Nasobenie 64 bit = 32x32 bit
;;      DE-HL-BC-xx = num1 x num2
;;              (xx nepotrebujeme)
;;
;;     mn  = num1
;;   * op  = num2
;;   ----
;;   .rst  =  p * mn
;;   uvw.  =  o * mn
;;   ----
;;   xyzi  = op * mn
;;
;; Trva: 2880..3500 taktov aj s callom

m32x32	;;ld	bc,(num1+2)	;; BC = m
	ld	hl,(num1+2)	;; BC = m
	ld	b,h
	ld	c,l
	;;ld	de,(num1+0)	;; DE = n
	ld	hl,(num1+0)
	ex	de,hl
	ld	hl,(num2+0)	;; HL = p
	push	de		;; Stk = n,...
	push	bc		;; Stk = m,n,...
	call	m16x32		;; Nasobenie DEHLBC = HL * BCDE
	pop	bc		;; BC = m, DE = r, HL = s  (BC = t sa tu strati)
	ex	de,hl		;; HL = r, DE = s
	ex	(sp),hl		;; Stk = r, HL = n
	ex	de,hl		;; HL = s, DE = n
	push	hl		;; Stk = s,r,...
	ld	hl,(num2+2)	;; HL = o, BC = m, DE = n
	call	m16x32		;; Nasobenie DEHLBC = HL * BCDE
	ld	(m32sto+1),hl	;; Store = v, DE = u, HL = v, BC = w
	ld	h,b
	ld	l,c		;; HL = w
	pop	bc		;; Stk = r,.. BC = s
	add	hl,bc		;; HL = s + w = z
	ex	(sp),hl		;; Stk = z, HL = r
m32sto	ld	bc,#5555	;; BC = v
	jp	nc,m32mmm
	inc	hl		;; HL = r + pretecenie(z)
	ld	a,h
	or	l
	jp	nz,m32mmm
	inc	de		;; DE = u + pretecenie(r)
m32mmm	add	hl,bc		;; HL = r + v + pretecenie(z), BC = v
	pop	bc
	ret	nc
	inc	de		;; DE = u + pretecenie(r)
	ret			;; DEHLBC = xyz

;; Nasobenie DEHLBC = HL * BCDE
;;
;;   BCDE
;;   * HL
;;   ----
;;   mnop
;; rstu
;; ------
;; vwxyzi
;;
;; Trva: 1300..1600 taktov aj s callom

m16x32	push	hl		;; Rezia: 156
	push	bc
	call	m16x16		;; HLDE = HL * DE
	;;ld	(m16sto+1),de	;; HL = mn, DE = op
	ex	de,hl
	ld	(m16sto+1),hl
	ex	de,hl
	pop	de		;; DE = byvale BC
	ex	(sp),hl		;; Stk = mn
	call	m16x16		;; HLDE = HL * DE
	ex	de,hl		;; DE = rs, HL = tu
	pop	bc		;; BC = mn
	add	hl,bc		;; HL = xy
m16sto	ld	bc,#5555	;; BC = zi
	ret	nc
	inc	de		;; vw = rs + pretecenie (mn + tu)
	ret

;; Nasobenie HLDE = HL * DE
;;
;;   DE
;; * HL
;; ----
;;  rst
;; uvw
;; ----
;; zxyt
;;
;; Trva: 574..721 taktov aj s callom

m16x16	push	hl		;; HL = mn, DE = op, Stk = mn
	ld	a,l		;; A = N
	call	m8x16		;; A:HL = rst = n * op
	ld	b,a		;; B = r
	pop	af		;; A = m
	push	hl		;; Stk = st
	call	m8x16		;; A:HL = uvw = m * op
	pop	de		;; DE = st
	ld	c,d		;; C = s
	add	hl,bc		;; HL = xy = vw + rs
	ld	d,l		;; D = y
	ld	l,h		;; L = x
	ld	h,a		;; H = z = u(+carry)
	ret	nc
	inc	h
	ret

;; Nasobenie ABCDE = A * BCDE
;;           AHLDE = A * BCDE
;;      A
;; * BCDE
;; ------
;;    mno  =  A*DE
;;  prs    =  A*BC
;; ------
;;  vwxyz  =  A*BCDE
;;
;; Trva: 610..750 taktov aj s callom

m8x32	push	bc		;; Rezia: 140
	push	af
	call	m8x16		;; A = m, HL = no
	ld	b,c		;; BC = 0 (z m8x16)
	ld	c,a		;; C = m
	pop	af		;; A = cinitel
	pop	de		;; DE = vyssie slovo
	push	hl		;; Stk = no,...
	push	bc		;; Stk = 0m,no,...
	call	m8x16		;; A = p, HL = rs
	pop	bc		;; BC = 0m
	pop	de		;; DE = no
	add	hl,bc		;; HL = rs + m
	ld	b,h
	ld	c,l		;; BC = rs + m
	ret	nc
	inc	a		;; A = p + pretecenie (rs + m)
	ret

;; Nasobenie A:HL = A * DE
;; Trva 235..304 T aj s call

m8x16	ld	c,#00		;; A:HL = A * DE
	ld	h,c		;; Nemeni B a DE
	ld	l,c

	add	a,a		;; Optimalizovana prva iteracia
	jp	nc,$+5
	ld	h,d
	ld	l,e

	DUP 6
	add	hl,hl
	rla
	jp	nc,$+5
	add	hl,de
	adc	a,c
	EDUP

	add	hl,hl		;; Optimalizovana posledna iteracia
	rla
	ret	nc
	add	hl,de
	adc	a,c
	ret

;; Nasobenie HL = H * E
;; Trva 195..243 T aj s call

m8x8	ld	l,#00
	ld	d,l
	DUP 7
	add	hl,hl
	jp	nc,$+4
	add	hl,de
	EDUP
	add	hl,hl
	ret	nc
	add	hl,de
	ret

;; Rutinky pre rychle delenie

H31AF					;; #31AF  

;; Floating point delenie 32/32 bit
;;     s optimalizaciu na 16/16 bit
;;             a dalej na 08/08 bit

DIVIDE	ex	de,hl		;; HL ukazuje na delitela
	call	int2fp		;; Prevod delitela na FP
	ex	de,hl		;; Ak je delitel nulovy
	jp	z,chyba		;; tak skok na chybu 'Number too big'
	call	int2fp		;; Prevod delenca na FP
	ret	z		;; Ak je delenec nulovy tak vysledok bude rovno ten delenec

	ld	a,e		;; Koniec mantisy pre ukoncenie delenia
	ld	(divme1+1),a
	ld	(divme2+1),a

	ld	a,(de)		;; Exponent delitela zinvertujeme
	cpl			;; aby potom exponenty stacilo
	inc	a		;; scitat ako pri nasobeni
	ld	(de),a		;; Exponent zostava v rozsahu #01-#FF
	call	chkund		;; A este predbezna kontrola podtecenia

	push	de		;; Adresa delitela (toto bude STKEND)
	push	hl		;; Adresa delenca  (tu bude vysledok)

	inc	hl
	inc	de

	ld	a,(de)		;; Znamienko delitela
	ld	c,a
	or	#80		;; Priprava mantisy delitela pre delenie
	ld	(de),a

	ex	de,hl		;; HL=adresa mantisy delitela
	ld	(addel0+1),hl	;; Najvyssi bajt mantisy delitela
	inc	hl
	inc	hl
	inc	hl
	ld	(addel3+1),hl	;; Najnizsi bajt mantisy delitela
	ex	de,hl

	ld	a,c
	xor	(hl)
	and	#80
	ld	b,(hl)
	ld	(hl),a		;; Znamienko vysledku #00/#80
	xor	a
	inc	hl
	ld	c,(hl)		;; Nacitanie mantisy delenca a
	ld	(hl),a		;; vynulovanie mantisy vysledku
	inc	hl
	ld	d,(hl)
	ld	(hl),a
	inc	hl
	ld	e,(hl)
	ld	(hl),a
	ld	a,b
	or	#80		;; Odstranenie znamienka z mantisy
	ld	b,a		;; BCDE = mantisa delenca

	call	delcmp		;; Porovnanie ci je delenec mensi ako delitel

	sbc	a,a		;; Simulacia chyby povodnej rutinky
	ld	(diverr+1),a	;; Ulozenie infa o chybe

	pop	hl
	jp	c,divmen	;; Ak je delenec mensi tak skok

	inc	(hl)		;; Ak nie je mensi tak zvysime exponent
	jp	nz,divnem	;; Ak exponent nepretiekol, je vsetko ok
	dec	(hl)		;; Ak pretiekol, vratime ho nazad
	ex	(sp),hl		;; a skusime zvysit druhy exponent
	inc	(hl)
	ex	(sp),hl		;; Ak ani ten nepretiekol, je vsetko ok
	jp	nz,divnem
chyba	rst	#08		;; Inak ohlasime chybu
	db	#05		;; "Number to big"

divmen	call	del2x		;; Zdvojnasobenie delenca (bude vzdy vecsi ako delitel)
divnem	push	hl		;; Odlozenie adresy vysledku

	ld	hl,(addel3+1)	;; Kontrola sirky delenca a delitela
	ld	a,(hl)
	dec	hl
	or	(hl)
	or	d
	or	e		;; Ak delenec aj delitel maju spodne wordy nenulove
	jp	nz,div32x	;; potom musime pokracovat na plne 32 bitove delenie

	dec	hl		;; Tu su delenec aj delitel max. 16 bitove
	or	(hl)
	or	c		;; Ak oba maju nizsi bajt vyssieho wordu nenulovy
	jp	nz,div16x	;; potom musime pokracovat na 16 bitove delenie

;; Delenie 8/8 bit

div08x	dec	hl		;; Inak mozeme pokracovat 8 bitovym delenim
	ld	e,(hl)		;; E = delitel

	ld	a,b		;; Odcitanie delitela od delenca
	sub	e		;; Ak je delenec uz po prvom odcitani nulovy,
	jp	z,divpop	;; v deleni dalej ani nemusime pokracovat
	ld	d,a		;; D = delenec

	pop	hl
	push	hl		;; HL = adresa vysledku - exponent
	inc	hl		;; HL = adresa vysledku - mantisa
	ld	a,(divme1+1)	;; Koniec mantisy pre ukoncenie delenia
	ld	b,a
	ld	c,#40		;; C = maska pre zapis bitu do mantisy
	jp	div8dv

;; Hlavna slucka delenia 8/8 bit
;; HL=pointer do mantisy vysledku
;;  C=maska pre zapisovany bit do mantisy vysledku
;;  D=delenec alebo co z neho zostava (zvysok)
;;  E=delitel
;;  B=hranica pre ukocenie delenia (koniec mantisy vysledku)

div8ll	ld	d,a
	sub	e
	jp	c,div8nx

div8st	ld	d,a
	ld	a,c
	or	(hl)		;; Zapiseme jednicku
	ld	(hl),a		;; do prislusneho bitu mantisy

	xor	a
	xor	d		;; Ak je delenec uz nulovy
	jp	z,divpop	;; mozeme rovno ukoncit cele delenie

div8nx	ld	a,c		;; Posun na dalsi bit v bajte mantisy
	rrca
	ld	c,a
	jp	nc,div8dv	;; Ak sme presli vsetky bity v bajte,
	inc	hl		;; posun na dalsi bajt mantisy
	ld	a,l
	cp	b		;; Ak sme presli vsetky bajty mantisy
	jp	z,div8ee	;; tak koniec a zaokruhlenie vysledku

div8dv	ld	a,d		;; Zdvojnasobenie delenca
	add	a,a
	jp	nc,div8ll	;; Ak nepretiekol, pokracujeme v slucke delenia
	sub	e		;; Ak pretiekol, odcitame delitela
	jp	div8st		;; a do vysledku zapiseme jednotkovy bit

;; Delenie 16/16 bit

div16x	ld	e,(hl)		;; Ulozenie delitela pre 16bit delenie
	dec	hl
	ld	d,(hl)

	ld	a,e		;; Nizsi bajt delitela
	ld	(divdl0+1),a
	ld	(divdl2+1),a
	ld	a,d		;; Vyssi bajt delitela
	ld	(divdl1+1),a
	ld	(divdl3+1),a

	ld	a,c		;; Prve odcitanie sa vzdy podari
	sub	e		;; lebo delenec je tu vecsi
	ld	e,a		;; a prvy bit vysledku bude vzdy 1
	ld	a,b		;; ale tento jednotkovy bit
	sbc	d		;; zapisovat do mantisy nemusime
	ld	d,a		;; lebo na jeho mieste bude znamienko

	or	e		;; Ak je delenec uz po prvom odcitani nulovy,
	jp	z,divpop	;; v deleni dalej ani nemusime pokracovat

	pop	hl
	push	hl		;; HL = adresa vysledku - exponent
	inc	hl		;; HL = adresa vysledku - mantisa

	ld	c,#40		;; C = maska pre zapis bitu do mantisy
	jp	divdva		;; Skok do hlavnej slucky 16bit delenia

;; Hlavna slucka delenia 16/16 bit
;; B=temporary
;; C=maska pre bit v mantise
;; HL=pointer do mantisy
;; DE=delenec

divilo	ld	a,e		;; Hlavna slucka delenia
divdl0	sub	#55		;; Pokusne odcitame delitela od delenca
	ld	b,a		;; (nizsi bajt rozdielu zatial ulozime do B)
	ld	a,d
divdl1	sbc	#55		;; Ak sa odcitanie nepodarilo
	jp	c,divnxt	;; potom bude bit vysledku 0 a skok

	ld	d,a		;; Delenca nahradime vysledkom odcitania
	ld	e,b		;; a bit vysledku bude 1
divset	ld	a,c
	or	(hl)		;; Zapiseme jednicku
	ld	(hl),a		;; do prislusneho bitu mantisy

	ld	a,d
	or	e		;; Ak je delenec po odcitani uz nulovy
	jp	z,divpop	;; potom je delenie hovove a mozeme skoncit

divnxt	ld	a,c		;; Posun na dalsi bit v bajte mantisy
	rrca
	ld	c,a
	jp	nc,divdva	;; Ak sme presli vsetky bity v bajte,
	inc	hl		;; posun na dalsi bajt mantisy
	ld	a,l
divme1	cp	#55		;; Ak sme presli vsetky bajty mantisy
	jp	z,div16e	;; tak koniec a zaokruhlenie vysledku

divdva	ex	de,hl		;; Zdvojnasobenie zvysku v delenci
	add	hl,hl
	ex	de,hl
	jp	nc,divilo	;; Ak zvysok nepretiekol, skok na test ci je uz nulovy

	ld	a,e		;; Ak zvysok pretiekol tak je urcite vecsi ako delitel
divdl2	sub	#55
	ld	e,a		;; mozeme od zvysku rovno odcitat delitela
	ld	a,d
divdl3	sbc	#55
	ld	d,a		;; a do vysledku rovno
	jp	divset		;; zapiseme jednotkovy bit

;; Delenie 32/32 bit

div32x	call	delsub		;; Odcitanie delitela od delenca
	pop	hl

	ld	a,b		;; Test ci je delenec uz nulovy
	or	c
	or	d
	or	e		;; Ak je uz delenec nulovy,
	jp	z,divpep	;; cele delenie rovno ukoncime.

	push	hl
	inc	hl
	push	hl		;; HL = smernik na bajty mantisy vysledku
	ld	a,#40		;; Inicializacia masky pre ukladanie bitov do mantisy
	ld	(divmsk+1),a
	jp	divtwo

;; Hlavna slucka delenia 32/32 bit
;; HL=temporary
;; BCDE=meniaci sa delenec
;; Adresa do mantisy vysledku je na stacku

divlop	ld	a,b
	or	c
	or	d
	or	e		;; Ak je uz delenec nulovy,
	jp	z,divend	;; cele delenie rovno ukoncime.

	call	delcmp		;; Porovnanie ci je delenec mensi ako delitel
	ccf
	jp	nc,divpos	;; Skok ak je mensi a vo vysledku bude nulovy bit

divsub	call	delsub		;; Odcitanie delitela od delenca

	pop	hl		;; Zapis jednotkoveho bitu do vysledku
divmsk	ld	a,#55		;; Maska pre zapis bitu
	or	(hl)
	ld	(hl),a
	push	hl

divpos	ld	hl,divmsk+1	;; Posun masky na dalsi bit
	ld	a,(hl)
	rrca
	ld	(hl),a
	jp	nc,divtwo
	pop	hl		;; Ak maska prekrocila bajt
	inc	hl		;; tak bude posun na dalsi bajt mantisy
	ld	a,l
divme2	cp	#55		;; Ak sme zapisali vsetky bity mantisy
	jp	z,divall	;; tak delenie ukoncime
	push	hl

divtwo	call	del2x		;; Zdvojnasobenie delenca, resp. zvysku po odcitani
	jp	c,divsub	;; Ak pretiekol, je urcite vecsi ako delitel
	jp	divlop		;; Inak budeme testovat ci uz nie je nulovy

;; Zaverecne osetrenie delenia a zaokruhlenie vysledku

div8ee	ld	e,#00		;; Prevod delenca D0 => DE00
div16e	ld	b,d		;; Prevod delenca DE => BC00
	ld	c,e
	ld	de,#00

divall	ld	a,(seting)	;; Simulacia aritmetickej chyby delenia
	and	#10		;; Ak chybu netreba simulovat
	jp	z,diveok	;; tak skok na spravne zaokruhlenie
diverr	ld	a,#55		;; Inak test ci sa ma chyba prejavit
	or	a		;; Ak sa ma prejavit tak
	jp	nz,divpop	;; zaokruhlovanie preskocime

diveok	dec	hl		;; HL = posledny bajt mantisy vysledku
	call	del2x		;; Zdvojnasobenie delenca  BCDE = BCDE << 1
	jp	c,divzzz	;; Ak pretiekol, urcite je vecsi nez delitel
	push	hl
	call	delcmp		;; Porovnanie delenca s delitelom
	pop	hl
	jp	c,divpop	;; Ak je stale mensi, 33-bit vysledku bude 0 a mozeme skoncit
divzzz	call	divzao		;; 33-ty bit je 1, zaokruhlime mantisu smerom hore
	jp	nz,divpop	;; Ak exponent nepretiekol tak ok

	dec	(hl)		;; Ked exponent delenca pretiekol, vratime ho nazad
	pop	de		;;   DE = adresa delenca
	pop	hl		;;   HL = adresa delitela
	inc	(hl)		;; a namiesto neho inkrementneme invertovany exponent delitela
	ex	de,hl		;;   HL = adresa vysledku, DE = STKEND
	jp	nz,divexp	;; Ak nepretiekol, je vsetko OK
	rst	#08
	db	#05		;; Inak chyba  Number to big

divend	pop	af		;; Odstranenie pointra na mantisu
divpop	pop	hl		;; Adresa vysledku
divpep	pop	de		;; Adresa STKEND

divexp	ld	a,(de)
	call	matexp		;; Urcenie exponentu vysledku (osetri aj pod/pretecenie)
	ld	(hl),a		;; Ulozenie exponentu vysledku
	ret			;; Koniec delenia floating point * floating point

;; Rozne drobne podprogramy pre scitanie, nasobenie a delenie

;; Precitanie mantisy FP cisla do registrov
;;     Zaroven ulozi do cisla znamienko
;;     a nastavi najvyssi bit mantisy
;;  Vstup: HL = adresa citanej mantisy, A = znamienko
;; Vystup: HL = adresa za tou mantisou, BCDE = mantisa

getmns	ld	b,(hl)
	ld	(hl),a		;; Ulozenie znamienka mantisy
	inc	hl
	ld	c,(hl)
	inc	hl
	ld	d,(hl)
	inc	hl
	ld	e,(hl)
	inc	hl
	ld	a,b
	or	#80		;; Uprava mantisy na spravny tvar
	ld	b,a		;; nastavenim najvyssieho bitu na 1
	ret

;; Zdvojnasobenie mantisy
;; BCDE = 2 * BCDE

del2x	ex	de,hl
	add	hl,hl
	ex	de,hl
bc2x1c	ld	a,c
	adc	a,a
	ld	c,a
	ld	a,b
	adc	a,a
	ld	b,a
	ret

;; Porovnanie ci je delenec mensi ako delitel

delcmp
addel0	ld	hl,#5555	;; Adresa bajtu 0 mantisy delitela
	ld	a,b
	cp	(hl)
	ret	nz
	inc	hl
	ld	a,c
	cp	(hl)
	ret	nz
	inc	hl
	ld	a,d
	cp	(hl)
	ret	nz
	inc	hl
	ld	a,e
	cp	(hl)
	ret

;; Odcitanie delitela od delenca

delsub
addel3	ld	hl,#5555	;; Adresa bajtu 3 mantisy delitela
	ld	a,e
	sub	(hl)
	ld	e,a
	dec	hl
	ld	a,d
	sbc	(hl)
	ld	d,a
	dec	hl
	ld	a,c
	sbc	(hl)
	ld	c,a
	dec	hl
	ld	a,b
	sbc	(hl)
	ld	b,a
	ret

;; Porovnanie absolutnych hodnot mantis
;;   Vstup: DE,HL = adresy cisel
;;  Vystup: Zero=rovnake, Carry=1 ak (DE) < (HL)

mnscmp	inc	hl
	inc	de
	ld	a,(hl)		;; Znamienka mantis
	or	#80		;; treba vymaskovat
	ld	c,a
	ld	a,(de)
	or	#80
	cp	c
	ret	nz
	inc	hl
	inc	de
	ld	a,(de)
	cp	(hl)
	ret	nz
	inc	hl
	inc	de
	ld	a,(de)
	cp	(hl)
	ret	nz
	inc	hl
	inc	de
	ld	a,(de)
	cp	(hl)
	ret

;; Zaokruhlenie floating point cisla smerom hore
;; alebo pripocitanie jednotky k celej 32 bitovej mantise

divzao	inc	(hl)
	ret	nz
	dec	hl
	inc	(hl)
	ret	nz
	dec	hl
	inc	(hl)
	ret	nz
	dec	hl
	ld	a,(hl)		;; Bit 7 prveho bajtu mantisy je znamienko
	inc	(hl)		;; (predbezne inkrementovanie bajtu)
	and	#7F		;; preto sa inkrementuje iba spodnych 7 bitov
	inc	a
	ret	p		;; Ak nepretiekli do siedmeho bitu, tak je vsetko OK
	dec	a
	and	#80		;; Inak musime zachovat znamienko
	ld	(hl),a		;; a ostatne bity vynulujeme
	dec	hl		;; a inkrementujeme exponent cisla
	inc	(hl)
	ret

;; Predbezna kontrola podtecenia
;; na zaciatku nasobenia a delenia

chkund	add	a,(hl)		;; Ak exponenty scitame a pretecie to
	ret	c		;; tak celkovy vysledok urcite nepodtecie
	cp	#7F		;; Ak je sucet vecsi ako #7F
	ret	nc		;; tak je tiez pravdepodobne vsetko OK
	jp	nulpop		;; Inak je podtecenie a rovno vratime vysledok nula

;; Urcenie vysledneho exponentu pre nasobenie
;;   Vstupne exponenty: (HL),A => 1..255 +128
;;  Vystupny exponent:  non-zero: A => 0..254 +127
;;                          zero: podtecenie (zapise nulovy vysledok)

matexp	add	(hl)		;; Scitanie exponentov
	jp	nc,matenc	;; Ak menej ako #FF tak skok
	sub	#80		;; Uprava na rozsah #80-#FF
	ret	c		;; Navrat ak je v rozsahu
	rst	#08		;; #31AD  Inak ohlasime chybu
	DEFB	#05		;; #31AE  'Number too big'

matenc	sub	#80		;; Uprava na rozsah #00-#7F
	jp	z,nulpop	;; Ak je nula tak podtiekol
	ret	nc		;; Navrat ak nepodtiekol

;; Nastavenie nuloveho vysledku na adresu HL
;; a tiez vytvori STKEND v DE ... DE=HL+5

nulpop	pop	af		;; Odstranenie navratovej adresy
nulset	xor	a		;; Ulozenie nuly do vysledku
	ld	d,h
	ld	e,l
	ld	(de),a
	inc	de
	ld	(de),a
	inc	de
	ld	(de),a
	inc	de
	ld	(de),a
	inc	de
	ld	(de),a
	inc	de
	ret

;; Konverzia cisla z integer na floating point
;; Rutinka podobna ako na #3297
;;   Vstup: HL = adresa cisla na stacku
;;  Vystup: Zero flag = cislo je nula

H3297
int2fp	ld	a,(hl)		;; Ak exponent cisla
	or	a		;; nie je nulovy, cislo je uz FP
	ret	nz		;; a hned navrat
	push	de
	call	H2D7F		;; Nacitanie integer cisla
	ex	de,hl		;; HL = absolutna hodnota integer cisla
	push	af
	ld	a,c
	and	#80
	ld	c,a		;; Znamienko #00/#80 do C
	pop	af
	ld	b,#91		;; Predbezna hodnota exponentu pre 16 bit
	jp	c,int2st	;; Skok pre hodnotu -65536
	xor	a
	xor	h
	jp	nz,int2n1	;; Skok pre hodnotu v rozsahu 256..65535
	xor	l
	ld	b,l
	jp	z,int2st	;; Skok pre hodnotu NULA
	ld	l,h		;; Skok pre hodnotu v rozsahu 1..255
	ld	b,#89		;; Predbezna hodnota exponentu pre 8 bit
int2l1	dec	b
	add	a,a
	jp	nc,int2l1
	rra
	ld	h,a
	jp	int2st

int2l2	add	hl,hl
int2n1	dec	b
	ld	a,h
	add	a,a
	jp	nc,int2l2
int2st	ex	de,hl
	xor	a
	inc	hl
	ld	(hl),a		;; Mantisa bajt 4  (bude vzdy nulovy)
	dec	hl
	ld	(hl),a		;; Mantisa bajt 3  (bude vzdy nulovy)
	dec	hl
	ld	a,d
	and	#7F
	or	c		;; Pridanie znamienka do mantisy
	ld	(hl),e		;; Mantisa bajt 2
	dec	hl
	ld	(hl),a		;; Mantica bajt 1 (bit7=znamienko)
	dec	hl
	ld	(hl),b		;; Exponent
	pop	de
	xor	a
	xor	b		;; Vystup: Zero pre nulove cislo
	ret

;; podpgm pro prevzeti celeho cisla ze zasobniku kalkulatoru
;; Rozsirenie: Pri -65536 vrati priznak CY=1
;;   Vstup: HL=adresa cisla
;;  Vystup: C=znamienko 00/FF, DE=absolutna hodnota

H2D7F	inc	HL			;; #2D7F  nyni adresuje znamenko
	ld	C,(HL)			;; #2D80  to je prevzato do _C,#FF znaci zapor.
	inc	HL			;; #2D81  adresuje LSB
	ld	A,(HL)			;; #2D82  prevezme LSB
	xor	C			;; #2D83  a vytvori 1.doplnek
	sub	C			;; #2D84  neg: prictenim 1: 2.doplnek
	ld	E,A			;; #2D85  LSB do _E
	inc	HL			;; #2D86  ukazuje na MSB
	ld	A,(HL)			;; #2D87  prevezme jej
	adc	C			;; #2D88  a pokud je zaporny
	xor	C			;; #2D89  vytvori 2.doplnek
	ld	D,A			;; #2D8A  MSB do _D

	or	e		;; Test ci cislo bolo 0 alebo akoze -65536
	ret	nz		;; Ak nie tak hned navrat (CY=0)
	or	c		;; Tak isto aj pre +0
	ret	z		;; hned navrat
	ld	a,(seting)	;; Osetrenie stavu pre -65536 (#FF #00 #00)
	and	#10		;; Ak chybu treba simulovat
	ret	nz		;; tak tiez hned navrat s C=#FF
	scf			;; Inak nastavime CY ako priznak ze bolo -65536

	ret				;; #2D8B

;; podpgm pro zapis celeho cisla na zasobnik kalkulatoru
;; (opak predchoziho podpgmu)
;; Vstup: HL=adresa cisla, C=znamienko 00/FF, DE=absolutna hodnota

H2D8E	push	HL			;; #2D8E  vstup se znamenkem v _C
					;; #2D8F  (#FF:zaporne, 0:kladne)
	ld	(HL),0			;; #2D8F  nulovan prvni bajt
	inc	HL			;; #2D91
	ld	(HL),C			;; #2D92  znamenko zapsano do druheho
	inc	HL			;; #2D93  pro zaporne cislo bude vytvoren
	ld	A,E			;; #2D94  2.doplnek
	xor	C			;; #2D95  nejprve pro LSB
	sub	C			;; #2D96
	ld	(HL),A			;; #2D97  LSB zapsan
	inc	HL			;; #2D98
	ld	A,D			;; #2D99  zpracovan MSB
	adc	C			;; #2D9A
	xor	C			;; #2D9B
	ld	(HL),A			;; #2D9C  a take zapsan
	inc	HL			;; #2D9D
	ld	(HL),0			;; #2D9E  5.bajt taktez nulovy
	pop	HL			;; #2DA0  obnoveni ukazatele na prvni bajt
	ret				;; #2DA1

;; funkce 'ABS' (op.kod #2A) Absolutni hodnota cisla

ABSOLU	ld	B,#FF			;; #346A  iniciace _B
	jp	H3474			;; #346C  a skok do rutiny NEGIER

;; podpgm pro zmenu znamenka posl.hodnoty na zasobniku (#1B)

NEGIER	call	H34E9			;; #346E  kdyz je cislo nula
	ret	C			;; #3471  pak se nebude nic provadet
	ld	B,0			;; #3472  _B=0 pro negaci
H3474	ld	A,(HL)			;; #3474  prevzeti 1.bajtu
	and	A			;; #3475  pokud je nulovy
	jp	Z,H3483			;; #3476  jde o cislo "integer"
	inc	HL			;; #3478  jinak ukazatel na 2.bajt
	ld	A,B			;; #3479  bit7=1 pro 'ABS',bit7=0 pro negaci
	and	#80			;; #347A  ponecha jen tento bit
	or	(HL)			;; #347C  (pro 'ABS' nastaven)
	xor	#80
	;;rla				;; #347D  pres CARRY je invertovan
	;;ccf				;; #347E
	;;rra				;; #347F
	ld	(HL),A			;; #3480  bajt se zmenenym znamenkem zpet
	dec	HL			;; #3481  ukazatel opet na 1.bajt
	ret				;; #3482

;; zmena znamenka cisla "integer"

H3483	push	DE			;; #3483  uschovan >STKEND<
	push	HL			;; #3484  a ukazatel na cislo
	call	H2D7F			;; #3485  znamenko do _C,cislo do _DE
	pop	HL			;; #3488  obnoven ukazatel na cislo

	jp	nc,H3489		;; Ak to nebolo -65536 tak skok
	ld	(hl),#91		;; Ak ano, ako vysledok zapiseme
	inc	hl			;; floating point hodnotu +65536
	ld	(hl),#00		;; #91 #00 ...
	dec	hl
	pop	de
	ret

H3489	ld	A,B			;; #3489  #FF pro 'ABS',#00 pro negaci
	or	C			;; #348A  zde znamenko pro 'ABS' vzdy #FF
	cpl				;; #348B  znamenko invertovano
	ld	C,A			;; #348C  a kopie do _C
	call	H2D8E			;; #348D  cislo "integer" zapsano zpet
	pop	DE			;; #3490  obnoveni >STKEND< v _DE
	ret				;; #3491

;; podpgm pro test,zda cislo na zasobniku je 0

H34E9	push	HL			;; #34E9  uschovan ukazatel na cislo
	push	BC			;; #34EA
	ld	B,A			;; #34EB  _A uschovano do _B
	ld	A,(HL)			;; #34EC  prvni bajt prevzat
	inc	HL			;; #34ED  a provedeno log.OR s dalsimi tremi
	or	(HL)			;; #34EE  (vsechny musi byt nulove)
	inc	HL			;; #34EF  (a CARRY bude take 0)
	or	(HL)			;; #34F0
	inc	HL			;; #34F1
	or	(HL)			;; #34F2
	ld	A,B			;; #34F3  obnoveni _A,
	pop	BC			;; #34F4  _BC
	pop	HL			;; #34F5  i ukazatele na cislo
	ret	NZ			;; #34F6  cislo<>0:CARRY=0
	scf				;; #34F7  cislo =0:CARRY=1
	ret				;; #34F8

;; Rychle porovnanie dvoch cisel namiesto odcitania
;; Pouzite v relacnych operatoroch = < > <> =< =>
;; V podstate robi vypocet: vysledok = SGN(cislo1-cislo2)
;;
;; Na rozdiel od povodne pouziteho poctiveho odcitania zvlada
;; porovnat aj extremne pripady, napriklad: 1e38 s cislom -1e38

SPDCMP	push	de		;; DE = adresa druheho cisla
	push	hl		;; HL = adresa  prveho cisla
	ld	a,(de)
	ld	c,(hl)		;; C = exponent  prveho cisla
	ld	b,a		;; B = exponent druheho cisla
	inc	hl
	inc	de
	ld	a,(de)
	xor	(hl)		;; Ako prve porovname
	and	#80		;; znamienka oboch cisel
	ld	a,(hl)
	rlca			;; Ak su rozne, vysledkom bude +/-1
	jp	nz,cmp1cy	;; so znamienkom podla prveho cisla

;; Dalej sa porovnavaju iba cisla s rovnakym znamienkom

	ld	a,b		;; Test ci su obe cisla integer
	or	c		;; (musia mat nulove exponenty)
	jp	nz,cmpflt	;; Skok pri floating point

;; Porovnanie cisel typu integer

cmpint	inc	hl		;; Posun na hodnoty cisel
	inc	de		;; Cisla maju rovnake znamienko
	ld	a,(de)		;; a su v dvojkovom doplnku, preto
	sub	(hl)		;; pre porovnanie ich staci odcitat
	ld	c,a		;; C = docasne nizsi bajt rozdielu
	inc	hl
	inc	de
	ld	a,(de)
	sbc	(hl)
	ld	de,#01
	ccf			;; Ak je prve cislo vecsie
	jp	nc,cmp1cy	;; tak zapiseme vysledok +1
	or	c		;; Ak je rozdiel cisel nenulovy
	scf			;; potom prve cislo je urcite mensie
	jp	nz,cmp1cy	;; a zapiseme vysledok -1
cmpnul	xor	a		;; Nulovy rozdiel => cisla su rovnake
	ld	d,a
	ld	e,a
	jp	cmpcst

;; Porovnanie cisel typu floading point

cmpflt	dec	hl		;; Posun nazad na exponenty cisel
	dec	de
	call	int2fp		;; Prevod prveho cisla na FP (ak uz nie je)
	scf			;; Ak je prve cislo nula, druhe bude urcite kladne
	jp	z,cmp1cy	;; a vysledkom porovnania potom bude -1

	ex	de,hl		;; HL ukazuje na druhe cislo
	call	int2fp		;; Prevod druheho cisla na FP (ak uz nie je)
	ex	de,hl		;; Ak je druhe cislo nula, prve bude urcite kladne
	jp	z,cmp1cy	;; a vysledkom porovnania potom bude +1

;; Dalej sa porovnavaju iba dve nenulove floating point cisla

	ld	a,(de)		;; Porovnanie exponentov cisel
	cp	(hl)		;; Ak su rozne,
	jp	nz,cmpfst	;; skok na zapis +/-1 podla znamienka cisel

	call	mnscmp		;; Ak su exponenty rovnake, porovname mantisy
	jp	z,cmpnul	;; Ak su aj mantisy rovnake, vysledok bude nula

cmpfst	pop	hl		;; Cisla su urcite rozne
	push	hl		;; HL = adresa prveho cisla
	inc	hl		;; HL = adresa prveho bajtu mantisy so znamienkom
	ccf
	sbc	a,a		;; Vysledok porovnania absolutnych hodnot cisel
	xor	(hl)		;; vyxorujeme so znamienkom tychto cisel a tym
	add	a,a		;; ziskame vysledok porovnania samotnych cisel

cmp1cy	ld	de,#01		;; Ulozenie +/-1 podla carry
	sbc	a,a		;; (CY=0 pre + a CY=1 pre -)
cmpcst	ld	c,a		;; C = znamienko cisla #00/#FF
	pop	hl		;; HL = adresa vysledku
	call	H2D8E		;; Ulozenie vysledku porovnania -1/0/+1 na zasobnik
	pop	de		;; DE = STKEND
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

;; Koniec samotneho kodu

	OUTEND

;; Nastavenie systemu

seting	db	#00

;; Argumenty pre nasobenie 32x32 bit

num1	ds	#04
num2	ds	#04
