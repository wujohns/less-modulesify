'use strict';

const fs = require('fs');
const path = require('path');
const mocha = require('mocha');
const should = require('chai').should();
const browserify = require('browserify');
const lessModulesify = require('../index');

describe('compile', () => {
    it('inline-css', (done) => {
        const b = browserify();
        b.add(path.join(__dirname, './main.js'));
        b.plugin(lessModulesify, {});
        b.bundle((err, buf) => {
            should.not.exist(err);
            should.exist(buf);
            return done();
        });
    });

    it('output-css', (done) => {
        const b = browserify();
        b.add(path.join(__dirname, './main.js'));
        b.plugin(lessModulesify, {
            outputDir: path.join(__dirname, './')
        });
        b.bundle((err, buf) => {
            should.not.exist(err);
            should.exist(buf);
            done();
        });
    });

    it('hasSourcemap', (done) => {
        const b = browserify();
        b.add(path.join(__dirname, './main.js'));
        b.plugin(lessModulesify, {
            sourceMap: true
        });
        b.bundle((err, buf) => {
            should.not.exist(err);
            should.exist(buf);
            done();
        });
    });

    after((done) => {
        fs.unlink(path.join(__dirname, './styles.css'), (err) => {
            should.not.exist(err);
            return done();
        });
    });
});