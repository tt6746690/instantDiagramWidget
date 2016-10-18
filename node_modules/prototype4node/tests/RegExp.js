var assert = this['assert'] ? this['assert'] : require('assert');
!RegExp.prototype.match ? require('../lib/RegExp') : 0;

describe('RegExp', function() {
	describe('RegExp (instance)', function() {
		it('#match', function () {
			assert(new RegExp("(\w+)").match("word"));
		})
	})
	describe('RegExp (static, class)', function () {
		it('.escape', function () {
			assert(RegExp.escape("$0.00") == "\\$0\\.00");
		})
	})
})