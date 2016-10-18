var assert = this['assert'] ? this['assert'] : require('assert');
var $A = this['$A'] ? this['$A'] : require('../lib/Array.js').$A;

describe('Array', function(){
	describe('$A (instance)', function () {
		it('should be defined as a function', function () {
			assert.equal(typeof $A, 'function')
		})
		it('should return an array when executed', function () {
			assert(Object.isArray($A()))	
		})
		it('should contain 5 nodes when passed "Hello"', function () {
			assert($A('hello').length = 4)
		})
		it('#uniq', function () {
			assert([1, 3, 2, 1].uniq().toString() == '1,3,2')
			// -> [1, 2, 3]
			assert(['A', 'a'].uniq().toString() == 'A,a')
			// -> ['A', 'a'] (because String comparison is case-sensitive)
		})
		it('#last', function () {
			assert([1, 2, 3].last() == 3)
		})
		it('#clear', function () {
			var guys = ['Sam', 'Justin', 'Andrew', 'Dan'];
			assert(guys.clear().length == 0)
			// -> []
		})
		it('#flatten', function () {
			var a = ['frank', ['bob', 'lisa'], ['jill', ['tom', 'sally']]];
			var b = a.flatten();
			// a -> ['frank', ['bob', 'lisa'], ['jill', ['tom', 'sally']]]
			// b -> ['frank', 'bob', 'lisa', 'jill', 'tom', 'sally']

			assert(b.toString() == 'frank,bob,lisa,jill,tom,sally')
		})
		it('#clone', function () {
			var orig = [1, 2, 3];
			var clone = orig.clone().reverse();

			assert(orig.toString() == '1,2,3')
			assert(clone.toString() == '3,2,1')
		})
		it('#indexOf', function () {
			assert([3, 5, 6, 1, 20].indexOf(1) == 3)
			// -> 3
			assert([3, 5, 6, 1, 20].indexOf(90) == -1)
			// -> -1 (not found)
			assert(['1', '2', '3'].indexOf(1) == -1)
			// -> -1 (not found, 1 !== '1')
			assert([1, 2, 1].indexOf(1, 1) == 2)
		})
		it('#without', function () {
			assert([3, 5, 6].without(3)[0] == 5)
			assert([3, 5, 6].without(3).length == 2)
			// -> [5, 6]
			assert([3, 5, 6, 20].without(20, 6)[0] == 3)
			assert([3, 5, 6, 20].without(20, 6)[1] == 5)
			assert([3, 5, 6, 20].without(20, 6).length == 2)
			// -> [3, 5]
		})
		it('#reverse', function () {
			// Making a copy
			var nums = [3, 5, 6, 1, 20];
			var rev = nums.reverse(false);
			assert(rev.toString() == '20,1,6,5,3')
			// nums -> [3, 5, 6, 1, 20]
			// rev -> [20, 1, 6, 5, 3]
			// Working inline
			var nums = [3, 5, 6, 1, 20];
			nums.reverse();
			assert(nums.toString() == '20,1,6,5,3')
			// nums -> [20, 1, 6, 5, 3]
		})
		it('#lastIndexOf', function () {
			assert([1, 2, 1].lastIndexOf(1) == 2)
		})
		it('#toArray', function () {
			var orig = [1, 2, 3];
			var clone = orig.toArray().reverse();

			assert(orig.toString() == '1,2,3')
			assert(clone.toString() == '3,2,1')
		})
		it('#size', function () {
			assert([1, 2, 3].size() == 3)
		})
		it('#intersect', function () {
			assert([1, 2, 3].intersect([3, 4, 5])[0] == 3)
			assert([1, 2, 3].intersect([3, 4, 5]).length == 1)
		})
	})
	describe('Array (static, class)', function () {
		it('.from', function () {
			assert(Array.from('hello').length = 4)		
		})
	})
})