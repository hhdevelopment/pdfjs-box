/* global _ */
(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', ['boxes.scroll']);
	}
	pdfbox.directive('pdfThumbnails', pdfThumbnails);
	/* @ngInject */
	function pdfThumbnails($document, pdfjsboxItemServices, pdfjsboxDomServices) {
		var hasFocus = false;
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
				elm.find('box-hscroll').css('height', elm.css('height'));
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['selectedItem', 'ngItems.length'], function (vs1, vs2, s) {
					// permet de detecter si l'tem selectionné est toujours dans une liste accessible
					if (s.selectedItem && pdfjsboxItemServices.getIndexOfItemInList(s.selectedItem, s.selectedItem.items) === -1) {
						s.selectedItem = null;
					} else {
						updateSelectedItem(s, elm, vs1[0], s.ngItems);
					}
				}, true));
				scope.$on('$destroy', function () {
					elm.off("click", clickOnElt);
					$document.off("click", clickOnDoc);
					$document.off("keydown", keydownOnDoc);
					elm.off('dragstart', handleDragStartJQuery);
					$document.off('dragover', handleDragOverJQuery);
					$document.off('drop', handleDropJQuery);
					watcherClears.forEach(function (watcherClear) {
						watcherClear();
					});
				});
				manageDragAndDropHandler(scope, elm);
				elm.on("click", {scope:scope, element:elm}, clickOnElt);
				$document.on("click", {scope:scope, element:elm}, clickOnDoc);
				$document.on("keydown", {scope:scope, ctrl:ctrl}, keydownOnDoc);
			}
		};
		function clickOnElt(event) {
			var scope = event.data.scope;
			var elm = event.data.element;
			pdfjsboxDomServices.stopEvent(event);
			hasFocus = true;
			var idx = Math.max(pdfjsboxItemServices.getIndexOfItemInList(scope.selectedItem, scope.ngItems), 0);
			scope.selectedItem = scope.ngItems[idx];
			elm.addClass('active');
		}
		function clickOnDoc(event) {
			var scope = event.data.scope;
			var elm = event.data.element;
			hasFocus = pdfjsboxDomServices.getElementFromJQueryElement(elm).contains(event.target);
			if (hasFocus) {
				var idx = Math.max(pdfjsboxItemServices.getIndexOfItemInList(scope.selectedItem, scope.ngItems), 0);
				scope.selectedItem = scope.ngItems[idx];
				elm.addClass('active');
			} else {
				elm.removeClass('active');
			}
		}
		function keydownOnDoc(event) {
			var scope = event.data.scope;
			var ctrl = event.data.ctrl;
			if (!hasFocus || event.which < 37 || event.which > 40)
				return;
			scope.$apply(function () {
				pdfjsboxDomServices.stopEvent(event);
				if (event.which === 37 || event.which === 38) {
					ctrl.previous();
				} else {
					ctrl.next();
				}
			});

		}
		function manageDragAndDropHandler(scope, elm) {
			if (!window.dataTransfer) {
				window.dataTransfer = {item:null};
			}
			if (scope.allowDrag) {
				elm.on('dragstart', {scope:scope, element:elm}, handleDragStartJQuery);
			}
			if (scope.allowDrop) {
				$document.on('dragover', {scope:scope, element:elm}, handleDragOverJQuery);
				$document.on('drop', {scope:scope, element:elm}, handleDropJQuery);
			}
		}
		function handleDragStartJQuery(jqe) {
			jqe.stopImmediatePropagation();
			jqe.stopPropagation();
//				jqe.preventDefault(); // ne pas mettre
			return handleDragStart(jqe.originalEvent, jqe.data);
		}
		function handleDragOverJQuery(jqe) {
			pdfjsboxDomServices.stopEvent(jqe);
			return handleDragOver(jqe.originalEvent, jqe.data);
		}
		function handleDropJQuery(jqe) {
			pdfjsboxDomServices.stopEvent(jqe);
			return handleDrop(jqe.originalEvent, jqe.data);
		}
		function handleDragStart(e, data) {
			var scope = data.scope;
			var elm = data.element;
			var currentDrag = getFirstParentNamed(e.target, 'pdf-thumbnail');
			window.dataTransfer.item = scope.ngItems[scope.ctrl.begin + elm.find("pdf-thumbnail").index(currentDrag)];
			window.dataTransfer.item.moving = true;
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/html', "<div></div>"); // si on set pas de data le drag and drop ne marche pas dans Firefox
		}
		function handleDragOver(e, data) {
			var scope = data.scope;
			var elm = data.element;
			if (e.preventDefault) {
				e.preventDefault(); // Necessary. Allows us to drop.
			}
			e.dataTransfer.dropEffect = 'move';
			if (window.dataTransfer.item) {
				var pdfthumbnails = getFirstParentNamed(e.target, 'pdf-thumbnails');
				if (pdfthumbnails && ng.element(pdfthumbnails).attr('allow-drop') === 'true') {
					var item = getItemInListOrClone(scope, window.dataTransfer.item, scope.ngItems);
					if (item) {
						var thumbnailOver = getFirstParentNamed(e.target, 'pdf-thumbnail');
						if (thumbnailOver) { // on survole un autre thumbnail
							var itemOver = scope.ngItems[scope.ctrl.begin + elm.find("pdf-thumbnail").index(thumbnailOver)];
							addThumbnailAroundOver(scope, item, thumbnailOver, itemOver, e.clientX);
						} else {
							addThumbnailAtEnd(scope, item);
						}
					}
				}
			}
			return false;
		}
		function handleDrop(e, data) {
			var scope = data.scope;
			if (window.dataTransfer.item) {
				window.dataTransfer.item.moving = false;
				if (!window.dataTransfer.item.tmp) {
					window.dataTransfer.item = null;
				} else {
					if (pdfjsboxItemServices.isContainInList(window.dataTransfer.item, scope.ngItems)) {
						window.dataTransfer.item.tmp = false;
						window.dataTransfer.item = null;
					} else {
						var idx = pdfjsboxItemServices.getIndexOfItemInList(window.dataTransfer.item, window.dataTransfer.item.items);
						window.dataTransfer.item.items.splice(idx, 1); 
					}
				}
				scope.$apply();
			}
			return false;
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
		 */
		function addThumbnailAtEnd(scope, item) {
			removeOldPosition(scope, item);
			scope.ngItems.push(item);
			scope.$apply();
		}
		/**
		 * Ajoute un thumbnail pour l'item avant ou apres le thumbnail survolé
		 * @param {Angular scope} scope : Scope du thumbnails survolé
		 * @param {Item} item
		 * @param {HTMLElement} thumbnailOver : Thumbnail survolé éventuellement
		 * @param {Item} itemOver : item survolé
		 * @param {Number} clientX : x de la souris
		 */
		function addThumbnailAroundOver(scope, item, thumbnailOver, itemOver, clientX) {
			var items = scope.ngItems;
			if (itemOver && !pdfjsboxItemServices.areItemsEqual(itemOver, item)) { // on n'est pas dessus
				removeOldPosition(scope, item);
				var idx = pdfjsboxItemServices.getIndexOfItemInList(itemOver, items);
				var median = getHMedian(thumbnailOver.getClientRects()[0]);
				if (clientX < median) {
					items.splice(idx, 0, item);
				} else {
					items.splice(idx + 1, 0, item);
				}
				scope.$apply();
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
			if(idx !== -1) {
				if (idx < scope.ctrl.begin) {
					scope.ctrl.begin = idx;
				}
				if (idx > scope.ctrl.begin + scope.ctrl.limit - 2) {
					scope.ctrl.begin = idx - scope.ctrl.limit + 3;
				}
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
		 * Angular PdfThumbnails Controller
		 * @param {angular scope} $scope
		 * @param {PdfjsboxItemServices} pdfjsboxItemServices
		 */
		function PdfThumbnailsCtrl($scope, pdfjsboxItemServices) {
			var ctrl = this;
			ctrl.begin = 0;
			ctrl.limit = 10000;
			ctrl.previous = previous;
			ctrl.next = next;
			ctrl.areItemsEqual = pdfjsboxItemServices.areItemsEqual;
			ctrl.selectByClick = selectByClick;
			ctrl.copyByDblclick = copyByDblclick;
			ctrl.trackItem = trackItem;

			/**
			 * set ngItem with previous item
			 */
			function previous() {
				$scope.selectedItem = pdfjsboxItemServices.getPrevious($scope.selectedItem);
			}
			/**
			 * set ngItem with next item
			 */
			function next() {
				$scope.selectedItem = pdfjsboxItemServices.getNext($scope.selectedItem);
			}
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
