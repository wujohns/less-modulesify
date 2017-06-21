# less-modulesify  
A browserify plugin support [CSS Modules](https://github.com/css-modules/css-modules) feature for less.

## Getting started  
First install the package: `npm install --save less-modulesify`  
Applying a class to an element you can do something like:  

styles.less
```less
.exContent {
    height: 100px;
    width: 100px;
    background-color: red;
}
```

main.js
```js
var styles = require('./styles.less');
var content = document.getElementById('content');
content.className = styles.exContent;
```

Then using browserify to build it: `browserify -p [less-modulesify] main.js > bundle.js`  

## API Usage  
```js
// Basic Usage, css will be inline
var b = require('browserify')();

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
var b = require('browserify')();
b.add('./main.js');
b.plugin(require('less-modulesify'), {
    outputDir: './dist',
    sourceMap: true,
    lessCompileOption: {
        compress: true
    }
});
b.bundle();
```

### Options:

- `global`: browserify's global transforming
- `exclude`: the files those will not be transformed. Files can be globs
- `modulesifyExclude`: the files those will not be modulesify transformed. Files can be globs
- `outputDir`: the target css will be written into this directory.When not setting it,the style will be inline.  
- `sourceMap`: using sourceMap or not. Support inline-sourceMap only
- `lessCompileOption`: you can using original less options here(like: plugins,compress...),excepts sourcemap, for more 
just see the [less docs](http://lesscss.org/usage/#programmatic-usage)

### Examples:

Just in this project's [examples folder](https://github.com/wujohns/less-modulesify/tree/master/examples)

## Licence  
MIT  