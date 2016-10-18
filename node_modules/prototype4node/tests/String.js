var assert = this['assert'] ? this['assert'] : require('assert');
!String.interpret ? require('../lib/String.js') : 0;
!Object.isArray ? require('../lib/Object.js') : 0;
!Array.prototype.inspect ? require('../lib/Array.js') : 0;

describe('String', function () {
	describe('String (instance)', function () {
		it('#blank', function () {
			assert(''.blank()) //-> true
			assert('  '.blank()) //-> true
			assert(!(' a '.blank())) //-> false
		})
		it('#empty', function () {
			assert(''.empty()); //-> true
			assert(!'  '.empty()) //-> false
		})
		it('#scan', function () {
			var actual = 'apple, pear & orange';
			actual.scan(/\w+/, function (i) {
				assert(actual.indexOf(i) != -1);
			});

			var fruits = [];
			'apple, pear & orange'.scan(/\w+/, function(match) { fruits.push(match[0]) });
			assert(fruits.inspect() == "['apple', 'pear', 'orange']") // -> ['apple', 'pear', 'orange']

			// Note, skipped DOM test since it wont work on the server without additional libraries like jsDOM
		})
		it('#toQueryParams', function () {
			assert('section=blog&id=45'.toQueryParams().section == 'blog') // -> {section: 'blog', id: '45'}
			assert('section=blog&id=45'.toQueryParams().id == 45) // -> {section: 'blog', id: '45'}
			
			assert('section=blog;id=45'.toQueryParams(';').section == 'blog') // -> {section: 'blog', id: '45'}
			assert('section=blog;id=45'.toQueryParams(';').id == 45) // -> {section: 'blog', id: '45'}
			
			assert('http://www.example.com?section=blog&id=45#comments'.toQueryParams().section == 'blog') // -> {section: 'blog', id: '45'}
			assert('http://www.example.com?section=blog&id=45#comments'.toQueryParams().id == 45) // -> {section: 'blog', id: '45'}
			
			assert('section=blog&tag=javascript&tag=prototype&tag=doc'.toQueryParams().section == 'blog') // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			assert(Object.isArray('section=blog&tag=javascript&tag=prototype&tag=doc'.toQueryParams().tag)) // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			assert('section=blog&tag=javascript&tag=prototype&tag=doc'.toQueryParams().tag.length == 3) // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			
			assert('tag=ruby%20on%20rails'.toQueryParams().tag == 'ruby on rails') // -> {tag: 'ruby on rails'}
			
			assert('id=45&raw'.toQueryParams().id == 45) // -> {id: '45', raw: undefined}
			assert('id=45&raw'.toQueryParams().raw == undefined) // -> {id: '45', raw: undefined}
			
		})
		it('#unfilterJSON', function () {
			assert('/*-secure-\n{"name": "Violet", "occupation": "character", "age": 25}\n*\/'.unfilterJSON().trim() == '{"name": "Violet", "occupation": "character", "age": 25}') // -> '{"name": "Violet", "occupation": "character", "age": 25}'
		})
		it('#dasherize', function () {
			assert('border_bottom_width'.dasherize() == 'border-bottom-width') // -> 'border-bottom-width'
			assert('borderBottomWidth'.underscore().dasherize() == 'border-bottom-width') // -> 'border-bottom-width'
		})
		it('#interpolate', function () {
			assert('#{foo}'.interpolate({foo: 'bar'}) == 'bar')
		})
		it('#camelize', function () {
			assert('background-color'.camelize() == 'backgroundColor') // -> 'backgroundColor'
			assert('-moz-binding'.camelize() == 'MozBinding') // -> 'MozBinding'
		})
		it('#unescapeHTML', function () {
			assert('x &gt; 10'.unescapeHTML() == 'x > 10') // -> 'x > 10'
			assert('<h1>Pride &amp; Prejudice</h1>'.unescapeHTML() == 'Pride & Prejudice') // -> '<h1>Pride & Prejudice</h1>'
		})
		it('#times', function () {
			assert("echo ".times(3) == "echo echo echo ") // -> "echo echo echo "
		})
		it('#capitalize', function () {
			assert('hello'.capitalize() == 'Hello') // -> 'Hello'
			assert('HELLO WORLD!'.capitalize() == 'Hello world!') // -> 'Hello world!'
		})
		it('#truncate', function () {
			assert('A random sentence whose length exceeds 30 characters.'.truncate() == 'A random sentence whose len...') // -> 'A random sentence whose len...'
			assert('Some random text'.truncate() == 'Some random text') // -> 'Some random text.'
			assert('Some random text'.truncate(10) == 'Some ra...') // -> 'Some ra...'
			assert('Some random text'.truncate(10, ' [...]') == 'Some [...]') // -> 'Some [...]'
		})
		it('#evalJSON', function () {
			var person = '{ "name": "Violet", "occupation": "character" }'.evalJSON();
			assert(person.name == 'Violet'); //-> "Violet"
			assert.throws(function () {
				//-> SyntaxError: Badly formed JSON string: 'grabUserPassword()'
				person = 'grabUserPassword()'.evalJSON(true); 
			}, Error)
			
			person = '/*-secure-\n{"name": "Violet", "occupation": "character"}\n*\/'.evalJSON()
			assert(person.name == 'Violet'); //-> "Violet"
		})
		it('#succ', function () {
			assert('a'.succ() == 'b') // -> 'b'
			assert('aaaa'.succ() == 'aaab') // -> 'aaab'
		})
		it('#underscore', function () {
			assert('borderBottomWidth'.underscore() == 'border_bottom_width') // -> 'border_bottom_width'
			assert('borderBottomWidth'.underscore().dasherize() == 'border-bottom-width') // -> 'border-bottom-width'
		})
		it('#evalScripts', function () {
			assert('lorem... <script>2 + 2</script>'.evalScripts()[0] == 4); // -> [4]
			// Choose not to include second example due to alert statement
		})
		it('#startsWith', function () {
			assert('Prototype JavaScript'.startsWith('Pro')) //-> true
		})
		it('#endsWith', function () {
			assert('slaughter'.endsWith('laughter')) // -> true
		})
		it('#include', function () {
			assert('Prototype framework'.include('frame')) //-> true
			assert(!'Prototype framework'.include('frameset')) //-> false
		})
		it('#gsub', function () {
			var mouseEvents = 'click dblclick mousedown mouseup mouseover mousemove mouseout';
			// -> 'click, dblclick, mousedown, mouseup, mouseover, mousemove, mouseout'
			assert(mouseEvents.gsub(' ', ', ') == 'click, dblclick, mousedown, mouseup, mouseover, mousemove, mouseout')
			// -> 'click, dblclick, mousedown, mouseup, mouseover, mousemove, mouseout'
			assert(mouseEvents.gsub(/\s+/, ', ') == 'click, dblclick, mousedown, mouseup, mouseover, mousemove, mouseout')
		})
		it('#strip', function () {
			assert('    hello world!    '.strip() == 'hello world!') // -> 'hello world!'
		})
		it('#stripScripts', function () {
			// => "<p>This is a test.End of test</p>"
			assert("<p>This is a test.<script>alert(\"Look, a test!\");</script>End of test</p>".stripScripts() == "<p>This is a test.End of test</p>");
		})
		it('#sub', function () {
			var fruits = 'apple pear orange';
			assert(fruits.sub(' ', ', ') == 'apple, pear orange') // -> 'apple, pear orange'
			assert(fruits.sub(' ', ', ', 1) == 'apple, pear orange') // -> 'apple, pear orange'
			assert(fruits.sub(' ', ', ', 2) == 'apple, pear, orange') // -> 'apple, pear, orange'
			assert(fruits.sub(/\w+/, function(match){ return match[0].capitalize() + ',' }, 2) == 'Apple, Pear, orange') // -> 'Apple, Pear, orange'
			
			var markdown = '![a pear](/img/pear.jpg) ![an orange](/img/orange.jpg)';
			// -> '<img alt="a pear" src="/img/pear.jpg" /> ![an orange](/img/orange.jpg)'
			assert(markdown.sub(/!\[(.*?)\]\((.*?)\)/, function(match) {
				return '<img alt="' + match[1] + '" src="' + match[2] + '" />';
			}) == '<img alt="a pear" src="/img/pear.jpg" /> ![an orange](/img/orange.jpg)');
			
			// -> '<img alt="a pear" src="/img/pear.jpg" /> ![an orange](/img/orange.jpg)'
			assert(markdown.sub(/!\[(.*?)\]\((.*?)\)/, '<img alt="#{1}" src="#{2}" />') == '<img alt="a pear" src="/img/pear.jpg" /> ![an orange](/img/orange.jpg)');
		})
		it('#escapeHTML', function () {
			// -> "&lt;div class="article"&gt;This is an article&lt;/div&gt;"
			assert('<div class="article">This is an article</div>'.escapeHTML() == "&lt;div class=\"article\"&gt;This is an article&lt;/div&gt;");
		})
		it('#isJSON', function () {
			assert(!"something".isJSON()) // -> false
			assert("\"something\"".isJSON()) // -> true
			assert(!"{ foo: 42 }".isJSON()) // -> false
			assert("{ \"foo\": 42 }".isJSON()) // -> true
		})
		it('#toArray', function () {
			assert('a'.toArray()[0] == 'a') // -> ['a']
			assert('hello world!'.toArray().toString() == 'h,e,l,l,o, ,w,o,r,l,d,!') // -> ['h', 'e', 'l', 'l', 'o', ' ', 'w', 'o', 'r', 'l', 'd', '!']
		})
		it('#stripTags', function () {
			assert('a <a href="#">link</a>'.stripTags() == 'a link') // -> 'a link'
			assert('a <a href="#">link</a><script>alert("hello world!");</script>'.stripTags() == 'a linkalert("hello world!");') // -> 'a linkalert("hello world!");'
			assert('a <a href="#">link</a><script>alert("hello world!");</script>'.stripScripts().stripTags() == 'a link') // -> 'a link'
		})
		it('#inspect', function () {
			assert('I\'m so happy.'.inspect() == '\'I\\\'m so happy.\'') // -> '\'I\\\'m so happy.\''
			// (displayed as 'I\'m so happy.' in an alert dialog or the console)
			assert('I\'m so happy.'.inspect(true) == '"I\'m so happy."') // -> '"I'm so happy."'
			// (displayed as "I'm so happy." in an alert dialog or the console)
		})
		it('#parseQuery', function () {
			assert('section=blog&id=45'.parseQuery().section == 'blog') // -> {section: 'blog', id: '45'}
			assert('section=blog&id=45'.parseQuery().id == 45) // -> {section: 'blog', id: '45'}
			
			assert('section=blog;id=45'.parseQuery(';').section == 'blog') // -> {section: 'blog', id: '45'}
			assert('section=blog;id=45'.parseQuery(';').id == 45) // -> {section: 'blog', id: '45'}
			
			assert('http://www.example.com?section=blog&id=45#comments'.parseQuery().section == 'blog') // -> {section: 'blog', id: '45'}
			assert('http://www.example.com?section=blog&id=45#comments'.parseQuery().id == 45) // -> {section: 'blog', id: '45'}
			
			assert('section=blog&tag=javascript&tag=prototype&tag=doc'.parseQuery().section == 'blog') // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			assert(Object.isArray('section=blog&tag=javascript&tag=prototype&tag=doc'.parseQuery().tag)) // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			assert('section=blog&tag=javascript&tag=prototype&tag=doc'.parseQuery().tag.length == 3) // -> {section: 'blog', tag: ['javascript', 'prototype', 'doc']}
			
			assert('tag=ruby%20on%20rails'.parseQuery().tag == 'ruby on rails') // -> {tag: 'ruby on rails'}
			
			assert('id=45&raw'.parseQuery().id == 45) // -> {id: '45', raw: undefined}
			assert('id=45&raw'.parseQuery().raw == undefined) // -> {id: '45', raw: undefined}
		})
	})
	describe('String (static, class)', function () {
		it('.interpret', function () {
			assert(String.interpret(1234) == '1234')
		})
	})
});

