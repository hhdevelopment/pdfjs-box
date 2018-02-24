import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';
import angular from 'angular';
import 'boxes-scroll/dist/boxesscroll.css';
import 'boxes-scroll/dist/boxesscroll.js';
import 'pdfjs-box/dist/pdfjsbox.css';
import 'pdfjs-box/dist/pdfjsbox.js';

//var angular = require('angular');

require('./pdfs/conditions.pdf');
require('./pdfs/guide.pdf');
require('./pdfs/UnicodeStandard.pdf');
require('./favicon.ico');
require('./index.css');

(function (ng, __) {
	'use strict';
	ng.module('app', ['pdfjs-box'])
			  .constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', cMapUrl:'cmaps/', cMapPacked:true, preloadRecursivePages:7 } )
			  .controller('AppCtrl', AppCtrl);
	function AppCtrl() {
		var ctrl = this;
		ctrl.module = 'pdfjs-box';
		ctrl.documents = [{label:'Conditions générales', url:'conditions.pdf'}, 
			{label:'guide renovation 2016', url:'guide.pdf'}, 
			{label:'UnicodeStandard', url:'UnicodeStandard.pdf'}];
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedDocument;
		ctrl.docscale = 'fit';
		ctrl.quality = 3;
		ctrl.scale;
		ctrl.selectedItem;
		ctrl.onSave = onSave;
		
		
		function onSave(items) {
			alert('document PDF de '+items.length+' pages sauvegardées');
			items.splice(0, items.length);
		}
	}
})(angular, _);
window.countWatchers = countWatchers;
function countWatchers() { 
    var root = angular.element(document.getElementsByTagName('body'));

    var watchers = [];

    var f = function (element) {
        angular.forEach(['$scope', '$isolateScope'], function (scopeProperty) { 
            if (element.data() && element.data().hasOwnProperty(scopeProperty)) {
                angular.forEach(element.data()[scopeProperty].$$watchers, function (watcher) {
                    watchers.push(watcher);
                });
            }
        });

        angular.forEach(element.children(), function (childElement) {
            f(angular.element(childElement));
        });
    };

    f(root);

    // Remove duplicate watchers
    var watchersWithoutDuplicates = [];
    angular.forEach(watchers, function(item) {
        if(watchersWithoutDuplicates.indexOf(item) < 0) {
             watchersWithoutDuplicates.push(item);
        }
    });

    console.log(watchersWithoutDuplicates.length);
}
