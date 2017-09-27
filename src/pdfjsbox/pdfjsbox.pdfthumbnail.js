(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch(e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfThumbnail', pdfThumbnail);
	/* @ngInject */
	function pdfThumbnail(pdfjsboxWatcherServices, pdfjsboxDrawServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnail.html',
			controller: PdfThumbnailCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '<', // un item portant le pdfDocument, l'index de la page, l'angle de rotation
				'ngHeight': '<' // la hauteur desirée de la page
			},
			link: function (scope, elm, attrs, ctrl) {
				elm.addClass('notrendered');
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.rotate'], function (vs1, vs2, s) {
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
			var thumbnail = pdfThumbnailElm.get(0);
			thumbnail.item = item;
			pdfjsboxDrawServices.drawPageWhenAvailableIfVisible(scope.ngHeight, pdfThumbnailElm, thumbnail, item, item.selected);
		}
		/**
		 * Angular Controller
		 * @param {type} $scope
		 * @returns {undefined}
		 */
		function PdfThumbnailCtrl($scope) {
			var ctrl = this;
			ctrl.switchThumbnailSelected = switchThumbnailSelected;
			ctrl.removeThumbnail = removeThumbnail;
			/**
			 * handler de la checkbox, stop la propagation de l'event
			 * @param {ClickEvent} evt
			 */
			function switchThumbnailSelected(evt) {
				evt.stopPropagation();
				evt.stopImmediatePropagation();
			}
			/**
			 * Click sur la croix pour remove l'item
			 * @param {ClickEvent} evt
			 */
			function removeThumbnail(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				var idx = $scope.ngItem.items.indexOf($scope.ngItem);
				$scope.ngItem.items.splice(idx, 1);
			}
		}
	}
})(angular, _);