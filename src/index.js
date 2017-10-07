import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';

import angular from 'angular';
//var angular = require('angular');

require('./pdfs/conditions.pdf');
require('./pdfs/guide.pdf');
require('./pdfs/UnicodeStandard.pdf');
require('./favicon.ico');
require('./pdfjsbox/pdfjsbox.css');
require('./pdfjsbox/pdfjsbox.config.js');
require('./pdfjsbox/pdfjsbox.pdfdocscale.js');
require('./pdfjsbox/pdfjsbox.pdfcommands.js');
require('./pdfjsbox/pdfjsbox.pdfdocument.js');
require('./pdfjsbox/pdfjsbox.pdfthumbnail.js');
require('./pdfjsbox/pdfjsbox.pdfthumbnails.js');
require('./pdfjsbox/pdfjsbox.pdfview.js');
require('./pdfjsbox/pdfjsbox.services.js');

(function (ng, __) {
	'use strict';
	ng.module('app', ['pdfjs-box'])
			  .constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', preloadRecursivePages:7 } )
			  .controller('AppCtrl', AppCtrl);
	function AppCtrl() {
		var ctrl = this;
		ctrl.documents = [{label:'Conditions générales', url:'conditions.pdf'}, 
			{label:'guide renovation 2016', url:'guide.pdf'}, 
			{label:'UnicodeStandard', url:'UnicodeStandard.pdf'}];
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedDocument;
		ctrl.docscale = 'fitV';
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
