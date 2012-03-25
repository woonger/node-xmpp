var test = require('tap').test,
xmpp = require('./../lib/xmpp');

const C2S_PORT = 45552;

test('TCP client/server', function(t) {
    var sv = new xmpp.C2SServer({ port: C2S_PORT }), svcl;
    sv.on('connect', function(svcl_) {
	svcl = svcl_;
	svcl.on('authenticate', function(opts, cb) {
	    cb();
	});
    });

    t.test('client', function(t) {
	var cl;
	t.test("can log in" ,function(t) {
	    cl = new xmpp.Client({
		jid: 'test@example.com',
		password: 'test',
		host: '::1',
		port: C2S_PORT
	    });
	    cl.on('online', function() {
		console.error("oneline", t.end);
		t.end();
		console.error("onelined");
	    });
	});
	t.test('can send stanzas', function(t) {
	    svcl.once('stanza', function(stanza) {
		t.test("received proper message", function(t) {
		    t.ok(stanza.is('message'), "Message stanza");
		    t.equal(stanza.attrs.to, "foo@bar.org");
		    t.equal(stanza.getChildText('body'), "Hello");
		});
		t.end();
	    });
	    cl.send(new xmpp.Message({ to: "foo@bar.org" }).
			 c('body').t("Hello"));
	});
	t.test('can receive stanzas', function(t) {
	    cl.once('stanza', function(stanza) {
		t.test("received proper message", function(t) {
		    t.ok(stanza.is('message'), "Message stanza");
		    t.equal(stanza.attrs.to, "bar@bar.org");
		    t.equal(stanza.getChildText('body'), "Hello back");
		});
		t.end();
			 });
	    svcl.send(new xmpp.Message({ to: "bar@bar.org" }).
			   c('body').t("Hello back"));
	});
	t.end();
    });
    t.test("frob", function(t) {
	t.ok(true, "Yup");
	t.end();
    });
    //'client fails login': "pending",

    //'auto reconnect': "pending"

    t.end();
});
