/* eslint-disable @typescript-eslint/no-var-requires */
const path = require("path");
const webpack = require("webpack");
const dotenv = require("dotenv");

const parseENV = () => {
    const loadedEnv = dotenv.config().parsed;
    const env = {};
    Object.keys(loadedEnv).forEach((eachEnvKey) => {
        env[eachEnvKey] = JSON.stringify(loadedEnv[eachEnvKey]);
    });
    return env;
};

const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");

module.exports = {
    target: "webworker",
    mode: process.env.NODE_ENV || "development",
    entry: { bundle: path.join(__dirname, "./src/index.ts") },
    devtool: process.env.NODE_ENV != "production" ? "cheap-module-source-map" : false,
    resolve: {
        extensions: [".mjs", ".json", ".ts", ".js"],
        symlinks: false,
        cacheWithContext: false,
    },
    module: {
        rules: [
            // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
            {
                test: /\.(tsx?)$/,
                loader: "ts-loader",
                exclude: [[path.resolve(__dirname, "node_modules"), path.resolve(__dirname, "dist")]],
                options: {
                    transpileOnly: true,
                    experimentalWatchApi: true,
                },
            },
        ],
    },
    plugins: [
        new webpack.DefinePlugin({ "process.env": parseENV() }),
        new ForkTsCheckerWebpackPlugin({
            eslint: true,
            eslintOptions: {
                cache: false,
            },
        }),
    ],
};
