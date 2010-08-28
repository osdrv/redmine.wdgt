var
  AUTHENTICITY_TOKEN = 'authenticity_token',
  REDMINE_SESSION_ID = '_redmine_session',
  LOGIN_URI = '/login';
  MY_PAGE_URI = '/my/page';

function _st(_ev) {_ev.preventDefault()}

function debug(_msg) {
  var _da = $('#test');
  _da.text(_da.text() + "\n" + _msg);
}

function cfg(_key) {
  if (arguments.length == 2) {
    if (window.widget) {
      widget.setPreferenceForKey(arguments[1], _key);
    }
    return true;
  } else {
    return widget.preferenceForKey(_key)
  }
}

function beforeAjaxSend(_x) {
  _sessid = cfg('sessid');
  if (_sessid) _x.setRequestHeader('Cookie', '_redmine_session=' + _sessid);
  _x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
}

$.ajaxSetup({
  beforeSend: beforeAjaxSend
})

var User = function() { this._init() }

User.prototype = {
  _username: null,
  _password: null,
  _sessid: null,
  
  _init: function() {
    this._username = cfg('username');
    this._password = cfg('password');
    //if (!this._sessid) this.auth();
  },
  
  isAuthenticated: function() {
    return !!(this._sessid);
  },
  
  auth: function(_c) {
    var self = this,
    _host = cfg('host'),
    _uri = LOGIN_URI,
    _query = 'username=' + this._username + '&password=' + this._password,
    _url = 'http://' + _host + _uri;
    cfg('sessid', '');
    if (!this._username || !this._password || !_host) {
      //system_notice('error', 'Configuration invalid');
      //widget.selectTab('settings');
      debug('auth error');
    }
    try {
      $.ajax({
        url: _url,
        success: function(_resp, _st, _x) {
          var _resp_sessid = parser.getSessid(_x);
          if (_resp_sessid) {
            if (_resp_sessid != cfg('sessid')) cfg('sessid', _resp_sessid);
            var _token = parser.getAuthencityToken(_resp);
            $.ajax({
              url: _url,
              type: 'POST',
              data: { username: self._username, password: self._password, authenticity_token: _token },
              success: function(_resp, _st, _x2) {
                var _sessid = parser.getSessid(_x2);
                cfg('sessid', _sessid);
                self.sessid = _sessid;
                if (typeof(_c) == 'function') _c();
              },
              error: function(_x, _st, _e) { debug(_x.responseText) }//,
            })
          }
        }
      })
    } catch (e) { debug(e) }
  },
  
  loadFeed: function(_c) {
    var self = this,
    _loadMyFeed = function() {
      var _getFeed = function() {
        $.getFeed({
          url: cfg('my_feed_url'),
    			success: function(feed) { _c(feed) },
    			error: function() { _c(null) }
    		});
      }

      if (!cfg('my_feed_url')) {
        self._getMyFeedUrl(_getFeed)
      } else {
        _getFeed();
      }
    }
    if (!this.isAuthenticated()) this.auth(_loadMyFeed); else _loadMyFeed();
  },
  
  _getMyFeedUrl: function(_c) {
    $.ajax({
      url: 'http://' + cfg('host') + MY_PAGE_URI,
      success: function(_resp) {
        cfg('my_feed_url', parser.getMyFeedUrl(_resp));
        debug(cfg('my_feed_url'));
        _c();
      },
      error: function() { debug('getMyFeedUrl error') }
    })
  }
}

var parser = {
  getMyFeedUrl: function(_resp) {
    debug('getMyFeed');
    var _link = /<link.*rel="alternate".*?\/>/.exec(_resp);
    if (_link && (_link[0] !== undefined)) {
      var _href = /href="(.+)?"/.exec(_link[0]);
      if (_href[1] !== undefined) return _href[1];
    }
    return null;
  },
  
  getAuthencityToken: function(_resp) {
    var _input = /<input.*authenticity_token.*?>/.exec(_resp);
    if (_input && (_input[0] !== undefined)) {
      var _token = /value=["']{1}(.*)?["']{1}/.exec(_input[0]);
      if (_token && (_token[0] !== undefined) && (_token[1] !== undefined)) {
        return _token[1];
      }
    }
  },
  
  getSessid: function(_x) {
    var _header = _x.getResponseHeader('Set-Cookie'),
    _find_sessid = /_redmine_session=([^;]+)/.exec(_header);
    if (_find_sessid && (_find_sessid[0] !== undefined) && (_find_sessid[1] !== undefined)) return _find_sessid[1];
    return null;
  }
}

function _init_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); _el.val(cfg(_el.attr('name')));
  });
}

function _save_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); cfg(_el.attr('name'), _el.val());
  });
  var _body = $('#body_div').addClass('ok');
  window.setTimeout(function() { _body.removeClass('ok') }, 700);
}

var RedmineWidget = function() { this._init() };

RedmineWidget.prototype = {
  
  _element: null,
  _tabs: null,
  
  _init: function() {
    this._element = $('#body_div');
    this._tabs = this._element.children('div.block');
    _init_cfg();
    
    $('#save_settings_button').click(_save_cfg);
    
    this._tabs.each(function(_i, _el) {
      $(_el).find('strong a').click(function(_ev) {
        _st(_ev);
        $('#body_div').children('div.block').removeClass('expanded');
        $(_el).addClass('expanded');
      });
    });
    
    return this;
  },
  
  selectTab: function(_name) {
    this._tabs.filter('[name="' + _name + '"]').find('strong a').trigger('click');
    return this;
  },
  
  updateTasks: function(_feed) {
    var _items = $(_feed.items),
    _holder = $('#tasklist'),
    _lis = '';
    $.each(_items, function(_i, _item) {
      _item = $(_item);
      _lis += '<li>' + '<a onclick="widget.openURL(this.href);return false;" href="' + _item.attr('link') + '">' + _item.attr('title') + '</a></li>';
    });
    _holder.html(_lis);
    
    return this;
  }
}

function init_widget() {
  $(function() {
    var _user = new User(),
    w = new RedmineWidget();
    w.selectTab('tasks');
    widget.onshow = function() { _user.loadFeed(w.updateTasks) };
    //_user.loadFeed(w.updateTasks)
    
    $('#try_to_auth').click(function() {
      try {
        if (!_user) _user = new User();
        _user.auth();
      } catch (e) {
        debug (e);
      }
    });
    $('#load_feed').click(function() {
      try {
        if (!_user) _user = new User();
        debug('user created');
        _user.loadFeed(function(_feed) {
          if (_feed) {
            var _items = $(_feed.items);
            debug(_items.length);
          }
        });
      } catch (e) { debug (e) }
    });
  });
}