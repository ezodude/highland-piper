'use strict';

const _ = require('lodash')
    , h = require('highland')
    , consumer = require('./lib/consumer');

module.exports = Pipeline;

let pipes, finalize = h.doto(() => {});

function Pipe(opts){
  this.type = opts.type
  this.name = opts.name;
  this.fn = opts.fn;
}

Pipe.prototype.run = function () {
  return this.fn;
};

function Pipeline(title) {
  if (!(this instanceof Pipeline)) return new Pipeline(title);
  this.title = title;
  pipes = [];
}

Pipeline.prototype.add = function (name, transform) {
  pipes.push(new Pipe({
    type: 'transform',
    name: name,
    fn: transform
  }));
  return this;
};

Pipeline.prototype.abort = function (name, predicate) {
  pipes.push(new Pipe({
    type: 'abort',
    name: name,
    fn: predicate
  }));
  return this;
};

Pipeline.prototype.transforms = function () {
  return pipes.filter(e => e.type === 'transform').reduce((a, b) => {
    a[b.name] = b.fn;
    return a;
  }, {});
};

Pipeline.prototype.finally = function (transform) {
  finalize = transform;
};

Pipeline.prototype.consumer = function (s) {
  return consumer(s, pipes).through(finalize);
};