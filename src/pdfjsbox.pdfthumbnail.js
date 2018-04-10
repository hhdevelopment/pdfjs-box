/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfThumbnail', pdfThumbnail);
	/* @ngInject */
	function pdfThumbnail(pdfjsboxDrawServices, pdfjsboxSemServices, pdfjsboxScaleServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnail.html',
			controller: PdfThumbnailCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '<' // un item portant le pdfDocument, l'index de la page, l'angle de rotation
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				var height = Math.max(elm.parent().height() - 4, 0) || 100; 
				watcherClears.push(scope.$watchGroup(['ngItem.$$pdfid', 'ngItem.pageIdx', 'ngItem.rotate'], function (vs1, vs2, s) {
					if(vs1[0] !== vs2[0] || vs1[1] !== vs2[1] || vs1[2] !== vs2[2]) {
						updateNgItem(s);
					}
				}, true));
				scope.$on('$destroy', function () {
					if(scope.renderTask) {
						scope.renderTask.cancel();
						scope.renderTask = null;
					}
					elm.empty();
					watcherClears.forEach(function (watcherClear) {
						watcherClear();
					});
				});
				updateNgItem(scope);
				function updateNgItem(s) {
					elm.addClass('notrendered');
					var jcanvas = elm.find("canvas");
					drawItemInCanvas(s, s.ngItem, jcanvas.get(0), height).then(function() {
						elm.removeClass('notrendered');
					});
				}
			}
		};
		/**
		 * Dessine l'item dans le canvas
		 * @param {Angular Scope} scope
		 * @param {Item} item
		 * @param {HTMLElement} canvas
		 * @param {number} height
		 * @returns promise
		 */
		function drawItemInCanvas(scope, item, canvas, height) {
			if(scope.renderTask) {
				scope.renderTask.cancel();
				scope.renderTask = null;
			}
			if (canvas) {
				canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height); // on efface l'ancien dessin
				setCanvasSize(canvas, height * 0.7, height, 1); // on met un ration format A4
				return pdfjsboxSemServices.acquire("pdfthmbnail").then(function() {
					return item.getPage().then(function (pdfPage) {
						var rectangle = pdfjsboxScaleServices.getRectangle(pdfPage, item.rotate);
						var scale = height / rectangle.height;
						var ratio = rectangle.width / rectangle.height;
						var quality = 2;
						setCanvasSize(canvas, height * ratio, height, quality);
						scope.renderTask = pdfjsboxDrawServices.drawPdfPageToCanvas(canvas, pdfPage, item.rotate, scale * quality);
						return scope.renderTask.then(function() {
							pdfjsboxSemServices.release("pdfthmbnail");
						}, function() {
							pdfjsboxSemServices.release("pdfthmbnail");
						});
					});
				});
			}
			return {then:function() {}};
		}
		/**
		 * 
		 * @param {HTMLElement} canvas
		 * @param {number} width
		 * @param {number} height
		 * @param {number} quality
		 */
		function setCanvasSize(canvas, width, height, quality) {
			canvas.setAttribute("width", width * quality);
			canvas.setAttribute("height", height * quality);
			canvas.style.width = width+"px";
			canvas.style.height = height+"px";
		}
		/**
		 * Angular Controller
		 * @param {Angular Scope} $scope
		 * @param {type} pdfjsboxDomServices
		 * @returns {undefined}
		 */
		function PdfThumbnailCtrl($scope, pdfjsboxDomServices) {
			var ctrl = this;
			ctrl.switchThumbnailSelected = switchThumbnailSelected;
			ctrl.removeThumbnail = removeThumbnail;
			/**
			 * handler de la checkbox, stop la propagation de l'event
			 * @param {ClickEvent} evt
			 */
			function switchThumbnailSelected(evt) {
				pdfjsboxDomServices.stopEvent(evt);
			}
			/**
			 * Click sur la croix pour remove l'item
			 * @param {ClickEvent} evt
			 */
			function removeThumbnail(evt) {
				pdfjsboxDomServices.stopEvent(evt);
				var idx = $scope.ngItem.items.indexOf($scope.ngItem);
				$scope.ngItem.items.splice(idx, 1);
			}
		}
	}
})(angular, _);
