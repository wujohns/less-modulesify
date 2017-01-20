/**
 * After less was compiled，using postcss to support the css-modules feature
 */
'use strict';

const _ = require('lodash');
const Lmify = require('./lib/lmify');

/**
 * used as browserify plugin
 * @param {Object} browserify - browserify Object
 * @param {Object} options - the plugin options
 * @param {Boolean} options.sourceMap - using sourcemap feature, default false
 * @param {String} options.outputDir - output css file's folder, default using inline-style
 * @param {Object} options.lessCompileOption - less compile options which is same as original less excepts sourcemap
 */
module.exports = (browserify, options) => {
    browserify.transform(
        (filename, options) => new Lmify(filename, options),
        {
            outputDir: _.get(options, 'outputDir', false),
            sourceMap: _.get(options, 'sourceMap', false),
            lessCompileOption: _.get(options, 'lessCompileOption', {})
        }
    );

    // TODO if it's nessesary, using browserify's pipeline feature to add more.
    return browserify;
};