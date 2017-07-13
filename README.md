# image-selector-by-fabric
## Running Demo
```
$ npm install -g npm-run-all
```
```
$ npm install && bower install && npm start
```
## Usage
### Init
```html
<div id="container"></div>
<div id="button-container" class="btn-group">
    <button data-mode="MODE_SELECT" class="btn" title="Select"><i class="fa fa-hand-pointer-o"></i></button>
    <button data-mode="MODE_CREATE_RECT" class="btn" title="Create Rect Selection"><i class="fa fa-square-o"></i></button>
    <button data-mode="MODE_CREATE_CIRCLE" class="btn" title="Create Circle Selection"><i class="fa fa-circle-o"></i></button>
    <button data-mode="MODE_CREATE_POLYGON" class="btn" title="Create Polygon Selection"><i class="fa fa-star-o"></i></button>
    <button data-mode="MODE_PAN" class="btn" title="Move viewport"><i class="fa fa-arrows"></i></button>
    <button data-action="ROTATE" class="btn" title="Rotate"><i class="fa fa-rotate-left"></i></button>
    <button data-action="ZOOM_IN" class="btn" title="Zoom in"><i class="fa fa-search-plus"></i></button>
    <button data-action="ZOOM_OUT" class="btn" title="Zoom out"><i class="fa fa-search-minus"></i></button>
</div>
```

```javascript
var container = document.getElementById('container');
var buttonContainer = document.getElementById('button-container');
var imageSelect = new ImageSelector(container, buttonContainer);
```
### Methods
#### Reset
Reset whole editor
```javascript
imageSelect.resetEditor();
```
#### Add Image to editor
This method will delete current image and add new image from url into editor.
```javascript
imageSelect.addImagefromUrl(imgUrl);
```
##### Params
- `imgUrl` (`string`): Image url

#### Export To Images
This method will extract all selections to images separately
```javascript
imageSelect.exportToImage();
```
##### Returns `Image[]`
Example
```javascript
var images = imageSelect.exportToImage();
images.forEach(function(img) {
    document.getElementBy('foo').appendChild(img);
});
```

## Properties
### canvas
get the fabric Canvas instance
```javascript
var c = imageSelect.canvas;
```