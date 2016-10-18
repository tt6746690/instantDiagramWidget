var assert = this['assert'] ? this['assert'] : require('assert');
var PeriodicalExecuter = this['PeriodicalExecuter'] ? this['PeriodicalExecuter'] : require('../lib/PeriodicalExecuter');
!Function.prototype.bind ? require('../lib/Function') : 0;

describe('PeriodicalExecuter', function() {
	describe('PeriodicalExecuter (instance)', function() {
		it('#stop', function (done) {
			var context = {
				start: new Date()
			};
			var execute = (function (pe) {
				var end = new Date();
				try {
					assert(end>this.start)
				} catch(e) {
					pe.stop();
					return done(e);
				}
				pe.stop();
				done();
			}).bind(context);

			new PeriodicalExecuter(execute, .05); // intentionally .05ms
		});
	})
})