'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MODE_SELECT = 'MODE_SELECT';
var MODE_PAN = 'MODE_PAN';
var ZOOM_IN = 'ZOOM_IN';
var ZOOM_OUT = 'ZOOM_OUT';
var MODE_CREATE_RECT = 'MODE_CREATE_RECT';
var MODE_CREATE_CIRCLE = 'MODE_CREATE_CIRCLE';
var MODE_CREATE_POLYGON = 'MODE_CREATE_POLYGON';
var ROTATE = 'ROTATE';

var ImageSelector = function () {
	_createClass(ImageSelector, [{
		key: 'initEditor',
		value: function initEditor() {
			this.currentEditingImage = null;
			this.squareSelections = [];
			this.roundSelections = [];
			this.polygonSelections = [];
			this.panOrigin = {
				x: 0,
				y: 0
			};
			this.isPanning = false;
			this.drawingPolygonPoints = [];
			this.drawingPolygon = null;
			this.switchMode(MODE_SELECT);
		}
	}]);

	function ImageSelector(container, buttonContainer, options) {
		var _this = this;

		_classCallCheck(this, ImageSelector);

		/**
   * define default options for this plugin
   */
		var defaultOptions = {
			width: 640,
			height: 480
		};

		this.options = Object.assign({}, defaultOptions, options);

		/**
   * If container or buttonContainer is not passed into constructor
   * then return
   */
		if (!container || !buttonContainer) {
			alert('Please identity a container for containing editor!');
			return;
		}

		this.minZoom = 0.2;
		this.maxZoom = 5;

		/**
         * append canvas to container
         */

		var canvas = document.createElement('canvas');
		canvas.id = 'image-selector-canvas';
		canvas.width = this.options.width;
		canvas.height = this.options.height;

		container.appendChild(canvas);

		this.canvas = new fabric.Canvas(canvas, {
			preserveObjectStacking: true
		});

		this.initEditor();

		/**
         * get controls from buttonContainer
         */

		this.controls = {};
		this.controls.MODE_SELECT = buttonContainer.querySelector('[data-mode="' + MODE_SELECT + '"]');
		this.controls.MODE_PAN = buttonContainer.querySelector('[data-mode="' + MODE_PAN + '"]');
		this.controls.ZOOM_IN = buttonContainer.querySelector('[data-action="' + ZOOM_IN + '"]');
		this.controls.ZOOM_OUT = buttonContainer.querySelector('[data-action="' + ZOOM_OUT + '"]');
		this.controls.MODE_CREATE_RECT = buttonContainer.querySelector('[data-mode="' + MODE_CREATE_RECT + '"]');
		this.controls.MODE_CREATE_CIRCLE = buttonContainer.querySelector('[data-mode="' + MODE_CREATE_CIRCLE + '"]');
		this.controls.ROTATE = buttonContainer.querySelector('[data-action="' + ROTATE + '"]');
		this.controls.MODE_CREATE_POLYGON = buttonContainer.querySelector('[data-mode="' + MODE_CREATE_POLYGON + '"]');

		/**
   * Binding events to buttons
   */
		for (var btn in this.controls) {
			this.controls[btn].addEventListener('click', function (ctrl) {
				var mode = ctrl.currentTarget.getAttribute('data-mode');
				var action = ctrl.currentTarget.getAttribute('data-action');
				if (mode) {
					_this.switchMode(mode);
				}
				if (action) {
					_this.doAction(action);
				}
			});
		}

		/**
         * canvas event
         */
		this.bindCanvasEvent();
	}

	/**
  * get exact coord of pointer in canvas
  * @param {Event} event 
  */


	_createClass(ImageSelector, [{
		key: 'getPointer',
		value: function getPointer(event) {
			var pointer = this.canvas.getPointer(event.e, false);
			return pointer;
		}

		/**
      * bind canvas event
      */

	}, {
		key: 'bindCanvasEvent',
		value: function bindCanvasEvent() {
			var _this2 = this;

			var x0 = 0,
			    y0 = 0;

			this.canvas.on('mouse:down', function (mdEvent) {
				if (_this2.currentMode === MODE_PAN) {
					_this2.isPanning = true;
				} else if (_this2.currentMode === MODE_CREATE_RECT || _this2.currentMode === MODE_CREATE_CIRCLE) {
					var _getPointer = _this2.getPointer(mdEvent),
					    x = _getPointer.x,
					    y = _getPointer.y;

					x0 = x;
					y0 = y;
				}
			});

			this.canvas.on('mouse:move', function (e) {
				if (_this2.currentMode === MODE_PAN && _this2.isPanning && e && e.e) {
					var delta = new fabric.Point(e.e.movementX, e.e.movementY);
					_this2.canvas.relativePan(delta);
				}
			});

			this.canvas.on('mouse:up', function (e) {
				if (_this2.currentMode === MODE_PAN && _this2.isPanning) {
					_this2.isPanning = false;
				} else if (_this2.currentMode === MODE_CREATE_RECT) {
					var _getPointer2 = _this2.getPointer(e),
					    x = _getPointer2.x,
					    y = _getPointer2.y;

					var left = x0 < x ? x0 : x;
					var top = y0 < y ? y0 : y;
					var width = Math.abs(x0 - x);
					var height = Math.abs(y0 - y);
					_this2.createRect(left, top, width, height);
				} else if (_this2.currentMode === MODE_CREATE_CIRCLE) {
					var _getPointer3 = _this2.getPointer(e),
					    _x = _getPointer3.x,
					    _y = _getPointer3.y;

					var _left = x0 < _x ? x0 : _x;
					var _top = y0 < _y ? y0 : _y;
					var r = Math.abs(x0 - _x) / 2;
					var _height = Math.abs(y0 - _y);
					_this2.createCircle(_left, _top, r, _height);
				} else if (_this2.currentMode === MODE_CREATE_POLYGON) {
					var point = _this2.getPointer(e);
					_this2.drawingPolygonPoints.push(point);
					_this2.drawPolygon();
				}
			});

			this.canvas.on('mouse:dblclick', function (e) {
				if (_this2.currentMode === MODE_CREATE_POLYGON) {
					var point = _this2.getPointer(e);

					_this2.drawingPolygonPoints.push(point);
					_this2.drawPolygon(true);

					// back to SELECT mode
					_this2.switchMode(MODE_SELECT);
				}
			});

			fabric.util.addListener(this.canvas.upperCanvasEl, 'dblclick', function (event) {
				var target = _this2.canvas.findTarget(event);
				_this2.canvas.fire('mouse:dblclick', {
					target: target,
					e: event
				});
			});
		}

		/**
      * reset Editor
      */

	}, {
		key: 'resetEditor',
		value: function resetEditor() {
			this.canvas.clear();
			this.initEditor();
		}

		/**
      * switch mode
      * @param {string} mode 
      */

	}, {
		key: 'switchMode',
		value: function switchMode(mode) {
			/**
    * if user hit the same MODE, return
    */
			if (mode === this.currentMode) {
				return;
			}

			console.log('SWITCH_MODE', mode);

			/**
    * Special case:
    * current mode: MODE_CREATE_POLYGON
    */
			if (this.currentMode === MODE_CREATE_POLYGON) {
				this.controls[MODE_CREATE_POLYGON].classList.remove('active');
				this.drawPolygon(true);
			}

			this.currentMode = mode;

			for (var ctrl in this.controls) {
				if (this.controls[ctrl].classList.contains('active')) {
					this.controls[ctrl].classList.remove('active');
				}

				if (ctrl === mode) {
					this.controls[ctrl].classList.add('active');
				}
			}
			switch (mode) {
				default:
				case MODE_SELECT:
					this.switchToModeSelect();
					break;
				case MODE_PAN:
					this.switchToModePan();
					break;
				case MODE_CREATE_RECT:
				case MODE_CREATE_CIRCLE:
					this.switchToModeDrawSelection();
					break;
				case MODE_CREATE_POLYGON:
					this.switchToModePolygon();
					break;
			}
		}

		/**
      * do action on editor
      * @param {string} action 
      */

	}, {
		key: 'doAction',
		value: function doAction(action) {
			switch (action) {
				case ZOOM_IN:
					this.zoomIn();
					break;
				case ZOOM_OUT:
					this.zoomOut();
					break;
				case ROTATE:
					this.rotate();
					break;
				default:
					break;
			}
		}

		/**
      * Add new image to editor
      * @param {string} imageUrl 
      */

	}, {
		key: 'addImagefromUrl',
		value: function addImagefromUrl(imageUrl) {
			var _this3 = this;

			if (this.currentEditingImage) {
				this.canvas.remove(this.currentEditingImage);
				this.currentEditingImage = null;
			}

			var img = fabric.Image.fromURL(imageUrl, function (img) {
				_this3.currentEditingImage = img;

				// let wRatio = this.canvas.width / img.width;
				// let hRatio = this.canvas.height / img.height;
				// let scale = wRatio > hRatio ? hRatio : wRatio;
				// img.set({
				//     scaleX: scale,
				//     scaleY: scale
				// });

				_this3.canvas.add(img);
				_this3.canvas.sendToBack(img);

				_this3.canvas.renderAll();
			});
		}

		/**
      * turn on select picture mode
      */

	}, {
		key: 'switchToModeSelect',
		value: function switchToModeSelect() {
			this.toggleSelection(true);
		}

		/**
   * enable / disable selection / object selectable
   * @param {boolean} enable 
   */

	}, {
		key: 'toggleSelection',
		value: function toggleSelection(enable) {
			this.canvas.selection = enable;
			if (this.currentEditingImage) this.currentEditingImage.selectable = enable;
			this.squareSelections.forEach(function (item) {
				item.selectable = enable;
			});
			this.roundSelections.forEach(function (item) {
				item.selectable = enable;
			});
			this.polygonSelections.forEach(function (item) {
				item.selectable = enable;
			});
			this.canvas.discardActiveGroup();
			this.canvas.discardActiveObject();
			this.canvas.renderAll();
		}

		/**
      * switch to selection mode
      */

	}, {
		key: 'switchToModePan',
		value: function switchToModePan() {
			this.toggleSelection(false);
		}

		/**
   * switch to drawing shape mode (not fabric draw mode)
   */

	}, {
		key: 'switchToModeDrawSelection',
		value: function switchToModeDrawSelection() {
			this.canvas.discardActiveObject();
			this.toggleSelection(false);
			this.canvas.selection = true;
		}

		/**
   * start drawing polying mode
   */

	}, {
		key: 'switchToModePolygon',
		value: function switchToModePolygon() {
			this.drawingPolygonPoints = [];
			this.drawingPolygon = null;
			this.toggleSelection(false);
		}

		/**
      * Zoom In Editor
      */

	}, {
		key: 'zoomIn',
		value: function zoomIn() {
			var zoom = this.canvas.getZoom();
			if (zoom < this.maxZoom) {
				zoom += 0.1;
				this.canvas.setZoom(zoom);
			}
		}

		/**
      * Zoom Out Editor
      */

	}, {
		key: 'zoomOut',
		value: function zoomOut() {
			var zoom = this.canvas.getZoom();
			if (zoom > this.minZoom) {
				zoom -= 0.1;
				this.canvas.setZoom(zoom);
			}
		}

		/**
   * Rotate active object of the canvas
   */

	}, {
		key: 'rotate',
		value: function rotate() {
			var activeObject = this.canvas.getActiveObject();
			if (activeObject) {
				var currentRotate = activeObject.getAngle();
				activeObject.setAngle(currentRotate - 90);
				this.canvas.renderAll();
			}
		}

		/**
   * draw rect
   * @param {number} x 
   * @param {number} y 
   * @param {number} width 
   * @param {number} height 
   */

	}, {
		key: 'createRect',
		value: function createRect(x, y, width, height) {
			this.switchMode(MODE_SELECT);

			var shape = new fabric.Rect({
				left: x,
				top: y,
				width: width,
				height: height,
				fill: 'rgba(255, 255, 255, 0.5)',
				strokeWidth: 1,
				strokeDashArray: [3, 3],
				stroke: '#000000'
			});

			this.squareSelections.push(shape);
			this.canvas.add(shape);
			this.canvas.bringToFront(shape);
			this.canvas.setActiveObject(shape);
		}

		/**
   * draw circle
   * @param {number} x 
   * @param {number} y 
   * @param {number} r 
   * @param {number} height 
   */

	}, {
		key: 'createCircle',
		value: function createCircle(x, y, r, height) {
			this.switchMode(MODE_SELECT);

			var shape = new fabric.Circle({
				left: x,
				top: y,
				radius: r,
				fill: 'rgba(255, 255, 255, 0.5)',
				strokeWidth: 1,
				strokeDashArray: [3, 3],
				stroke: '#000000'
			});

			var scaleY = height / (r * 2);
			shape.setScaleY(scaleY);

			this.roundSelections.push(shape);
			this.canvas.add(shape);
			this.canvas.bringToFront(shape);
			this.canvas.setActiveObject(shape);
		}

		/**
   * draw polygon
   * @param {boolean} lastPoint if this param is passed as true the the drawing Polygon will be completed
   * @param {string} returnToMode if not specified will return canvas to select mode
   */

	}, {
		key: 'drawPolygon',
		value: function drawPolygon(lastPoint) {
			var _ref;

			// remove previous state of polygon
			if (this.drawingPolygon) {
				this.canvas.remove(this.drawingPolygon);
			}

			// prepare new state of polygon
			var newPolygon = new fabric.Polygon(this.drawingPolygonPoints, (_ref = {
				strokeWidth: 0,
				fill: 'rgba(255, 255, 255, 0.5)',
				selectable: false
			}, _defineProperty(_ref, 'strokeWidth', 1), _defineProperty(_ref, 'strokeDashArray', [3, 3]), _defineProperty(_ref, 'stroke', '#000000'), _ref));

			// set as currenly drawing polygon, draw to canvas, and set as active
			this.drawingPolygon = newPolygon;
			this.canvas.add(this.drawingPolygon);
			this.canvas.setActiveObject(this.drawingPolygon);

			// If this is the last point of polygon
			if (lastPoint) {
				// new polygon should be selectable and active after creating
				newPolygon.selectable = true;
				this.canvas.setActiveObject(newPolygon);

				// reset temp variable of polygon
				this.drawingPolygon = null;
				this.drawingPolygonPoints = [];

				// push new Polygon to selection array
				this.polygonSelections.push(newPolygon);
			}

			this.canvas.renderAll();
		}

		/**
   * export to image
   * @return Array<Image>
   */

	}, {
		key: 'exportToImage',
		value: function exportToImage() {
			var _this4 = this;

			var squares = this.squareSelections.map(function (shape) {
				return _this4.exportShapeToImage(shape);
			});

			var rounds = this.roundSelections.map(function (shape) {
				return _this4.exportShapeToImage(shape);
			});

			var pols = this.polygonSelections.map(function (shape) {
				return _this4.exportShapeToImage(shape);
			});

			return [].concat(_toConsumableArray(squares), _toConsumableArray(rounds), _toConsumableArray(pols));
		}

		/**
   * Export a selection area to a separated image
   * @param {Object} originalShape this is Fabric Object class
   * @return Image
   */

	}, {
		key: 'exportShapeToImage',
		value: function exportShapeToImage(originalShape) {
			var offscreenCanvas = document.createElement('canvas');
			offscreenCanvas.width = this.currentEditingImage.getWidth();
			offscreenCanvas.height = this.currentEditingImage.getHeight();

			var context = offscreenCanvas.getContext('2d');

			var image = new Image();
			var newImg = new Image();

			this.currentEditingImage.render(context);

			var shape = originalShape.clone();
			shape.globalCompositeOperation = 'destination-in';
			shape.setFill('red');
			shape.setStrokeWidth(0);
			shape.render(context);

			newImg.src = this.trim(offscreenCanvas).toDataURL('image/png');

			return newImg;
		}

		/**
   * @param {HTMLElement} c canvas element
   */

	}, {
		key: 'trim',
		value: function trim(c) {
			var ctx = c.getContext('2d'),
			    copy = document.createElement('canvas').getContext('2d'),
			    pixels = ctx.getImageData(0, 0, c.width, c.height),
			    l = pixels.data.length,
			    i,
			    bound = {
				top: null,
				left: null,
				right: null,
				bottom: null
			},
			    x,
			    y;

			for (i = 0; i < l; i += 4) {
				if (pixels.data[i + 3] !== 0) {
					x = i / 4 % c.width;
					y = ~~(i / 4 / c.width);

					if (bound.top === null) {
						bound.top = y;
					}

					if (bound.left === null) {
						bound.left = x;
					} else if (x < bound.left) {
						bound.left = x;
					}

					if (bound.right === null) {
						bound.right = x;
					} else if (bound.right < x) {
						bound.right = x;
					}

					if (bound.bottom === null) {
						bound.bottom = y;
					} else if (bound.bottom < y) {
						bound.bottom = y;
					}
				}
			}

			var trimHeight = bound.bottom - bound.top,
			    trimWidth = bound.right - bound.left,
			    trimmed = ctx.getImageData(bound.left, bound.top, trimWidth, trimHeight);

			copy.canvas.width = trimWidth;
			copy.canvas.height = trimHeight;
			copy.putImageData(trimmed, 0, 0);

			// open new window with trimmed image:
			return copy.canvas;
		}
	}]);

	return ImageSelector;
}();
