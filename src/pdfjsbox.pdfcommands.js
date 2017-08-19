(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfCommands', pdfCommands);
	/* @ngInject */
	function pdfCommands(pdfjsboxWatcherServices, pdfjsboxItemServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfcommands.html',
			controller: PdfCommandsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngScale': '=',
				'docScale': '=',
				'allowPrint': '='
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'ngItem.pageIdx', 'ngItem.items'], function (vs1, vs2, s) {
					updateNgItem(s.ctrl, s.ngItem);
				}, true));
				watcherClears.push(scope.$watch('ngItem.items.length', function (v1, v2, s) {
					updateItemsLength(s.ctrl, v1);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateNgItem(ctrl, scope.ngItem);
			}
		};
		function updateItemsLength(ctrl, length) {
			ctrl.total = length;
		}
		function updateNgItem(ctrl, item) {
			if (item && item.items) {
				ctrl.document = item.document;
				ctrl.index = pdfjsboxItemServices.getIndexOfItemInList(item, item.items);
				ctrl.total = item.items.length;
			} else {
				ctrl.document = null;
				ctrl.index = 0;
				ctrl.total = 0;
			}
		}
		function PdfCommandsCtrl($scope) {
			var ctrl = this;
			ctrl.document = null;
			ctrl.index;
			ctrl.total;
			ctrl.previous = previous;
			ctrl.next = next;
			ctrl.rotate = rotate;
			ctrl.print = print;
			ctrl.fitH = fitH;
			ctrl.fitV = fitV;
			function previous(evt) {
				evt.stopPropagation();
				var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
				if (idx > 0) {
					$scope.ngItem = $scope.ngItem.items[idx - 1];
				}
			}
			function next(evt) {
				evt.stopPropagation();
				var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
				if (idx < $scope.ngItem.items.length - 1) {
					$scope.ngItem = $scope.ngItem.items[idx + 1];
				}

			}
			function rotate(evt) {
				evt.stopPropagation();
				$scope.ngItem.rotate = ($scope.ngItem.rotate + 90) % 360;
			}
			function fitH(evt) {
				evt.stopPropagation();
				$scope.ngScale = null;
				$scope.defaultScale = "fitH";
			}
			function fitV(evt) {
				evt.stopPropagation();
				$scope.ngScale = null;
				$scope.defaultScale = "fitV";
			}
			function print(evt) {
				evt.stopPropagation();
				console.log('TODO print feature...');
			}
		}
	}
})(angular, _, PDFJS, pdfjsLib);