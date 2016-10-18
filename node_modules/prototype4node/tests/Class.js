var assert = this['assert'] ? this['assert'] : require('assert');
var Class = this['Class'] ? this['Class'] : require('../lib/Class.js');

describe('Class', function() {
	describe('Class (instance)', function() {
		it('#addMethods', function() {
			var Animal = Class.create({
				initialize: function(name, sound) {
					this.name = name;
					this.sound = sound;
				},
				speak: function() {
					return this.name + " says: " + this.sound + "!";
				}
			});
			// subclassing Animal
			var Snake = Class.create(Animal, {
				initialize: function($super, name) {
					$super(name, 'hissssssssss');
				}
			});
			var ringneck = new Snake("Ringneck");

			assert(ringneck.speak() == "Ringneck says: hissssssssss!")
			//-> alerts "Ringneck says: hissssssss!"
			// adding Snake#speak (with a supercall)
			Snake.addMethods({
				speak: function($super) {
					return $super() + "\nYou should probably run. He looks really mad.";
				}
			});
			assert(ringneck.speak() == "Ringneck says: hissssssssss!\nYou should probably run. He looks really mad.")
			//-> alerts "Ringneck says: hissssssss!"
			//-> alerts "You should probably run. He looks really mad."
			// redefining Animal#speak
			Animal.addMethods({
				speak: function() {
					return this.name + ' snarls: ' + this.sound + '!';
				}
			});
			
			assert(ringneck.speak() == "Ringneck snarls: hissssssssss!\nYou should probably run. He looks really mad.")
			//-> alerts "Ringneck snarls: hissssssss!"
			//-> alerts "You should probably run. He looks really mad."
		})
	})
	describe('Class (static, class)', function() {
		it('.create', function() {
			var Person = Class.create();
			Person.prototype = {
				initialize: function(name) {
					this.name = name;
				},
				say: function(message) {
					return this.name + ': ' + message;
				}
			};

			var guy = new Person('Miro');
			assert(guy.say('hi') == 'Miro: hi')
			// -> "Miro: hi"
			var Pirate = Class.create();
			// inherit from Person class:
			Pirate.prototype = Object.extend(new Person(), {
				// redefine the speak method
				say: function(message) {
					return this.name + ': ' + message + ', yarr!';
				}
			});

			var john = new Pirate('Long John');
			assert(john.say('ahoy matey') == "Long John: ahoy matey, yarr!")
			// -> "Long John: ahoy matey, yarr!"
		})
		it('.create, mixin', function() {
			// define a module
			var Vulnerable = {
				wound: function(hp) {
					this.health -= hp;
					if (this.health < 0) this.kill();
				},
				kill: function() {
					this.dead = true;
				}
			};

			// the first argument isn't a class object, so there is no inheritance ...
			// simply mix in all the arguments as methods:
			var Person = Class.create(Vulnerable, {
				initialize: function() {
					this.health = 100;
					this.dead = false;
				}
			});

			var bruce = new Person;
			bruce.wound(55);
			assert(bruce.health == 45); //-> 45
			bruce.wound(100);
			assert(bruce.dead == true);
		})
	})
})