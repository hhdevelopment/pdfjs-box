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
						console.log('Preload recursive '+Math.min(pdfjsConfig.preloadRecursivePages, pdfDocument.numPages)+' pages in %sms', new Date().getTime()-t0);
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
		 * @param {type} idx
		 * @param {type} t0
		 */
		function loadSinglePage(scope, document, pdfDocument, items, offset, idx, t0) {
			var item = {document: document, pdfPage: null, pageIdx: idx + 1, rotate: null, items: items};
			items.push(item);
			pdfDocument.getPage(idx + 1).then(function (pdfPage) {
				item.pdfPage = pdfPage;
				item.rotate = 0; // c'est ca qui lance le lancement du render
				scope.$apply();
				if((idx + 1) === pdfDocument.numPages) {
					console.log('Preload sequence '+(pdfDocument.numPages-offset)+' pages in %sms', new Date().getTime()-t0);
				}
			});
		}
		/**
		 * Charge les pages de facon récursive ou mix si max est inferieur à 
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
					var item = {document: document, pdfPage: pdfPage, pageIdx: idx + 1, rotate: 0, items: items};
					if(scope.ngDocument === document) { // on s'assure que l'on a pas changé de document
						items.push(item);
						scope.$apply();
						return loadRecursivePage(scope, document, pdfDocument, items, idx + 1, max);
					}
				});
			} else {
				for (var i = idx; i < pdfDocument.numPages; i++) {
					loadSinglePage(scope, document, pdfDocument, scope.ngModel, idx, i, new Date().getTime());
				}
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
				'ngRotate': '='
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
				var tumbnail = elm.get(0);
				var render = isHVisibleIn(tumbnail.getClientRects()[0], tumbnail.parentElement.getClientRects()[0]);
				var pdfPage = item.pdfPage;
				var view = pdfPage.view;
				var scale = (scope.ngHeight || 100) / Math.max(view[2], view[3]);
				var tumbnail = drawPdfPageToThumbnail(elm, pdfPage, item.rotate, scale, render);
				tumbnail.item = item;
			} else {
				drawPdfPageToThumbnail(elm, null, 0, scale, render);
			}
		}
	}
	/*******************************************************************
	 * 
	 * PDF-THUMBNAILS
	 * 
	 ******************************************************************/
	pdfbox.directive('pdfThumbnails', pdfThumbnails);
	/* @ngInject */
	function pdfThumbnails($timeout, $window, pdfjsConfig) {
		return {
			restrict: 'E',
			templateUrl: 'pdfthumbnails.html',
			controller: PdfThumbnailsCtrl,
			controllerAs: 'ctrl',
			scope: {
				// nom interne : nom externe
				'ngValues': '=', // la liste de items represantant les pages du document
				'allowDrag':'<', // Les miniatures sont elles draggables
				'allowDrop':'<', // Les miniatures sont elles droppables ici
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
			if(!window.dataTransfer) {
				window.dataTransfer = {};
			}
			if(scope.allowDrag) {
				elm.bind('dragstart', window.dataTransfer, handleDragStartJQuery);
			}
			if(scope.allowDrop) {
				elm.bind('dragover', window.dataTransfer, handleDragOverJQuery);
				elm.bind('drop', window.dataTransfer, handleDropJQuery);
				elm.bind('dropeend', window.dataTransfer, handleDropJQuery);
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
				return handleDropend(jqe.originalEvent, jqe.data);
			}
			function handleDragStart(e, data) {
				data.srcNode = null;
				var currentDrag = e.path.filter(function (e) {
					return e.nodeName === 'PDF-THUMBNAIL';
				})[0];
				data.srcNode = currentDrag;
				data.srcNode.classList.add('moving');
				data.srcClone = cloneThumbnail(currentDrag);
				data.srcClone.classList.remove('active');
				data.srcClone.classList.add('moving');
				e.dataTransfer.effectAllowed = 'move';
			}
			function handleDragOver(e, data) {
				if(data.srcNode) {
					e.dataTransfer.dropEffect = 'move';
					var currentOver = e.path.filter(function (e) {
						return e.nodeName === 'PDF-THUMBNAIL';
					})[0];
					var parentTarget = e.path.filter(function (e) {
						return e.nodeName === 'DIV';
					})[0];
					var srcNode = data.srcClone;
					// si on reviens sur le conteneur d'origine, on supprime la copie
					if(data.srcNode.parentElement === parentTarget) {
						srcNode = data.srcNode;
						if(data.srcClone.parentElement) {
							data.srcClone.parentElement.removeChild(data.srcClone);
						}
					}
					moveThumbnailAndItem(srcNode, currentOver, parentTarget, e.clientX);
				}
				return false;
			}
			function handleDrop(e, data) {
				if(data.srcNode) {
					data.srcNode.classList.remove('moving');
				}
				if(data.srcClone) {
					data.srcClone.classList.remove('moving');
				}
				return false;
			}
			function handleDropend(e, data) {
				if(data.srcNode) {
					data.srcNode.classList.remove('moving');
				}
				if(data.srcClone && data.srcClone.parentElement) {
					var parentTarget = e.path.filter(function (e) {
						return e.nodeName === 'DIV';
					})[0];
					if(parentTarget !== data.srcClone.parentElement) {
						data.srcClone.parentElement.removeChild(data.srcClone);
					}
					data.srcClone.classList.remove('moving');
				}
				return false;
			}
		}
		function cloneThumbnail(thumbnail) {
				var clone = thumbnail.cloneNode(true);
				clone.item = thumbnail.item;			
				var canvasSrc = ng.element(thumbnail).find('canvas').get(0);
				var canvasTg = ng.element(clone).find('canvas').get(0);
				var context = canvasTg.getContext('2d');
				context.drawImage(canvasSrc, 0, 0);				
				return clone;
		}
		function moveThumbnailAndItem(currentDrag, currentOver, parentTarget, clientX) {
			if (currentDrag !== currentOver) {
				var median = 100000;
				if(currentOver) {
					var clientRect = currentOver.getClientRects()[0];
					median = ((clientRect.right - clientRect.left) / 2) + clientRect.left;
				}
//				var items = currentDrag.item.items;
//				var idx = items.indexOf(currentDrag.item);
//				items.splice(idx, 1);
//				var idxTg = items.indexOf(currentOver.item);
				if (clientX < median) {
					parentTarget.insertBefore(currentDrag, currentOver);
				} else {
//					idxTg++;
					parentTarget.insertBefore(currentDrag, currentOver.nextSibling);
				}
//				items.splice(idxTg, 0, currentDrag.item);
			}
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
				var tumbnail = first;
				while (tumbnail !== null && isHVisibleIn(tumbnail.getClientRects()[0], tumbnail.parentElement.getClientRects()[0])) {
					var parent = ng.element(tumbnail);
					if (parent.hasClass('notrendered')) {
						var item = tumbnail.item;
						var view = item.pdfPage.view;
						var scale = (height || 100) / Math.max(view[2], view[3]);
						drawPdfPageToThumbnail(parent, item.pdfPage, item.rotate, scale, true);
					}
					tumbnail = tumbnail.nextElementSibling;
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
			var tumbnail = container.children[selectedIndex];
			ensureIsHVisibleIn(tumbnail, container);
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
						elm.addClass('notrendered');
						updateView(elm, vs1[0], vs1[1], vs1[2]);
					}
				}, true));
				cleanWatchersOnDestroy(scope, watcherClears);
			}
		};
		function updateView(elm, pdfPage, rotate, scale) {
			drawPdfPage(elm, pdfPage, rotate, scale, true);
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
	 * 
	 * @param {type} elm
	 * @param {type} pdfPage
	 * @param {type} rotate
	 * @param {type} scale
	 * @param {type} render
	 * return 
	 */
	function drawPdfPage(elm, pdfPage, rotate, scale, render) {
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
			var tumbnail = elm.get(0);
			var clientRect = tumbnail.getClientRects()[0];
			var padding = Math.max(clientRect.width - canvas.width, 0) / 2;
			tumbnail.style.paddingLeft = padding + "px";
			tumbnail.style.paddingRight = padding + "px";
			return tumbnail;
		}
		return null;
	}
	/**
	 * S'assure que le tumbnail est visible dans le container (horizontalement) et scroll si nécessaire
	 * @param {type} tumbnail
	 * @param {type} container
	 */
	function ensureIsHVisibleIn(tumbnail, container) {
		var clientRects1 = tumbnail.getClientRects()[0];
		var clientRects2 = container.getClientRects()[0];
		if (!isCompletlyHVisibleIn(clientRects1, clientRects2)) {
			if (clientRects1.right > clientRects2.right) { // l'element dépasse à droite
				container.scrollLeft += clientRects1.right - clientRects2.right;
			} else { // l'element dépasse à gauche
				container.scrollLeft -= clientRects2.left - clientRects1.left;
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
	 * S'assure que le tumbnail est visible dans le container (verticalement) et scroll si nécessaire
	 * @param {type} tumbnail
	 * @param {type} container
	 */
	function ensureIsVVisibleIn(tumbnail, container) {
		var clientRects1 = tumbnail.getClientRects()[0];
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
