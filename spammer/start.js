
require('babel-polyfill');
require('babel-register')({
    presets: ['env']
});

module.exports = require('./spammer.js')