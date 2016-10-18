var assert = this['assert'] ? this['assert'] : require('assert');
var Try = this['Try'] ? this['Try'] : require('../lib/Try');

describe('Try', function() {
	describe('Try (static, class)', function() {
		it('.these', function () {
			var result = Try.these(
				function () {throw new Error('Error1')},
				function () {throw new Error('Error2')},
				function () {throw new Error('Error3')}
			) || false;

			assert(!result);
			// -> false

			result = Try.these(
				function () {throw new Error('Error1')},
				function () {throw new Error('Error2')},
				function () {throw new Error('Error3')},
				function () {return true;}
			)

			assert(result);
			// -> true
		})
	})
})