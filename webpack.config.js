const path = require('path');

module.exports = {
    entry: "./main.js",
    target: 'node',
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "bundle.js"
    }
};
