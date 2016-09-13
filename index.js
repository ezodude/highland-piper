'use strict';

const _         = require('lodash')
    , h         = require('highland')
    , consumer  = require('./lib/consumer');

module.exports = Pipeline;

const NIL_TRANSFORM = h.doto(() => {});

function Pipe(opts){
  this.type = opts.type
  this.name = opts.name;
  this.fn = opts.fn;
}

Pipe.nil = new Pipe({type: 'transform', fn: NIL_TRANSFORM});

Pipe.prototype.run = function () {
  return this.fn;
};

Pipe.prototype.exec = function (data, cb) {
  if(this.type === 'abort') {
    let error, result;
    try{
      result = this.run()(data[0]);
    }
    catch(err){
      error = err;
    }
    finally{
      return cb(error, result);
    }
  }
  return this.run()(h(data).head()).toCallback((err, out) => cb(err, out));
};

function Pipeline(title) {
  if (!(this instanceof Pipeline)) return new Pipeline(title);
  this.title = title;
  this.pipes = [];
  this.finalize = NIL_TRANSFORM;

  this.consumer = function(stream){
    return consumer(stream, this.pipes).through(this.finalize);
  }.bind(this);
}

Pipeline.prototype.add = function (name, transform) {
  this.pipes.push(new Pipe({
    type: 'transform',
    name: name,
    fn: transform
  }));
  return this;
};

Pipeline.prototype.abort = function (name, predicate) {
  this.pipes.push(new Pipe({
    type: 'abort',
    name: name,
    fn: predicate
  }));
  return this;
};

Pipeline.prototype.finally = function (transform) {
  this.finalize = transform;
};

Pipeline.prototype.exec = function () {
  const args      = Array.prototype.slice.call(arguments, 0)
      , stage     = args[0]
      , data      = args.slice(1, args.length - 1)
      , cb  = args[args.length - 1];

  let found = Pipe.nil;
  found = (stage === 'finally' && new Pipe({type: 'transform', fn: this.finalize})) || found;
  found = (stage !== 'finally' && this.pipes.find(pipe => pipe.name === stage) )|| found;

  return found.exec(data, cb);
};