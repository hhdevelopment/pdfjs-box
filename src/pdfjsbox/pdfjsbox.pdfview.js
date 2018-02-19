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
	function pdfView(pdfjsboxWatcherServices, pdfjsboxScaleServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfview.html',
			transclude: true,
			controller: PdfViewCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngScale': '='
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				// Don't survey ngItem because, ngItem.items cause infinitive loop
				watcherClears.push(scope.$watchGroup(['ngItem.$$pdfid', 'ngItem.pageIdx', 'ngItem.rotate', 'ngScale'], function (vs1, vs2, s) {
					ctrl.showTransclude = true;
					updateView(s, elm, s.ngItem);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateView(scope, elm, scope.ngItem);
				elm.on('mouseenter', function(event) {
					scope.$apply(function () {
						ctrl.showTransclude = true;
					});
				});
				elm.on('click', function(event) {
					scope.$apply(function () {
						ctrl.showTransclude = !ctrl.showTransclude;
					});
				});
				var hasFocus = false;
				ng.element(document).on("click", function (event) {
					hasFocus = elm[0].contains(event.target);
				});
				ng.element(document).on("keydown", function (event) {
					if (!hasFocus || event.which < 37 || event.which > 40)
						return;
					event.stopPropagation();
					event.preventDefault();
					scope.$apply(function () {
						if (event.which === 38 || event.which === 37) {
							ctrl.previous();
						} else {
							ctrl.next();
						}
					});
				});
			}
		};
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
				var viewport = getViewport(pdfPage, scope.ngScale, rotate);
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
		 */
		function defineSizes(pdfView, width, height) {
			pdfView.find('canvas').attr('width', width).attr('height', height);
			pdfView.find('canvas').css('width', '100%').css('height', '100%');
			pdfView.find('.page,.canvasWrapper,.textLayer').css('width', width + 'px').css('height', height + 'px');
		}
		/**
		 * RAZ le context du canvas et le retourne
		 * @param {JQueryElement} pdfView
		 * @returns {CanvasContext}
		 */
		function getAndClearCanvasContext(pdfView) {
			var jcanvas = ng.element("<canvas></canvas>");
			pdfView.find('canvas').replaceWith(jcanvas);
			var canvas = jcanvas.get(0);
			if (canvas) {
				return canvas.getContext('2d');
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
				if ($scope.ngItem) {
					var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
					if (idx > 0) {
						$scope.ngItem = $scope.ngItem.items[idx - 1];
					}
				}
			}
			/**
			 * set ngItem with next item
			 */
			function next() {
				if ($scope.ngItem) {
					var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
					if (idx < $scope.ngItem.items.length - 1) {
						$scope.ngItem = $scope.ngItem.items[idx + 1];
					}
				}
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