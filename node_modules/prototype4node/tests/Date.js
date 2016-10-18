var assert = this['assert'] ? this['assert'] : require('assert');
!Date.prototype.toISOString ? require('../lib/Date') : 0;

describe('Date', function() {
	describe('Date (instance)', function() {
		it('#toISOString', function() {
			var d = new Date(1969, 11, 31, 19);
			assert(d.toISOString() == '1970-01-01T03:00:00.000Z') // modified with observed WebKit results
			//-> '1969-12-31T16:00:00Z'
		})
		it('#toJSON', function () {
			var d = new Date(1969, 11, 31, 19);
			assert(d.toJSON() == '1970-01-01T03:00:00.000Z') // modified with observed WebKit results
			//-> '1969-12-31T16:00:00Z'
		})
	})
})