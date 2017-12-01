/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.directive('pdfThumbnails', pdfThumbnails);
	/* @ngInject */
	function pdfThumbnails($timeout, $window, pdfjsboxWatcherServices, pdfjsboxDrawServices, pdfjsboxItemServices) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnails.html',
			controller: PdfThumbnailsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngItems': '=', // la liste de items representant les pages du document
				'allowDrag': '<', // Les miniatures sont elles draggables
				'allowDrop': '<', // Les miniatures sont elles droppables ici
				'selectedItem': '=', // l'item sélectionné
				'placeholder': '@', // texte quand la ligne est vide
				'dblclickTarget': '=', // une liste d'items cible pour la copie via le doubleclick
				'reverseScroll': '<',
				'style': '@'
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
				manageScrollHandler(scope, elm);
				manageResizeHandler(scope, elm);
				manageDragAndDropHandler(scope, elm);
				updateSelectedItem(scope, elm, scope.selectedItem, scope.ngItems);
				manageWheelHandler(scope, elm);
				elm.addClass('scrollable');
			}
		};
		/**
		 * Gestion du mousewheel de la zone
		 * @param {Angular Scope} scope
		 * @param {jQueryElement} jqThumbnails
		 */
		function manageWheelHandler(scope, jqThumbnails) {
			jqThumbnails.on('wheel', {scope: scope, target: jqThumbnails.get(0)}, function (event) {
				if (event.data.target === event.currentTarget) {
					var scope = event.data.scope;
					var coeff = scope.reverseScroll ? -1 : 1;
					if (scope.selectedItem && scope.ngItems.length) {
						var idx = pdfjsboxItemServices.getIndexOfItemInList(scope.selectedItem, scope.ngItems);
						if ((coeff * event.originalEvent.deltaY) < 0) {
							idx = Math.min(idx + 1, scope.ngItems.length - 1);
						} else {
							idx = Math.max(idx - 1, 0);
						}
						var newItem = scope.ngItems[idx];
						if (newItem !== scope.selectedItem) {
							event.originalEvent.stopPropagation();
							event.originalEvent.preventDefault();
							scope.selectedItem = scope.ngItems[idx];
							scope.$apply();
						}
					}
				}
			});
		}
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
				var currentDrag = getFirstParentNamed(e.target, 'pdf-thumbnail');
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
					var pdfthumbnails = getFirstParentNamed(e.target, 'pdf-thumbnails');
					if (pdfthumbnails && ng.element(pdfthumbnails).attr('allow-drop') === 'true') {
						var item = getItemInListOrClone(scope, data.item, scope.ngItems);
						if (item) {
							var thumbnailOver = getFirstParentNamed(e.target, 'pdf-thumbnail');
							if (thumbnailOver) { // on survole un autre thumbnail
								addThumbnailAroundOver(scope, item, thumbnailOver, pdfthumbnails, e.clientX);
							} else {
								addThumbnailAtEnd(scope, item, pdfthumbnails);
							}
						}
					}
				}
				return false;
			}
			function handleDrop(e, data) {
				data = data || window.dataTransfer;
				if (data.item) {
					var pdfthumbnails = getFirstParentNamed(e.target, 'pdf-thumbnails');
					data.item.moving = false;
					if (!data.item.tmp) {
						data.item = null;
					} else {
						if (pdfthumbnails) {
							var rightContainer = false;
							for (var i = 0; !rightContainer && i < pdfthumbnails.childElementCount; i++) {
								var item = pdfthumbnails.children[i].item;
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
		/**
		 * Retourne le noeud lui meme ou son ancetre le plus proche etant de type nodename 
		 * @param {HTMLElement} target
		 * @param {string} nodeName
		 * @returns {HTMLElement}
		 */
		function getFirstParentNamed(target, nodeName) {
			return target.nodeName === nodeName.toUpperCase() ? target : ng.element(target).parents(nodeName.toLowerCase()).get(0);
		}
		/**
		 * Si l'item est déjà dans la liste survolée on le supprime pour pouvoir le remettre à sa nouvelle position
		 * @param {Angular scope} scope : Scope du thumbnails survolé
		 * @param {Item} item : Item d'origine
		 */
		function removeOldPosition(scope, item) {
			var currentIdx = pdfjsboxItemServices.getIndexOfItemInList(item, scope.ngItems);
			if (currentIdx !== -1) { // s'il est déjà present on le supprime
				scope.ngItems.splice(currentIdx, 1);
			}
		}
		/**
		 * Ajoute un thumbnail à la fin de la liste
		 * @param {Angular scope} scope : Scope du thumbnails survolé
		 * @param {Item} item
		 * @param {HTMLElement} pdfthumbnails : Thumbnails survolé
		 */
		function addThumbnailAtEnd(scope, item, pdfthumbnails) {
			removeOldPosition(scope, item);
			scope.ngItems.push(item);
			scope.$apply();
			$timeout(drawVisiblePdfThumbnails, 50, true, pdfthumbnails.getClientRects()[0]);
		}
		/**
		 * Ajoute un thumbnail pour l'item avant ou apres le thumbnail survolé
		 * @param {Angular scope} scope : Scope du thumbnails survolé
		 * @param {Item} item
		 * @param {HTMLElement} thumbnailOver : Thumbnail survolé éventuellement
		 * @param {HTMLElement} pdfthumbnails : Thumbnails survolé
		 * @param {Number} clientX : x de la souris
		 */
		function addThumbnailAroundOver(scope, item, thumbnailOver, pdfthumbnails, clientX) {
			var items = scope.ngItems;
			if (thumbnailOver.item && !pdfjsboxItemServices.areItemsEqual(thumbnailOver.item, item)) { // on n'est pas dessus
				removeOldPosition(scope, item);
				var idx = pdfjsboxItemServices.getIndexOfItemInList(thumbnailOver.item, items);
				var median = getHMedian(thumbnailOver.getClientRects()[0]);
				if (clientX < median) {
					items.splice(idx, 0, item);
				} else {
					items.splice(idx + 1, 0, item);
				}
				scope.$apply();
				$timeout(drawVisiblePdfThumbnails, 50, true, pdfthumbnails.getClientRects()[0]);
			}
		}
		/**
		 * 
		 * @param {Angular scope} scope
		 * @param {Item} item
		 * @param {Array<Item>} items
		 * @returns {Item}
		 */
		function getItemInListOrClone(scope, item, items) {
			if (item.items !== items) { // copy, on drag dans une autre liste de miniature.
				if (item.tmp) {
					item.items.splice(pdfjsboxItemServices.getIndexOfItemInList(item, item.items), 1);
				} else {
					item.moving = false; // end of move
				}
				if (!pdfjsboxItemServices.isContainInList(item, items)) { // n'existe pas, on clone
					item = pdfjsboxItemServices.cloneItem(item, items);
					item.tmp = true; // on le met temporaire car non encore droppé
				} else { // Sinon on le récupere pour éviter les doublons
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
		 * @param {angular Scope} scope
		 * @param {jQueryElement} jqThumbnails
		 */
		function manageResizeHandler(scope, jqThumbnails) {
			ng.element($window).on('resize', {promise: null, container: jqThumbnails.get(0)}, manageDrawVisiblePfgThumbnailsHandler);
		}
		/**
		 * Gestion du scroll de la zone de miniature
		 * @param {angular Scope} scope
		 * @param {jQueryElement} jqThumbnails
		 */
		function manageScrollHandler(scope, jqThumbnails) {
			jqThumbnails.on('scroll', {promise: null, container: jqThumbnails.get(0)}, manageDrawVisiblePfgThumbnailsHandler);
		}
		/**
		 * Temporise la gestion de dessin des thumbnail qui apparaisent à l'ecran
		 * @param {ScrollEvent|REsizeEvent} evt
		 */
		function manageDrawVisiblePfgThumbnailsHandler(evt) {
			var data = evt.data;
			if (data.promise) {
				$timeout.cancel(data.promise);
			}
			data.promise = $timeout(drawVisiblePdfThumbnails, 500, true, data.container.getClientRects()[0]);
		}
		/**
		 * Dessine tous les miniatures notrendered dans la zone visible dans le clientRect
		 * @param {ClientRect} clientRect
		 */
		function drawVisiblePdfThumbnails(clientRect) {
			if(clientRect) {
				var elm = document.elementFromPoint(clientRect.left, clientRect.top);
				if (elm) {
					var thumbnail;
					if(elm.nodeName === 'CANVAS') {
						thumbnail = elm.parentElement;
					} else if(elm.nodeName === 'PDF-THUMBNAIL') {
						thumbnail = elm;
					}
					while (thumbnail && pdfjsboxDrawServices.isHVisibleIn(thumbnail.getClientRects()[0], clientRect)) {
						pdfjsboxDrawServices.drawPageWhenAvailableIfVisible(thumbnail, thumbnail.item, true);
						thumbnail = thumbnail.nextElementSibling;
					}
				}
			}
		}
		/**
		 * La selection est changé, on selectionne le bon item et on s'assure qu'il soit visible.
		 * @param {angular scope} scope
		 * @param {JQueryElement} pdfthumbnailsElm
		 * @param {Item} selectedItem
		 * @param {Array} items
		 */
		function updateSelectedItem(scope, pdfthumbnailsElm, selectedItem, items) {
			pdfthumbnailsElm.removeClass('active');
			if (!items || !items.length) {
				return;
			}
			if (!selectedItem) {
				scope.selectedItem = items[0];
				return;
			}
			var idx = pdfjsboxItemServices.getIndexOfItemInList(selectedItem, items);
			if (idx !== -1) {
				var thumbnail = pdfthumbnailsElm.children().get(idx);
				ensureIsHVisibleIn(thumbnail, pdfthumbnailsElm.get(0));
				pdfjsboxDrawServices.drawPageWhenAvailableIfVisible(thumbnail, selectedItem, true);
				if (selectedItem.items === items) {
					pdfthumbnailsElm.addClass('active');
				}
			}
		}
		/**
		 * Retourne le millieu horizontal du rectanle
		 * @param {ClientRect} clientRect
		 * @returns {Number}
		 */
		function getHMedian(clientRect) {
			return ((clientRect.right - clientRect.left) / 2) + clientRect.left;
		}
		/**
		 * Retourne le millieu vertical du rectanle
		 * @param {ClientRect} clientRect
		 * @returns {Number}
		 */
		function getVMedian(clientRect) {
			return ((clientRect.bottom - clientRect.top) / 2) + clientRect.top;
		}
		/**
		 * S'assure que le thumbnail est visible dans le container (horizontalement) et scroll si nécessaire
		 * @param {HTMLElement} thumbnail
		 * @param {HTMLElement} thumbnails
		 */
		function ensureIsHVisibleIn(thumbnail, thumbnails) {
			if (thumbnail && thumbnails) {
				var clientRects1 = thumbnail.getClientRects()[0];
				var clientRects2 = thumbnails.getClientRects()[0];
				if (!isCompletlyHVisibleIn(clientRects1, clientRects2)) {
					if (clientRects1.right > clientRects2.right) { // l'element dépasse à droite
						thumbnails.scrollLeft += clientRects1.right - clientRects2.right;
					} else { // l'element dépasse à gauche
						thumbnails.scrollLeft -= clientRects2.left - clientRects1.left;
					}
				}
			}
		}
		/**
		 * Détermine si le rectangle1 est visible entierement horizontalement dans le rectangle2
		 * @param {ClientRect} clientRects1
		 * @param {ClientRect} clientRects2
		 * @returns {Boolean}
		 */
		function isCompletlyHVisibleIn(clientRects1, clientRects2) {
			return clientRects1.right <= clientRects2.right && clientRects1.left >= clientRects2.left;
		}
		/**
		 * S'assure que le thumbnail est visible dans le container (verticalement) et scroll si nécessaire
		 * @param {HTMLElement} thumbnail
		 * @param {HTMLElement} jqThumbnails
		 */
		function ensureIsVVisibleIn(thumbnail, jqThumbnails) {
			var clientRects1 = thumbnail.getClientRects()[0];
			var clientRects2 = jqThumbnails.getClientRects()[0];
			if (!isCompletlyVVisibleIn(clientRects1, clientRects2)) {
				if (clientRects1.bottom > clientRects2.bottom) { // l'element dépasse en bas
					jqThumbnails.scrollTop += clientRects1.bottom - clientRects2.bottom;
				} else { // l'element dépasse en haut
					jqThumbnails.scrollTop -= clientRects2.top - clientRects1.top;
				}
			}
		}
		/**
		 * Détermine si le rectangle1 est visible entierement verticalement dans le rectangle2
		 * @param {ClientRect} clientRects1
		 * @param {ClientRect} clientRects2
		 * @returns {Boolean}
		 */
		function isCompletlyVVisibleIn(clientRects1, clientRects2) {
			return clientRects1.bottom <= clientRects2.bottom && clientRects1.top >= clientRects2.top;
		}
		/**
		 * Angular PdfThumbnails Controller
		 * @param {angular scope} $scope
		 * @param {PdfjsboxItemServices} pdfjsboxItemServices
		 */
		function PdfThumbnailsCtrl($scope, pdfjsboxItemServices) {
			var ctrl = this;
			ctrl.areItemsEqual = pdfjsboxItemServices.areItemsEqual;
			ctrl.selectByClick = selectByClick;
			ctrl.copyByDblclick = copyByDblclick;
			ctrl.trackItem = trackItem;

			function trackItem(item) {
				return item.pageIdx + '_' + item.$$pdfid;
			}
			function selectByClick(item) {
				$scope.selectedItem = item;
			}
			function copyByDblclick(item) {
				if ($scope.dblclickTarget && !pdfjsboxItemServices.isContainInList(item, $scope.dblclickTarget)) {
					$scope.dblclickTarget.push(pdfjsboxItemServices.cloneItem(item, $scope.dblclickTarget));
				}
			}
		}
	}
})(angular, _);