/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch(e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfThumbnail', pdfThumbnail);
	/* @ngInject */
	function pdfThumbnail(pdfjsboxWatcherServices, pdfjsboxDrawServices, pdfjsboxDomServices) {
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
			if(item) {
				var thumbnail = pdfjsboxDomServices.getElementFromJQueryElement(pdfThumbnailElm);
				thumbnail.item = item;
				drawPage(pdfThumbnailElm, item);
			}
		}
		function drawPage(pdfThumbnailElm, item) {
			var height = (pdfThumbnailElm.parent().height() -  4) || 100; // 20px en moins pour le padding 10 autour, - 4 pour la scrollbar
			item.getPage().then(function (pdfPage) {
				var view = pdfPage.view;
				var w = view[2] - view[0];
				var h = view[3] - view[1];
				var scale = height / h;
				var ratio = w/h;
				var quality = 2;
				var jcanvas = ng.element("<canvas draggable='true'></canvas>");
				jcanvas.css('width', height * ratio).css('height', height);
				pdfThumbnailElm.find('canvas').replaceWith(jcanvas);
				var canvas = jcanvas.get(0);
				pdfjsboxDrawServices.drawPdfPageToCanvas(canvas, pdfPage, item.rotate, scale * quality).then(function() {
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