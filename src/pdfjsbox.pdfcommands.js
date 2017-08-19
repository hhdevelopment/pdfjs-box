(function (ng, __) {
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
		/**
		 * Met à jour le nombre total de pages
		 * @param {Angular Controller} ctrl
		 * @param {Number} length
		 */
		function updateItemsLength(ctrl, length) {
			ctrl.total = length;
		}
		/**
		 * Met à jour l'index de la page, 
		 * @param {Angular Controller} ctrl
		 * @param {Item} item
		 */
		function updateNgItem(ctrl, item) {
			if (item && item.items) {
				ctrl.index = pdfjsboxItemServices.getIndexOfItemInList(item, item.items);
			} else {
				ctrl.index = 0;
				ctrl.total = 0;
			}
		}
		/**
		 * Controller
		 * @param {Angular Scope} $scope
		 */
		/* @ngInject */
		function PdfCommandsCtrl($scope) {
			var ctrl = this;
			ctrl.index;
			ctrl.total;
			ctrl.previous = previous;
			ctrl.next = next;
			ctrl.rotate = rotate;
			ctrl.print = print;
			ctrl.fitH = fitH;
			ctrl.fitV = fitV;
			/**
			 * set ngItem with previous item
			 * @param {ClickEvent} evt
			 */
			function previous(evt) {
				evt.stopPropagation();
				var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
				if (idx > 0) {
					$scope.ngItem = $scope.ngItem.items[idx - 1];
				}
			}
			/**
			 * set ngItem with next item
			 * @param {ClickEvent} evt
			 */
			function next(evt) {
				evt.stopPropagation();
				var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
				if (idx < $scope.ngItem.items.length - 1) {
					$scope.ngItem = $scope.ngItem.items[idx + 1];
				}

			}
			/**
			 * Add 90° to rotate
			 * @param {ClickEvent} evt
			 */
			function rotate(evt) {
				evt.stopPropagation();
				$scope.ngItem.rotate = ($scope.ngItem.rotate + 90) % 360;
			}
			/**
			 * Set fitH to docScale
			 * @param {ClickEvent} evt
			 */
			function fitH(evt) {
				evt.stopPropagation();
				$scope.ngScale = null;
				$scope.docScale = "fitH";
			}
			/**
			 * Set fitV to docScale
			 * @param {ClickEvent} evt
			 */
			function fitV(evt) {
				evt.stopPropagation();
				$scope.ngScale = null;
				$scope.docScale = "fitV";
			}
			/**
			 * Print current items link to ngItem
			 * @param {ClickEvent} evt
			 */
			function print(evt) {
				evt.stopPropagation();
				console.log('TODO print feature...');
			}
		}
	}
})(angular, _);