'use strict';

const _ = require('lodash');
const async = require('async');
const path = require('path');
const less = require('less');
const postcss = require('postcss');
const postcssModules = require('postcss-modules');
const Transform = require('stream').Transform;
const writeFile = require('./writefile');

class Lmify extends Transform {
    /**
     * init
     * @param {String} filename - the source file's name
     * @param {Object} options - the options from browserify.transform
     * @param {Object} options.lessCompileOption - the less compile options
     */
    constructor (filename, options) {
        super();
        this._filename = filename;
        this._outputDir = options.outputDir;
        this._lessCompileOption = _.defaults({}, options.lessCompileOption, {
            filename: this._getLessFilename(),
            sourceMap: false
        });

        if (options.sourceMap) {
            this._lessCompileOption.sourceMap = {
                sourceMapFileInline: true
            };
        }
    }

    /**
     * transforming for less file. Currently only support inline style
     * @param {String} chunk - the content of the required file
     * @param {String} enc - encoding of the file
     * @param {Function} callback - callback function
     */
    _transform (chunk, enc, callback) {
        if (!/\.css$|\.less$/.test(this._filename)) {
            this.push(chunk);
            return callback();
        }

        // _.set(this._lessCompileOption, 'filename', this._getLessFilename());
        async.auto({
            // compile less
            compileLess: (callback) => {
                less.render(chunk.toString(), this._lessCompileOption, callback);
            },
            // using postcss to support the css-module feature
            cssModule: ['compileLess', (results, callback) => {
                const lessOutput = results.compileLess;
                const postcssCompileOption = this._getPostcssCompileOption();

                let postcssJson;
                postcss([
                    postcssModules({
                        getJSON: (cssFileName, json) => {
                            postcssJson = json;
                        }
                    })
                ])
                .process(lessOutput.css, postcssCompileOption)
                .then((processResult) => {
                    return callback(null, {
                        css: processResult.css,
                        json: postcssJson
                    });
                });
            }],
            // get ths chunk and write the output file(if outputDir is set)
            getChunk: ['cssModule', (results, callback) => {
                const css = results.cssModule.css;
                const json = results.cssModule.json;
                const outputFilePath = this._getOutputFilePath();
                let newChunk = `module.exports = ${ JSON.stringify(json) };`;
                if (!outputFilePath) {
                    newChunk += `
                        (function() {
                            var head = document.getElementsByTagName('head')[0];
                            var link = document.createElement('link');
                            link.rel = 'stylesheet';
                            link.type = 'text/css';
                            link.href = 'data:text/css;base64,${ new Buffer(css).toString('base64') }'
                            head.appendChild(link);
                        }())
                    `;
                    return callback(null, newChunk);
                }
                writeFile(outputFilePath, css, (err) => {
                    return callback(err, newChunk);
                });
            }]
        }, (err, results) => {
            this.push(results.getChunk);
            return callback(err);
        });
    }

    /**
     * flush which is called after transform finished
     * @param {Function} callback
     */
    _flush (callback) {
        return callback();
    }

    /**
     * transform less compile options to postcss compile options.Main for sourcemap
     * @return {Object} the options for postcss's compiling
     */
    _getPostcssCompileOption () {
        const enableSouceMap = _.get(this._lessCompileOption, 'sourceMap.sourceMapFileInline');
        const postcssOptions = {};

        if (enableSouceMap) {
            _.set(postcssOptions, 'map.inline', true);
        }
        return postcssOptions;
    }

    /**
     * get the output css file's fullpath
     * @return {String} the path
     */
    _getOutputFilePath () {
        if (!this._outputDir) {
            return false;
        }

        const extname = path.extname(this._filename);
        const basename = path.basename(this._filename, extname);
        const outputFilePath = path.join(this._outputDir, `${ basename }.css`);
        return outputFilePath;
    }

    /**
     * get the filename for less rendering
     * @return {String} the filename
     */
    _getLessFilename () {
        if (!this._outputDir) {
            return this._filename;
        }
        return path.relative(this._outputDir, this._filename);
    }
}

module.exports = Lmify;