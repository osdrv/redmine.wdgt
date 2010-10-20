var
  AUTHENTICITY_TOKEN = 'authenticity_token',
  REDMINE_SESSION_ID = '_redmine_session',
  LOGIN_URI = '/login',
  MY_PAGE_URI = '/my/page',
  PROJECTS_PAGE_URI = '/projects',
  NEW_ISSUE_URI = '/issues/new',
  ISSUES_URI = '/issues',
  UPD_CHECK_INTERVAL = 24 * 60 * 60 * 1000,
  CHECK_URL_GITHUB = 'http://github.com/api/v2/json/repos/show/4pcbr/redmine.wdgt',
  DOWNLOAD_NEW_VERSION_URL = 'http://4pcbr.com/redmine/redmine.wdgt.tar',
  _user, w;
  
function _st(_ev) {_ev.preventDefault()}

function debug(_msg) {
  var _da = $('#test');
  _da.text(_da.text() + "\n" + _msg);
}

function info(_m) {
  $('#info').text(_m);
  window.setTimeout(function() { $('#info').fadeout() }, 1500);
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

function _init_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); _el.val(cfg(_el.attr('name')));
  });
}

function _save_cfg() {
  $('#settings').find('input[type="text"], input[type="password"]').each(function(_i, _el) {
    _el = $(_el); cfg(_el.attr('name'), _el.val());
  });
  cfg('my_feed_url', '');
  cfg('projects_feed_url', '');
  _user.forgetAuth();
  $('#projects-list').html('<li>loading...</li>');
  $('#tasklist').html('');
  _user.auth(function() {
    _user.loadProjectsFeed(w.updateProjectsList);
    _user.loadFeed(w.updateTasks);
    var _body = $('#front').addClass('ok');
    window.setTimeout(function() { _body.removeClass('ok') }, 700);
  })
}



var User = function() { this._init() }

User.prototype = {
  _username: null,
  _password: null,
  _sessid: null,
  
  _init: function() {
    this._username = cfg('username');
    this._password = cfg('password');
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
      debug('auth error');
    }
    try {
      $.ajax({
        url: _url,
        success: function(_resp, _st, _x) {
          var _resp_sessid = parser.getSessid(_x);
          if (_resp_sessid) {
            if (_resp_sessid != cfg('sessid')) cfg('sessid', _resp_sessid);
            var _token = parser.getAuthencityToken(_resp),
			_data = { username: self._username, password: self._password };
			if (_token) _data['authenticity_token'] = _token;
			$.ajax({
              url: _url,
              type: 'POST',
              data: _data,
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
  
  _getFeed: function(_url, _c) {
    $.getFeed({
      url: _url,
			success: function(feed) { _c(feed) },
			error: function() { _c(null) }
		});
  },
  
  loadFeed: function(_c) {
    var self = this,
    _loadMyFeed = function() {
      var _my_feed_url = cfg('my_feed_url');
      if (!_my_feed_url) {
        self._getMyFeedUrl(function() { self._getFeed(cfg('my_feed_url'), _c) })
      } else {
        self._getFeed(_my_feed_url, _c);
      }
    }
    if (!this.isAuthenticated()) this.auth(_loadMyFeed); else _loadMyFeed();
  },
  
  _getMyFeedUrl: function(_c) {
    $.ajax({
      url: 'http://' + cfg('host') + MY_PAGE_URI,
      success: function(_resp) {
        cfg('my_feed_url', parser.getFeedUrl(_resp));
        _c();
      },
      error: function() { debug('getMyFeedUrl error') }
    })
  },
  
  loadProjectsFeed: function(_c) {
    var self = this,
    _loadProjectsFeed = function() {
      var _projects_feed_url = cfg('projects_feed_url');
      if (!_projects_feed_url) {
        self._getProjectsFeedUrl(function() { self._getFeed(cfg('projects_feed_url'), _c) })
      } else {
        self._getFeed(_projects_feed_url, _c);
      }
    }
    if (!this.isAuthenticated()) this.auth(_loadProjectsFeed); else _loadProjectsFeed();
  },
  
  _getProjectsFeedUrl: function(_c) {
    $.ajax({
      url: 'http://' + cfg('host') + PROJECTS_PAGE_URI,
      success: function(_resp) {
        cfg('projects_feed_url', parser.getProjectsFeedUrl(_resp));
        _c();
      },
      error: function() { debug('getProjectsFeedUrl error') }
    })
  },
  
  forgetAuth: function() {
    this._sessid = null;
    cfg('sessid', '');
  }
}

var parser = {
  
  getProjectsFeedUrl: function(_resp) {
    var _link = /<a.+class="atom".*?>/.exec(_resp);
    if (_link[0] !== undefined) {
      var _href = /href="([^"]+)"/.exec(_link[0]);
      if (_href[1] !== undefined) return 'http://' + cfg('host') + _href[1];
    }
    return null;
  },
  
  getFeedUrl: function(_resp) {
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
  },
  
  getAssigneeOptions: function(_resp) {
    var _resp = _resp.split(/<select.+assigned_to_id.+?>/)[1];
    if (_resp === undefined) return '';
    _resp = _resp.split(/<\/select>/);
    return _resp[0];
  }
}

var RedmineWidget = function() { this._init() };

RedmineWidget.prototype = {
  
  _element: null,
  _tabs: null,
  
  _init: function() {
    this._element = $('#front');
    this._tabs = this._element.children('div.block');
    _init_cfg();
    
    $('#save_settings_button').click(_save_cfg);
    
    this._tabs.each(function(_i, _el) {
      $(_el).find('strong a').click(function(_ev) {
        _st(_ev);
        $('#front').children('div.block').removeClass('expanded');
        $(_el).addClass('expanded');
      });
    });
    
    var self = this;
    $("#projects-list li a").live('click', function(_ev) {
      _st(_ev);
      var _project_link = $(this).attr('link'),
      _project_name = $(this).text();
      self.initNewIssue(_project_link, _project_name);
    })
    
    $('#save-new-issue').click(function(){ self.saveNewIssue.call(self) });
    $('#cancel-new-issue').click(function() { self._clearNewIssueForm() });
    return this;
  },
  
  _clearNewIssueForm: function() {
    $('#form-authenticity-token').val('');
    $('#subject_input').val('');
    $('#details_textarea').val('');
    $('#choose-project').show();
    $('#form').hide();
    _user.loadProjectsFeed(this.updateProjectsList);
  },
  
  initNewIssue: function(_link, _name) {
    $('#projects-list').html('<li>loading...</li>')
    $.ajax({
      url: _link + NEW_ISSUE_URI,
      success: function(_resp) {
        $('#choose-project').hide();
        $('#form').show();
        $('#project-name').html(_name);
        $('#form').attr('action', _link + ISSUES_URI);
        var _token = parser.getAuthencityToken(_resp);
        if (_token) $('#form-authenticity-token').val(_token);
        $('#assignee_select').html(parser.getAssigneeOptions(_resp));
      }
    });
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
      _title = _item.attr('title');
      var _pos = _title.search(/#/);
      if (_pos != -1) _title = _title.substring(_pos);
      if (_title.length > 42) _title = _title.substr(0, 50) + '...';
      _lis += '<li>' + '<a onclick="widget.openURL(this.href);return false;" href="' + _item.attr('link') + '">' + _title + '</a></li>';
    });
    _holder.html(_lis);
    
    return this;
  },
  
  updateProjectsList: function(_feed) {
    var _items = $(_feed.items),
    _holder = $('#projects-list'),
    _lis = '';
    $.each(_items, function(_i, _item) {
      var _item = $(_item),
      _title = _item.attr('title').substr(0, 42);
      _title += (_item.attr('title').length > 42) ? '...' : '';
      _lis += '<li>' + '<a href="javascript:void(0);" link="' + _item.attr('link') + '">' + _title + '</a>' + '</li>';
    });
    _holder.html(_lis);
    
    return this;
  },
  
  saveNewIssue: function() {
    var _data = {}, self = this;
    $('#form').find('input, checkbox, textarea, select').each(function(_i, _el) {
      var _el = $(_el), _v = _el.val();
      if (_v) _data[_el.attr('name')] = _v;
    });
    $.ajax({
      url: $('#form').attr('action'),
      type: 'POST',
      data: _data,
      beforeSend: function(_x) {
        _sessid = cfg('sessid');
        if (_sessid) _x.setRequestHeader('Cookie', '_redmine_session=' + _sessid);
        _x.setRequestHeader('Content-Type', 'multipart/form-data');
        _x.setRequestHeader('X-Requested-With', 'widget');
      },
      success: function(_resp, _st, _xhr) {
        debug(_resp);
	      self._clearNewIssueForm();
        $('#front').addClass('ok');
        self.selectTab('tasks');
        _user.loadFeed(self.updateTasks);
        window.setTimeout(function() { $('#front').removeClass('ok') }, 700);
      }
    })
  },
  _checkForUpdate: function(_c) {
    $.ajax({
      url: CHECK_URL_GITHUB,
      dataType: 'json',
      success: function(_res) { if ($.isEmptyObject(_res) || !_res.repository) return; _c(_res) }
    })
  },
  checkForUpdate: function(_force) {
    var _d = new Date(),
    _t = _d.getTime(),
    _last_check = cfg('upd_last_check');
    if (((_last_check + UPD_CHECK_INTERVAL) > _t) && !_force) return;
    this._checkForUpdate(function(_res) {
      cfg('upd_last_check', _t);
      var _last_push = _res.repository.pushed_at,
      _last_version = cfg('last_release_timestamp');
      if (_last_push != _last_version) info('update is available');
      $('#install-updates').show();
    })
  },
  update: function() {
    info('updating...');
    var self = this;
    widget.system('curl "' + DOWNLOAD_NEW_VERSION_URL + '" > /tmp/redmine.widget.tar && cd /tmp/ && tar -xf redmine.widget.tar && rm redmine.widget.tar && mv redmine.wdgt ~/Library/Widgets/', 
      function() {
        info('Update complete. Reload this widget with ⌘R for changes to take a place.');
        self._checkForUpdate(function(_res) { cfg('last_release_timestamp', _res.repository.pushed_at) })
      }
    );
  }
}

function init_widget() {
  $(function() {
    _user = new User(),
    w = new RedmineWidget();
    w.selectTab('tasks');
    widget.onshow = function() { _user.loadFeed(w.updateTasks); w.checkForUpdate() };
    $('#my_tasks').click(function() { _user.loadFeed(w.updateTasks) });
    _user.loadFeed(w.updateTasks);
    _user.loadProjectsFeed(w.updateProjectsList);
    $('#test, #info').dblclick(function() { $(this).html('') });
    $('#config_host_input, #config_host_login, #config_host_password, #subject_input, #details_textarea').smart_input({ emptyCss: { color: "#A0A0A0" }, element_class: 'active'});
    $('#check-for-updates').click(function(){ w.checkForUpdate(true) });
    $('#install-updates').click(function() { w.update() });
    var _d;
    if (_d = cfg('last_release_timestamp')) $('#last-update-time-label').html(_d);
    debug(cfg('last_release_timestamp'));
  });
}
