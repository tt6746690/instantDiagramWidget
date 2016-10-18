var assert = this['assert'] ? this['assert'] : require('assert');
var $H = this['$H'] ? this['$H'] : require('../lib/Hash').$H;
var Hash = this['Hash'] ? this['Hash'] : require('../lib/Hash').Hash;
var Class = this['Class'] ? this['Class'] : require('../lib/Class');

describe('Hash', function () {
	describe('$H (instance)', function () {
		it('should be a type of function', function () {
			assert(typeof $H == 'function')
		})
		it('should return an object when executed', function () {
			assert(typeof $H({}) == 'object')
		})
		it('should be a subclass of klass', function () {
			assert(Hash.toString().indexOf('klass') != -1)
		})
		it('#toQueryString', function () {
			var order = $H({action: 'ship',
				order_id: 123,
				fees: ['f1', 'f2']
			});
			assert(order.toQueryString() == 'action=ship&order_id=123&fees=f1&fees=f2');
		})
		it('#merge', function () {
			var h = $H({one: "uno", two: "due"});
			var h2 = h.merge({three: "tre"});

			assert(h.keys().toString() == 'one,two') // -> ["one", "two"] (unchanged)
			assert(h2.keys().toString() == 'one,two,three') // -> ["one", "two", "three"] (has merged contents)			
		})
		it('#index', function () {
			var h = $H({one: "uno", two: "due"});
			assert(h.index('uno') == 'one')
			assert(!h.index('tre'))
		})
		it('#set', function() {
			var h = $H({});
			assert(h.set('foo', 'bar') == 'bar');
		})
		it('#get', function () {
			var h = $H({foo: 'bar'});
			assert(h.get('foo') == 'bar');
		})
		it('#clone', function () {
			var h = $H({foo: 'bar'}),
				h2 = h.clone();

			assert(h2.get('foo') == 'bar');
		})
		it('#inspect', function () {
			var h = $H({foo: 'bar'});
			assert(h.inspect() == "#<Hash:{'foo': 'bar'}>")
		})
		it('#each', function () {
			var h = $H({version: 1.6, author: 'The Core Team'});
			var result = '';
			var expectedResult = 'version=1.6,author=The Core Team,';
			h.each(function(pair) {
				result += pair.key + '=' + pair.value + ',';
			});
			assert(result == expectedResult)
		})
		it('#unset', function () {
			var h = new Hash({a: 'apple', b: 'banana', c: 'coconut'});

			assert(h.keys().toString() == 'a,b,c') // -> ["a", "b", "c"]
			assert(h.unset('a') == 'apple') // -> 'apple'
			assert(h.keys().toString() == 'b,c') // -> ["b", "c"] ("a" is no longer in the hash)
		})
		it('#values', function () {
			var h = $H({one: "uno", two: "due", three: "tre"});
			var values = h.values(); // -> ["uno", "tre", "due"] (these may be in any order)

			assert(values.length == 3)
			assert(values.toString().indexOf('uno') != -1)
			assert(values.toString().indexOf('tre') != -1)
			assert(values.toString().indexOf('due') != -1)
		})
		it('#toObject', function () {
			var h = new Hash({ a: 'apple', b: 'banana', c: 'coconut' });
			var obj = h.toObject();

			assert(obj.a == 'apple') // -> "apple"
			assert(obj.b == 'banana')
			assert(obj.c == 'coconut')
		})
		it('#toJSON', function () {
			var h = new Hash({ a: 'apple', b: 'banana', c: 'coconut' });
			var obj = h.toJSON();

			assert(obj.a == 'apple') // -> "apple"
			assert(obj.b == 'banana')
			assert(obj.c == 'coconut')
		})
		it('#keys', function () {
			var h = $H({one: "uno", two: "due", three: "tre"});
			var keys = h.keys().toString(); // -> ["one", "three", "two"] (these may be in any order)


			assert(keys.indexOf('one') != -1)
			assert(keys.indexOf('two') != -1)
			assert(keys.indexOf('three') != -1)
		})
		it('#update', function () {
			var h = $H({one: "uno", two: "due"});
			h._isOriginal = true;

			assert(h.update({three: "tre"})._isOriginal) // -> h (a reference to the original hash)

			var keys = h.keys().toString(); // -> ["one", "two", "three"] (has merged contents)
			assert(keys.indexOf('one') != -1)
			assert(keys.indexOf('two') != -1)
			assert(keys.indexOf('three') != -1)
		})
	});
	describe('Hash (static, class)', function () {		
		it('should be extendable', function () {
			var Subclass = Class.create(Hash, {});
			var testee = new Subclass({
				foo: 'bar'
			});
			assert(testee.get('foo') == 'bar');
		})
	})
})