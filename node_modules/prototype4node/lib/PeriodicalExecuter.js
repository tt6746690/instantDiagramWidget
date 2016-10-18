require('./Function');

var Class = require('./Class');

var PeriodicalExecuter = Class.create({
	initialize: function(callback, frequency) {
		this.callback = callback;
		this.frequency = frequency;
		this.currentlyExecuting = false;

		this.registerCallback();
	},

	registerCallback: function() {
		this.timer = setInterval(this.onTimerEvent.bind(this), this.frequency * 1000);
	},

	execute: function() {
		this.callback(this);
	},

	stop: function() {
		if (!this.timer) return;
		clearInterval(this.timer);
		this.timer = null;
	},

	onTimerEvent: function() {
		if (!this.currentlyExecuting) {
			try {
				this.currentlyExecuting = true;
				this.execute();
				this.currentlyExecuting = false;
			} catch (e) {
				this.currentlyExecuting = false;
				throw e;
			}
		}
	}
});

module.exports = PeriodicalExecuter;