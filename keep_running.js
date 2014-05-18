// keep_running.js
//
// _Example_ for using a single browser for rerunning protractor
// tests when files change (inspired by ng-scenario+karma's normal behaviour)
//
// By Mika Raento, Karhea Oy
// Put in the public domain, do whatever you wish with it
//
// Restrictions of the example:
// - only chromedriver
// - only jasmine
// - tests are assumed to live under acceptance/
// - watches current directory
// - simplistic assumption about process.kill
// - monkey-patches protractor, jasmine and node internals, will
//   easily break with new versions of any
// - there's a reason protractor doesn't support this: it's much easier to
//   get deterministic tests if you restart with a fresh browser
//
// node-requirements: protractor q minijasminenode chokidar
//
// run with:
// $ node keep_running.js <protractor options go here>
//
var q = require('q');

// Monkey-patch the chrome provider to reuse the same browser instance
chrome = Object.getPrototypeOf(
    require('protractor/lib/driverProviders/chrome.dp.js')());
var orig_getDriver = chrome.getDriver;
var driver;
chrome.getDriver = function() {
    if (driver) {
        this.driver_ = driver;
    } else {
        driver = orig_getDriver.apply(this);
    }
    return driver;
};
chrome.teardownEnv = function() {
    // could we do something here to clean at least some things up?
    return q.fcall(function() {});
};
chrome.setupEnv = function() {
    return q.fcall(function() {});
};

var maybe_run;
var should_run = true;
process.exit = function() {
    is_running = false;
    maybe_run();
};
var is_running = false;
var pending;

require('minijasminenode');
maybe_run = function() {
    if (is_running) return;
    if (!should_run) {
        if (pending) return;
        pending = setTimeout(function() {
            pending = null;
            maybe_run();
        }, 300);
        return;
    }
    is_running = true;
    should_run = false;
    // protractor and (mini)jasmine use node's require() for side effects,
    // reset the modules here
    delete require.cache[require.resolve('protractor/lib/cli.js')];
    delete require.cache[require.resolve('protractor/lib/runner.js')];
    for (var k in require.cache) {
        // especially our test specs
        if (k.indexOf("/acceptance/") > 0) {
            // TODO: parse the command line and configuration file to
            // see what are out specs
            delete require.cache[k];
        }
    }
    // Don't reuse the same jasmine environment for new tests
    jasmine.currentEnv_ = undefined;

    // Kick the run off
    // Here we could call the underlying protractor/lib/launcher.js instead
    // and give it a list of changed files
    require('protractor/lib/cli.js');
};

require('chokidar').watch('.').on('all', function() {
    should_run = true;
});

process.on('exit', function() { if (driver) driver.quit(); });

maybe_run();
