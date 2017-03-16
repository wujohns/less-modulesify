'use strict';

const _ = require('lodash');
const async = require('async');
const path = require('path');
const globby = require('globby');
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
        this._transformExclude = this._isExcluded(options.transformExclude);
        this._modulesifyExcluded = this._isExcluded(options.modulesifyExclude);
        this._outputDir = options.outputDir;
        this._sourceMap = options.sourceMap;
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
        // do nothing when the file is not style file or has been compiled by lmify
        if (!/\.css$|\.less$/.test(this._filename) || chunk.lmifyHasBuild || this._transformExclude) {
            this.push(chunk);
            return callback();
        }

        async.auto({
            // compile less
            compileLess: (callback) => {
                less.render(chunk.toString(), this._lessCompileOption, callback);
            },
            // using postcss to support the css-module feature
            cssModule: ['compileLess', (results, callback) => {
                const lessOutput = results.compileLess;

                if (this._modulesifyExcluded) {
                    return callback(null, {
                        css: lessOutput.css,
                        json: {}
                    });
                }

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
                    if (this._sourceMap) {
                        // The target file size will be bigger for supportting sourceMap feature
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
                    } else {
                        newChunk += `
                            (function() {
                                var head = document.getElementsByTagName('head')[0];
                                var style = document.createElement('style');
                                style.type = 'text/css';
                                var css = ${ JSON.stringify(css) };
                                if (style.styleSheet) {
                                    style.styleSheet.cssText = css;
                                } else {
                                    style.appendChild(document.createTextNode(css));
                                }
                                head.appendChild(style);
                            }())
                        `;
                    }
                    return callback(null, newChunk);
                }
                writeFile(outputFilePath, css, (err) => {
                    return callback(err, newChunk);
                });
            }]
        }, (err, results) => {
            if (err) {
                throw err;
                return callback(err);
            }
            const targetChunk = Buffer.from(results.getChunk);
            targetChunk.lmifyHasBuild = true;
            this.push(targetChunk);
            return callback();
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
     * the file is excluded or not
     * @param {Array} the file to exclude
     * @return {Boolean}
     */
    _isExcluded (exclude) {
        let isExcluded = false;
        if (_.isEmpty(exclude)) {
            return isExcluded;
        }
        const excludedFiles = globby.sync(exclude);
        _.forEach(excludedFiles, (filePath) => {
            const absolutePath = path.join(process.cwd(), filePath);
            if (_.includes(this._filename, absolutePath)) {
                isExcluded = true;
                return false;
            }
            return true;
        });
        return isExcluded;
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