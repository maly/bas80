



	return {
		compile: function(source) {
			return generator(parse(source),CONFIG.OMENALPHA)
		}
	}
}));
