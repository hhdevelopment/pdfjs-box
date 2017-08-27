(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch(e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.run(config);
	/* @ngInject */
	function config($templateCache, pdfjsConfig) {
		if (pdfjsConfig.workerSrc) {
			PDFJS.workerSrc = pdfjsConfig.workerSrc;
		} else {
			PDFJS.disableWorker = true;
		}
		$templateCache.put('pdfthumbnails.html', require('./pdfthumbnails.html'));
		$templateCache.put('pdfthumbnail.html', require('./pdfthumbnail.html'));
		$templateCache.put('pdfview.html', require('./pdfview.html'));
		$templateCache.put('pdfcommands.html', require('./pdfcommands.html'));
	}
})(angular, _, PDFJS, pdfjsLib);