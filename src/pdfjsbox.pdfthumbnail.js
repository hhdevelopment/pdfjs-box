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
	function pdfThumbnail(pdfjsboxWatcherServices, pdfjsboxDrawServices, pdfjsboxDomServices, pdfjsboxScaleServices) {
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
				watcherClears.push(scope.$watchGroup(['ngItem.rotate'], function (vs1, vs2, s) {
					elm.addClass('notrendered');
					updateNgItem(s, elm, s.ngItem);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
			}
		};
		/**
		 * Mise à jour de l'item du thumbnail
		 * @param {Angular scope} scope
		 * @param {JQueryElement} pdfThumbnailElm
		 * @param {Item} item
		 */
		function updateNgItem(scope, pdfThumbnailElm, item) {
			if (item) {
				var thumbnail = pdfjsboxDomServices.getElementFromJQueryElement(pdfThumbnailElm);
				thumbnail.item = item;
				drawPage(pdfThumbnailElm, item);
			}
		}
		function drawPage(pdfThumbnailElm, item) {
			var height = Math.max(pdfThumbnailElm.parent().height() - 4, 0) || 100; 
			var oldcanvas = pdfThumbnailElm.find("canvas");
			oldcanvas.attr('width', height * 0.7).attr('height', height).css('width', height * 0.7+'px').css('height', height +'px');
			item.getPage().then(function (pdfPage) {
				var rectangle = pdfjsboxScaleServices.getRectangle(pdfPage, item.rotate);
				var scale = height / rectangle.height;
				var ratio = rectangle.width / rectangle.height;
				var quality = 2;
				var jcanvas = ng.element("<canvas draggable='true'></canvas>");
				jcanvas.attr('width', height * ratio * quality).attr('height', height * quality).css('width', height * ratio+'px').css('height', height +'px');
				pdfThumbnailElm.find('canvas').replaceWith(jcanvas);
				var canvas = jcanvas.get(0);
				pdfjsboxDrawServices.drawPdfPageToCanvas(canvas, pdfPage, item.rotate, scale * quality).then(function () {
					pdfThumbnailElm.removeClass('notrendered');
				});
			});
		}
		/**
		 * Angular Controller
		 * @param {type} $scope
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
