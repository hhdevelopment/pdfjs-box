# PDFJS-BOX : include easyly pdfjs in your angular application

[![npm version](https://img.shields.io/npm/v/pdfjs-box.svg)](https://www.npmjs.com/package/pdfjs-box)
[![Build Status](https://travis-ci.org/hhdevelopment/pdfjs-box.svg?branch=master)](https://travis-ci.org/hhdevelopment/pdfjs-box)

pdfjs-box is a collection of angular directives for include easily pdfjs in angular 1.x application.

[Demo](https://hhdevelopment.github.io/pdfjs-box)

## Directives 

~~~~    
<pdf-document pdf ng-items></pdf-document>
<pdf-thumbnails ng-height ng-items removable allow-drag allow-drop selected-item placeholder></pdf-thumbnails>
<pdf-view ng-item ng-scale ng-quality></pdf-view>
<pdf-docscale ng-item ng-scale allow-print></pdf-docscale>
<pdf-commands ng-item pdfview-selector doc-scale ng-scale ng-quality></pdf-commands>
~~~~    

  - pdf-document : from your document object implementation, computes the url to get pdf and supplies the items collections for other components   
	 items collection describe each page of document.

  - pdf-thumbnails : is the deck for view thumbnails of pdf-document : it consumes items from pdf-documents. it supplies an item : selected-item

  - pdf-view : is a deck for view current item supplied by pdf-thumbnails.

  - pdf-docscale is the supplier for compute default scale for each document

  - pdf-commands, is a commands panels

## Usage 

* Installation

~~~~    
npm install pdfjs-box -save
~~~~    

* Dependencies

  * angularjs 1.x
  * bootstrap 3.x
  * pdfjs 1.x
  * lodash

* Add files to your build (webpack, gulp...)

~~~~    
node_modules/pdfjs-box/dist/pdfjsbox.js
node_modules/pdfjs-box/dist/pdfjsbox.css   
~~~~    

With require : in your main module : 

~~~~    
require('pdfjs-box/dist/pdfjsbox.js');
require('pdfjs-box/dist/pdfjsbox.css');
~~~~    


* webpack.

If you use scoped bundle as webback, you have to expose PDFJS Api to your application   
For that use ProvidePlugin.   
In this following example I expose lodash, jquery and PDFJS.   

~~~~   
...  
	},
	plugins: [
		new webpack.ProvidePlugin({
			_: 'lodash',
			'window.jQuery': 'jquery',
			'jQuery': 'jquery',
			'$': 'jquery',
			'PDFJS': 'pdfjs-dist'
		}),   
...  
~~~~    

* Configuration

1. Add module to your angular application

~~~~
  angular.module("YourApp", [..., 'pdfjs-box', ...]);
~~~~

2. Configure pdfjs and pdfjsbox

PDFjs needs worker (it is recomanded, more efficient).   
For use it, you have to expose it directly in the path of your web application. Available/reachable from an url so. 
But becarefull, worker can't be bundled in the vendors ou app bundles, it must be bundle in separate bundle 
So if you use webpack or other bundler, you have to add pdfjs worker bundle in the path.   

This is my solution for webpack.

~~~~
return [{
		context: __dirname,
		entry: {
			'pdf.worker.bundle.js': 'pdfjs-dist/build/pdf.worker.entry'
		},
		output: {
			filename: '[name]',
			path: path.resolve(__dirname, 'public_html')
		},
		plugins: [new webpack.optimize.UglifyJsPlugin({compressor: {screw_ie8: true, warnings: false}})]
	},
~~~~
Now you can add it with constant 'pdfjsConfig'

~~~~
angular.module("YourApp", [..., 'pdfjs-box', ...]).  
    constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', preloadRecursivePages:7 } )
~~~~

workerSrc : path for worker.
preloadRecursivePages : configure balance between preload recursive or sequency. Set value with number of thumbnails visible by default.

3. Add fontmaps : cmap

Some pdf use specifics fonts. For it, PDFJS needs cmap.
These cmap are include in pdfjs src : './node_modules/pdfjs-dist/cmaps/*'
Include them in your build

With webpack 2+

~~~~
const cmapPath = './node_modules/pdfjs-dist/cmaps';
...
	return [{
		entry: () => new Promise((resolve) => fs.readdir(cmapPath, function(e, files) {
			resolve(files.map(function(file) {return cmapPath+'/'+file;}));
		})),
		output: {
			filename: '[name]',
			path: path.resolve(__dirname, 'public_html')
		},
		module: {
			rules: [{test: /\.(bcmap)$/, use: [{loader: 'file-loader', options: {name: 'cmaps/[name].[ext]'}}]}]
		}
	}, {

~~~~
Now you can add it with constant 'pdfjsConfig'

~~~~
angular.module("YourApp", [..., 'pdfjs-box', ...]).  
    constant('pdfjsConfig', { cMapUrl:'cmaps/', cMapPacked:true } )
~~~~

cMapUrl : the relative url in your site.
cMapPacked : Set true if you use bcmap include in pdfjs

4. Add directives to your html

