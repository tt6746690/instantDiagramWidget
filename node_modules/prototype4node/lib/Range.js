require('./Object');
require('./Function');
require('./Number');

var Prototype = require('./Prototype'),
	Class = require('./Class'),
	Enumerable = require('./Enumerable');

function initialize(start, end, exclusive) {
	this.start = start;
	this.end = end;
	this.exclusive = exclusive;
}

function _each(iterator) {
	var value = this.start;
	while (this.include(value)) {
		iterator(value);
		value = value.succ();
	}
}

function include(value) {
	if (value < this.start) return false;
	if (this.exclusive) return value < this.end;
	return value <= this.end;
}

var ObjectRange = Class.create(Enumerable, {
	initialize: initialize,
	_each: _each,
	include: include
});

function $R(start, end, exclusive) {
	return new ObjectRange(start, end, exclusive);
}

module.exports = {
	$R: $R,
	ObjectRange: ObjectRange
};