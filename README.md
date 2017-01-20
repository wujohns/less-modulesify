# less-modulesify  
A browsrify plugin support [CSS Modules] feature for less.   
[CSS Modules]: https://github.com/css-modules/css-modules  

## Getting started  

## API Usage  
```js
// Basic Usage, css will be inline
var b = require('browsrify')();

b.add('./main.js');
b.plugin(require('less-modulesify'), {
    sourceMap: true,
    lessCompileOption: {
        compress: true
    }
});
b.bundle();
```

```js
// Output the css file,the base filename will not change
var b = require('browsrify')();
b.add('./main.js');
b.plugin(require('less-modulesify'), {
    outputDir: './dist'
    sourceMap: true,
    lessCompileOption: {
        compress: true
    }
});
b.bundle();
```

### Options:

- `outputDir`: the target css will be written into this directory.When not setting it,the style will be inline.  
- `sourceMap`: using sourceMap or not. Support inline-sourceMap only
- `lessCompileOption`: you can using original less options here(like: plugins,compress...),excepts sourcemap, for more 
just see the [less docs]
[less docs]: http://lesscss.org/usage/#programmatic-usage