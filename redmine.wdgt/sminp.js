;(function($) {
	$.widget('ui.smart_input', {
		
		options: {
			element_class: 'ui-smart-input',
			filledCss: {},
			emptyCss: {},
			onBlur: undefined,
			onFocus: undefined,
			label: '...'
		},
		
		_def_value: function() {
			if (!this.element.val()) {
				this.element.hide();
				
				if (this.options._fake.filter('textarea').length) {
					this.options._fake.text(this.options.label);
				} else {
					this.options._fake.val(this.options.label);
				}
				this.options._fake.css(this.options.emptyCss).show();
			} else {
				this.options._fake.hide();
				this.element.show().css(this.options.filledCss);
			}
		},
		
		_onBlur: function(_ev) {
			var _e = this.element, _o = this.options, self = this;
			this._def_value();
			if (typeof(_o.onBlur) == 'function') {
				_o.onBlur.call(_e, _ev);
			}
		},
		
		_onFocus: function() {
			var _e = this.element, _o = this.options, self = this, _val = _e.val();
			try {
				if (_val == _o.label) {
					_e.val('');
				}
				_e.css(_o.filledCss);
				
				if (typeof(_o.onFocus) == 'function') {
					_o.onFocus.call(_e, _ev);
				}
			} catch (e) {}
		},
		
		_create: function() {
			
			var self = this;
			this.options._isPasswd = true;
			
			if (_l = this.element.attr('suggest')) this.options.label = _l;
			
			if (this.element.filter('textarea').length) {
				this.options._fake = $('<textarea />').text(this.element.val());
				
				if (this.element.attr('rows')) {

  				this.options._fake.attr('rows', this.element.attr('rows'));
  			}
  			
  			if (this.element.attr('cols')) {

  				this.options._fake.attr('cols', this.element.attr('cols'));
  			}
			} else {
				this.options._fake = $('<input type="text" />').attr('value', this.element.val());
			}
			
			this.options._fake.attr('style', this.element.attr('style'));
			
			if (this.element.attr('class')) {
			
				this.options._fake.attr('class', this.element.attr('class'));
			}
			if (this.element.attr('size')) {
			
				this.options._fake.attr('size', this.element.attr('size'));
			}
			if (this.element.attr('tabindex')) {
				
				this.options._fake.attr('tabindex', this.element.attr('tabindex'));
			}
			
			this.options._fake.attr({ id: '', name: ''}).insertAfter(this.element).hide().bind('click focus', function(){ $(this).hide(); self.element.show().focus() });
			
			this.element.addClass(this.options.element_class).blur(function(_ev) {
				self._onBlur.call(self, _ev);
			}).focus(function(_ev) {
				self._onFocus.call(self, _ev);
			});
			this._def_value();
		},
		
		value: function() {
			
			var _val = this.element.val();
			return _val = this.options.label == _val ? '' : this.element.val();
		},
		
		focus: function() {
			
			this.options._fake.trigger('click');
		},
		
		empty: function() {
			
			this.element.val('').trigger('blur');
		}
	});
})(jQuery);

