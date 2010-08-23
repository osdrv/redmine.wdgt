function _st(_ev) {_ev.preventDefault()}

var cfg;
(function() {
  var _cfg_keys = new Array('host', 'login', 'password', 'sessid'), _cfg = {};
    $.each(_cfg_keys, function(_i, _key) {
      _cfg[_key] = window.widget ? widget.preferenceForKey(_key) : '';
    });
  cfg = function(_key) {
    
    if (arguments.length == 2) {
      _cfg[_key] = arguments[1];
      if (window.widget) {
        widget.setPreferenceForKey(_key, _cfg[_key]);
      }
      $('#test').innerHTML(widget.preferenceForKey(_key));
      return true;
    } else {
      return _cfg[_key]
    }
  }
})();

function _init_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); _el.val(cfg(_el.attr('name')));
  });
}

function _save_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); cfg(_el.attr('name'), _el.val());
    _el.css({'background-color': '#DFFFDF'});
    window.setTimeout(function() { _el.css({ 'background-color': '#FFFFFF' }) }, 700);
  });
}

function auth() {
  
}

function init_widget() {
  $(function() {
    var _b = $('#body_div');
    _b.children('div.block').each(function(_i, _el) {
      $(_el).find('strong a').click(function(_ev) {
        _st(_ev);
        $('#body_div').children('div.block').removeClass('expanded');
        $(_el).addClass('expanded');
      });
    });
    $('#settings strong a').click(function(_ev) { _st(_ev); _init_cfg() });
    $('#save_settings_button').click(_save_cfg);
  });
}