var assert = this['assert'] ? this['assert'] : require('assert');
var Template = this['Template'] ? this['Template'] : require('../lib/Template');

describe('Template', function() {
	describe('Template (instance)', function() {
		it('new Template', function() {
			// the template (our formatting expression)
			var myTemplate = new Template('The TV show #{title} was created by #{author}.');
			// our data to be formatted by the template
			var show = {
				title: 'The Simpsons',
				author: 'Matt Groening',
				network: 'FOX'
			};

			// let's format our data
			// -> "The TV show The Simpsons was created by Matt Groening."
			assert(myTemplate.evaluate(show) == "The TV show The Simpsons was created by Matt Groening.")
		})
		it('should be reusable', function () {
			// creating a few similar objects
			var conversion1 = { from: 'meters', to: 'feet', factor: 3.28 };
			var conversion2 = { from: 'kilojoules', to: 'BTUs', factor: 0.9478 };
			var conversion3 = { from: 'megabytes', to: 'gigabytes', factor: 1024 };
			 // the template
			var templ = new Template(
				'Multiply by #{factor} to convert from #{from} to #{to}.');

			 // let's format each object
			var evaluatedTemplates = [conversion1, conversion2, conversion3].map( function(conv){
			    return templ.evaluate(conv);
			});

			assert(evaluatedTemplates[0] == 'Multiply by 3.28 to convert from meters to feet.')
			assert(evaluatedTemplates[1] == 'Multiply by 0.9478 to convert from kilojoules to BTUs.')
			assert(evaluatedTemplates[2] == 'Multiply by 1024 to convert from megabytes to gigabytes.')
			// -> Multiply by 3.28 to convert from meters to feet.
			// -> Multiply by 0.9478 to convert from kilojoules to BTUs.
			// -> Multiply by 1024 to convert from megabytes to gigabytes.
		})
		it('should accept escape characters', function () {
			// NOTE: you're seeing two backslashes here because the backslash
			// is also an escape character in JavaScript strings, so a literal
			// backslash is represented by two backslashes.
			var t = new Template(
				'in #{lang} we also use the \\#{variable} syntax for templates.');
			var data = { lang:'Ruby', variable: '(not used)' };

			assert(t.evaluate(data) == 'in Ruby we also use the #{variable} syntax for templates.')
			// -> in Ruby we also use the #{variable} syntax for templates.
		})
		it('should accept custom syntaxes', function () {
			// matches symbols like '{{ field }}'
			var syntax = /(^|.|\r|\n)(\{{\s*(\w+)\s*}})/;
			var t = new Template(
				'<div>Name: <b>{{ name }}</b>, Age: <b>{{ age }}</b></div>',
			syntax);
			assert(t.evaluate( {name: 'John Smith', age: 26} ) == '<div>Name: <b>John Smith</b>, Age: <b>26</b></div>')
			// -> <div>Name: <b>John Smith</b>, Age: <b>26</b></div>
		})
	})
})