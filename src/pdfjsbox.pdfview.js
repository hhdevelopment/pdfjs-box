(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
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
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'ngItem.pageIdx', 'ngItem.rotate', 'ngScale'], function (vs1, vs2, s) {
					updateView(s, s.ctrl, elm, s.ngItem, s.ngScale);
				}), true);
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateView(scope, ctrl, elm, scope.ngItem, scope.ngScale);
			}
		};
		function updateView(scope, ctrl, elm, item, scale) {
			if (item) {
				elm.addClass('notrendered');
				item.getPage().then(function (pdfPage) {
					drawPdfPageToView(ctrl, elm, pdfPage, item.rotate, scale, true && scale);
				});
			} else {
				drawPdfPageToView(ctrl, elm, null, null, scale, false);
			}
		}
		/**
		 * Dessine la page du pdf dans elm, elm etant un pdf-view 
		 * @param {type} ctrl
		 * @param {type} elm
		 * @param {type} pdfPage
		 * @param {type} rotate
		 * @param {type} scale
		 * @param {type} render
		 * return 
		 */
		function drawPdfPageToView(ctrl, elm, pdfPage, rotate, scale, render) {
			var canvas = elm.find('canvas').get(0);
			var textLayer = getAndclearTextLayer(elm);
			if (canvas) {
				var ctx = getAndclearCanvasContext(canvas);
				var viewport = getViewport(pdfPage, scale, rotate);
				defineSizes(elm, canvas, viewport);
				if (pdfPage) {
					elm.addClass('notrendered');
					if (render) {
						ctrl.readyToRender().then(function () {
							ctrl.setReadyToRender(false);
							drawPageToCtx(ctrl, elm, pdfPage, textLayer, viewport, ctx);
						});
					}
				}
			}
		}
		function drawPageToCtx(ctrl, elm, pdfPage, textLayer, viewport, ctx) {
			return pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.then(function () {
				elm.removeClass('notrendered');
				ctrl.setReadyToRender(true);
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
					});
				}
				return null;
			});
		}
		function getViewport(pdfPage, scale, rotate) {
			return pdfPage ? pdfPage.getViewport(scale || 1, rotate || 0) : {width: 0, height: 0};
		}
		function defineSizes(elm, canvas, viewport) {
			var page = elm.find('.page').get(0);
			var wrapper = elm.find('.canvasWrapper').get(0);
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
		}
		function getAndclearCanvasContext(canvas) {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			return ctx;
		}
		function getAndclearTextLayer(elm) {
			var textLayer = elm.find('.textLayer').get(0);
			if (textLayer) {
				textLayer.innerHTML = "";
			}
			return textLayer;
		}
		function PdfViewCtrl($q) {
			var ctrl = this;
			ctrl.document = null;
			ctrl.readyToRender = readyToRender;
			ctrl.setReadyToRender = setReadyToRender;
			var deferred = {defer:$q.defer()};
			function readyToRender() {
				return deferred.defer.promise;
			}
			function setReadyToRender(ready) {
				if(ready) {
					deferred.defer.resolve();
				} else {
					deferred.defer = $q.defer();
				}
			}
			deferred.defer.resolve();
		}
	}
})(angular, _, PDFJS, pdfjsLib);