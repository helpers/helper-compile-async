'use strict';

var isObject = require('isobject');
var AsyncHelpers = require('async-helpers');
var asyncHelpers;

/**
 * Compile a helper function to add convenience methods for
 * working with [async-helpers][].
 *
 * ```js
 * // ensures that asyncHelpers.resolveIds is called on the
 * // rendered content from `options.fn` before returning
 * var helper = compile(function(options, cb) {
 *   return options.fn(this, cb);
 * });
 * ```
 * @param  {Function} `helper` Helper function to be called with a modified `options.fn` and `options.inverse` function if available.
 * @return {Function} Compiled helper function suitable to be registered with a template engine.
 * @api public
 */

module.exports = function compile(helper) {
  if (typeof helper !== 'function') {
    throw new TypeError('expected a function');
  }

  if (!asyncHelpers) {
    asyncHelpers = new AsyncHelpers();
  }

  function compiled(/* args */) {
    var args = [].slice.call(arguments);
    var cb, options;
    if (typeof args[args.length - 1] === 'function') {
      cb = args.pop();
    }

    options = args[args.length - 1];
    if (!isObject(options) || !isObject(options.hash)) {
      options = {};
    }

    if (typeof cb === 'function') {
      args.push(cb);
    }

    if (typeof options.fn === 'function') {
      var fn = options.fn;
      options.fn = function(context, options, cb) {
        if (typeof options === 'function') {
          cb = options;
          options = {};
        }

        var str = fn(context, options);
        if (typeof cb === 'function') {
          return asyncHelpers.resolveIds(str, cb);
        }
        return str;
      };
    }

    if (typeof options.inverse === 'function') {
      var inverse = options.inverse;
      options.inverse = function(context, options, cb) {
        if (typeof options === 'function') {
          cb = options;
          options = {};
        }

        var str = inverse(context, options);
        if (typeof cb === 'function') {
          asyncHelpers.resolveIds(str, cb);
          return;
        }
        return str;
      };
    }

    return helper.apply(this, args);
  }

  if (helper.async === true) {
    compiled.async = true;
  }

  return compiled;
};
