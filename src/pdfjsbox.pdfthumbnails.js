(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfThumbnails', pdfThumbnails);
	/* @ngInject */
	function pdfThumbnails($q, $timeout, $window, pdfjsboxWatcherServices, pdfjsboxDrawServices, pdfjsboxItemServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnails.html',
			controller: PdfThumbnailsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItems': '=', // la liste de items represantant les pages du document
				'allowDrag': '<', // Les miniatures sont elles draggables
				'allowDrop': '<', // Les miniatures sont elles droppables ici
				'ngHeight': '<', // la hauteur désiré des miniatures
				'selectedItem': '=', // l'item sélectionné
				'placeholder': '@', // texte quand la ligne est vide
				'dblclickTarget':'=' 
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['selectedItem', 'ngItems.length'], function (vs1, vs2, s) {
					// permet de detecter si l'tem selectionné est toujours dans une liste accessible
					if (s.selectedItem && pdfjsboxItemServices.getIndexOfItemInList(s.selectedItem, s.selectedItem.items) === -1) {
						s.selectedItem = null;
					} else {
						updateSelectedItem(s, elm, vs1[0], s.ngItems);
					}
				}, true));
				pdfjsboxWatcherServices.cleanWatchersOnDestroy(scope, watcherClears);
				var container = elm.get(0).firstChild;
				manageScrollHandler(scope, container);
				manageResizeHandler(scope, container);
				manageDragAndDropHandler(scope, elm);
				updateSelectedItem(scope, elm, scope.selectedItem, scope.ngItems);
			}
		};
		function manageDragAndDropHandler(scope, elm) {
			if (!window.dataTransfer) {
				window.dataTransfer = {};
			}
			if (scope.allowDrag) {
				elm.on('dragstart', window.dataTransfer, handleDragStartJQuery);
			}
			if (scope.allowDrop) {
				$(document).off('dragover', window.dataTransfer, handleDragOverJQuery);
				$(document).on('dragover', window.dataTransfer, handleDragOverJQuery);
				$(document).off('drop', window.dataTransfer, handleDropJQuery);
				$(document).on('drop', window.dataTransfer, handleDropJQuery);
			}
			function handleDragStartJQuery(jqe) {
				return handleDragStart(jqe.originalEvent, jqe.data);
			}
			function handleDragOverJQuery(jqe) {
				return handleDragOver(jqe.originalEvent, jqe.data);
			}
			function handleDropJQuery(jqe) {
				return handleDrop(jqe.originalEvent, jqe.data);
			}
			function handleDragStart(e, data) {
				data = data || window.dataTransfer;
				var currentDrag = getFirstParent(e.target, 'pdf-thumbnail');
				data.item = currentDrag.item;
				data.item.moving = true;
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/html', "<div></div>"); // si on set pas de data le drag and drop ne marche pas dans Firefox
			}
			function handleDragOver(e, data) {
				data = data || window.dataTransfer;
				if (e.preventDefault) {
					e.preventDefault(); // Necessary. Allows us to drop.
				}
				e.dataTransfer.dropEffect = 'move';
				if (data.item) {
					var pdfthumbnails = getFirstParent(e.target, 'pdf-thumbnails');
					if (pdfthumbnails && ng.element(pdfthumbnails).attr('allow-drop') === 'true') {
						var currentOver = getFirstParent(e.target, 'pdf-thumbnail');
						moveOrCopyThumbnail(scope, data.item, scope.ngItems, currentOver, e.clientX);
					}
				}
				return false;
			}
			function handleDrop(e, data) {
				data = data || window.dataTransfer;
				if (data.item) {
					var pdfthumbnails = getFirstParent(e.target, 'pdf-thumbnails');
					data.item.moving = false;
					if (!data.item.tmp) {
						data.item.moving = false;
						data.item = null;
					} else {
						if (pdfthumbnails) {
							var div = pdfthumbnails.children[0];
							var rightContainer = false;
							for (var i = 0; !rightContainer && i < div.childElementCount; i++) {
								var item = div.children[i].item;
								rightContainer = item === data.item;
							}
							if (rightContainer) {
								data.item.tmp = false;
								data.item = null;
							} else {
								var idx = pdfjsboxItemServices.getIndexOfItemInList(data.item, data.item.items);
								data.item.items.splice(idx, 1);
							}
						} else {
							var idx = pdfjsboxItemServices.getIndexOfItemInList(data.item, data.item.items);
							data.item.items.splice(idx, 1);
						}
					}
					scope.$apply();
				}
				return false;
			}
		}
		function getFirstParent(target, nodeName) {
			return target.nodeName === nodeName.toUpperCase() ? target : ng.element(target).parents(nodeName.toLowerCase()).get(0);
		}
		function moveOrCopyThumbnail(scope, item, items, currentOver, clientX) {
			item = getItemInListOrClone(scope, item, items);
			if (!item) {
				return;
			}
			var currentIdx = pdfjsboxItemServices.getIndexOfItemInList(item, items);
			if (currentOver) {
				if (currentOver.item && !pdfjsboxItemServices.areItemsEqual(currentOver.item, item)) { // on n'est pas dessus
					if (currentIdx !== -1) {
						items.splice(currentIdx, 1);
					}
					var idx = pdfjsboxItemServices.getIndexOfItemInList(currentOver.item, items);
					var median = getHMedian(currentOver.getClientRects()[0]);
					if (clientX < median) {
						items.splice(idx, 0, item);
					} else {
						items.splice(idx + 1, 0, item);
					}
					scope.$apply();
				}
			} else {
				if (currentIdx === -1) {
					items.push(item);
					scope.$apply();
				}
			}
		}
		function getItemInListOrClone(scope, item, items) {
			if (item.items !== items) { // copy, on drag dans une autre liste de miniature.
				if (item.tmp) {
					item.items.splice(pdfjsboxItemServices.getIndexOfItemInList(item, item.items), 1);
				} else {
					item.moving = false; // end of move
				}
				var currentIdx = pdfjsboxItemServices.getIndexOfItemInList(item, items);
				if (currentIdx === -1) { // n'existe ps, on clone
					item = pdfjsboxItemServices.cloneItem(item, items);
				} else {
					item = pdfjsboxItemServices.getItemInList(item, items);
				}
				window.dataTransfer.item = item;
				item.moving = true;
				scope.$apply();
			}
			return item;
		}
		/**
		 * Gestion du resize
		 * @param {type} scope
		 * @param {type} container
		 */
		function manageResizeHandler(scope, container) {
			ng.element($window).on('resize', {promise: null, container: container, height: scope.ngHeight}, manageDrawVisiblePfgThumbnailsHandler);
		}
		/**
		 * Gestion du scroll de la zone de miniature
		 * @param {type} scope
		 * @param {type} container
		 */
		function manageScrollHandler(scope, container) {
			ng.element(container).on('scroll', {promise: null, container: container, height: scope.ngHeight}, manageDrawVisiblePfgThumbnailsHandler);
		}
		function manageDrawVisiblePfgThumbnailsHandler(evt) {
			var data = evt.data;
			if (data.promise) {
				$timeout.cancel(data.promise);
			}
			data.promise = $timeout(drawVisiblePdfThumbnails, 500, false, data.container.getClientRects()[0], data.height);
		}
		/**
		 * Dessine tous les miniatures notrendered dans la zone visible dans le clientRect
		 * @param {type} clientRect
		 * @param {type} height : hauteur de la miniature
		 * @returns {undefined}
		 */
		function drawVisiblePdfThumbnails(clientRect, height) {
			var first = document.elementFromPoint(clientRect.left + 5, clientRect.top + 5);
			if (first && first.nodeName === 'PDF-THUMBNAIL') {
				var thumbnail = first;
				while (thumbnail !== null && pdfjsboxDrawServices.isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0])) {
					var parent = ng.element(thumbnail);
					if (parent.hasClass('notrendered')) {
						pdfjsboxDrawServices.drawPageWhenAvailableIfVisible(height, parent, thumbnail, thumbnail.item, true);
					}
					thumbnail = thumbnail.nextElementSibling;
				}
			}
		}
		/**
		 * La selection est changé, on selectionne le bon item et on s'assure qu'il soit visible.
		 * @param {type} scope
		 * @param {type} elm
		 * @param {type} selectedItem
		 * @param {type} items
		 * @returns {undefined}
		 */
		function updateSelectedItem(scope, elm, selectedItem, items) {
			elm.removeClass('active');
			if (!items || !items.length) {
				return;
			}
			if (!selectedItem) {
				scope.selectedItem = items[0];
				return;
			}
			var idx = pdfjsboxItemServices.getIndexOfItemInList(selectedItem, items);
			if (idx !== -1) {
				var container = elm.get(0).firstChild;
				var thumbnail = container.children[idx];
				ensureIsHVisibleIn(thumbnail, container);
				if (selectedItem.items === items) {
					elm.addClass('active');
				}
			}
		}
		function getHMedian(clientRect) {
			return ((clientRect.right - clientRect.left) / 2) + clientRect.left;
		}
		function getVMedian(clientRect) {
			return ((clientRect.bottom - clientRect.top) / 2) + clientRect.top;
		}
		/**
		 * S'assure que le thumbnail est visible dans le container (horizontalement) et scroll si nécessaire
		 * @param {type} thumbnail
		 * @param {type} container
		 */
		function ensureIsHVisibleIn(thumbnail, container) {
			if (thumbnail && container) {
				var clientRects1 = thumbnail.getClientRects()[0];
				var clientRects2 = container.getClientRects()[0];
				if (!isCompletlyHVisibleIn(clientRects1, clientRects2)) {
					if (clientRects1.right > clientRects2.right) { // l'element dépasse à droite
						container.scrollLeft += clientRects1.right - clientRects2.right;
					} else { // l'element dépasse à gauche
						container.scrollLeft -= clientRects2.left - clientRects1.left;
					}
				}
			}
		}
		/**
		 * Détermine si le rectangle1 est visible entierement horizontalement dans le rectangle2
		 * @param {type} clientRects1
		 * @param {type} clientRects2
		 * @returns {Boolean}
		 */
		function isCompletlyHVisibleIn(clientRects1, clientRects2) {
			return clientRects1.right <= clientRects2.right && clientRects1.left >= clientRects2.left;
		}
		/**
		 * S'assure que le thumbnail est visible dans le container (verticalement) et scroll si nécessaire
		 * @param {type} thumbnail
		 * @param {type} container
		 */
		function ensureIsVVisibleIn(thumbnail, container) {
			var clientRects1 = thumbnail.getClientRects()[0];
			var clientRects2 = container.getClientRects()[0];
			if (!isCompletlyVVisibleIn(clientRects1, clientRects2)) {
				if (clientRects1.bottom > clientRects2.bottom) { // l'element dépasse en bas
					container.scrollTop += clientRects1.bottom - clientRects2.bottom;
				} else { // l'element dépasse en haut
					container.scrollTop -= clientRects2.top - clientRects1.top;
				}
			}
		}
		/**
		 * Détermine si le rectangle1 est visible entierement verticalement dans le rectangle2
		 * @param {type} clientRects1
		 * @param {type} clientRects2
		 * @returns {Boolean}
		 */
		function isCompletlyVVisibleIn(clientRects1, clientRects2) {
			return clientRects1.bottom <= clientRects2.bottom && clientRects1.top >= clientRects2.top;
		}
		function PdfThumbnailsCtrl($scope) {
			var ctrl = this;
			ctrl.areItemsEqual = pdfjsboxItemServices.areItemsEqual;
			ctrl.selectByClick = selectByClick;
			ctrl.copyByDblclick = copyByDblclick;
			ctrl.trackItem = trackItem;

			function trackItem(item) {
				return JSON.stringify(item.document) + item.pageIdx;
			}
			function selectByClick(item) {
				$scope.selectedItem = item;
			}
			function copyByDblclick(item) {
				if($scope.dblclickTarget) {
					$scope.dblclickTarget.push(item);
				}
			}
		}
	}
})(angular, _, PDFJS, pdfjsLib);