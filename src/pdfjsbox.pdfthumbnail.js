(function (ng, __, PDFJS, pdfjsLib) {
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
				var watcherClears = [];
				watcherClears.push(scope.$watch('ngItem.rotate', function (v1, v2, s) {
					updateNgItem(s, elm, s.ngItem);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
			}
		};
		function updateNgItem(scope, elm, item) {
			var thumbnail = elm.get(0);
			thumbnail.item = item;
			pdfjsboxDrawServices.drawPageWhenAvailableIfVisible(scope.ngHeight, elm, thumbnail, item, false);
		}
		function PdfThumbnailCtrl($scope) {
			var ctrl = this;
			ctrl.switchThumbnailSelected = switchThumbnailSelected;
			ctrl.removeThumbnail = removeThumbnail;
			function switchThumbnailSelected(evt) {
				evt.stopPropagation();
				evt.stopImmediatePropagation();
			}

			function removeThumbnail(evt) {
				evt.stopPropagation();
				evt.preventDefault();
				var idx = $scope.ngItem.items.indexOf($scope.ngItem);
				$scope.ngItem.items.splice(idx, 1);
			}
		}
	}
})(angular, _, PDFJS, pdfjsLib);