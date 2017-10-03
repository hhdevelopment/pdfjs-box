(function (ng, __) {
	'use strict';
	var pdfbox;
	try {
		pdfbox = ng.module('pdfjs-box');
	} catch (e) {
		pdfbox = ng.module('pdfjs-box', []);
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
			isVVisibleIn: isVVisibleIn
		};
		function drawPageWhenAvailableIfVisible(height, elm, thumbnail, item, forceRender) {
			if (elm.hasClass('notrendered')) {
				item.getPage().then(function (pdfPage) {
					var render = forceRender || (thumbnail.parentElement && isHVisibleIn(thumbnail.getClientRects()[0], thumbnail.parentElement.getClientRects()[0]));
					var view = pdfPage.view;
					var scale = (height || 100) / (view[3] - view[1]);
					if (render) {
						var jcanvas = ng.element("<canvas draggable='true' height='" + height + "' width='" + (height * 0.7) + "'></canvas>");
						elm.find('canvas').replaceWith(jcanvas);
						var canvas = jcanvas.get(0);
						drawPdfPageToCanvas(canvas, pdfPage, item.rotate, scale).then(function () {
							elm.removeClass('notrendered');
						});
					}
					item.selected = true;
				});
			}
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
//			return (item1.document === item2.document) && (item1.pageIdx === item2.pageIdx);
		}
	}
})(angular, _);