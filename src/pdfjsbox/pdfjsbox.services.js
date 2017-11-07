(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
	}
	pdfbox.factory('pdfjsboxScaleServices', scaleServices);
	function scaleServices() {
		return {
			getRectangle: getRectangle
		};
		/*
		 * Retourne le rectangle que va occupé la page en tenant compte de la rotation (multiple de 90)
		 * @param {type} scope
		 * @param {type} watcherClears
		 */
		function getRectangle(pdfPage, rotate) {
			if (pdfPage && pdfPage.view) {
				var view = pdfPage.view;
				var vHeight;
				var vWidth;
				var rotation = pdfPage.pageInfo.rotate + (rotate || 0);
				if ((rotation / 90) % 2) {
					vWidth = (view[3] - view[1]);
					vHeight = (view[2] - view[0]);
				} else {
					vHeight = (view[3] - view[1]);
					vWidth = (view[2] - view[0]);
				}
				return {width: vWidth, height: vHeight};
			}
			return {width: 0, height: 0};
		}
	}
	pdfbox.factory('pdfjsboxWatcherServices', watcherServices);
	function watcherServices() {
		return {
			cleanWatchersOnDestroy: cleanWatchersOnDestroy
		};
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
	}
	pdfbox.factory('pdfjsboxDrawServices', drawServices);
	function drawServices() {
		return {
			drawPageWhenAvailableIfVisible: drawPageWhenAvailableIfVisible,
			drawPdfPageToCanvas: drawPdfPageToCanvas,
			isHVisibleIn: isHVisibleIn,
			isVVisibleIn: isVVisibleIn,
			getScrollbarHeight: getScrollbarHeight,
			getScrollbarWidth: getScrollbarWidth,
			isVerticalScrollbarPresent:isVerticalScrollbarPresent,
			isHorizontalScrollbarPresent:isHorizontalScrollbarPresent
		};
		var scrollbarHeight;
		var scrollbarWidth;
		function drawPageWhenAvailableIfVisible(thumbnail, item, forceRender) {
			var elm = ng.element(thumbnail);
			var height = (thumbnail.parentElement.offsetHeight - 20 - getScrollbarHeight()) || 100; // 20px en moins pour le padding 10 en top et bottom
			if (elm.hasClass('notrendered')) {
				var render = forceRender || (thumbnail.parentElement && isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0]));
				if (render) {
					item.getPage().then(function (pdfPage) {
						var view = pdfPage.view;
						var scale = height / (view[3] - view[1]);
						var jcanvas = ng.element("<canvas draggable='true' height='" + height + "' width='" + (height * 0.7) + "'></canvas>");
						elm.find('canvas').replaceWith(jcanvas);
						var canvas = jcanvas.get(0);
						drawPdfPageToCanvas(canvas, pdfPage, item.rotate, scale).then(function () {
							elm.removeClass('notrendered');
						});
					});
				}
			}
		}
		function isVerticalScrollbarPresent(jqElt) {
			var elt = jqElt.get(0);
			return elt.offsetWidth !== elt.clientWidth;
		}
		function isHorizontalScrollbarPresent(jqElt) {
			var elt = jqElt.get(0);
			return elt.offsetHeight !== elt.clientHeight;
		}
		/**
		 * retourne la hauteur des scrollbars
		 * @returns {Number}
		 */
		function getScrollbarHeight() {
			if (scrollbarHeight === undefined) {
				computeScrollbarMeasure();
			}
			return scrollbarHeight;
		}
		/**
		 * retourne la largeur des scrollbars
		 * @returns {Number}
		 */
		function getScrollbarWidth() {
			if (scrollbarWidth === undefined) {
				computeScrollbarMeasure();
			}
			return scrollbarWidth;
		}
		/**
		 * Calcul les dimensions des scrollbars
		 */
		function computeScrollbarMeasure() {
			var scrollDiv = document.createElement("div");
			scrollDiv.className = "all-scrollbars";
			document.body.appendChild(scrollDiv);
			scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			scrollbarHeight = scrollDiv.offsetHeight - scrollDiv.clientHeight;
			document.body.removeChild(scrollDiv);
		}
		/**
		 * Dessine la page du pdf dans le canvas, utilisé pour les pdf-thumbnal ou les pages à print
		 * @param {type} canvas
		 * @param {type} pdfPage
		 * @param {type} rotate
		 * @param {type} scale
		 */
		function drawPdfPageToCanvas(canvas, pdfPage, rotate, scale) {
			if (canvas) {
				var ctx = canvas.getContext('2d');
				var rot = pdfPage.pageInfo.rotate + (rotate || 0);
				ctx.clearRect(0, 0, canvas.width, canvas.height);
				var viewport = pdfPage.getViewport(scale, rot);
				canvas.width = viewport.width;
				canvas.height = viewport.height;
				return pdfPage.render({canvasContext: ctx, viewport: viewport}).promise.catch(function (error) {
					console.log(error);
				});
			}
			return null;
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
		 * Détermine si le rectangle1 est visible entierement ou en partie verticalement dans le rectangle2
		 * @param {ClientRects} clientRects1
		 * @param {ClientRects} clientRects2
		 * @returns {Boolean}
		 */
		function isVVisibleIn(clientRects1, clientRects2) {
			return clientRects1.top <= clientRects2.bottom && clientRects1.bottom >= clientRects2.top;
		}
	}
	pdfbox.factory('pdfjsboxItemServices', itemServices);
	function itemServices() {
		return {
			getIndexOfItemInList: getIndexOfItemInList,
			isContainInList: isContainInList,
			getItemInList: getItemInList,
			areItemsEqual: areItemsEqual,
			cloneItem: cloneItem
		};
		/**
		 * Clone l'tem pour la liste en parametre
		 * @param {Item} item
		 * @param {Array} itemsTarget
		 * @returns {Item}
		 */
		function cloneItem(item, itemsTarget) {
			return {document: item.document, pageIdx: item.pageIdx, rotate: item.rotate, items: itemsTarget, getPage: item.getPage};
		}
		function getIndexOfItemInList(item, items) {
			return item && __.findIndex(items, {'document': item.document, 'pageIdx': item.pageIdx});
		}
		function isContainInList(item, items) {
			return __.some(items, {'document': item.document, 'pageIdx': item.pageIdx});
		}
		function getItemInList(item, items) {
			return item && __.find(items, {'document': item.document, 'pageIdx': item.pageIdx});
		}
		/**
		 * Compare deux items pour determiner s'ils sont egaux
		 * @param {type} item1
		 * @param {type} item2
		 * @returns {Boolean}
		 */
		function areItemsEqual(item1, item2) {
			if (!item1 && !item2) {
				return true;
			}
			if (!item1 || !item2) {
				return false;
			}
			return __.isMatch(item1, {'document': item2.document, 'pageIdx': item2.pageIdx});
		}
	}
})(angular, _);