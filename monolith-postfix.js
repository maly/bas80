



	return {
		compile: function(source) {
			return generator(parse(source),CONFIG.OMENALPHA,BASIC.I8080)
		}
	}
}));
