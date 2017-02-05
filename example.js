'use strict';

var Remarkable = require('remarkable');
var Handlebars = require('handlebars');
var AsyncHelpers = require('async-helpers');
var asyncHelpers = new AsyncHelpers();

var compile = require('.');

// sync block function that uses options.fn
function upper(options) {
  var str = options.fn(this);
  return str.toUpperCase();
}

// async block function that uses options.fn with a callback
function lower(options, cb) {
  var self = this;
  process.nextTick(function() {
    options.fn(self, function(err, content) {
      if (err) return cb(err);
      cb(null, content.toLowerCase());
    });
  });
}
lower.async = true;

// async markdown block helper that renders the block
// with options.fn using a callback, then renders markdown
// to html using remarkable
// this will resolve inner async helpers before rendering markdown
// to ensure problems don't occur
function md(options, cb) {
  var remarkable = new Remarkable();
  // cb(null, remarkable.render(options.fn()));
  options.fn(this, function(err, content) {
    if (err) return cb(err);
    cb(null, remarkable.render(content));
  });
}
md.async = true;

// sync markdown block helper that renders the block
// with options.fn without a callback, then renders markdown
// to html using remarkable
// this will not resolve inner async helpers before rendering markdown
// which may cause problems
function md2(options) {
  var remarkable = new Remarkable();
  return remarkable.render(options.fn());
}

asyncHelpers.set('each', Handlebars.helpers.each);
asyncHelpers.set('upper', compile(upper));
asyncHelpers.set('lower', compile(lower));
asyncHelpers.set('md', compile(md));
asyncHelpers.set('md2', compile(md2));

var helpers = asyncHelpers.get({wrap: true});

console.log('-- WRAPPED HELPERS --');
console.log(helpers);
console.log();
Handlebars.registerHelper(helpers);

var tmpl = `
  upper: {{#upper}}foo{{/upper}}
  lower: {{#lower}}FOO{{/lower}}

  markdown
  --------
{{#md}}
{{#each list as |item|}}
  - {{item}}
{{/each}}
{{/md}}

  markdown 2
  ----------
{{#md2}}
# {{#upper}}header 1{{/upper}}

> {{#lower}}this is a LOWER block QUOTE{{/lower}}
{{/md2}}
`;

console.log('-- TEMPLATE --');
console.log(tmpl);
console.log();
var fn = Handlebars.compile(tmpl);
var str = fn({list: ['a', 'b', 'c', 'd']});
console.log('-- RENDERED STRING (contains async ids) --');
console.log(str);
console.log();

asyncHelpers.resolveIds(str, function(err, str) {
  if (err) console.error(err);
  console.log('-- RESOLVED STRING (no async ids) --');
  console.log(str);
  console.log();
});
