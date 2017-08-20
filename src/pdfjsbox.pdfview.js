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
				// Don't survey ngItem because, ngItem.items cause infinitive loop
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'ngItem.pageIdx', 'ngItem.rotate', 'ngScale'], function (vs1, vs2, s) {
					updateView(s.ctrl, elm, s.ngItem, s.ngScale);
				}), true);
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateView(ctrl, elm, scope.ngItem, scope.ngScale);
			}
		};
		function updateView(ctrl, elm, item, scale) {
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
		 * @param {Angular Ctrl} ctrl
		 * @param {JQueryElement} pdfView
		 * @param {PDFPage} pdfPage
		 * @param {number} rotate
		 * @param {number} scale
		 * @param {boolean} render
		 */
		function drawPdfPageToView(ctrl, pdfView, pdfPage, rotate, scale, render) {
			clearTextLayer(pdfView);
			var ctx = getAndClearCanvasContext(pdfView);
			if (ctx) {
				var viewport = getViewport(pdfPage, scale, rotate);
				defineSizes(pdfView, viewport.width, viewport.height);
				if (pdfPage) {
					pdfView.addClass('notrendered');
					if (render) {
						ctrl.readyToRender().then(function () {
							drawPageToCtx(ctrl, pdfView, pdfPage, viewport, ctx);
						});
					}
				}
			}
		}
		/**
		 * Dessine la page dans le context du canvas
		 * @param {Angular Ctrl} ctrl
		 * @param {JQueryElement} pdfView
		 * @param {PDFPage} pdfPage
		 * @param {ViewPort} viewport
		 * @param {CanvasContext} ctx
		 * @returns {Promise}
		 */
		function drawPageToCtx(ctrl, pdfView, pdfPage, viewport, ctx) {
			return pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.then(function () {
				pdfView.removeClass('notrendered');
				ctrl.setReadyToRender(); // emulate mutex unlock
				var textLayer = pdfView.find('.textLayer').get(0);
				if (textLayer) {
					return pdfPage.getTextContent().then(function (textContent) {
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
		/**
		 * 
		 * @param {PDFPage} pdfPage
		 * @param {number} scale
		 * @param {number} rotate
		 * @returns {ViewPort or Object support width and height}
		 */
		function getViewport(pdfPage, scale, rotate) {
			return pdfPage ? pdfPage.getViewport(scale || 1, rotate || 0) : {width: 0, height: 0};
		}
		/**
		 * Definit la taille des different conteneurs : canvas, .page, .canvasWrapper, .textLayer
		 * @param {JQueryElement} pdfView
		 * @param {number} width
		 * @param {number} height
		 */
		function defineSizes(pdfView, width, height) {
			pdfView.find('canvas').attr('width', width).attr('height', height);
			pdfView.find('.page,.canvasWrapper,.textLayer').css('width', width + 'px').css('height', height + 'px');
		}
		/**
		 * RAZ le context du canvas et le retourne
		 * @param {JQueryElement} pdfView
		 * @returns {CanvasContext}
		 */
		function getAndClearCanvasContext(pdfView) {
			var canvas = pdfView.find('canvas').get(0);
			if(canvas) {
				var ctx = canvas.getContext('2d');
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				return ctx;
			}
			return null;
		}
		/**
		 * RAZ le calque du texte
		 * @param {JQueryElement} pdfView
		 */
		function clearTextLayer(pdfView) {
			var textLayer = pdfView.find('.textLayer').get(0);
			if (textLayer) {
				textLayer.innerHTML = "";
			}
		}
		/**
		 * Controller
		 * @param {angular $q} $q
		 */
		function PdfViewCtrl($q) {
			var ctrl = this;
			var deferred = {defer: $q.defer()};
			ctrl.readyToRender = readyToRender;
			ctrl.setReadyToRender = setReadyToRender;
			deferred.defer.resolve();

			function readyToRender() {
				return deferred.defer.promise.then(function() {
					deferred.defer = $q.defer();
				});
			}
			function setReadyToRender() {
				deferred.defer.resolve();
			}
		}
	}
})(angular, _, PDFJS, pdfjsLib);