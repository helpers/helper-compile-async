'use strict';

require('mocha');
var assert = require('assert');
var compile = require('../');

describe('helper-compile-async', function() {
  it('should export a function', function() {
    assert.equal(typeof compile, 'function');
  });

  it('should throw an error when invalid args are passed', function(cb) {
    try {
      compile();
      cb(new Error('expected an error'));
    } catch (err) {
      assert(err);
      assert.equal(err.message, 'expected a function');
      cb();
    }
  });
});
