(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfDocscale', pdfDocscale);
	/* @ngInject */
	function pdfDocscale(pdfjsboxWatcherServices) {
		return {
			restrict: 'E',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngScale': '=',
				'docScale': '=',
				'pdfviewSelector': '@'
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'docScale'], function (vs1, vs2, s) {
//					if (vs1[0] && s.ctrl.document !== vs1[0]) {
						computeScale(s, elm, s.ngItem, s.docScale, s.pdfviewSelector);
//					}
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
			}
		};
		function computeScale(scope, elm, item, docScale, pdfviewSelector) {
			if(!docScale || !item) {
				return;
			}
			item.getPage().then(function (pdfPage) {
				if (!isNaN(docScale)) {
					scope.ngScale = docScale;
				} else {
					var view = pdfPage.view;
					if(!view) {
						scope.ngScale = 1;
						return;
					}
					var container;
					if (pdfviewSelector) {
						container = ng.element(pdfviewSelector);
						if (!container) {
							scope.ngScale = 1;
							console.log('"docScale" feature : Cannot find \'%s\' selector of \'pdf-view\'. set an other value of attribute \'pdfview-selector\' or Transclude \'pdf-docscale\' in \'pdf-view\'', pdfviewSelector);
							return;
						}
					} else {
						container = elm.parents('pdf-view');
					}
					if (!container) {
						scope.ngScale = 1;
						console.log('"docScale" feature : Transclude \'pdf-docscale\' in \'pdf-view\' or set \'pdfview-selector\' attribute on \'pdf-docscale\' with selector of \'pdf-view\' value');
						return;
					}
					if (docScale === 'fitV') {
						var height = container.height();
						var pageHeight = view[3] - view[1];
						scope.ngScale = (height || pageHeight) / pageHeight;
					} else if (docScale === 'fitH') {
						var width = container.width();
						var pageWidth = view[2] - view[0];
						scope.ngScale = (width || pageWidth) / pageWidth;
					} else {
						console.log('docScale feature : \'%s\' is not good value for doc-scale, set with \'fitH\' or \'fitV\' or float', docScale);
					}
				}
			});
		}
	}
})(angular, _);