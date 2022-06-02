const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlInlineScriptWebpackPlugin = require("html-inline-script-webpack-plugin");

const entry = {
    index: "./view/index.tsx",
    test: "./view/aaaa.tsx"
};

module.exports = {
    mode: "production",
    entry,
    output: {
        filename: "[name].js"
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
            },
        ],
    },
    resolve: {
        extensions: [
            ".tsx", ".ts", ".jsx", ".js",
        ],
    },
    plugins: [
        ...Object.entries(entry).map(([chunk, filename]) =>
            new HtmlWebpackPlugin({
                filename: `${chunk}.html`,
                template: path.join(__dirname, "template.html"),
                chunks: [chunk],
                minify: false,
            })),
        ...Object.entries(entry).map(([chunk, filename]) =>
            new HtmlInlineScriptWebpackPlugin({
                htmlMatchPattern: [`${chunk}.html`],
            })),
    ]
}
