var Connection = require('./connection');
var JID = require('./jid').JID;
var ltx = require('ltx');
var sys = require('sys');
var crypto = require('crypto');
var SRV = require('./srv');

var NS_COMPONENT = 'jabber:component:accept';

/**
 * params:
 *   jid: String (required)
 *   password: String (required)
 *   host: String (required)
 *   port: Number (required)
 *   reconnect: Boolean (optional)
 */
function Component(params) {
    var that = this;
    Connection.Connection.call(this);

    if (typeof params.jid == 'string')
        this.jid = new JID(params.jid);
    else
        this.jid = params.jid;
    this.password = params.password;
    this.host = params.host;
    this.port = params.port;
    this.reconnect = params.reconnect;
    this.xmlns[''] = NS_COMPONENT;
    this.streamTo = this.jid.domain;

    this.addListener('streamStart', function(streamAttrs) {
        that.onStreamStart(streamAttrs);
    });
    this.addListener('rawStanza', function(stanza) {
        that.onRawStanza(stanza);
    });

    this.connect();
    /*if (this.reconnect)
	this.socket.addListener('close', function() {
	    console.log('closing')
	    setTimeout(function() {
		that.connect();
	    }, Math.ceil(Math.random() * 1000));
	});*/
}

sys.inherits(Component, Connection.Connection);
exports.Component = Component;

Component.prototype.connect = function() {
    var that = this;
    /* Components actually don't use SRV records. We still use this
     * layer as it provides address family retrying etc.
     */
    var attempt = SRV.connect(this.socket, [], this.host, this.port);
    attempt.addListener('connect', function() {
        that.startParser();
        that.startStream();
    });
    attempt.addListener('error', function(e) {
	if (that.reconnect) {
	    console.error('Component: ' + e.message);
	    setTimeout(function() {
		that.connect();
	    }, Math.ceil(Math.random() * 5000));
	} else
	    that.emit('error', e);
    });
};

Component.prototype.onStreamStart = function(streamAttrs) {
    var digest = sha1_hex(streamAttrs.id + this.password);
    this.send(new ltx.Element('handshake').t(digest));
};

Component.prototype.onRawStanza = function(stanza) {
    if (stanza.is('handshake', NS_COMPONENT)) {
        this.emit('online');
    } else {
        this.emit('stanza', stanza);
    }
};

function sha1_hex(s) {
    var hash = crypto.createHash('sha1');
    hash.update(s);
    return hash.digest('hex');
}
