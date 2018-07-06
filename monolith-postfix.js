

	var CONFIG = {
	    "OMENALPHA": {
	        org:"8000h",
	        ramtop:"0f800h",
	        goback:"RST 0"
	    }
	}

	return {
		compile: function(source) {
			return generator(parse(source),CONFIG.OMENALPHA)
		}
	}
}));
