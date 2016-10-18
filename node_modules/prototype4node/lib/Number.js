require('./Object');
require('./String');
require('./Array');

function toColorPart() {
	return this.toPaddedString(2, 16);
}

function succ() {
	return this + 1;
}

function times(iterator, context) {
	var i = 0,
		range = [];

	for(i;i<this;i++) {
		range.push(i);
	}

	range.each(iterator, context);
	return this;
}

function toPaddedString(length, radix) {
	var string = this.toString(radix || 10);
	return '0'.times(length - string.length) + string;
}

function abs() {
	return Math.abs(this);
}

function round() {
	return Math.round(this);
}

function ceil() {
	return Math.ceil(this);
}

function floor() {
	return Math.floor(this);
}


Object.extend(Number.prototype, {
	toColorPart: toColorPart,
	succ: succ,
	times: times,
	toPaddedString: toPaddedString,
	abs: abs,
	round: round,
	ceil: ceil,
	floor: floor
});