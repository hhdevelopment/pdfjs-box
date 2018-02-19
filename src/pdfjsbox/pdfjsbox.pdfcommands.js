/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfCommands', pdfCommands);
	/* @ngInject */
	function pdfCommands(pdfjsboxWatcherServices, pdfjsboxItemServices, pdfjsboxDrawServices, pdfjsboxScaleServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfcommands.html',
			controller: PdfCommandsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItem': '=',
				'ngScale': '=',
				'allowPrint': '<',
				'allowRefresh': '<'
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['ngItem.document', 'ngItem.pageIdx', 'ngItem.items'], function (vs1, vs2, s) {
					updateNgItem(s, s.ctrl, s.ngItem);
				}, true));
				watcherClears.push(scope.$watch('ngItem.items.length', function (v1, v2, s) {
					updateItemsLength(s.ctrl, v1);
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				updateNgItem(scope, ctrl, scope.ngItem);
				ctrl.jqPrintIframe = elm.find('iframe');
				ctrl.pdfView = elm.parents('pdf-view');
				manageWheelHandler(ctrl, scope, ctrl.pdfView);
			}
		};
		/**
		 * Gestion du mousewheel de la zone
		 * @param {Angular Controller} ctrl
		 * @param {Angular Scope} scope
		 * @param {jQueryElement} jpdfView
		 */
		function manageWheelHandler(ctrl, scope, jpdfView) {
			jpdfView.on('wheel', null, {ctrl: ctrl}, function (event) {
				if (event.originalEvent.deltaY < 0) {
					if(event.ctrlKey) {
						ctrl.zoomPlus(event);
					} else if(!pdfjsboxDrawServices.isVerticalScrollbarPresent(jpdfView.parent())) {
						event.data.ctrl.previous(event.originalEvent);
					}
				} else {
					if(event.ctrlKey) {
						ctrl.zoomMoins(event);
					} else if(!pdfjsboxDrawServices.isVerticalScrollbarPresent(jpdfView.parent())) {
						event.data.ctrl.next(event.originalEvent);
					}
				}
				scope.$apply();
			});
		}
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
		 * @param {Angular Scope directive} scope
		 * @param {Angular Controller} ctrl
		 * @param {Item} item
		 */
		function updateNgItem(scope, ctrl, item) {
			if (item && item.items) {
				var pdfView = ctrl.pdfView[0];
				var fited = isFited(pdfView.parentElement);				
				ctrl.index = pdfjsboxItemServices.getIndexOfItemInList(item, item.items);
				item.getPage().then(function (pdfPage) {
					var rectangle = pdfjsboxScaleServices.getRectangle(pdfPage, 0);
					var scaleFitV = (pdfView.clientHeight || rectangle.height) / rectangle.height;
					var scaleFitH = (pdfView.clientWidth || rectangle.width) / rectangle.width;
					ctrl.scaleFited = Math.min(scaleFitV, scaleFitH);
					if(fited) {
						scope.ngScale = ctrl.scaleFited;
					}
				});
			} else {
				ctrl.index = 0;
				ctrl.total = 0;
				ctrl.scaleFited = 1;
			}
		}
		/**
		 * Détermine si la vue est fité (pas de scrollbar)
		 * @param {HTML Element} htmlElt
		 */
		function isFited(htmlElt) {
			var scrollbarWidth = htmlElt.offsetWidth - htmlElt.clientWidth;
			var scrollbarHeight = htmlElt.offsetHeight - htmlElt.clientHeight;
			return !scrollbarWidth && !scrollbarHeight;
		}
		/**
		 * Controller
		 * @param {Angular Scope} $scope
		 * @param {Angular PromiseAPI} $q
		 * @param {Services} pdfjsboxDrawServices
		 * @param {Services} pdfjsboxScaleServices
		 */
		/* @ngInject */
		function PdfCommandsCtrl($scope, $q, pdfjsboxDrawServices, pdfjsboxScaleServices) {
			var ctrl = this;
			ctrl.index;
			ctrl.total;
			ctrl.previous = previous;
			ctrl.next = next;
			ctrl.zoomMoins = zoomMoins;
			ctrl.zoomPlus = zoomPlus;
			ctrl.rotate = rotate;
			ctrl.print = print;
			ctrl.refresh = refresh;
			ctrl.fit = fit;
			/**
			 * Dézoom
			 * @param {jEvent} evt
			 */
			function zoomMoins(evt) {
				stopEvent(evt);
				$scope.ngScale = $scope.ngScale * 0.9;
			}
			/**
			 * Zoom
			 * @param {jEvent} evt
			 */
			function zoomPlus(evt) {
				stopEvent(evt);
				$scope.ngScale = $scope.ngScale / 0.9;
			}
			/**
			 * set ngItem with previous item
			 * @param {ClickEvent} evt
			 */
			function previous(evt) {
				stopEvent(evt);
				if($scope.ngItem) {
					var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
					if (idx > 0) {
						$scope.ngItem = $scope.ngItem.items[idx - 1];
					}
				}
			}
			/**
			 * set ngItem with next item
			 * @param {ClickEvent} evt
			 */
			function next(evt) {
				stopEvent(evt);
				if($scope.ngItem) {
					var idx = pdfjsboxItemServices.getIndexOfItemInList($scope.ngItem, $scope.ngItem.items);
					if (idx < $scope.ngItem.items.length - 1) {
						$scope.ngItem = $scope.ngItem.items[idx + 1];
					}
				}
			}
			/**
			 * Add 90° to rotate
			 * @param {ClickEvent} evt
			 */
			function rotate(evt) {
				stopEvent(evt);
				$scope.ngItem.rotate = ($scope.ngItem.rotate + 90) % 360;
			}
			/**
			 * Set fitV to docScale
			 * @param {ClickEvent} evt
			 */
			function fit(evt) {
				stopEvent(evt);
				$scope.ngScale = ctrl.scaleFited;
			}
			/**
			 * Refresh the pdf
			 * @param {ClickEvent} evt
			 */
			function refresh(evt) {
				stopEvent(evt);
				if($scope.ngItem) {
					$scope.$root.$broadcast('pdfdoc-refresh', $scope.ngItem.$$pdfid);
				}
			}
			/**
			 * Print current items link to ngItem
			 * @param {ClickEvent} evt
			 */
			function print(evt) {
				stopEvent(evt);
				var jqSpanIcon = ng.element(evt.currentTarget).find('span');
				jqSpanIcon.addClass('compute');
				var jqBody = ctrl.jqPrintIframe.contents().find('body'); // ng.element(destDocument.body);
				jqBody.empty(); // on supprime le document precedent
				var promises = $scope.ngItem.items.map(function (item, idx, arr) { // transforme les items en promesses
					return drawItemToCanvas(item, ng.element("<canvas style='page-break-after:always'></canvas>").appendTo(jqBody).get(0));
				});
				$q.all(promises).then(function () {
					jqSpanIcon.removeClass('compute');
					printIframe(ctrl.jqPrintIframe.get(0));
					return;
				});
			}
			function printIframe(printFrame) {
				try {
					if (printFrame.contentWindow.document.queryCommandSupported("print")) {
						printFrame.contentWindow.document.execCommand('print', false, null);
					} else {
						printFrame.contentWindow.focus();
						printFrame.contentWindow.print();
					}
				} catch (error) {
//					console.error(error.message);
				}
			}
			function drawItemToCanvas(item, canvas) {
				return item.getPage().then(function (pdfPage) {
					var rot = pdfPage.pageInfo.rotate;
					var viewport = pdfPage.getViewport(1, rot);
					var scale1 = 1080 / Math.min(viewport.width, viewport.height);
					var scale2 = 1920 / Math.max(viewport.width, viewport.height);
					return pdfjsboxDrawServices.drawPdfPageToCanvas(canvas, pdfPage, 0, Math.min(scale1, scale2));
				});
			}
			function stopEvent(evt) {
				evt.preventDefault();
				evt.stopPropagation();
			}
		}
	}
})(angular, _);