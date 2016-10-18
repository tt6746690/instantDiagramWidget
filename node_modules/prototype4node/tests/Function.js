var assert = this['assert'] ? this['assert'] : require('assert');
var Prototype = this['Prototype'] ? this['Prototype'] : require('../lib/Prototype');
!Function.bind ? require('../lib/Function') : 0;
!Array.prototype.inspect ? require('../lib/Array') : 0;

describe('Function', function() {
	describe('Function (instance)', function() {
		it('#argumentNames', function() {
			function fn(foo, bar) {
				return foo + bar;
			}
			assert(fn.argumentNames().inspect() == "['foo', 'bar']")
			//-> ['foo', 'bar']
			assert(Prototype.emptyFunction.argumentNames().inspect() == "[]")
			//-> []
		})
		it('#bind', function() {
			// Wrote different bind test for simplicity
			var context = {
				foo: 'bar'
			};
			var fn = function() {
					return this.foo;
				};
			assert(fn() == undefined); // undefined because foo is running in a global context
			// Bind function to the custom context
			assert(fn.bind(context)() == 'bar')
		})
		it('#bindAsEventListener', function() {
			// Omitted DOM specific
		})
		it('#curry', function() {
			function showArguments() {
				return Array.from(arguments).join(', ');
			}
			assert(showArguments(1, 2, 3) == '1, 2, 3') // Corrected test from example
			// -> alerts "1, 2, 3"
			var f = showArguments.curry(1, 2, 3);
			assert(f('a', 'b') == "1, 2, 3, a, b")
			// -> alerts "1, 2, 3, a, b"
		})
		it('#defer', function(done) {
			// Wrote different defer test for simplicity, similar to original
			var result = '';

			var fn = function(message) {
					result += message;

					if (message == 'two') {
						try {
							assert(result == 'onethreetwo')
						} catch (e) {
							return done(e);
						}
						done();
					}
				}
			fn('one');
			fn.defer('two');
			fn('three');
		})
		it('#delay', function(done) {
			var a = false;
			// a == false
			assert(a == false);

			// 1. a == false when the function is executed
			(function() {
				try {
					assert(a == true);
				} catch (e) {
					return done(e);
				}
				// 3. a == true when the delayed function is executed
				done();
			}).bind(this).delay(.01)
			// 2. a == true after the function is executed
			a = true;
		})
		it('#methodize', function() {
			// A function that sets a name on a target object
			function setName(target, name) {
				target.name = name;
			}
			// Use it
			var obj = {};
			setName(obj, 'Fred');
			assert(obj.name == 'Fred')
			// -> "Fred"

			// Make it a method of the object
			obj.setName = setName.methodize();
			// Use the method instead
			obj.setName('Barney');
			assert(obj.name == 'Barney')
			// -> "Barney"
		})
		it('#wrap', function() {
			// Modify test to not modify global scope (potentially mess with other tests)
			var capitalize = String.prototype.capitalize.wrap(
				// Wrap String#capitalize so it accepts an additional argument
				function(callOriginal, eachWord) {
					if (eachWord && this.include(" ")) {
						// capitalize each word in the string
						return this.split(" ").invoke("capitalize").join(" ");
					} else {
						// proceed using the original function
						return callOriginal();
					}
				}
			);

			assert(capitalize.call("hello world") == "Hello world")
			// -> "Hello world" (only the 'H' is capitalized)
			assert(capitalize.call("hello world", true) == "Hello World")
			// -> "Hello World" (both 'H' and 'W' are capitalized)
		})
	})
})