import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/js/bootstrap.js';

import angular from 'angular';
//var angular = require('angular');

require('./pdfjsbox.css');
require('./pdfjsbox.config.js');
require('./pdfjsbox.pdfcommands.js');
require('./pdfjsbox.pdfdocument.js');
require('./pdfjsbox.pdfthumbnail.js');
require('./pdfjsbox.pdfthumbnails.js');
require('./pdfjsbox.pdfview.js');
require('./pdfjsbox.services.js');

(function (ng, __) {
	'use strict';
	ng.module('app', ['pdfjs-box'])
			  .constant('pdfjsConfig', { workerSrc: './pdf.worker.bundle.js', preloadRecursivePages:7 } )
			  .controller('AppCtrl', AppCtrl);
	function AppCtrl() {
		var ctrl = this;
		ctrl.documents = [{label:'Conditions générales', url:'document.pdf'}, {label:'Contract', url:'document2.pdf'}, {label:'UnicodeStandard', url:'UnicodeStandard.pdf'}];
		ctrl.items = [];
		ctrl.items2 = [];
		ctrl.selectedDocument;
		ctrl.scale;
		ctrl.selectedItem;
		ctrl.globalData = {test:5};
		ctrl.urlSupplier = urlSupplier;
		ctrl.labelSupplier = labelSupplier;
		ctrl.onSave = onSave;
		
		
		function urlSupplier(document, data) {
			return document.url;
		}
		function labelSupplier(document, data, index) {
			return document.label + ' ('+index+')';
		}
		function onSave(items) {
			alert('document PDF de '+items.length+' pages sauvegardé');
			items.splice(0, items.length);
		}
	}
})(angular, _);
