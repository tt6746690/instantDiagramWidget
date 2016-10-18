var assert = this['assert'] ? this['assert'] : require('assert');
var index = false;

try {
	index = require('../lib/');
} catch (e) {}

describe('index (server)', function () {
	describe('index (static)', function () {
		if(index) {
			it('Prototype', function () {
				assert(index.Prototype);
			})
			it('Template', function () {
				assert(index.Template);
			})
			it('Class', function () {
				assert(index.Class);
			})
			it('Hash', function () {
				assert(index.Hash);
			})
			it('$A', function () {
				assert(index.$A);
			})
			it('$w', function () {
				assert(index.$w);
			})
			it('$H', function () {
				assert(index.$H);
			})
			it('$R', function () {
				assert(index.$R);
			})
			it('ObjectRange', function () {
				assert(index.ObjectRange);
			})
			it('PeriodicalExecuter', function () {
				assert(index.PeriodicalExecuter);
			})
			it('Try', function () {
				assert(index.Try);
			})

		}
	})
})