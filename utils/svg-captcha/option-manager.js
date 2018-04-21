'use strict';

const opentype = require('opentype.js');
const charPreset = require('./char-preset');
const font = opentype.loadSync('./assets/Comismsh.ttf');
const ascender = font.ascender;
const descender = font.descender;

const options = {
	width: 140,
	height: 40,
	noise: 2,
	color: false,
	background: '',
	size: 4,
	ignoreChars: '',
	fontSize: 42,
	charPreset, font, ascender, descender
};

const loadFont = filepath => {
	const font = opentype.loadSync(filepath);
	options.font = font;
	options.ascender = font.ascender;
	options.descender = font.descender;
};

module.exports = {
	options, loadFont
};
