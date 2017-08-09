var ExtractTextPlugin = require('extract-text-webpack-plugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var CleanObsoleteChunks = require('webpack-clean-obsolete-chunks');
var CleanWebpackPlugin = require('clean-webpack-plugin');
var webpack = require('webpack');
var path = require('path');

module.exports = function (env) {
	return [{
			context: __dirname,
			entry: {
				'pdf.worker': 'pdfjs-dist/build/pdf.worker.entry'
			},
			output: {
				filename: '[name].bundle.js',
				path: path.resolve(__dirname, 'public_html')
			},
			plugins: [
				new webpack.optimize.UglifyJsPlugin({
					compressor: {
						screw_ie8: true,
						warnings: false
					}
				})
			]
		}, {
			context: __dirname + '/src',
			entry: {
				main: './index.js'
			},
			output: {
				filename: '[name].[chunkhash].js',
				path: path.resolve(__dirname, 'public_html')
			},
			module: {
				rules: [
					{
						test: /\.css$/,
						use: ExtractTextPlugin.extract({
							use: 'css-loader'
						})
					}, {
						test: /\.(png|svg|jpg|gif)$/,
						use: [
							'file-loader'
						]
					}, {
						test: /\.html$/,
						use: [
							'angular-templatecache-loader'
						]
					}, {
						test: /\.(woff|woff2|eot|ttf|otf)$/,
						use: [
							'file-loader'
						]
					}, {
						test: /\.(csv|tsv)$/,
						use: 'csv-loader'
					}, {
						test: /\.xml$/,
						use: 'xml-loader'
					}
				]
			},
			plugins: [
				new webpack.ProvidePlugin({
					_: 'lodash',
					'window.jQuery': 'jquery',
					'jQuery': 'jquery',
					'$': 'jquery',
					'pdfjsLib': 'pdfjs-dist'
				}),
				new ExtractTextPlugin('[name].css'),
				new webpack.optimize.CommonsChunkPlugin({
					name: 'vendor',
					minChunks: function (module) {
						// this assumes your vendor imports exist in the node_modules directory
						return module.context && module.context.indexOf('node_modules') !== -1;
					}
				}),
				new HtmlWebpackPlugin({
					template: './index.ejs'
				}),
//				new CleanWebpackPlugin(['public_html'], {root: __dirname,verbose: true,dry: false,watch: true,exclude: [ 'document.pdf', 'document2.pdf', 'UnicodeStandard.pdf', 'pdf.worker.bundle.js' ] }),
				new CleanObsoleteChunks({verbose: true})
			]
		}];
};

