(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch(e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfView', pdfView);
	/* @ngInject */
	function pdfView(pdfjsboxWatcherServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfview.html',
			transclude: true,
			controller: PdfViewCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '<',
				'ngScale': '='
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'ngItem.pageIdx', 'ngItem.rotate'], function (vs1, vs2, s) {
					updateView(s, s.ctrl, elm, s.ngItem, s.ngScale);
				}), true);
				watcherClears.push(scope.$watch('ngScale', function (v1, v2, s) {
					updateView(s, s.ctrl, elm, s.ngItem, s.ngScale);
				}), false);
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateView(scope, ctrl, elm, scope.ngItem, scope.ngScale);
			}
		};
		function updateView(scope, ctrl, elm, item, scale) {
			elm.addClass('notrendered');
			if (item) {
				item.getPage().then(function (pdfPage) {
					drawPdfPageToView(elm, pdfPage, item.rotate, scale, true && scale);
				});
			} else {
				drawPdfPageToView(elm, null, null, scale, false);
			}
		}
		/**
		 * Dessine la page du pdf dans elm, elm etant un pdf-view 
		 * @param {type} elm
		 * @param {type} pdfPage
		 * @param {type} rotate
		 * @param {type} scale
		 * @param {type} render
		 * return 
		 */
		function drawPdfPageToView(elm, pdfPage, rotate, scale, render) {
			var canvas = elm.find('canvas').get(0);
			var page = elm.find('.page').get(0);
			var textLayer = elm.find('.textLayer').get(0);
			var wrapper = elm.find('.canvasWrapper').get(0);
			if (textLayer) {
				textLayer.innerHTML = "";
			}
			if (canvas) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				var viewport = pdfPage ? pdfPage.getViewport(scale, rotate || 0) : {width: 0, height: 0};
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				if (page) {
					page.style.width = viewport.width + 'px';
					page.style.height = viewport.height + 'px';
				}
				if (wrapper) {
					wrapper.style.width = viewport.width + 'px';
					wrapper.style.height = viewport.height + 'px';
				}
				if (pdfPage) {
					if (render) {
						pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.then(function () {
							elm.removeClass('notrendered');
							if (textLayer) {
								textLayer.style.width = viewport.width + 'px';
								textLayer.style.height = viewport.height + 'px';
								pdfPage.getTextContent().then(function (textContent) {
									PDFJS.renderTextLayer({
										textContent: textContent,
										container: textLayer,
										viewport: viewport,
										textDivs: []
									});
									page.classList.remove('loading');
								});
							}
						});
						//return renderTask.promise;
					} else {
						elm.addClass('notrendered');
					}
				}
			}
			return null;
		}
		function PdfViewCtrl() {
			var ctrl = this;
			ctrl.document = null;
		}
	}
})(angular, _, PDFJS, pdfjsLib);