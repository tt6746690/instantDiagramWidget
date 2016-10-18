require('./Object');

var Hash,
	Enumerable = require('./Enumerable'),
	Class = require('./Class');

function toQueryPair(key, value) {
	if (Object.isUndefined(value)) return key;
	return key + '=' + encodeURIComponent(String.interpret(value));
}

Hash = Class.create(Enumerable, {
	initialize : function initialize(object) {
		this._object = Object.isHash(object) ? object.toObject() : Object.clone(object);
	},
	_each : function _each(iterator) {
		for (var key in this._object) {
			var value = this._object[key],
				pair = [key, value];
			pair.key = key;
			pair.value = value;
			iterator(pair);
		}
	},
	set : function set(key, value) {
		return this._object[key] = value;
	},
	get : function get(key) {
		if (this._object[key] !== Object.prototype[key]) return this._object[key];
	},
	unset : function unset(key) {
		var value = this._object[key];
		delete this._object[key];
		return value;
	},
	toObject : function toObject() {
		return Object.clone(this._object);
	},
	keys : function keys() {
		return this.pluck('key');
	},
	values : function values() {
		return this.pluck('value');
	},
	index : function index(value) {
		var match = this.detect(function(pair) {
			return pair.value === value;
		});
		return match && match.key;
	},
	merge : function merge(object) {
		return this.clone().update(object);
	},
	update : function update(object) {
		return new Hash(object).inject(this, function(result, pair) {
			result.set(pair.key, pair.value);
			return result;
		});
	},
	toQueryString : function toQueryString() {
		return this.inject([], function(results, pair) {
			var key = encodeURIComponent(pair.key),
				values = pair.value;

			if (values && typeof values == 'object') {
				if (Object.isArray(values)) {
					var queryValues = [];
					for (var i = 0, len = values.length, value; i < len; i++) {
						value = values[i];
						queryValues.push(toQueryPair(key, value));
					}
					return results.concat(queryValues);
				}
			} else results.push(toQueryPair(key, values));
			return results;
		}).join('&');
	},
	inspect : function inspect() {
		return '#<Hash:{' + this.map(function(pair) {
			return pair.map(Object.inspect).join(': ');
		}).join(', ') + '}>';
	},
	clone : function clone() {
		return new Hash(this);
	}
});

function $H(object) {
	return new Hash(object);
}

// Static
Hash.from = $H;

// Aliases
Hash.prototype.toJSON = Hash.prototype.toTemplateReplacements = Hash.prototype.toObject;

module.exports = {
	'$H': $H,
	Hash: Hash
};
