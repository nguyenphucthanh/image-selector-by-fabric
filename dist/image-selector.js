'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MODE_SELECT = 'MODE_SELECT';
var MODE_PAN = 'MODE_PAN';
var ZOOM_IN = 'ZOOM_IN';
var ZOOM_OUT = 'ZOOM_OUT';
var MODE_CREATE_RECT = 'MODE_CREATE_RECT';
var MODE_CREATE_CIRCLE = 'MODE_CREATE_CIRCLE';

var ImageSelector = function () {
	function ImageSelector(container, buttonContainer) {
		var _this = this;

		var width = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 640;
		var height = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 480;

		_classCallCheck(this, ImageSelector);

		if (!container || !buttonContainer) {
			alert('Please identity a container for containing editor!');
		}
		this.minZoom = 1;
		this.maxZoom = 10;
		this.currentMode = MODE_SELECT;
		this.currentEditingImage = null;
		this.squareSelections = [];
		this.roundSelections = [];
		this.polygonSelections = [];
		this.controls = {};
		this.panOrigin = {
			x: 0,
			y: 0
		};
		this.isPanning = false;

		/**
         * append canvas
         */

		var canvas = document.createElement('canvas');
		canvas.id = 'image-selector-canvas';
		canvas.width = width;
		canvas.height = height;

		container.appendChild(canvas);

		this.canvas = new fabric.Canvas(canvas, {
			preserveObjectStacking: true
		});

		/**
         * get controls
         */
		this.controls.btnSelect = buttonContainer.querySelector('[data-mode="' + MODE_SELECT + '"]');
		this.controls.btnMove = buttonContainer.querySelector('[data-mode="' + MODE_PAN + '"]');
		this.controls.btnZoomIn = buttonContainer.querySelector('[data-action="' + ZOOM_IN + '"]');
		this.controls.btnZoomOut = buttonContainer.querySelector('[data-action="' + ZOOM_OUT + '"]');
		this.controls.btnAddRect = buttonContainer.querySelector('[data-mode="' + MODE_CREATE_RECT + '"]');
		this.controls.btnAddCircle = buttonContainer.querySelector('[data-mode="' + MODE_CREATE_CIRCLE + '"]');

		for (var btn in this.controls) {
			this.controls[btn].addEventListener('click', function (ctrl) {
				var mode = ctrl.target.getAttribute('data-mode');
				var action = ctrl.target.getAttribute('data-action');
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

					_this2.createRect(x0 < x ? x0 : x, y0 < y ? y0 : y, Math.abs(x0 - x), Math.abs(y0 - y));
				} else if (_this2.currentMode === MODE_CREATE_CIRCLE) {
					var _getPointer3 = _this2.getPointer(e),
					    _x3 = _getPointer3.x,
					    _y = _getPointer3.y;

					_this2.createCircle(x0 < _x3 ? x0 : _x3, y0 < _y ? y0 : _y, Math.abs(x0 - _x3) / 2);
				}
			});
		}

		/**
      * reset Editor
      */

	}, {
		key: 'resetEditor',
		value: function resetEditor() {
			this.canvas.clear();
			this.currentEditingImage = null;
			this.squareSelections = [];
			this.roundSelections = [];
			this.polygonSelections = [];
		}

		/**
      * switch mode
      * @param {*} mode 
      */

	}, {
		key: 'switchMode',
		value: function switchMode(mode) {
			this.currentMode = mode;
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
			}
		}

		/**
      * do action on editor
      * @param {*} action 
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
				default:
					break;
			}
		}

		/**
      * Add new image to editor
      * @param {*} imageUrl 
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
	}, {
		key: 'switchToModeDrawSelection',
		value: function switchToModeDrawSelection() {
			this.toggleSelection(false);
			this.canvas.selection = true;
		}

		/**
      * Zoom In Editor
      */

	}, {
		key: 'zoomIn',
		value: function zoomIn() {
			var zoom = this.canvas.getZoom();
			if (zoom < this.maxZoom) {
				zoom++;
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
				zoom--;
				this.canvas.setZoom(zoom);
			}
		}
	}, {
		key: 'createRect',
		value: function createRect(x, y, width, height) {
			this.switchMode(MODE_SELECT);

			var shape = new fabric.Rect({
				left: x,
				top: y,
				width: width,
				height: height,
				fill: 'transparent',
				strokeWidth: 1,
				strokeDashArray: [3, 3],
				stroke: '#000000'
			});

			this.squareSelections.push(shape);
			this.canvas.add(shape);
			this.canvas.bringToFront(shape);
			this.canvas.setActiveObject(shape);
		}
	}, {
		key: 'createCircle',
		value: function createCircle(x, y, r) {
			this.switchMode(MODE_SELECT);

			var shape = new fabric.Circle({
				left: x,
				top: y,
				radius: r,
				fill: 'rgba(0,0,0,0)',
				strokeWidth: 1,
				strokeDashArray: [3, 3],
				stroke: '#000000'
			});

			this.roundSelections.push(shape);
			this.canvas.add(shape);
			this.canvas.bringToFront(shape);
			this.canvas.setActiveObject(shape);
		}
	}, {
		key: 'exportToImage',
		value: function exportToImage() {
			var _this4 = this;

			this.squareSelections.forEach(function (shape) {
				_this4.exportShapeToImage(shape);
			});

			this.roundSelections.forEach(function (shape) {
				_this4.exportShapeToImage(shape);
			});
		}
	}, {
		key: 'exportShapeToImage',
		value: function exportShapeToImage(originalShape) {
			var _this5 = this;

			var offscreenCanvas = document.createElement('canvas');
			offscreenCanvas.width = this.canvas.width;
			offscreenCanvas.height = this.canvas.height;

			var context = offscreenCanvas.getContext('2d');

			var image = new Image();

			image.onload = function () {
				context.drawImage(image, _this5.currentEditingImage.getLeft(), _this5.currentEditingImage.getTop(), _this5.currentEditingImage.getWidth(), _this5.currentEditingImage.getHeight());

				// context.clip();

				// context.fillStyle = '#FFFFFF';
				// context.fillRect(100 , 100, 100, 100);

				var shape = originalShape.clone();
				shape.globalCompositeOperation = 'destination-in';
				shape.setFill('red');
				shape.setStrokeWidth(0);
				shape.render(context);

				var newImg = new Image();
				newImg.onload = function () {
					document.querySelector('body').appendChild(newImg);
				};
				newImg.src = _this5.trim(offscreenCanvas).toDataURL('image/png');
			};

			image.src = this.currentEditingImage.getSrc();
		}
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
