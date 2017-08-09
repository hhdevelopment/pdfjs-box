# PDFJS-BOX #

pdfjs-box is a collection of angular directives.


```javascript

```


### Usage ###

* Installation

```shell
npm install pdf-merger -save
```

* Add file to your build (webpack, gulp...)

```shell
node_modules/int-selector/dist/pdfmerger.js
node_modules/int-selector/dist/pdfmerger.css
```

* Dependencies

  * angularjs 1.x
  * bootstrap 3.x
  * pdfjs 1.x
  * lodash

* Configuration

1. Add module to your angular application

```javascript
  angular.module("YourApp", [..., 'pdf-merger', ...]);
```

2. Add directive to your html

```html
<pdf-merger 
	pdf-documents="array" 
	global-data="object"
	url-supplier="function"
	label-supplier="function"
	on-save="function"
</pdf-merger>
```

3. Options

* **pdf-documents** : List of document. : default value : **[]**
* **global-data** : common data. : default value : **{}**
* **url-supplier** : An url supplier from document, data and index. : default value : **function(doc, global, idx) {return doc.url;}**
* **label-supplier** : A label supplier from document, data and index.. : default value : **function(doc, global, idx) {return doc.label || doc.name || 'Document '+idx;}**
