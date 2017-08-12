(function (ng, __, PDFJS, pdfjsLib) {
	'use strict';
	var pdfbox = ng.module('pdfjs-box', []).run(config);
	/* @ngInject */
	function config($templateCache, pdfjsConfig) {
		if (pdfjsConfig.workerSrc) {
			PDFJS.workerSrc = pdfjsConfig.workerSrc;
		} else {
			PDFJS.disableWorker = true;
		}
		$templateCache.put('pdfthumbnails.html', require('./pdfthumbnails.html'));
		$templateCache.put('pdfthumbnail.html', require('./pdfthumbnail.html'));
		$templateCache.put('pdfview.html', require('./pdfview.html'));
		$templateCache.put('pdfcommands.html', require('./pdfcommands.html'));
	}
	/*******************************************************************
	 * 
	 * PDF-DOCUMENT
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfDocument', pdfDocument);
	/* @ngInject */
	function pdfDocument(pdfjsConfig) {
		return {
			restrict: 'E',
			scope: {
				// nom interne : nom externe
				'ngDocument': '<', // le document sous forme d'objet
				'ngData': '<', // Un objet exposant des données global 
				'urlSupplier': '=', // une fonction retournant l'url a partir du document et de l'objet globalData. 
				'ngModel': '=', // la liste de items representant les pages du document
				'onPdfinfo': '&' // qd on charge un document pdf
			},
			link: function (scope, elm, attrs, ctrl) {
				var p;
				var watcherClears = [];
				watcherClears.push(scope.$watch('ngDocument', function (v1, v2, s) {
					p = updateNgDocument(s, v1);
				}, true));
				cleanWatchersOnDestroy(scope, watcherClears);
				p = updateNgDocument(scope, scope.ngDocument);
			}
		};
		/**
		 * Changement de document
		 * @param {type} scope
		 * @param {type} ngDocument
		 */
		function updateNgDocument(scope, ngDocument) {
			scope.ngModel.splice(0, scope.ngModel.length);
			if (ngDocument) {
				var url = scope.urlSupplier ? scope.urlSupplier({'document': ngDocument, 'data': scope.ngData}) : (ngDocument.url || ngDocument);
				var task = PDFJS.getDocument(url);
				return task.promise.then(function (pdfDocument) {
					if (scope.onPdfinfo) {
						scope.onPdfinfo({pdfinfo: pdfDocument.pdfInfo});
					}
					var t0 = new Date().getTime();
					return loadRecursivePage(scope, ngDocument, pdfDocument, scope.ngModel, 0, pdfjsConfig.preloadRecursivePages).then(function () {
						console.log('Preload recursive ' + Math.min(pdfjsConfig.preloadRecursivePages, pdfDocument.numPages) + ' pages in %sms', new Date().getTime() - t0);
					});
				}).catch(function (reason) {
					console.error('Error: ' + reason);
				});
			}
			return null;
		}
		/**
		 * Charge une page, utilisé dans le mode séquenciel
		 * @param {type} scope
		 * @param {type} document
		 * @param {type} pdfDocument
		 * @param {type} items
		 * @param {type} offset
		 * @param {type} idx
		 * @param {type} t0
		 */
		function loadSinglePage(scope, document, pdfDocument, items, offset, idx, t0) {
			var item = {document: document, pdfPage: null, pageIdx: idx + 1, rotate: null, items: items};
			items.push(item);
			pdfDocument.getPage(idx + 1).then(function (pdfPage) {
				item.pdfPage = pdfPage;
				item.rotate = 0; // c'est ca qui lance le lancement du render
				if ((idx + 1) === pdfDocument.numPages) {
					console.log('Preload sequence ' + (pdfDocument.numPages - offset) + ' pages in %sms', new Date().getTime() - t0);
				}
			});
		}
		/**
		 * Charge les pages de facon récursive ou mix si max est inferieur à numPages 
		 * @param {type} scope
		 * @param {type} document
		 * @param {type} pdfDocument
		 * @param {type} items
		 * @param {type} idx
		 * @param {type} max
		 */
		function loadRecursivePage(scope, document, pdfDocument, items, idx, max) {
			if (idx < max && idx < pdfDocument.numPages) {
				return pdfDocument.getPage(idx + 1).then(function (pdfPage) {
					if (scope.ngDocument === document) { // on s'assure que l'on a pas changé de document
						var item = {document: document, pdfPage: pdfPage, pageIdx: idx + 1, rotate: 0, items: items};
						items.push(item);
						scope.$apply();
						return loadRecursivePage(scope, document, pdfDocument, items, idx + 1, max);
					}
				});
			} else {
				for (var i = idx; i < pdfDocument.numPages; i++) {
					loadSinglePage(scope, document, pdfDocument, scope.ngModel, idx, i, new Date().getTime());
				}
				scope.$apply();
			}
			return null;
		}
	}
	/*******************************************************************
	 * 
	 * PDF-COMMANDS
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfCommands', pdfCommands);
	/* @ngInject */
	function pdfCommands() {
		return {
			restrict: 'E',
			templateUrl: 'pdfcommands.html',
			scope: {
				// nom interne : nom externe
				'ngIndex': '=',
				'ngTotal': '<',
				'ngScale': '=',
				'ngRotate': '=',
				'onPrint': '&',
				'onDownload': '&'
			}
		};
	}
	/*******************************************************************
	 * 
	 * PDF-THUMBNAIL
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfThumbnail', pdfThumbnail);
	/* @ngInject */
	function pdfThumbnail() {
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
				cleanWatchersOnDestroy(scope, watcherClears);
			}
		};
		function updateNgItem(scope, elm, item) {
			if (item && item.pdfPage) {
				var thumbnail = elm.get(0);
				var render = isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0]);
				var pdfPage = item.pdfPage;
				var view = pdfPage.view;
				var scale = (scope.ngHeight || 100) / Math.max(view[2], view[3]);
				var thumbnail = drawPdfPageToThumbnail(elm, pdfPage, item.rotate, scale, render);
				thumbnail.item = item;
				item.selected = true;
			} else {
				drawPdfPageToThumbnail(elm, null, 0, scale, render);
			}
		}
	}
	function PdfThumbnailCtrl($scope, $timeout) {
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
//			$scope.ngItem.items.splice(idx + 1, 0, $scope.ngItem);
		}
	}
	/*******************************************************************
	 * 
	 * PDF-THUMBNAILS
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfThumbnails', pdfThumbnails);
	/* @ngInject */
	function pdfThumbnails($timeout, $window) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnails.html',
			controller: PdfThumbnailsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngValues': '=', // la liste de items represantant les pages du document
				'allowDrag': '<', // Les miniatures sont elles draggables
				'allowDrop': '<', // Les miniatures sont elles droppables ici
				'ngHeight': '<', // la hauteur désiré des miniatures
				'selectedIndex': '=', // l'index de la miniature sélectionnée
				'onSelect': '&' // qd on selection une miniature
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['selectedIndex', 'ngValues.length'], function (vs1, vs2, s) {
					updateSelectedIndex(s, s.ctrl, elm, vs1[0]);
				}, true));
				cleanWatchersOnDestroy(scope, watcherClears);
				var container = elm.get(0).firstChild;
				manageScrollHandler(scope, container);
				manageResizeHandler(scope, container);
				manageDragAndDropHandler(scope, elm);
				updateSelectedIndex(scope, ctrl, elm, scope.selectedIndex);
			}
		};
		function manageDragAndDropHandler(scope, elm) {
			if (!window.dataTransfer) {
				window.dataTransfer = {};
			}
			if (scope.allowDrag) {
				elm.bind('dragstart', window.dataTransfer, handleDragStartJQuery);
			}
			if (scope.allowDrop) {
				elm.bind('dragover', window.dataTransfer, handleDragOverJQuery);
				elm.bind('drop', window.dataTransfer, handleDropJQuery);
				elm.bind('dropend', window.dataTransfer, handleDropendJQuery);
				elm.bind('dropleave', window.dataTransfer, handleDropleaveJQuery);
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
			function handleDropendJQuery(jqe) {
				console.log('dropend');
			}
			function handleDropleaveJQuery(jqe) {
				console.log('dropleave');
			}
			function handleDragStart(e, data) {
				var currentDrag = e.path.filter(function (e) {
					return e.nodeName === 'PDF-THUMBNAIL';
				})[0];
				data.item = currentDrag.item;
				data.item.moving = true;
				e.dataTransfer.effectAllowed = 'move';
			}
			function handleDragOver(e, data) {
				if (e.preventDefault) {
					e.preventDefault(); // Necessary. Allows us to drop.
				}
				if (data.item) {
					e.dataTransfer.dropEffect = 'move';
					var pdfthumbnails = e.path.filter(function (e) {
						return e.nodeName === 'PDF-THUMBNAILS';
					})[0];
					if (pdfthumbnails) {
						var currentOver = e.path.filter(function (e) {
							return e.nodeName === 'PDF-THUMBNAIL';
						})[0];
						moveOrCopyThumbnail(scope, data.item, scope.ngValues, currentOver, e.clientX);
					}
				}
				return false;
			}
			function handleDrop(e, data) {
				data.item.moving = false;
				scope.$apply();
				data.item = null;
				return false;
			}
		}
		function moveOrCopyThumbnail(scope, item, items, currentOver, clientX) {
			item = getItemInListOrClone(scope, item, items);
			if (!item) {
				return;
			}
			var currentIdx = getIndexOfItemInList(item, items);
			if (currentOver) {
				if (currentOver.item && currentOver.item !== item) { // on n'est pas dessus
					items.splice(currentIdx, 1);
					var idx = getIndexOfItemInList(currentOver.item, items);
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
				item.moving = false; // end of move
				var currentIdx = getIndexOfItemInList(item, items);
				if (currentIdx === -1) { // n'existe ps, on clone
					item = {document: item.document, pdfPage: item.pdfPage, pageIdx: item.pageIdx, rotate: item.rotate, items: items};
				} else {
					item = getItemInList(item, items);
				}
				window.dataTransfer.item = item;
				item.moving = true;
				scope.$apply();
			}
			return item;
		}
		function getHMedian(clientRect) {
			return ((clientRect.right - clientRect.left) / 2) + clientRect.left;
		}
		function getIndexOfItemInList(item, items) {
			return __.findIndex(items, function (it) {
				return it.document === item.document && it.pageIdx === item.pageIdx;
			});
		}
		function getItemInList(item, items) {
			return __.find(items, function (it) {
				return it.document === item.document && it.pageIdx === item.pageIdx;
			});
		}
		/**
		 * Gestion du resize s
		 * @param {type} scope
		 * @param {type} container
		 */
		function manageResizeHandler(scope, container) {
			ng.element($window).bind('resize', {promise: null, container: container, height: scope.ngHeight}, manageDrawVisiblePfgThumbnailsHandler);
		}
		/**
		 * Gestion du scroll de la zone de miniature
		 * @param {type} scope
		 * @param {type} container
		 */
		function manageScrollHandler(scope, container) {
			ng.element(container).bind('scroll', {promise: null, container: container, height: scope.ngHeight}, manageDrawVisiblePfgThumbnailsHandler);
		}
		function manageDrawVisiblePfgThumbnailsHandler(evt) {
			var data = evt.data;
			if (data.promise) {
				$timeout.cancel(data.promise);
			}
			data.promise = $timeout(drawVisiblePfgThumbnails, 500, false, data.container.getClientRects()[0], data.height);
		}
		/**
		 * Dessine tous les miniatures notrendered dans la zone visible dans le clientRect
		 * @param {type} clientRect
		 * @param {type} height : hauteur de la miniature
		 * @returns {undefined}
		 */
		function drawVisiblePfgThumbnails(clientRect, height) {
			var first = document.elementFromPoint(clientRect.left + 5, clientRect.top + 5);
			if (first.nodeName === 'PDF-THUMBNAIL') {
				var thumbnail = first;
				while (thumbnail !== null && isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0])) {
					var parent = ng.element(thumbnail);
					if (parent.hasClass('notrendered')) {
						var item = thumbnail.item;
						var view = item.pdfPage.view;
						var scale = (height || 100) / Math.max(view[2], view[3]);
						drawPdfPageToThumbnail(parent, item.pdfPage, item.rotate, scale, true);
					}
					thumbnail = thumbnail.nextElementSibling;
				}
			}
		}
		/**
		 * L'index de la selection et changé, on selectionne le bon item et on s'assure qu'il soit visible.
		 * @param {type} scope
		 * @param {type} ctrl
		 * @param {type} elm
		 * @param {type} selectedIndex
		 * @returns {undefined}
		 */
		function updateSelectedIndex(scope, ctrl, elm, selectedIndex) {
			ctrl.selectedItem = null;
			if (!scope.ngValues)
				return;
			var item = scope.ngValues[selectedIndex || 0];
			if (!item)
				return;
			ctrl.selectedItem = item;
			var container = elm.get(0).firstChild;
			var thumbnail = container.children[selectedIndex];
			ensureIsHVisibleIn(thumbnail, container);
			if (scope.onSelect) {
				scope.onSelect({item: item});
			}
		}
	}
	function PdfThumbnailsCtrl($scope) {
		var ctrl = this;
		ctrl.selectedItem = null;
		ctrl.selectByClick = selectByClick;
		function selectByClick(item, index) {
			$scope.selectedIndex = index;
			ctrl.selectedItem = item;
			if ($scope.onSelect) {
				$scope.onSelect({item: item});
			}
		}
	}
	/*******************************************************************
	 * 
	 * PDF-VIEW
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfView', pdfView);
	/* @ngInject */
	function pdfView() {
		return {
			restrict: 'E',
			templateUrl: 'pdfview.html',
			transclude: true,
			scope: {
				// nom interne : nom externe
				'pdfPage': '<',
				'rotate': '<',
				'ngScale': '<'
			},
			link: function (scope, elm, attrs, ctrl) {
				var watcherClears = [];
				watcherClears.push(scope.$watchGroup(['pdfPage', 'rotate', 'ngScale'], function (vs1, vs2, s) {
					if (!__.isEqual(vs1, vs2)) {
						updateView(elm, vs1[0], vs1[1], vs1[2]);
					}
				}, true));
				cleanWatchersOnDestroy(scope, watcherClears);
				updateView(elm, scope.pdfPage, scope.rotate, scope.ngScale);
			}
		};
		function updateView(elm, pdfPage, rotate, scale) {
			elm.addClass('notrendered');
			drawPdfPageToView(elm, pdfPage, rotate, scale, true);
		}
	}
	/*
	 * GLOBAL METHODS
	 */
	/*
	 * clean les watchers sur le scope
	 * @param {type} scope
	 * @param {type} watcherClears
	 */
	function cleanWatchersOnDestroy(scope, watcherClears) {
		scope.$on('$destroy', function () {
			// stop watching when scope is destroyed
			watcherClears.forEach(function (watcherClear) {
				watcherClear();
			});
		});
	}
	/**
	 * Dessine la page du pdf dans elm, elm etant un pdf-view 
	 * @param {type} elm
	 * @param {type} pdfPage
	 * @param {type} rotate
	 * @param {type} scale
	 * @param {type} render
	 * return 
	 */
	function drawPdfPageToView(elm, pdfPage, rotate, scale, render) {
		var canvas = elm.find('canvas').get(0);
		var page = elm.find('.page').get(0);
		var textLayer = elm.find('.textLayer').get(0);
		var wrapper = elm.find('.canvasWrapper').get(0);
		if (textLayer) {
			textLayer.innerHTML = "";
		}
		if (canvas) {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (pdfPage) {
				var viewport = pdfPage.getViewport(scale, rotate || 0);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				if (page) {
					page.style.width = viewport.width + 'px';
					page.style.height = viewport.height + 'px';
				}
				if (wrapper) {
					wrapper.style.width = viewport.width + 'px';
					wrapper.style.height = viewport.height + 'px';
				}
				if (render) {
					pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.then(function () {
						elm.removeClass('notrendered');
						if (textLayer) {
							textLayer.style.width = viewport.width + 'px';
							textLayer.style.height = viewport.height + 'px';
							pdfPage.getTextContent().then(function (textContent) {
								PDFJS.renderTextLayer({
									textContent: textContent,
									container: textLayer,
									viewport: viewport,
									textDivs: []
								});
								page.classList.remove('loading');
							});
						}
					});
					//return renderTask.promise;
				} else {
					elm.addClass('notrendered');
				}
			}
		}
		return null;
	}
	/**
	 * Dessine la page du pdf dans elm, elm etant un pdf-thumbnail 
	 * @param {type} elm
	 * @param {type} pdfPage
	 * @param {type} rotate
	 * @param {type} scale
	 * @param {type} render
	 * @returns {thumbnail}
	 */
	function drawPdfPageToThumbnail(elm, pdfPage, rotate, scale, render) {
		var canvas = elm.find('canvas').get(0);
		if (canvas) {
			var ctx = canvas.getContext('2d');
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			if (pdfPage) {
				var viewport = pdfPage.getViewport(scale, rotate || 0);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				if (render) {
					pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.then(function () {
						elm.removeClass('notrendered');
					});
				} else {
					elm.addClass('notrendered');
				}
			} else {
				canvas.width = 61;
				canvas.height = 87;
				elm.addClass('notrendered');
			}
			var thumbnail = elm.get(0);
			return thumbnail;
		}
		return null;
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
	 * Détermine si le rectangle1 est visible entierement ou en partie horizontalement dans le rectangle2
	 * @param {ClientRects} clientRects1
	 * @param {ClientRects} clientRects2
	 * @returns {Boolean}
	 */
	function isHVisibleIn(clientRects1, clientRects2) {
		return clientRects1.left <= clientRects2.right && clientRects1.right >= clientRects2.left;
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
	 * Détermine si le rectangle1 est visible entierement ou en partie verticalement dans le rectangle2
	 * @param {ClientRects} clientRects1
	 * @param {ClientRects} clientRects2
	 * @returns {Boolean}
	 */
	function isVVisibleIn(clientRects1, clientRects2) {
		return clientRects1.top <= clientRects2.bottom && clientRects1.bottom >= clientRects2.top;
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
})(angular, _, PDFJS, pdfjsLib);
