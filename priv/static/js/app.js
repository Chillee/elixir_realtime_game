(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var expRe = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (expRe.test(name) ? root + '/' + name : name).split('/');
    for (var i = 0, length = parts.length; i < length; i++) {
      part = parts[i];
      if (part === '..') {
        results.pop();
      } else if (part !== '.' && part !== '') {
        results.push(part);
      }
    }
    return results.join('/');
  };

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var hot = null;
    hot = hmr && hmr.createHot(name);
    var module = {id: name, exports: {}, hot: hot};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var expandAlias = function(name) {
    return aliases[name] ? expandAlias(aliases[name]) : name;
  };

  var _resolve = function(name, dep) {
    return expandAlias(expand(dirname(name), dep));
  };

  var require = function(name, loaderPath) {
    if (loaderPath == null) loaderPath = '/';
    var path = expandAlias(name);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    throw new Error("Cannot find module '" + name + "' from '" + loaderPath + "'");
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  var extRe = /\.[^.\/]+$/;
  var indexRe = /\/index(\.[^\/]+)?$/;
  var addExtensions = function(bundle) {
    if (extRe.test(bundle)) {
      var alias = bundle.replace(extRe, '');
      if (!has.call(aliases, alias) || aliases[alias].replace(extRe, '') === alias + '/index') {
        aliases[alias] = bundle;
      }
    }

    if (indexRe.test(bundle)) {
      var iAlias = bundle.replace(indexRe, '');
      if (!has.call(aliases, iAlias)) {
        aliases[iAlias] = bundle;
      }
    }
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          require.register(key, bundle[key]);
        }
      }
    } else {
      modules[bundle] = fn;
      delete cache[bundle];
      addExtensions(bundle);
    }
  };

  require.list = function() {
    var list = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        list.push(item);
      }
    }
    return list;
  };

  var hmr = globals._hmr && new globals._hmr(_resolve, require, modules, cache);
  require._cache = cache;
  require.hmr = hmr && hmr.wrap;
  require.brunch = true;
  globals.require = require;
})();

(function() {
var global = window;
var __makeRelativeRequire = function(require, mappings, pref) {
  var none = {};
  var tryReq = function(name, pref) {
    var val;
    try {
      val = require(pref + '/node_modules/' + name);
      return val;
    } catch (e) {
      if (e.toString().indexOf('Cannot find module') === -1) {
        throw e;
      }

      if (pref.indexOf('node_modules') !== -1) {
        var s = pref.split('/');
        var i = s.lastIndexOf('node_modules');
        var newPref = s.slice(0, i).join('/');
        return tryReq(name, newPref);
      }
    }
    return none;
  };
  return function(name) {
    if (name in mappings) name = mappings[name];
    if (!name) return;
    if (name[0] !== '.' && pref) {
      var val = tryReq(name, pref);
      if (val !== none) return val;
    }
    return require(name);
  }
};

require.register("phoenix/priv/static/phoenix.js", function(exports, require, module) {
  require = __makeRelativeRequire(require, {}, "phoenix");
  (function() {
    (function(exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Phoenix Channels JavaScript client
//
// ## Socket Connection
//
// A single connection is established to the server and
// channels are multiplexed over the connection.
// Connect to the server using the `Socket` class:
//
//     let socket = new Socket("/ws", {params: {userToken: "123"}})
//     socket.connect()
//
// The `Socket` constructor takes the mount point of the socket,
// the authentication params, as well as options that can be found in
// the Socket docs, such as configuring the `LongPoll` transport, and
// heartbeat.
//
// ## Channels
//
// Channels are isolated, concurrent processes on the server that
// subscribe to topics and broker events between the client and server.
// To join a channel, you must provide the topic, and channel params for
// authorization. Here's an example chat room example where `"new_msg"`
// events are listened for, messages are pushed to the server, and
// the channel is joined with ok/error/timeout matches:
//
//     let channel = socket.channel("room:123", {token: roomToken})
//     channel.on("new_msg", msg => console.log("Got message", msg) )
//     $input.onEnter( e => {
//       channel.push("new_msg", {body: e.target.val}, 10000)
//        .receive("ok", (msg) => console.log("created message", msg) )
//        .receive("error", (reasons) => console.log("create failed", reasons) )
//        .receive("timeout", () => console.log("Networking issue...") )
//     })
//     channel.join()
//       .receive("ok", ({messages}) => console.log("catching up", messages) )
//       .receive("error", ({reason}) => console.log("failed join", reason) )
//       .receive("timeout", () => console.log("Networking issue. Still waiting...") )
//
//
// ## Joining
//
// Creating a channel with `socket.channel(topic, params)`, binds the params to
// `channel.params`, which are sent up on `channel.join()`.
// Subsequent rejoins will send up the modified params for
// updating authorization params, or passing up last_message_id information.
// Successful joins receive an "ok" status, while unsuccessful joins
// receive "error".
//
// ## Duplicate Join Subscriptions
//
// While the client may join any number of topics on any number of channels,
// the client may only hold a single subscription for each unique topic at any
// given time. When attempting to create a duplicate subscription,
// the server will close the existing channel, log a warning, and
// spawn a new channel for the topic. The client will have their
// `channel.onClose` callbacks fired for the existing channel, and the new
// channel join will have its receive hooks processed as normal.
//
// ## Pushing Messages
//
// From the previous example, we can see that pushing messages to the server
// can be done with `channel.push(eventName, payload)` and we can optionally
// receive responses from the push. Additionally, we can use
// `receive("timeout", callback)` to abort waiting for our other `receive` hooks
//  and take action after some period of waiting. The default timeout is 5000ms.
//
//
// ## Socket Hooks
//
// Lifecycle events of the multiplexed connection can be hooked into via
// `socket.onError()` and `socket.onClose()` events, ie:
//
//     socket.onError( () => console.log("there was an error with the connection!") )
//     socket.onClose( () => console.log("the connection dropped") )
//
//
// ## Channel Hooks
//
// For each joined channel, you can bind to `onError` and `onClose` events
// to monitor the channel lifecycle, ie:
//
//     channel.onError( () => console.log("there was an error!") )
//     channel.onClose( () => console.log("the channel has gone away gracefully") )
//
// ### onError hooks
//
// `onError` hooks are invoked if the socket connection drops, or the channel
// crashes on the server. In either case, a channel rejoin is attempted
// automatically in an exponential backoff manner.
//
// ### onClose hooks
//
// `onClose` hooks are invoked only in two cases. 1) the channel explicitly
// closed on the server, or 2). The client explicitly closed, by calling
// `channel.leave()`
//
//
// ## Presence
//
// The `Presence` object provides features for syncing presence information
// from the server with the client and handling presences joining and leaving.
//
// ### Syncing initial state from the server
//
// `Presence.syncState` is used to sync the list of presences on the server
// with the client's state. An optional `onJoin` and `onLeave` callback can
// be provided to react to changes in the client's local presences across
// disconnects and reconnects with the server.
//
// `Presence.syncDiff` is used to sync a diff of presence join and leave
// events from the server, as they happen. Like `syncState`, `syncDiff`
// accepts optional `onJoin` and `onLeave` callbacks to react to a user
// joining or leaving from a device.
//
// ### Listing Presences
//
// `Presence.list` is used to return a list of presence information
// based on the local state of metadata. By default, all presence
// metadata is returned, but a `listBy` function can be supplied to
// allow the client to select which metadata to use for a given presence.
// For example, you may have a user online from different devices with a
// a metadata status of "online", but they have set themselves to "away"
// on another device. In this case, they app may choose to use the "away"
// status for what appears on the UI. The example below defines a `listBy`
// function which prioritizes the first metadata which was registered for
// each user. This could be the first tab they opened, or the first device
// they came online from:
//
//     let state = {}
//     state = Presence.syncState(state, stateFromServer)
//     let listBy = (id, {metas: [first, ...rest]}) => {
//       first.count = rest.length + 1 // count of this user's presences
//       first.id = id
//       return first
//     }
//     let onlineUsers = Presence.list(state, listBy)
//
//
// ### Example Usage
//
//     // detect if user has joined for the 1st time or from another tab/device
//     let onJoin = (id, current, newPres) => {
//       if(!current){
//         console.log("user has entered for the first time", newPres)
//       } else {
//         console.log("user additional presence", newPres)
//       }
//     }
//     // detect if user has left from all tabs/devices, or is still present
//     let onLeave = (id, current, leftPres) => {
//       if(current.metas.length === 0){
//         console.log("user has left from all devices", leftPres)
//       } else {
//         console.log("user left from a device", leftPres)
//       }
//     }
//     let presences = {} // client's initial empty presence state
//     // receive initial presence data from server, sent after join
//     myChannel.on("presences", state => {
//       presences = Presence.syncState(presences, state, onJoin, onLeave)
//       displayUsers(Presence.list(presences))
//     })
//     // receive "presence_diff" from server, containing join/leave events
//     myChannel.on("presence_diff", diff => {
//       presences = Presence.syncDiff(presences, diff, onJoin, onLeave)
//       this.setState({users: Presence.list(room.presences, listBy)})
//     })
//
var VSN = "1.0.0";
var SOCKET_STATES = { connecting: 0, open: 1, closing: 2, closed: 3 };
var DEFAULT_TIMEOUT = 10000;
var CHANNEL_STATES = {
  closed: "closed",
  errored: "errored",
  joined: "joined",
  joining: "joining",
  leaving: "leaving"
};
var CHANNEL_EVENTS = {
  close: "phx_close",
  error: "phx_error",
  join: "phx_join",
  reply: "phx_reply",
  leave: "phx_leave"
};
var TRANSPORTS = {
  longpoll: "longpoll",
  websocket: "websocket"
};

var Push = function () {

  // Initializes the Push
  //
  // channel - The Channel
  // event - The event, for example `"phx_join"`
  // payload - The payload, for example `{user_id: 123}`
  // timeout - The push timeout in milliseconds
  //

  function Push(channel, event, payload, timeout) {
    _classCallCheck(this, Push);

    this.channel = channel;
    this.event = event;
    this.payload = payload || {};
    this.receivedResp = null;
    this.timeout = timeout;
    this.timeoutTimer = null;
    this.recHooks = [];
    this.sent = false;
  }

  _createClass(Push, [{
    key: "resend",
    value: function resend(timeout) {
      this.timeout = timeout;
      this.cancelRefEvent();
      this.ref = null;
      this.refEvent = null;
      this.receivedResp = null;
      this.sent = false;
      this.send();
    }
  }, {
    key: "send",
    value: function send() {
      if (this.hasReceived("timeout")) {
        return;
      }
      this.startTimeout();
      this.sent = true;
      this.channel.socket.push({
        topic: this.channel.topic,
        event: this.event,
        payload: this.payload,
        ref: this.ref
      });
    }
  }, {
    key: "receive",
    value: function receive(status, callback) {
      if (this.hasReceived(status)) {
        callback(this.receivedResp.response);
      }

      this.recHooks.push({ status: status, callback: callback });
      return this;
    }

    // private

  }, {
    key: "matchReceive",
    value: function matchReceive(_ref) {
      var status = _ref.status;
      var response = _ref.response;
      var ref = _ref.ref;

      this.recHooks.filter(function (h) {
        return h.status === status;
      }).forEach(function (h) {
        return h.callback(response);
      });
    }
  }, {
    key: "cancelRefEvent",
    value: function cancelRefEvent() {
      if (!this.refEvent) {
        return;
      }
      this.channel.off(this.refEvent);
    }
  }, {
    key: "cancelTimeout",
    value: function cancelTimeout() {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }, {
    key: "startTimeout",
    value: function startTimeout() {
      var _this = this;

      if (this.timeoutTimer) {
        return;
      }
      this.ref = this.channel.socket.makeRef();
      this.refEvent = this.channel.replyEventName(this.ref);

      this.channel.on(this.refEvent, function (payload) {
        _this.cancelRefEvent();
        _this.cancelTimeout();
        _this.receivedResp = payload;
        _this.matchReceive(payload);
      });

      this.timeoutTimer = setTimeout(function () {
        _this.trigger("timeout", {});
      }, this.timeout);
    }
  }, {
    key: "hasReceived",
    value: function hasReceived(status) {
      return this.receivedResp && this.receivedResp.status === status;
    }
  }, {
    key: "trigger",
    value: function trigger(status, response) {
      this.channel.trigger(this.refEvent, { status: status, response: response });
    }
  }]);

  return Push;
}();

var Channel = exports.Channel = function () {
  function Channel(topic, params, socket) {
    var _this2 = this;

    _classCallCheck(this, Channel);

    this.state = CHANNEL_STATES.closed;
    this.topic = topic;
    this.params = params || {};
    this.socket = socket;
    this.bindings = [];
    this.timeout = this.socket.timeout;
    this.joinedOnce = false;
    this.joinPush = new Push(this, CHANNEL_EVENTS.join, this.params, this.timeout);
    this.pushBuffer = [];
    this.rejoinTimer = new Timer(function () {
      return _this2.rejoinUntilConnected();
    }, this.socket.reconnectAfterMs);
    this.joinPush.receive("ok", function () {
      _this2.state = CHANNEL_STATES.joined;
      _this2.rejoinTimer.reset();
      _this2.pushBuffer.forEach(function (pushEvent) {
        return pushEvent.send();
      });
      _this2.pushBuffer = [];
    });
    this.onClose(function () {
      _this2.rejoinTimer.reset();
      _this2.socket.log("channel", "close " + _this2.topic + " " + _this2.joinRef());
      _this2.state = CHANNEL_STATES.closed;
      _this2.socket.remove(_this2);
    });
    this.onError(function (reason) {
      if (_this2.isLeaving() || _this2.isClosed()) {
        return;
      }
      _this2.socket.log("channel", "error " + _this2.topic, reason);
      _this2.state = CHANNEL_STATES.errored;
      _this2.rejoinTimer.scheduleTimeout();
    });
    this.joinPush.receive("timeout", function () {
      if (!_this2.isJoining()) {
        return;
      }
      _this2.socket.log("channel", "timeout " + _this2.topic, _this2.joinPush.timeout);
      _this2.state = CHANNEL_STATES.errored;
      _this2.rejoinTimer.scheduleTimeout();
    });
    this.on(CHANNEL_EVENTS.reply, function (payload, ref) {
      _this2.trigger(_this2.replyEventName(ref), payload);
    });
  }

  _createClass(Channel, [{
    key: "rejoinUntilConnected",
    value: function rejoinUntilConnected() {
      this.rejoinTimer.scheduleTimeout();
      if (this.socket.isConnected()) {
        this.rejoin();
      }
    }
  }, {
    key: "join",
    value: function join() {
      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];

      if (this.joinedOnce) {
        throw "tried to join multiple times. 'join' can only be called a single time per channel instance";
      } else {
        this.joinedOnce = true;
        this.rejoin(timeout);
        return this.joinPush;
      }
    }
  }, {
    key: "onClose",
    value: function onClose(callback) {
      this.on(CHANNEL_EVENTS.close, callback);
    }
  }, {
    key: "onError",
    value: function onError(callback) {
      this.on(CHANNEL_EVENTS.error, function (reason) {
        return callback(reason);
      });
    }
  }, {
    key: "on",
    value: function on(event, callback) {
      this.bindings.push({ event: event, callback: callback });
    }
  }, {
    key: "off",
    value: function off(event) {
      this.bindings = this.bindings.filter(function (bind) {
        return bind.event !== event;
      });
    }
  }, {
    key: "canPush",
    value: function canPush() {
      return this.socket.isConnected() && this.isJoined();
    }
  }, {
    key: "push",
    value: function push(event, payload) {
      var timeout = arguments.length <= 2 || arguments[2] === undefined ? this.timeout : arguments[2];

      if (!this.joinedOnce) {
        throw "tried to push '" + event + "' to '" + this.topic + "' before joining. Use channel.join() before pushing events";
      }
      var pushEvent = new Push(this, event, payload, timeout);
      if (this.canPush()) {
        pushEvent.send();
      } else {
        pushEvent.startTimeout();
        this.pushBuffer.push(pushEvent);
      }

      return pushEvent;
    }

    // Leaves the channel
    //
    // Unsubscribes from server events, and
    // instructs channel to terminate on server
    //
    // Triggers onClose() hooks
    //
    // To receive leave acknowledgements, use the a `receive`
    // hook to bind to the server ack, ie:
    //
    //     channel.leave().receive("ok", () => alert("left!") )
    //

  }, {
    key: "leave",
    value: function leave() {
      var _this3 = this;

      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];

      this.state = CHANNEL_STATES.leaving;
      var onClose = function onClose() {
        _this3.socket.log("channel", "leave " + _this3.topic);
        _this3.trigger(CHANNEL_EVENTS.close, "leave", _this3.joinRef());
      };
      var leavePush = new Push(this, CHANNEL_EVENTS.leave, {}, timeout);
      leavePush.receive("ok", function () {
        return onClose();
      }).receive("timeout", function () {
        return onClose();
      });
      leavePush.send();
      if (!this.canPush()) {
        leavePush.trigger("ok", {});
      }

      return leavePush;
    }

    // Overridable message hook
    //
    // Receives all events for specialized message handling
    // before dispatching to the channel callbacks.
    //
    // Must return the payload, modified or unmodified

  }, {
    key: "onMessage",
    value: function onMessage(event, payload, ref) {
      return payload;
    }

    // private

  }, {
    key: "isMember",
    value: function isMember(topic) {
      return this.topic === topic;
    }
  }, {
    key: "joinRef",
    value: function joinRef() {
      return this.joinPush.ref;
    }
  }, {
    key: "sendJoin",
    value: function sendJoin(timeout) {
      this.state = CHANNEL_STATES.joining;
      this.joinPush.resend(timeout);
    }
  }, {
    key: "rejoin",
    value: function rejoin() {
      var timeout = arguments.length <= 0 || arguments[0] === undefined ? this.timeout : arguments[0];
      if (this.isLeaving()) {
        return;
      }
      this.sendJoin(timeout);
    }
  }, {
    key: "trigger",
    value: function trigger(event, payload, ref) {
      var close = CHANNEL_EVENTS.close;
      var error = CHANNEL_EVENTS.error;
      var leave = CHANNEL_EVENTS.leave;
      var join = CHANNEL_EVENTS.join;

      if (ref && [close, error, leave, join].indexOf(event) >= 0 && ref !== this.joinRef()) {
        return;
      }
      var handledPayload = this.onMessage(event, payload, ref);
      if (payload && !handledPayload) {
        throw "channel onMessage callbacks must return the payload, modified or unmodified";
      }

      this.bindings.filter(function (bind) {
        return bind.event === event;
      }).map(function (bind) {
        return bind.callback(handledPayload, ref);
      });
    }
  }, {
    key: "replyEventName",
    value: function replyEventName(ref) {
      return "chan_reply_" + ref;
    }
  }, {
    key: "isClosed",
    value: function isClosed() {
      return this.state === CHANNEL_STATES.closed;
    }
  }, {
    key: "isErrored",
    value: function isErrored() {
      return this.state === CHANNEL_STATES.errored;
    }
  }, {
    key: "isJoined",
    value: function isJoined() {
      return this.state === CHANNEL_STATES.joined;
    }
  }, {
    key: "isJoining",
    value: function isJoining() {
      return this.state === CHANNEL_STATES.joining;
    }
  }, {
    key: "isLeaving",
    value: function isLeaving() {
      return this.state === CHANNEL_STATES.leaving;
    }
  }]);

  return Channel;
}();

var Socket = exports.Socket = function () {

  // Initializes the Socket
  //
  // endPoint - The string WebSocket endpoint, ie, "ws://example.com/ws",
  //                                               "wss://example.com"
  //                                               "/ws" (inherited host & protocol)
  // opts - Optional configuration
  //   transport - The Websocket Transport, for example WebSocket or Phoenix.LongPoll.
  //               Defaults to WebSocket with automatic LongPoll fallback.
  //   timeout - The default timeout in milliseconds to trigger push timeouts.
  //             Defaults `DEFAULT_TIMEOUT`
  //   heartbeatIntervalMs - The millisec interval to send a heartbeat message
  //   reconnectAfterMs - The optional function that returns the millsec
  //                      reconnect interval. Defaults to stepped backoff of:
  //
  //     function(tries){
  //       return [1000, 5000, 10000][tries - 1] || 10000
  //     }
  //
  //   logger - The optional function for specialized logging, ie:
  //     `logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
  //
  //   longpollerTimeout - The maximum timeout of a long poll AJAX request.
  //                        Defaults to 20s (double the server long poll timer).
  //
  //   params - The optional params to pass when connecting
  //
  // For IE8 support use an ES5-shim (https://github.com/es-shims/es5-shim)
  //

  function Socket(endPoint) {
    var _this4 = this;

    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    _classCallCheck(this, Socket);

    this.stateChangeCallbacks = { open: [], close: [], error: [], message: [] };
    this.channels = [];
    this.sendBuffer = [];
    this.ref = 0;
    this.timeout = opts.timeout || DEFAULT_TIMEOUT;
    this.transport = opts.transport || window.WebSocket || LongPoll;
    this.heartbeatIntervalMs = opts.heartbeatIntervalMs || 30000;
    this.reconnectAfterMs = opts.reconnectAfterMs || function (tries) {
      return [1000, 2000, 5000, 10000][tries - 1] || 10000;
    };
    this.logger = opts.logger || function () {}; // noop
    this.longpollerTimeout = opts.longpollerTimeout || 20000;
    this.params = opts.params || {};
    this.endPoint = endPoint + "/" + TRANSPORTS.websocket;
    this.reconnectTimer = new Timer(function () {
      _this4.disconnect(function () {
        return _this4.connect();
      });
    }, this.reconnectAfterMs);
  }

  _createClass(Socket, [{
    key: "protocol",
    value: function protocol() {
      return location.protocol.match(/^https/) ? "wss" : "ws";
    }
  }, {
    key: "endPointURL",
    value: function endPointURL() {
      var uri = Ajax.appendParams(Ajax.appendParams(this.endPoint, this.params), { vsn: VSN });
      if (uri.charAt(0) !== "/") {
        return uri;
      }
      if (uri.charAt(1) === "/") {
        return this.protocol() + ":" + uri;
      }

      return this.protocol() + "://" + location.host + uri;
    }
  }, {
    key: "disconnect",
    value: function disconnect(callback, code, reason) {
      if (this.conn) {
        this.conn.onclose = function () {}; // noop
        if (code) {
          this.conn.close(code, reason || "");
        } else {
          this.conn.close();
        }
        this.conn = null;
      }
      callback && callback();
    }

    // params - The params to send when connecting, for example `{user_id: userToken}`

  }, {
    key: "connect",
    value: function connect(params) {
      var _this5 = this;

      if (params) {
        console && console.log("passing params to connect is deprecated. Instead pass :params to the Socket constructor");
        this.params = params;
      }
      if (this.conn) {
        return;
      }

      this.conn = new this.transport(this.endPointURL());
      this.conn.timeout = this.longpollerTimeout;
      this.conn.onopen = function () {
        return _this5.onConnOpen();
      };
      this.conn.onerror = function (error) {
        return _this5.onConnError(error);
      };
      this.conn.onmessage = function (event) {
        return _this5.onConnMessage(event);
      };
      this.conn.onclose = function (event) {
        return _this5.onConnClose(event);
      };
    }

    // Logs the message. Override `this.logger` for specialized logging. noops by default

  }, {
    key: "log",
    value: function log(kind, msg, data) {
      this.logger(kind, msg, data);
    }

    // Registers callbacks for connection state change events
    //
    // Examples
    //
    //    socket.onError(function(error){ alert("An error occurred") })
    //

  }, {
    key: "onOpen",
    value: function onOpen(callback) {
      this.stateChangeCallbacks.open.push(callback);
    }
  }, {
    key: "onClose",
    value: function onClose(callback) {
      this.stateChangeCallbacks.close.push(callback);
    }
  }, {
    key: "onError",
    value: function onError(callback) {
      this.stateChangeCallbacks.error.push(callback);
    }
  }, {
    key: "onMessage",
    value: function onMessage(callback) {
      this.stateChangeCallbacks.message.push(callback);
    }
  }, {
    key: "onConnOpen",
    value: function onConnOpen() {
      var _this6 = this;

      this.log("transport", "connected to " + this.endPointURL(), this.transport.prototype);
      this.flushSendBuffer();
      this.reconnectTimer.reset();
      if (!this.conn.skipHeartbeat) {
        clearInterval(this.heartbeatTimer);
        this.heartbeatTimer = setInterval(function () {
          return _this6.sendHeartbeat();
        }, this.heartbeatIntervalMs);
      }
      this.stateChangeCallbacks.open.forEach(function (callback) {
        return callback();
      });
    }
  }, {
    key: "onConnClose",
    value: function onConnClose(event) {
      this.log("transport", "close", event);
      this.triggerChanError();
      clearInterval(this.heartbeatTimer);
      this.reconnectTimer.scheduleTimeout();
      this.stateChangeCallbacks.close.forEach(function (callback) {
        return callback(event);
      });
    }
  }, {
    key: "onConnError",
    value: function onConnError(error) {
      this.log("transport", error);
      this.triggerChanError();
      this.stateChangeCallbacks.error.forEach(function (callback) {
        return callback(error);
      });
    }
  }, {
    key: "triggerChanError",
    value: function triggerChanError() {
      this.channels.forEach(function (channel) {
        return channel.trigger(CHANNEL_EVENTS.error);
      });
    }
  }, {
    key: "connectionState",
    value: function connectionState() {
      switch (this.conn && this.conn.readyState) {
        case SOCKET_STATES.connecting:
          return "connecting";
        case SOCKET_STATES.open:
          return "open";
        case SOCKET_STATES.closing:
          return "closing";
        default:
          return "closed";
      }
    }
  }, {
    key: "isConnected",
    value: function isConnected() {
      return this.connectionState() === "open";
    }
  }, {
    key: "remove",
    value: function remove(channel) {
      this.channels = this.channels.filter(function (c) {
        return c.joinRef() !== channel.joinRef();
      });
    }
  }, {
    key: "channel",
    value: function channel(topic) {
      var chanParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var chan = new Channel(topic, chanParams, this);
      this.channels.push(chan);
      return chan;
    }
  }, {
    key: "push",
    value: function push(data) {
      var _this7 = this;

      var topic = data.topic;
      var event = data.event;
      var payload = data.payload;
      var ref = data.ref;

      var callback = function callback() {
        return _this7.conn.send(JSON.stringify(data));
      };
      this.log("push", topic + " " + event + " (" + ref + ")", payload);
      if (this.isConnected()) {
        callback();
      } else {
        this.sendBuffer.push(callback);
      }
    }

    // Return the next message ref, accounting for overflows

  }, {
    key: "makeRef",
    value: function makeRef() {
      var newRef = this.ref + 1;
      if (newRef === this.ref) {
        this.ref = 0;
      } else {
        this.ref = newRef;
      }

      return this.ref.toString();
    }
  }, {
    key: "sendHeartbeat",
    value: function sendHeartbeat() {
      if (!this.isConnected()) {
        return;
      }
      this.push({ topic: "phoenix", event: "heartbeat", payload: {}, ref: this.makeRef() });
    }
  }, {
    key: "flushSendBuffer",
    value: function flushSendBuffer() {
      if (this.isConnected() && this.sendBuffer.length > 0) {
        this.sendBuffer.forEach(function (callback) {
          return callback();
        });
        this.sendBuffer = [];
      }
    }
  }, {
    key: "onConnMessage",
    value: function onConnMessage(rawMessage) {
      var msg = JSON.parse(rawMessage.data);
      var topic = msg.topic;
      var event = msg.event;
      var payload = msg.payload;
      var ref = msg.ref;

      this.log("receive", (payload.status || "") + " " + topic + " " + event + " " + (ref && "(" + ref + ")" || ""), payload);
      this.channels.filter(function (channel) {
        return channel.isMember(topic);
      }).forEach(function (channel) {
        return channel.trigger(event, payload, ref);
      });
      this.stateChangeCallbacks.message.forEach(function (callback) {
        return callback(msg);
      });
    }
  }]);

  return Socket;
}();

var LongPoll = exports.LongPoll = function () {
  function LongPoll(endPoint) {
    _classCallCheck(this, LongPoll);

    this.endPoint = null;
    this.token = null;
    this.skipHeartbeat = true;
    this.onopen = function () {}; // noop
    this.onerror = function () {}; // noop
    this.onmessage = function () {}; // noop
    this.onclose = function () {}; // noop
    this.pollEndpoint = this.normalizeEndpoint(endPoint);
    this.readyState = SOCKET_STATES.connecting;

    this.poll();
  }

  _createClass(LongPoll, [{
    key: "normalizeEndpoint",
    value: function normalizeEndpoint(endPoint) {
      return endPoint.replace("ws://", "http://").replace("wss://", "https://").replace(new RegExp("(.*)\/" + TRANSPORTS.websocket), "$1/" + TRANSPORTS.longpoll);
    }
  }, {
    key: "endpointURL",
    value: function endpointURL() {
      return Ajax.appendParams(this.pollEndpoint, { token: this.token });
    }
  }, {
    key: "closeAndRetry",
    value: function closeAndRetry() {
      this.close();
      this.readyState = SOCKET_STATES.connecting;
    }
  }, {
    key: "ontimeout",
    value: function ontimeout() {
      this.onerror("timeout");
      this.closeAndRetry();
    }
  }, {
    key: "poll",
    value: function poll() {
      var _this8 = this;

      if (!(this.readyState === SOCKET_STATES.open || this.readyState === SOCKET_STATES.connecting)) {
        return;
      }

      Ajax.request("GET", this.endpointURL(), "application/json", null, this.timeout, this.ontimeout.bind(this), function (resp) {
        if (resp) {
          var status = resp.status;
          var token = resp.token;
          var messages = resp.messages;

          _this8.token = token;
        } else {
          var status = 0;
        }

        switch (status) {
          case 200:
            messages.forEach(function (msg) {
              return _this8.onmessage({ data: JSON.stringify(msg) });
            });
            _this8.poll();
            break;
          case 204:
            _this8.poll();
            break;
          case 410:
            _this8.readyState = SOCKET_STATES.open;
            _this8.onopen();
            _this8.poll();
            break;
          case 0:
          case 500:
            _this8.onerror();
            _this8.closeAndRetry();
            break;
          default:
            throw "unhandled poll status " + status;
        }
      });
    }
  }, {
    key: "send",
    value: function send(body) {
      var _this9 = this;

      Ajax.request("POST", this.endpointURL(), "application/json", body, this.timeout, this.onerror.bind(this, "timeout"), function (resp) {
        if (!resp || resp.status !== 200) {
          _this9.onerror(status);
          _this9.closeAndRetry();
        }
      });
    }
  }, {
    key: "close",
    value: function close(code, reason) {
      this.readyState = SOCKET_STATES.closed;
      this.onclose();
    }
  }]);

  return LongPoll;
}();

var Ajax = exports.Ajax = function () {
  function Ajax() {
    _classCallCheck(this, Ajax);
  }

  _createClass(Ajax, null, [{
    key: "request",
    value: function request(method, endPoint, accept, body, timeout, ontimeout, callback) {
      if (window.XDomainRequest) {
        var req = new XDomainRequest(); // IE8, IE9
        this.xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback);
      } else {
        var req = window.XMLHttpRequest ? new XMLHttpRequest() : // IE7+, Firefox, Chrome, Opera, Safari
        new ActiveXObject("Microsoft.XMLHTTP"); // IE6, IE5
        this.xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback);
      }
    }
  }, {
    key: "xdomainRequest",
    value: function xdomainRequest(req, method, endPoint, body, timeout, ontimeout, callback) {
      var _this10 = this;

      req.timeout = timeout;
      req.open(method, endPoint);
      req.onload = function () {
        var response = _this10.parseJSON(req.responseText);
        callback && callback(response);
      };
      if (ontimeout) {
        req.ontimeout = ontimeout;
      }

      // Work around bug in IE9 that requires an attached onprogress handler
      req.onprogress = function () {};

      req.send(body);
    }
  }, {
    key: "xhrRequest",
    value: function xhrRequest(req, method, endPoint, accept, body, timeout, ontimeout, callback) {
      var _this11 = this;

      req.timeout = timeout;
      req.open(method, endPoint, true);
      req.setRequestHeader("Content-Type", accept);
      req.onerror = function () {
        callback && callback(null);
      };
      req.onreadystatechange = function () {
        if (req.readyState === _this11.states.complete && callback) {
          var response = _this11.parseJSON(req.responseText);
          callback(response);
        }
      };
      if (ontimeout) {
        req.ontimeout = ontimeout;
      }

      req.send(body);
    }
  }, {
    key: "parseJSON",
    value: function parseJSON(resp) {
      return resp && resp !== "" ? JSON.parse(resp) : null;
    }
  }, {
    key: "serialize",
    value: function serialize(obj, parentKey) {
      var queryStr = [];
      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {
          continue;
        }
        var paramKey = parentKey ? parentKey + "[" + key + "]" : key;
        var paramVal = obj[key];
        if ((typeof paramVal === "undefined" ? "undefined" : _typeof(paramVal)) === "object") {
          queryStr.push(this.serialize(paramVal, paramKey));
        } else {
          queryStr.push(encodeURIComponent(paramKey) + "=" + encodeURIComponent(paramVal));
        }
      }
      return queryStr.join("&");
    }
  }, {
    key: "appendParams",
    value: function appendParams(url, params) {
      if (Object.keys(params).length === 0) {
        return url;
      }

      var prefix = url.match(/\?/) ? "&" : "?";
      return "" + url + prefix + this.serialize(params);
    }
  }]);

  return Ajax;
}();

Ajax.states = { complete: 4 };

var Presence = exports.Presence = {
  syncState: function syncState(currentState, newState, onJoin, onLeave) {
    var _this12 = this;

    var state = this.clone(currentState);
    var joins = {};
    var leaves = {};

    this.map(state, function (key, presence) {
      if (!newState[key]) {
        leaves[key] = presence;
      }
    });
    this.map(newState, function (key, newPresence) {
      var currentPresence = state[key];
      if (currentPresence) {
        (function () {
          var newRefs = newPresence.metas.map(function (m) {
            return m.phx_ref;
          });
          var curRefs = currentPresence.metas.map(function (m) {
            return m.phx_ref;
          });
          var joinedMetas = newPresence.metas.filter(function (m) {
            return curRefs.indexOf(m.phx_ref) < 0;
          });
          var leftMetas = currentPresence.metas.filter(function (m) {
            return newRefs.indexOf(m.phx_ref) < 0;
          });
          if (joinedMetas.length > 0) {
            joins[key] = newPresence;
            joins[key].metas = joinedMetas;
          }
          if (leftMetas.length > 0) {
            leaves[key] = _this12.clone(currentPresence);
            leaves[key].metas = leftMetas;
          }
        })();
      } else {
        joins[key] = newPresence;
      }
    });
    return this.syncDiff(state, { joins: joins, leaves: leaves }, onJoin, onLeave);
  },
  syncDiff: function syncDiff(currentState, _ref2, onJoin, onLeave) {
    var joins = _ref2.joins;
    var leaves = _ref2.leaves;

    var state = this.clone(currentState);
    if (!onJoin) {
      onJoin = function onJoin() {};
    }
    if (!onLeave) {
      onLeave = function onLeave() {};
    }

    this.map(joins, function (key, newPresence) {
      var currentPresence = state[key];
      state[key] = newPresence;
      if (currentPresence) {
        var _state$key$metas;

        (_state$key$metas = state[key].metas).unshift.apply(_state$key$metas, _toConsumableArray(currentPresence.metas));
      }
      onJoin(key, currentPresence, newPresence);
    });
    this.map(leaves, function (key, leftPresence) {
      var currentPresence = state[key];
      if (!currentPresence) {
        return;
      }
      var refsToRemove = leftPresence.metas.map(function (m) {
        return m.phx_ref;
      });
      currentPresence.metas = currentPresence.metas.filter(function (p) {
        return refsToRemove.indexOf(p.phx_ref) < 0;
      });
      onLeave(key, currentPresence, leftPresence);
      if (currentPresence.metas.length === 0) {
        delete state[key];
      }
    });
    return state;
  },
  list: function list(presences, chooser) {
    if (!chooser) {
      chooser = function chooser(key, pres) {
        return pres;
      };
    }

    return this.map(presences, function (key, presence) {
      return chooser(key, presence);
    });
  },

  // private

  map: function map(obj, func) {
    return Object.getOwnPropertyNames(obj).map(function (key) {
      return func(key, obj[key]);
    });
  },
  clone: function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }
};

// Creates a timer that accepts a `timerCalc` function to perform
// calculated timeout retries, such as exponential backoff.
//
// ## Examples
//
//    let reconnectTimer = new Timer(() => this.connect(), function(tries){
//      return [1000, 5000, 10000][tries - 1] || 10000
//    })
//    reconnectTimer.scheduleTimeout() // fires after 1000
//    reconnectTimer.scheduleTimeout() // fires after 5000
//    reconnectTimer.reset()
//    reconnectTimer.scheduleTimeout() // fires after 1000
//

var Timer = function () {
  function Timer(callback, timerCalc) {
    _classCallCheck(this, Timer);

    this.callback = callback;
    this.timerCalc = timerCalc;
    this.timer = null;
    this.tries = 0;
  }

  _createClass(Timer, [{
    key: "reset",
    value: function reset() {
      this.tries = 0;
      clearTimeout(this.timer);
    }

    // Cancels any previous scheduleTimeout and schedules callback

  }, {
    key: "scheduleTimeout",
    value: function scheduleTimeout() {
      var _this13 = this;

      clearTimeout(this.timer);

      this.timer = setTimeout(function () {
        _this13.tries = _this13.tries + 1;
        _this13.callback();
      }, this.timerCalc(this.tries + 1));
    }
  }]);

  return Timer;
}();

})(typeof(exports) === "undefined" ? window.Phoenix = window.Phoenix || {} : exports);
  })();
});
require.register("web/static/js/app.js", function(exports, require, module) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var phoenix_1 = require("phoenix");
var constants_1 = require("./constants");
var state_1 = require("./state");
var entities_1 = require("./entities");
var game_1 = require("./game");

var App = function () {
    function App() {
        _classCallCheck(this, App);
    }

    _createClass(App, null, [{
        key: "start",
        value: function start() {
            var _this = this;

            this.socket = new phoenix_1.Socket("/socket", {});
            this.socket.connect();
            this.roomChan = this.socket.channel("rooms:lobby", {});
            this.roomChan.join().receive("ignore", function () {
                return console.log("auth error");
            }).receive("ok", function () {
                console.log("join ok");
            });
            this.roomChan.onError(function (e) {
                return console.log("something went wrong", e);
            });
            this.roomChan.on("init_data", function (data) {
                _this.run(data.id, data.team);
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = data.blocks[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var block = _step.value;

                        _this.game.state.level.collidables.push(new entities_1.PlayerBlock(block.x, block.y, block.id, block.team));
                    }
                } catch (err) {
                    _didIteratorError = true;
                    _iteratorError = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion && _iterator.return) {
                            _iterator.return();
                        }
                    } finally {
                        if (_didIteratorError) {
                            throw _iteratorError;
                        }
                    }
                }
            });
        }
    }, {
        key: "run",
        value: function run(id, team) {
            var _this2 = this;

            // chan.onClose(e => console.log("channel closed", e))
            this.game = new game_1.Game(id, team);
            this.game.state.roomChan = this.roomChan;
            var game = this.game;
            var c = game.canvas;
            var sheet = game.spriteSheet;
            var gs = game.state;
            // Start the game loop
            game.run();
            this.roomChan.on("update_player", function (msg) {
                if (msg.id === _this2.game.state.user_id) {
                    return;
                }
                var changedPlayer = _this2.game.state.playerStates.filter(function (x) {
                    return x.id === msg.id;
                });
                if (changedPlayer.length === 1) {
                    changedPlayer[0].x = msg.x;
                    changedPlayer[0].y = msg.y;
                } else if (changedPlayer.length === 0) {
                    _this2.game.state.playerStates.push(new state_1.PlayerState(msg.x, msg.y, msg.id, msg.team));
                }
            });
            this.roomChan.on("remove_player", function (res) {
                var data = res.data;
                var new_id = res.new_id;
                var player_idx = _this2.game.state.playerStates.findIndex(function (x) {
                    return x.id === data.id;
                });
                console.log(data.id, _this2.game.state.user_id);
                if (data.id !== _this2.game.state.user_id) {
                    _this2.game.state.playerStates.splice(player_idx, 1);
                } else {
                    var _new_id = Math.floor(Math.random() * 10000);
                    _this2.game.state.userState.id = _new_id;
                    _this2.game.state.user_id = _new_id;
                }
            });
            this.roomChan.on("add_block", function (data) {
                _this2.game.state.level.collidables.push(new entities_1.PlayerBlock(data.x, data.y, data.id, data.team));
            });
            this.roomChan.on("remove_blocks", function (data) {
                _this2.game.state.level.collidables = _this2.game.state.level.collidables.filter(function (x) {
                    return !(x instanceof entities_1.PlayerBlock && data.block_ids.indexOf(x.id) !== -1);
                });
            });
            this.roomChan.on("overview_data", function (data) {
                for (var i = 0; i < constants_1.Constants.TEAMS; i++) {
                    _this2.game.state.flags[i].holding_id = data.flag_holder[i];
                }
                _this2.game.state.scores = data.score;
            });
        }
    }]);

    return App;
}();

App.start();
exports.default = App;
//# sourceMappingURL=app.js.map
});

;require.register("web/static/js/camera.js", function(exports, require, module) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");

var Camera = function () {
    function Camera() {
        _classCallCheck(this, Camera);
    }

    _createClass(Camera, null, [{
        key: "updateTarget",
        value: function updateTarget(user) {
            this.targetX = user.x + constants_1.Constants.PLAYER_W / 2 - constants_1.Constants.W / 2;
            this.targetY = user.y + constants_1.Constants.PLAYER_H / 2 - constants_1.Constants.H / 2;
        }
    }, {
        key: "update",
        value: function update() {
            this.cx += (this.targetX - this.cx) * 0.1;
            this.cy += (this.targetY - this.cy) * 0.1;
            if (this.cx > constants_1.Constants.LEVEL_W - constants_1.Constants.W) this.cx = constants_1.Constants.LEVEL_W - constants_1.Constants.W;
            if (this.cx < 0) this.cx = 0;
            if (this.cy > constants_1.Constants.LEVEL_H - constants_1.Constants.H) this.cy = constants_1.Constants.LEVEL_H - constants_1.Constants.H;
            if (this.cy < 0) this.cy = 0;
        }
    }, {
        key: "x",
        get: function get() {
            return Math.floor(this.cx);
        }
    }, {
        key: "y",
        get: function get() {
            return Math.floor(this.cy);
        }
    }]);

    return Camera;
}();

Camera.cx = 0;
Camera.cy = 0;
Camera.targetX = 0;
Camera.targetY = 0;
exports.Camera = Camera;
//# sourceMappingURL=camera.js.map
});

;require.register("web/static/js/constants.js", function(exports, require, module) {
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });

var Constants = function Constants() {
  _classCallCheck(this, Constants);
};

Constants.TEAMS = 2;
Constants.TEAM_NAMES = ["White", "Red"];
Constants.DESTROY_RADIUS = 10000;
Constants.PLAYER_W = 32;
Constants.PLAYER_H = 32;
Constants.W = 640;
Constants.H = 640;
Constants.LEVEL_W = 0;
Constants.LEVEL_H = 0;
exports.Constants = Constants;
//# sourceMappingURL=constants.js.map
});

;require.register("web/static/js/entities.js", function(exports, require, module) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var constants_1 = require("./constants");

var Block = function Block(x, y) {
    _classCallCheck(this, Block);

    this.x = 0;
    this.y = 0;
    this.w = constants_1.Constants.PLAYER_W;
    this.h = constants_1.Constants.PLAYER_H;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.x = x;
    this.y = y;
};

exports.Block = Block;

var PlayerBlock = function PlayerBlock(x, y, id, team) {
    _classCallCheck(this, PlayerBlock);

    this.x = 0;
    this.y = 0;
    this.w = constants_1.Constants.PLAYER_W;
    this.h = constants_1.Constants.PLAYER_H;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.id = 0;
    this.team = 0;
    this.x = x;
    this.y = y;
    this.id = id;
    this.team = team;
};

exports.PlayerBlock = PlayerBlock;

var Flag = function Flag(x, y, team) {
    _classCallCheck(this, Flag);

    this.x = 0;
    this.y = 0;
    this.w = constants_1.Constants.PLAYER_W;
    this.h = constants_1.Constants.PLAYER_H;
    this.left = 6;
    this.right = 6;
    this.top = 13;
    this.bottom = 0;
    this.team = 0;
    this.holding_id = null; // if it's null, nobody has it
    this.x = x;
    this.y = y;
    this.team = team;
};

exports.Flag = Flag;

var ScoringArea = function ScoringArea(x, y, team) {
    _classCallCheck(this, ScoringArea);

    this.x = 0;
    this.y = 0;
    this.w = constants_1.Constants.PLAYER_W;
    this.h = constants_1.Constants.PLAYER_H;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;
    this.team = 0;
    this.x = x;
    this.y = y;
    this.team = team;
};

exports.ScoringArea = ScoringArea;

var Spike = function Spike(x, y) {
    _classCallCheck(this, Spike);

    this.x = 0;
    this.y = 0;
    this.w = constants_1.Constants.PLAYER_W;
    this.h = constants_1.Constants.PLAYER_H;
    this.left = 0;
    this.right = 0;
    this.top = constants_1.Constants.PLAYER_H / 2;
    this.bottom = 0;
    this.x = x;
    this.y = y;
};

exports.Spike = Spike;

var Level = function () {
    function Level() {
        _classCallCheck(this, Level);
    }

    _createClass(Level, [{
        key: "addBlock",
        value: function addBlock(x, y) {
            this.collidables.push(new Block(x, y));
        }
    }, {
        key: "addSpike",
        value: function addSpike(x, y) {
            this.collidables.push(new Spike(x, y));
        }
    }, {
        key: "addFlag",
        value: function addFlag(x, y, team) {
            var flag = new Flag(x, y, team);
            this.collidables.push(flag);
            return flag;
        }
    }, {
        key: "addScoringArea",
        value: function addScoringArea(x, y, team) {
            this.collidables.push(new ScoringArea(x, y, team));
        }
    }, {
        key: "create",
        value: function create(gs) {
            var _this = this;

            this.collidables = new Array();
            var levelImage = new Image();
            levelImage.src = "images/level.png";
            levelImage.onload = function () {
                var canvas = document.createElement("canvas");
                canvas.width = levelImage.width;
                canvas.height = levelImage.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(levelImage, 0, 0, levelImage.width, levelImage.height);
                var data = ctx.getImageData(0, 0, levelImage.width, levelImage.height).data;
                constants_1.Constants.LEVEL_W = levelImage.width * 32;
                constants_1.Constants.LEVEL_H = levelImage.height * 32;
                for (var y = 0; y < levelImage.height; y++) {
                    for (var x = 0; x < levelImage.width; x++) {
                        var r = data[(x + y * levelImage.width) * 4];
                        var g = data[(x + y * levelImage.width) * 4 + 1];
                        var b = data[(x + y * levelImage.width) * 4 + 2];
                        if (r === 0 && g === 0 && b === 0) {
                            _this.addBlock(x * 32, y * 32);
                        }
                        if (r === 0 && g === 255 && b === 0 && gs.user_team === 0) {
                            _this.spawnX = x * 32;
                            _this.spawnY = y * 32;
                            gs.userState.x = x * 32;
                            gs.userState.y = y * 32;
                        }
                        if (r === 0 && g === 128 && b === 128 && gs.user_team === 1) {
                            _this.spawnX = x * 32;
                            _this.spawnY = y * 32;
                            gs.userState.x = x * 32;
                            gs.userState.y = y * 32;
                        }
                        if (r === 255 && g === 0 && b === 0) {
                            _this.addSpike(x * 32, y * 32);
                        }
                        if (r === 255 && g === 0 && b === 255) {
                            _this.addScoringArea(x * 32, y * 32, 0);
                            gs.flags[0] = _this.addFlag(x * 32, y * 32, 0);
                        }
                        if (r === 0 && g === 0 && b === 255) {
                            _this.addScoringArea(x * 32, y * 32, 1);
                            gs.flags[1] = _this.addFlag(x * 32, y * 32, 1);
                        }
                        if (r === 0 && g === 0 && b === 128) {
                            _this.addScoringArea(x * 32, y * 32, 1);
                        }
                        if (r === 128 && g === 0 && b === 128) {
                            _this.addScoringArea(x * 32, y * 32, 0);
                        }
                    }
                }
            };
        }
    }]);

    return Level;
}();

exports.Level = Level;
//# sourceMappingURL=entities.js.map
});

;require.register("web/static/js/game.js", function(exports, require, module) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var entities_1 = require("./entities");
var state_1 = require("./state");
var constants_1 = require("./constants");
var camera_1 = require("./camera");

var PlayerData = function PlayerData(x, y, id, team, nickname) {
    _classCallCheck(this, PlayerData);

    this.x = 0;
    this.y = 0;
    this.id = 0;
    this.team = 0;
    this.nickname = "";
    this.x = x;
    this.y = y;
    this.id = id;
    this.team = team;
    this.nickname = nickname;
};

exports.PlayerData = PlayerData;

var Game = function () {
    function Game(id, team) {
        _classCallCheck(this, Game);

        this.canvas = document.getElementById("gameCanvas");
        this.spriteSheet = new Image();
        this.spriteSheet.src = "images/sheet.png";
        this.state = new state_1.GameState(id, team);
    }

    _createClass(Game, [{
        key: "checkCollision",
        value: function checkCollision(a, b) {
            if (a.x >= b.x + b.w - a.left - b.right || a.x + constants_1.Constants.PLAYER_W - a.right - b.left <= b.x) return false;
            if (a.y >= b.y + b.h - a.top - b.bottom || a.y + constants_1.Constants.PLAYER_H - b.top <= b.y) return false;
            return true;
        }
    }, {
        key: "takeFlag",
        value: function takeFlag(flag) {
            this.state.roomChan.push("take_flag", {
                id: this.state.user_id,
                team: flag.team
            }).receive("fail", function () {
                flag.holding_id = null;
            });
            flag.holding_id = this.state.user_id;
        }
    }, {
        key: "scoreFlag",
        value: function scoreFlag(flag) {
            this.state.roomChan.push("score_flag", {
                id: this.state.user_id,
                user_team: this.state.user_team,
                flag_team: flag.team
            });
            flag.holding_id = null;
        }
    }, {
        key: "blockInRange",
        value: function blockInRange(block) {
            var blockX = block.x + block.w / 2;
            var blockY = block.y + block.h / 2;
            var pX = this.state.userState.x + constants_1.Constants.PLAYER_W / 2;
            var pY = this.state.userState.x + constants_1.Constants.PLAYER_W / 2;
            if (Math.hypot(blockX - pX, blockY - pY) < constants_1.Constants.DESTROY_RADIUS) {
                return true;
            }
            return false;
        }
    }, {
        key: "sudoku",
        value: function sudoku() {
            this.state.roomChan.push("sudoku", new PlayerData(this.state.userState.x, this.state.userState.y, this.state.user_id, this.state.user_team, this.state.user_nickname));
            var ids = new Array();
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this.state.level.collidables[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var obj = _step.value;

                    if (obj instanceof entities_1.PlayerBlock && obj.team != this.state.user_team && this.blockInRange(obj)) {
                        ids.push(obj.id);
                    }
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            this.state.roomChan.push("remove_blocks", { block_ids: ids });
            this.teleportPlayer();
        }
    }, {
        key: "killPlayer",
        value: function killPlayer() {
            this.state.roomChan.push("death", new PlayerData(this.state.userState.x, this.state.userState.y, this.state.user_id, this.state.user_team, this.state.user_nickname));
            this.teleportPlayer();
        }
    }, {
        key: "teleportPlayer",
        value: function teleportPlayer() {
            this.state.deathAnimFrame = 30;
            this.state.userState.x = this.state.level.spawnX;
            this.state.userState.y = this.state.level.spawnY;
            this.state.userState.dx = 0;
            this.state.userState.dy = 0;
        }
    }, {
        key: "run",
        value: function run() {
            var _this = this;

            var collisions = function collisions() {
                var gs = _this.state;
                var players = gs.playerStates;
                var user = gs.userState;
                user.can_jump = false;
                user.y += user.dy;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    for (var _iterator2 = _this.state.level.collidables[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        var obj = _step2.value;

                        if (_this.checkCollision(user, obj)) {
                            if (obj instanceof entities_1.ScoringArea) {
                                if (obj.team === _this.state.user_team) {
                                    var _iteratorNormalCompletion4 = true;
                                    var _didIteratorError4 = false;
                                    var _iteratorError4 = undefined;

                                    try {
                                        for (var _iterator4 = _this.state.flags[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
                                            var flag = _step4.value;

                                            if (flag.holding_id === _this.state.user_id) {
                                                _this.scoreFlag(flag);
                                            }
                                        }
                                    } catch (err) {
                                        _didIteratorError4 = true;
                                        _iteratorError4 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion4 && _iterator4.return) {
                                                _iterator4.return();
                                            }
                                        } finally {
                                            if (_didIteratorError4) {
                                                throw _iteratorError4;
                                            }
                                        }
                                    }
                                }
                            } else if (obj instanceof entities_1.PlayerBlock) {
                                user.y -= user.dy;
                                if (!_this.checkCollision(user, obj)) {
                                    user.y += user.dy;
                                    if (user.dy > 0) {
                                        user.dy = 0;
                                        user.can_jump = !Key.isDown(Key.UP);
                                        user.y = obj.y - constants_1.Constants.PLAYER_H + obj.top;
                                    }
                                } else {
                                    user.y += user.dy;
                                }
                            } else if (obj instanceof entities_1.Flag) {
                                if (obj.holding_id === null && obj.team !== _this.state.user_team) {
                                    obj.holding_id = _this.state.user_id;
                                    _this.takeFlag(obj);
                                }
                            } else {
                                if (user.dy > 0) {
                                    user.dy = 0;
                                    user.can_jump = !Key.isDown(Key.UP);
                                    user.y = obj.y - constants_1.Constants.PLAYER_H + obj.top;
                                } else {
                                    user.dy = 0;
                                    user.y = obj.y + obj.h - user.top - obj.bottom;
                                }
                                if (obj instanceof entities_1.Spike) {
                                    _this.killPlayer();
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                user.x += user.dx;
                var _iteratorNormalCompletion3 = true;
                var _didIteratorError3 = false;
                var _iteratorError3 = undefined;

                try {
                    for (var _iterator3 = _this.state.level.collidables[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                        var _obj = _step3.value;

                        if (_this.checkCollision(user, _obj) && !(_obj instanceof entities_1.PlayerBlock)) {
                            if (_obj instanceof entities_1.ScoringArea) {
                                if (_obj.team === _this.state.user_team) {
                                    var _iteratorNormalCompletion5 = true;
                                    var _didIteratorError5 = false;
                                    var _iteratorError5 = undefined;

                                    try {
                                        for (var _iterator5 = _this.state.flags[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
                                            var _flag = _step5.value;

                                            if (_flag.holding_id === _this.state.user_id) {
                                                _this.scoreFlag(_flag);
                                            }
                                        }
                                    } catch (err) {
                                        _didIteratorError5 = true;
                                        _iteratorError5 = err;
                                    } finally {
                                        try {
                                            if (!_iteratorNormalCompletion5 && _iterator5.return) {
                                                _iterator5.return();
                                            }
                                        } finally {
                                            if (_didIteratorError5) {
                                                throw _iteratorError5;
                                            }
                                        }
                                    }
                                }
                            } else if (_obj instanceof entities_1.Flag) {
                                if (_obj.holding_id === null && _obj.team !== _this.state.user_team) {
                                    _obj.holding_id = _this.state.user_id;
                                    _this.takeFlag(_obj);
                                }
                            } else {
                                if (user.dx > 0) {
                                    user.x = _obj.x - constants_1.Constants.PLAYER_W + user.right + _obj.left;
                                } else {
                                    user.x = _obj.x + _obj.w - user.left - _obj.right;
                                }
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError3 = true;
                    _iteratorError3 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion3 && _iterator3.return) {
                            _iterator3.return();
                        }
                    } finally {
                        if (_didIteratorError3) {
                            throw _iteratorError3;
                        }
                    }
                }
            };
            var draw = function draw() {
                var ctx = _this.canvas.getContext("2d");
                var gs = _this.state;
                ctx.fillStyle = 'rgb(139, 206, 210)';
                ctx.fillRect(0, 0, constants_1.Constants.W, constants_1.Constants.H);
                ctx.fillStyle = 'rgb(0, 0, 0)';
                var user = _this.state.userState;
                var _iteratorNormalCompletion6 = true;
                var _didIteratorError6 = false;
                var _iteratorError6 = undefined;

                try {
                    for (var _iterator6 = _this.state.level.collidables[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
                        var obj = _step6.value;

                        if (obj instanceof entities_1.PlayerBlock) ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 5, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                        if (obj instanceof entities_1.Block) ctx.fillRect(obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, obj.w, obj.h);
                        if (obj instanceof entities_1.Spike) ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 4, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                        if (obj instanceof entities_1.Flag && obj.holding_id == null) {
                            if (obj.team === 0) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 2, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            } else if (obj.team === 1) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 3, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            }
                        }
                        if (obj instanceof entities_1.ScoringArea) {
                            if (obj.team === 0) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 4, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            } else if (obj.team === 1) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 5, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, obj.x - camera_1.Camera.x, obj.y - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError6 = true;
                    _iteratorError6 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion6 && _iterator6.return) {
                            _iterator6.return();
                        }
                    } finally {
                        if (_didIteratorError6) {
                            throw _iteratorError6;
                        }
                    }
                }

                if (user.x_dir === -1) {
                    ctx.translate(Math.floor(user.x) + constants_1.Constants.PLAYER_W - camera_1.Camera.x, Math.floor(user.y) - camera_1.Camera.y);
                    ctx.scale(-1, 1);
                    if (user.dx != 0) {
                        user.frame = Math.floor(user.tick / 5) % 4;
                        ctx.drawImage(_this.spriteSheet, user.frame * constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                    } else {
                        ctx.drawImage(_this.spriteSheet, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                    }
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                } else {
                    if (user.dx != 0) {
                        user.frame = Math.floor(user.tick / 5) % 4;
                        ctx.drawImage(_this.spriteSheet, user.frame * constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(user.x) - camera_1.Camera.x, Math.floor(user.y) - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                    } else {
                        ctx.drawImage(_this.spriteSheet, 0, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(user.x) - camera_1.Camera.x, Math.floor(user.y) - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                    }
                }
                var _iteratorNormalCompletion7 = true;
                var _didIteratorError7 = false;
                var _iteratorError7 = undefined;

                try {
                    for (var _iterator7 = _this.state.flags[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
                        var flag = _step7.value;

                        if (flag.holding_id === _this.state.user_id) {
                            if (flag.team === 0) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 2, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(user.x) - camera_1.Camera.x, Math.floor(user.y) - camera_1.Camera.y - constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            } else if (flag.team === 1) {
                                ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 3, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(user.x) - camera_1.Camera.x, Math.floor(user.y) - camera_1.Camera.y - constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                            }
                        }
                    }
                } catch (err) {
                    _didIteratorError7 = true;
                    _iteratorError7 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion7 && _iterator7.return) {
                            _iterator7.return();
                        }
                    } finally {
                        if (_didIteratorError7) {
                            throw _iteratorError7;
                        }
                    }
                }

                var _iteratorNormalCompletion8 = true;
                var _didIteratorError8 = false;
                var _iteratorError8 = undefined;

                try {
                    for (var _iterator8 = _this.state.nonUserStates[Symbol.iterator](), _step8; !(_iteratorNormalCompletion8 = (_step8 = _iterator8.next()).done); _iteratorNormalCompletion8 = true) {
                        var player = _step8.value;
                        var _iteratorNormalCompletion9 = true;
                        var _didIteratorError9 = false;
                        var _iteratorError9 = undefined;

                        try {
                            for (var _iterator9 = _this.state.flags[Symbol.iterator](), _step9; !(_iteratorNormalCompletion9 = (_step9 = _iterator9.next()).done); _iteratorNormalCompletion9 = true) {
                                var _flag2 = _step9.value;

                                if (_flag2.holding_id === player.id) {
                                    if (_flag2.team === 0) {
                                        ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 2, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(player.x) - camera_1.Camera.x, Math.floor(player.y) - camera_1.Camera.y - constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                                    } else if (_flag2.team === 1) {
                                        ctx.drawImage(_this.spriteSheet, constants_1.Constants.PLAYER_W * 3, 0, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H, Math.floor(player.x) - camera_1.Camera.x, Math.floor(player.y) - camera_1.Camera.y - constants_1.Constants.PLAYER_H, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                                    }
                                }
                            }
                        } catch (err) {
                            _didIteratorError9 = true;
                            _iteratorError9 = err;
                        } finally {
                            try {
                                if (!_iteratorNormalCompletion9 && _iterator9.return) {
                                    _iterator9.return();
                                }
                            } finally {
                                if (_didIteratorError9) {
                                    throw _iteratorError9;
                                }
                            }
                        }

                        ctx.fillRect(Math.floor(player.x) - camera_1.Camera.x, Math.floor(player.y) - camera_1.Camera.y, constants_1.Constants.PLAYER_W, constants_1.Constants.PLAYER_H);
                    }
                } catch (err) {
                    _didIteratorError8 = true;
                    _iteratorError8 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion8 && _iterator8.return) {
                            _iterator8.return();
                        }
                    } finally {
                        if (_didIteratorError8) {
                            throw _iteratorError8;
                        }
                    }
                }

                var scoreText = "";
                for (var i = 0; i < constants_1.Constants.TEAMS; i++) {
                    scoreText += "Team " + constants_1.Constants.TEAM_NAMES[i] + " score: " + _this.state.scores[i] + "\n";
                }
                ctx.font = '64px PixelFont';
                ctx.textBaseline = 'top';
                var textPadding = {
                    x: 10,
                    y: 0
                };
                var team0Score = "" + _this.state.scores[0];
                ctx.fillStyle = 'rgb(255, 255, 255)';
                ctx.fillText(team0Score, textPadding.x, textPadding.y);
                var team1Score = "" + _this.state.scores[1];
                ctx.fillStyle = 'rgb(172, 35, 48)';
                ctx.fillText(team1Score, constants_1.Constants.W - ctx.measureText(team1Score).width - textPadding.x, textPadding.y);
            };
            var Key = {
                _pressed: {},
                SPACE: 32,
                LEFT: 37,
                UP: 38,
                RIGHT: 39,
                DOWN: 40,
                isDown: function isDown(keyCode) {
                    return this._pressed[keyCode];
                },
                onKeydown: function onKeydown(event) {
                    if (event.keyCode == Key.SPACE) {
                        _this.sudoku();
                    }
                    Key._pressed[event.keyCode] = true;
                },
                onKeyup: function onKeyup(event) {
                    delete this._pressed[event.keyCode];
                }
            };
            window.addEventListener('keyup', function (event) {
                Key.onKeyup(event);
            }, false);
            window.addEventListener('keydown', function (event) {
                Key.onKeydown(event);
            }, false);
            var check_bounds = function check_bounds(user) {
                if (user.x < 0) user.x = 0;
                if (user.x > constants_1.Constants.LEVEL_W - constants_1.Constants.PLAYER_W) user.x = constants_1.Constants.LEVEL_W - constants_1.Constants.PLAYER_W;
                if (user.y < 0) {
                    user.dy = 0;
                    user.y = 0;
                }
                if (user.y >= constants_1.Constants.LEVEL_H - constants_1.Constants.PLAYER_H) {
                    user.dy = 0;
                    user.y = constants_1.Constants.LEVEL_H - constants_1.Constants.PLAYER_H;
                    user.can_jump = !Key.isDown(Key.UP);
                }
            };
            var update = function update() {
                var jump_v = 12;
                var v = 4;
                var gs = _this.state;
                var user = gs.userState;
                user.tick += 1;
                if (Key.isDown(Key.UP) && user.can_jump) {
                    user.dy = -jump_v;
                    user.can_jump = false;
                }
                if (Key.isDown(Key.LEFT)) {
                    user.dx += (-v - user.dx) * 0.2;
                    user.x_dir = -1;
                } else if (Key.isDown(Key.RIGHT)) {
                    user.dx += (v - user.dx) * 0.2;
                    user.x_dir = 1;
                } else {
                    user.dx *= 0.9;
                    if (Math.abs(user.dx) < 1) {
                        user.dx = 0;
                    }
                }
                collisions();
                check_bounds(user);
                user.dy += 0.7;
                if (_this.state.deathAnimFrame === 0) {
                    camera_1.Camera.updateTarget(user);
                } else {
                    _this.state.deathAnimFrame--;
                }
                camera_1.Camera.update();
            };
            var push = function push() {
                _this.state.roomChan.push("update_player", new PlayerData(_this.state.userState.x, _this.state.userState.y, _this.state.user_id, _this.state.user_team, _this.state.user_nickname));
            };
            setInterval(function () {
                update();
                draw();
                push();
            }, 1000 / this.state.fps);
        }
    }]);

    return Game;
}();

exports.Game = Game;
//# sourceMappingURL=game.js.map
});

;require.register("web/static/js/state.js", function(exports, require, module) {
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

Object.defineProperty(exports, "__esModule", { value: true });
var entities_1 = require("./entities");
var constants_1 = require("./constants");

var PlayerState = function PlayerState(x, y, id, team) {
    _classCallCheck(this, PlayerState);

    this.x = 0;
    this.y = 0;
    this.left = 3;
    this.right = 3;
    this.top = 6;
    this.x_dir = 1;
    this.dx = 0;
    this.dy = 0;
    this.can_jump = false;
    this.tick = 0;
    this.frame = 0;
    this.id = 0;
    this.team = 0;
    this.x = x;
    this.y = y;
    this.id = id;
    this.team = team;
};

exports.PlayerState = PlayerState;

var GameState = function () {
    function GameState(id, team) {
        _classCallCheck(this, GameState);

        this.user_id = 0;
        this.scores = [];
        this.flags = [];
        this.deathAnimFrame = 0;
        this.user_team = 0;
        this.user_nickname = "horsey";
        this.fps = 60;
        this.playerStates = new Array(new PlayerState(0, 0, id, team));
        this.user_id = id;
        this.user_team = team;
        this.scores = new Array(constants_1.Constants.TEAMS);
        this.scores.fill(0);
        this.flags = new Array(constants_1.Constants.TEAMS);
        this.level = new entities_1.Level();
        this.level.create(this);
    }

    _createClass(GameState, [{
        key: "userState",
        get: function get() {
            var _this = this;

            return this.playerStates.filter(function (x) {
                return x.id === _this.user_id;
            })[0];
        }
    }, {
        key: "nonUserStates",
        get: function get() {
            var _this2 = this;

            return this.playerStates.filter(function (x) {
                return x.id !== _this2.user_id;
            });
        }
    }]);

    return GameState;
}();

exports.GameState = GameState;
//# sourceMappingURL=state.js.map
});

;require.alias("phoenix/priv/static/phoenix.js", "phoenix");require.register("___globals___", function(exports, require, module) {
  
});})();require('___globals___');

require('web/static/js/app');
//# sourceMappingURL=app.js.map