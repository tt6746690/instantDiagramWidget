var assert = this['assert'] ? this['assert'] : require('assert');
var $R = this['$R'] ? this['$R'] : require('../lib/Range').$R;

describe('ObjectRange', function() {
	describe('ObjectRange (instance)', function() {
		it('#include', function () {
			assert($R(1, 10).include(5));
			// -> true
			assert(!$R('a', 'h').include('x'));
			// -> false
			assert($R(1, 10).include(10));
			// -> true
			assert(!$R(1, 10, true).include(10));
			// -> false
		})
	})
})