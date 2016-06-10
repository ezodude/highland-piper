# highland-piper

Create first class pipelines that enable abort and finalize logic.

Use pure functions to create complex workflows and optimise data processing.

## Getting started

### transforms only

This is the simplest use case. It mirrors a basic highland pipeline. But it does allow for naming transforms.

Use ```.add``` to add a transform. All transforms are highland transforms just like a simple highland ```_.pipeline(...)```

``` js
const piper = require('highland-piper');
const stream = _([ {title: 'The Title'} ]);

const pipeline = piper('title-changer');
p.add('changeTitle', h.doto( obj => obj.title = 'New Title'));
stream.through(pipeline.consumer).each(o => console.log(o.title));
```

### transforms and aborts

Aborts make a pipeline intelligent. You can skip unncessary processing for some objects without losing the data. Any aborted objects will be available for processing that starts after the pipeline ends. Think of it as a smart filter.

Use ```.abort``` to add an abort. Aborts take a name and a predicate. The predicate is a function that evaluates to ```true``` or ```false```. 

``` js
const piper = require('highland-piper');
const stream = _([
  {name: 'John', rating: 1}, 
  {name: 'Tom', rating: 2}, 
  {name: 'Sam', rating: 3} 
]);

const pipeline = piper('title-changer');

pipeline
.add('addInfo', h.doto( obj => obj.info = obj.rating > 2 ? 'Experienced' : 'Beginner'))
.abort('ignoreExperienced', obj => /experienced/i.test(obj.info))
.add('assignWork', h.doto( obj => obj.work = 'Do extra work.'));

stream
.through(pipeline.consumer)
.doto(obj => obj.holiday = 'Spain')
.each(o => console.log(o));
```

Only ```John & Tom``` will ```Do extra work```. But they will all ```John, Tom & Sam``` holiday in ```Spain```.

### finalising

Use ```.finally``` to perform a transformation that applies to all objects including any aborts. Its a great place to perform any clean up of pipeline specific attributes or properties.

There can only be one call to ```.finally```. Any subsequent calls will override an existing ```.finally``` transformation.

When used place it at the end of the pipeline.

Continuing from the example above.

``` js
...
...

pipeline
.add('addInfo', h.doto( obj => obj.info = obj.rating > 2 ? 'Experienced' : 'Beginner'))
.abort('ignoreExperienced', obj => /experienced/i.test(obj.info))
.add('assignWork', h.doto( obj => obj.work = 'Do extra work.'))
.finally(h.doto( obj => delete obj.rating));

stream
.through(pipeline.consumer)
.doto(obj => obj.holiday = 'Spain')
.each(o => console.log(o));
```

All objects will no longer include ```obj.rating```. After which they will include the ```holiday``` property.

## Thank yous

Thank you to the [highland](https://github.com/caolan/highland) team for all the hard work!