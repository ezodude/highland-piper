'use strict';

const h = require('highland');

module.exports = function (s, pipes) {
  return s.consume((err, x, push, next) => {
    let aborted;

    if (err) {
      // pass errors along the stream and consume next value
      push(err);
      next();
    }
    else if (x === h.nil) {
      // pass nil (end event) along the stream
      push(null, x);
    }
    else {
      let normal = h([x]);

      pipes.forEach(p => {
        if(p.type === 'abort'){
          normal = normal
          .doto(obj => { aborted = p.run()(obj) ? obj : null })
          .through(h.reject(p.run()));
        }

        if(p.type === 'transform'){
          normal = normal.through(p.run());
        }
      });

      normal.apply(v => {
        const result = v || aborted;
        result && push(null, result);
        next();
      });
    }
  });
};