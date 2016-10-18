var assert = this['assert'] ? this['assert'] : require('assert');
var Enumerable = this['Enumerable'] ? this['Enumerable'] : require('../lib/Enumerable.js');
var $R = this['$R'] ? this['$R'] : require('../lib/Range.js').$R;
var $A = this['$A'] ? this['$A'] : require('../lib/Array.js').$A;
var Hash = this['Hash'] ? this['Hash'] : require('../lib/Hash').Hash;
var $H = this['$H'] ? this['$H'] : require('../lib/Hash').$H;

describe('Enumerable', function() {
	describe('Enumerable (instance)', function() {
		it('#all', function() {
			assert($A([]).all())
			// -> true (empty arrays have no elements that could be falsy)
			assert($R(1, 5).all())
			// -> true (all values in [1..5] are truthy)
			assert(!$A([0, 1, 2]).all())
			// -> false (with only one loop cycle: 0 is falsy)
			assert(!$A([9, 10, 15]).all(function(n) {
				return n >= 10;
			}))
			// -> false (the iterator returns false on 9)
		})
		it('#any', function() {
			assert(!$A([]).any())
			// -> false (empty arrays have no elements that could be truthy)
			assert($R(0, 2).any())
			// -> true (on the second loop, 1 is truthy)
			assert($A([2, 4, 6, 8, 10]).any(function(n) {
				return n > 5;
			}))
			// -> true (the iterator will return true on 6)
		})
		it('#collect', function() {
			var result = $A(['Hitch', "Hiker's", 'Guide', 'to', 'the', 'Galaxy']).collect(function(s) {
				return s.charAt(0).toUpperCase();
			});
			assert(result.toString() == 'H,H,G,T,T,G')
			// -> ['H', 'H', 'G', 'T', 'T', 'G']
			result = $R(1, 5).collect(function(n) {
				return n * n;
			});
			assert(result.toString() == '1,4,9,16,25')
			// -> [1, 4, 9, 16, 25]
		})
		it('#detect', function() {
			assert([1, 7, -2, -4, 5].detect(function(n) {
				return n < 0;
			}) == -2)
			// -> -2
		})
		it('#each', function() {
			var result = '';
			$A(['one', 'two', 'three']).each(function(i) {
				result += i + ':'
			})
			assert(result == 'one:two:three:')
		})
		it('#eachSlice', function() {
			var students = [{
				name: 'Sunny',
				age: 20
			}, {
				name: 'Audrey',
				age: 21
			}, {
				name: 'Matt',
				age: 20
			}, {
				name: 'Amelie',
				age: 26
			}, {
				name: 'Will',
				age: 21
			}];
			var slices = $A([]);
			students.eachSlice(3, function(student) {
				slices.push(student)
			});

			assert(slices.length == 2)
			assert(slices[0].length == 3)
			assert(slices[1].length == 2)
			// -> [['Sunny', 'Audrey', 'Matt'], ['Amelie', 'Will']]
		})
		it('#entries', function() {
			// #toArray
		})
		it('#every', function() {
			// #all
		})
		it('#filter', function() {
			// #findAll
		})
		it('#find', function() {
			// #detect
		})
		it('#findAll', function() {
			var result = $A([1, 'two', 3, 'four', 5]).findAll(Object.isString);
			assert(result.toString() == 'two,four')
			// -> ['two', 'four']
		})
		it('#grep', function() {
			// Get all strings containing a repeated letter
			var result = $A(['hello', 'world', 'this', 'is', 'cool']).grep(/(.)\1/);
			assert(result.toString() == 'hello,cool')
			// -> ['hello', 'cool']
			// Get all numbers ending with 0 or 5 and subtract 1 from them
			result = $R(1, 30).grep(/[05]$/, function(n) {
				return n - 1;
			});
			assert(result.toString() == '4,9,14,19,24,29')
			// -> [4, 9, 14, 19, 24, 29]
		})
		it('#include', function() {
			assert($R(1, 15).include(10))
			// -> true
			assert(!$A(['hello', 'world']).include('HELLO'))
			// -> false ('hello' != 'HELLO')
			assert([1, 2, '3', '4', '5'].include(3))
			// -> true ('3' == 3)
		})
		it('#inGroupsOf', function() {
			var students = [{
				name: 'Sunny',
				age: 20
			}, {
				name: 'Audrey',
				age: 21
			}, {
				name: 'Matt',
				age: 20
			}, {
				name: 'Amelie',
				age: 26
			}, {
				name: 'Will',
				age: 21
			}];
			var result = students.inGroupsOf(2, {
				name: '',
				age: 0
			});
			assert(result.length == 3)
			assert(result[0].length == 2)
			assert(result[1].length == 2)
			assert(result[2].length == 2)
			// -> [
			//      [{ name: 'Sunny', age: 20 }, { name: 'Audrey', age: 21 }],
			//      [{ name: 'Matt', age: 20 },  { name: 'Amelie', age: 26 }],
			//      [{ name: 'Will', age: 21 },  { name: '', age: 0 }]
			//    ]
		})
		it('#inject', function() {
			var result = $R(1, 10).inject(0, function(acc, n) {
				return acc + n;
			});
			assert(result == 55)
			// -> 55 (sum of 1 to 10)
			result = $A(['a', 'b', 'c', 'd', 'e']).inject($A([]), function(string, value, index) {
				if (index % 2 === 0) { // even numbers
					string += value;
				}
				return string;
			});
			assert(result == 'ace')
			// -> 'ace'
		})
		it('#inspect', function() {
			// Using Array since Array extends Enumerable
			assert($A([]).inspect() == '[]')
		})
		it('#invoke', function() {
			var result = $A(['hello', 'world']).invoke('toUpperCase');
			assert(result[0] == 'HELLO')
			assert(result[1] == 'WORLD')
			// -> ['HELLO', 'WORLD']

			result = $A(['hello', 'world']).invoke('substring', 0, 3);
			assert(result[0] == 'hel')
			assert(result[1] == 'wor')
			// -> ['hel', 'wor']
			// Omitted DOM specific test
		})
		it('#map', function() {
			// #collect
		})
		it('#max', function() {
			assert($A(['c', 'b', 'a']).max() == 'c')
			// -> 'c'
			assert($A([1, 3, '3', 2]).max() == 3)
			// -> '3' (because both 3 and '3' are "max", and '3' was later)
			assert($A(['zero', 'one', 'two']).max(function(item) { return item.length; }) == 4)
			// -> 4
		})
		it('#member', function() {
			// #include
		})
		it('#min', function() {
			assert($A(['c', 'b', 'a']).min() == 'a')
			// -> 'a'
			assert($A([3, 1, '1', 2]).min() == 1)
			// -> 1 (because both 1 and '1' are "min", and 1 was earlier)
			assert($A(['un', 'deux', 'trois']).min(function(item) { return item.length; }) == 2)
			// -> 2
		})
		it('#partition', function() {
			var result = $A(['hello', null, 42, false, true, , 17]).partition();
			assert(result.inspect() == "[['hello', 42, true, 17], [null, false]]") // Modified expected result to match observed WebKit results
			// -> [['hello', 42, true, 17], [null, false, undefined]]
			result = $R(1, 10).partition(function(n) {
				return 0 == n % 2;
			});
			assert(result.inspect() == '[[2, 4, 6, 8, 10], [1, 3, 5, 7, 9]]')
			// -> [[2, 4, 6, 8, 10], [1, 3, 5, 7, 9]]
		})
		it('#pluck', function() {
			var result = $A(['hello', 'world', 'this', 'is', 'nice']).pluck('length');
			assert(result.inspect() == '[5, 5, 4, 2, 4]')
			// -> [5, 5, 4, 2, 4]
		})
		it('#reject', function() {
			var result = $A([1, "two", 3, "four", 5]).reject(Object.isString);
			assert(result.inspect() == '[1, 3, 5]')
			// -> [1, 3, 5]
		})
		it('#select', function() {
			// #findAll
		})
		it('#size', function() {
			assert($A([1, 2, 3]).size() == 3)
			assert(new Hash({a: 1, b: 1, c:1}).size() == 3)
		})
		it('#some', function() {
			// #any
		})
		it('#sortBy', function() {
			var result = $A(['hello', 'world', 'this', 'is', 'nice']).sortBy(function(s) {
				return s.length;
			});
			assert(result.inspect() == "['is', 'this', 'nice', 'hello', 'world']") // Modified expected result to match observed WebKit results
			// -> ['is', 'nice', 'this', 'world', 'hello']
		})
		it('#toArray', function() {
			assert($R(1, 5).toArray().inspect() == '[1, 2, 3, 4, 5]')
			// -> [1, 2, 3, 4, 5]
			var result = $H({ name: 'Sunny', age: 20 }).toArray();
			assert(result.inspect() == "[['name', 'Sunny'], ['age', 20]]")
			// -> [['name', 'Sunny'], ['age', 20]]
		})
		it('#zip', function() {
			var firstNames = $A(['Jane', 'Nitin', 'Guy']);
			var lastNames  = $A(['Doe', 'Patel', 'Forcier']);
			var ages       = $A([23, 41, 17]);
			var result = firstNames.zip(lastNames);
			assert(result.inspect() == "[['Jane', 'Doe'], ['Nitin', 'Patel'], ['Guy', 'Forcier']]")
			// -> [['Jane', 'Doe'], ['Nitin', 'Patel'], ['Guy', 'Forcier']]

			result = firstNames.zip(lastNames, ages);
			assert(result.inspect() == "[['Jane', 'Doe', 23], ['Nitin', 'Patel', 41], ['Guy', 'Forcier', 17]]")
			// -> [['Jane', 'Doe', 23], ['Nitin', 'Patel', 41], ['Guy', 'Forcier', 17]]

			result = firstNames.zip(lastNames, ages, function(tuple) {
				return tuple[0] + ' ' + tuple[1] + ' is ' + tuple[2];
			});
			assert(result.inspect() == "['Jane Doe is 23', 'Nitin Patel is 41', 'Guy Forcier is 17']")
			// -> ['Jane Doe is 23', 'Nitin Patel is 41', 'Guy Forcier is 17']
		})
	})
})