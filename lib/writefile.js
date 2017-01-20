/**
 * write str to a file.If the dir is not exist,create it
 */
'use strict';

const write = require('write');

/**
 * @param {String} outputPath - file path
 * @param {String} str - str which will be wrote into file
 * @param {Function} callback - callback function
 */
module.exports = (outputPath, str, callback) => {
    // if there is problem, try other way to achieve it.
    write(outputPath, str, callback);
};