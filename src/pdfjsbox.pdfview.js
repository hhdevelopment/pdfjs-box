/* global _, PDFJS */
(function (ng, __, PDFJS) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfView', pdfView);
	/* @ngInject */
	function pdfView($document, pdfjsboxWatcherServices, pdfjsboxScaleServices, pdfjsboxDomServices) {
		var hasFocus = false;
		return {
			restrict: 'E',
			templateUrl: 'pdfview.html',
			transclude: true,
			controller: PdfViewCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngQuality': '=',
				'ngScale': '='
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				// Don't survey ngItem because, ngItem.items cause infinitive loop
				watcherClears.push(scope.$watchGroup(['ngItem.$$pdfid', 'ngItem.pageIdx', 'ngItem.rotate', 'ngScale', 'ngQuality'], function (vs1, vs2, s) {
					ctrl.showTransclude = true;
					updateView(s, elm, s.ngItem);
				}, true));
				scope.$on('$destroy', function () {
					elm.off('mouseenter', mouseenterOnElt);
					elm.off('mouseleave', mouseleaveOnElt);
					elm.off('click', clickOnElt);
					$document.off("click", clickOnDoc);
					$document.off("keydown", keydownOnDoc);
					// stop watching when scope is destroyed
					watcherClears.forEach(function (watcherClear) {
						watcherClear();
					});
				});
				elm.on('mouseenter', {scope:scope, ctrl:ctrl}, mouseenterOnElt);
				elm.on('mouseleave', {scope:scope, ctrl:ctrl}, mouseleaveOnElt);
				elm.on('click', {scope:scope, ctrl:ctrl}, clickOnElt);
				$document.on("click", {element:elm}, clickOnDoc);
				$document.on("keydown", {scope:scope, ctrl:ctrl}, keydownOnDoc);
			}
		};
		function clickOnDoc(event) {
			var elm = event.data.element;
			hasFocus = pdfjsboxDomServices.getElementFromJQueryElement(elm).contains(event.target);
		}
		function keydownOnDoc(event) {
			var scope = event.data.scope;
			var ctrl = event.data.ctrl;
			if (!hasFocus || event.which < 37 || event.which > 40)
				return;
			pdfjsboxDomServices.stopEvent(event);
			scope.$apply(function () {
				if (event.which === 38 || event.which === 37) {
					ctrl.previous();
				} else {
					ctrl.next();
				}
			});
		}
		function mouseenterOnElt(event) {
			var scope = event.data.scope;
			var ctrl = event.data.ctrl;
			scope.$apply(function () {
				ctrl.showTransclude = true;
			});
		}
		function mouseleaveOnElt(event) {
			var scope = event.data.scope;
			var ctrl = event.data.ctrl;
			scope.$apply(function () {
				ctrl.showTransclude = false;
			});
		}
		function clickOnElt(event) {
			var scope = event.data.scope;
			var ctrl = event.data.ctrl;
			scope.$apply(function () {
				if(window.getSelection().type !== 'Range') ctrl.showTransclude = !ctrl.showTransclude;
			});
		}
		function updateView(scope, elm, item) {
			if (item) {
				elm.addClass('notrendered');
				item.getPage().then(function (pdfPage) {
					drawPdfPageToView(scope, elm, pdfPage, item.rotate, true && scope.ngScale);
				});
			} else {
				drawPdfPageToView(scope, elm, null, null, false);
			}
		}
		/**
		 * Dessine la page du pdf dans elm, elm etant un pdf-view 
		 * @param {Angular Scope} scope
		 * @param {JQueryElement} pdfView
		 * @param {PDFPage} pdfPage
		 * @param {number} rotate
		 * @param {boolean} render
		 */
		function drawPdfPageToView(scope, pdfView, pdfPage, rotate, render) {
			var ctrl = scope.ctrl;
			clearTextLayer(pdfView);
			var ctx = getAndClearCanvasContext(pdfView);
			if (ctx) {
				scope.ngScale = fixScale(pdfPage, scope.ngScale, rotate, pdfView.height(), pdfView.width());
				if (pdfPage) {
					var quality = scope.ngQuality || 3;
					var viewport = getViewport(pdfPage, scope.ngScale, rotate);
					defineSizes(pdfView, viewport.width, viewport.height, quality);
					var viewport2 = getViewport(pdfPage, scope.ngScale * quality, rotate);
					pdfView.addClass('notrendered');
					if (render) {
						ctrl.readyToRender().then(function () {
							drawPageToCtx(ctrl, pdfView, pdfPage, viewport, viewport2, ctx);
						});
					}
				}
			}
		}

		/**
		 * fix l'echelle pour que la page ne soit pas plus petite que la zone
		 * @param {PDFPage} pdfPage
		 * @param {Number} scale
		 * @param {Number} rotate
		 * @param {Number} height
		 * @param {Number} width
		 * @returns {Number}
		 */
		function fixScale(pdfPage, scale, rotate, height, width) {
			var scaleRetains = scale || 1;
			if (pdfPage && pdfPage.view) {
				var rectangle = pdfjsboxScaleServices.getRectangle(pdfPage, rotate);
				var pageHeight = rectangle.height * scaleRetains;
				var pageWidth = rectangle.width * scaleRetains;
				if (pageHeight < height && pageWidth < width) { // la page est trop petite
					var s = scaleRetains / 0.9; // on agrandi la page
					var pageHeight = rectangle.height * s;
					var pageWidth = rectangle.width * s;
					if (pageHeight <= height && pageWidth <= width) {
						return s;
					}
				}
			}
			return scaleRetains;
		}
		/**
		 * Dessine la page dans le context du canvas
		 * @param {Angular Ctrl} ctrl
		 * @param {JQueryElement} pdfView
		 * @param {PDFPage} pdfPage
		 * @param {ViewPort} viewport
		 * @param {ViewPort} viewport2
		 * @param {CanvasContext} ctx
		 * @returns {Promise}
		 */
		function drawPageToCtx(ctrl, pdfView, pdfPage, viewport, viewport2, ctx) {
			return pdfPage.render({canvasContext: ctx, viewport: viewport2}).promise.then(function () {
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
			if (pdfPage) {
				var rot = pdfPage.pageInfo.rotate + (rotate || 0);
				return pdfPage.getViewport(scale || 1, rot);
			}
			return {width: 0, height: 0};
		}
		/**
		 * Definit la taille des different conteneurs : canvas, .page, .canvasWrapper, .textLayer
		 * @param {JQueryElement} pdfView
		 * @param {number} width
		 * @param {number} height
		 * @param {number} quality
		 */
		function defineSizes(pdfView, width, height, quality) {
			var pdfViewer = pdfView.find('.pdfViewer');
			pdfViewer.find('canvas').attr('width', width * quality).attr('height', height * quality).css('width', '100%').css('height', '100%');
			pdfViewer.find('.page,.canvasWrapper,.textLayer').css('width', width + 'px').css('height', height + 'px');
		}
		/**
		 * RAZ le context du canvas et le retourne
		 * @param {JQueryElement} pdfView
		 * @returns {CanvasContext}
		 */
		function getAndClearCanvasContext(pdfView) {
			var jcanvas = pdfView.find('.pdfViewer').find('canvas');
			var canvas = jcanvas.get(0);
			if (canvas) {
				var context = canvas.getContext('2d');
				context.clearRect(0, 0, canvas.width, canvas.height);
				return context;
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
		 * @param {scope} $scope
		 * @param {service} pdfjsboxItemServices
		 */
		function PdfViewCtrl($q, $scope, pdfjsboxItemServices) {
			var ctrl = this;
			ctrl.previous = previous;
			ctrl.next = next;
			var deferred = {defer: $q.defer()};
			ctrl.readyToRender = readyToRender;
			ctrl.setReadyToRender = setReadyToRender;
			ctrl.showTransclude = false;
			deferred.defer.resolve();

			/**
			 * set ngItem with previous item
			 */
			function previous() {
				$scope.ngItem = pdfjsboxItemServices.getPrevious($scope.ngItem);
			}
			/**
			 * set ngItem with next item
			 */
			function next() {
				$scope.ngItem = pdfjsboxItemServices.getNext($scope.ngItem);
			}
			function readyToRender() {
				return deferred.defer.promise.then(function () {
					deferred.defer = $q.defer();
				});
			}
			function setReadyToRender() {
				deferred.defer.resolve();
			}
		}
	}
})(angular, _, PDFJS);
