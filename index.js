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

Pipe.prototype.exec = function (data, cb) {
  return this.run()(h(data)).collect().toCallback(cb);
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

Pipeline.prototype.finally = function (transform) {
  finalize = transform;
};

Pipeline.prototype.exec = function () {
  const args      = Array.prototype.slice.call(arguments, 0)
      , stage     = args[0]
      , data      = args.slice(1, args.length - 1)
      , cb  = args[args.length - 1];

  const found = pipes.find(pipe => pipe.name === stage);
  if(!found){ throw new Error('Unknown stage.'); }

  return found.exec(data, cb);
};

Pipeline.prototype.consumer = function (s) {
  return consumer(s, pipes).through(finalize);
};