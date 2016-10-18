var assert = this['assert'] ? this['assert'] : require('assert');
!Number.prototype.abs ? require('../lib/Number') : 0;

describe('Number', function() {
	describe('Number (instance)', function() {
		it('#abs', function () {
			var test = -1;
			assert(Math.abs(test) == 1)
			assert(test.abs() == 1)
		})
		it('#ceil', function () {
			var test = 5.55;
			assert(test.ceil() == 6)
		})
		it('#floor', function () {
			var test = 5.55;
			assert(test.floor() == 5)
		})
		it('#round', function () {
			var test = 5.54;
			assert(test.round() == 6)
		})
		it('#succ', function () {
			var test = 5;
			assert(test.succ() == 6)
			assert(test.succ().succ() == 7)
		})
		it('#times', function () {
			var result = '';
			(3).times(function (i) {
				result += i;
			});
			assert(result == '012')
		})
		it('#toColorPart', function () {
			var test = 10;
			assert(test.toColorPart() == '0a');
		})
		it('#toPaddedString', function () {
			// Only example provided

			assert((13).toPaddedString(4) == "0013")
			// -> "0013"
			assert((13).toPaddedString(2) == "13")
			// -> "13"
			assert((13).toPaddedString(1) == "13")
			// -> "13"
			assert((13).toPaddedString(4, 16) == "000d")
			// -> "000d"
			assert((13).toPaddedString(4, 2) == "1101")
			// -> "1101"
		})
	})
})