const MODE_SELECT = 'MODE_SELECT';
const MODE_PAN = 'MODE_PAN';
const ZOOM_IN = 'ZOOM_IN';
const ZOOM_OUT = 'ZOOM_OUT';
const MODE_CREATE_RECT = 'MODE_CREATE_RECT';
const MODE_CREATE_CIRCLE = 'MODE_CREATE_CIRCLE';
const MODE_CREATE_POLYGON = 'MODE_CREATE_POLYGON';
const ROTATE = 'ROTATE';

class ImageSelector {
	
	initEditor() {
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

	constructor(container, buttonContainer, options) {
		/**
		 * define default options for this plugin
		 */
		let defaultOptions = {
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

		let canvas = document.createElement('canvas');
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
		this.controls.MODE_SELECT = buttonContainer.querySelector(`[data-mode="${MODE_SELECT}"]`);
		this.controls.MODE_PAN = buttonContainer.querySelector(`[data-mode="${MODE_PAN}"]`);
		this.controls.ZOOM_IN = buttonContainer.querySelector(`[data-action="${ZOOM_IN}"]`);
		this.controls.ZOOM_OUT = buttonContainer.querySelector(`[data-action="${ZOOM_OUT}"]`);
		this.controls.MODE_CREATE_RECT = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_RECT}"]`);
		this.controls.MODE_CREATE_CIRCLE = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_CIRCLE}"]`);
		this.controls.ROTATE = buttonContainer.querySelector(`[data-action="${ROTATE}"]`);
		this.controls.MODE_CREATE_POLYGON = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_POLYGON}"]`);

		/**
		 * Binding events to buttons
		 */
		for (let btn in this.controls) {
			this.controls[btn].addEventListener('click', ctrl => {
				let mode = ctrl.currentTarget.getAttribute('data-mode');
				let action = ctrl.currentTarget.getAttribute('data-action');
				if (mode) {
					this.switchMode(mode);
				}
				if (action) {
					this.doAction(action);
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
	getPointer(event) {
		let pointer = this.canvas.getPointer(event.e, false);
		return pointer;
	}

	/**
     * bind canvas event
     */
	bindCanvasEvent() {
		let x0 = 0,
			y0 = 0;

		this.canvas.on('mouse:down', mdEvent => {
			if (this.currentMode === MODE_PAN) {
				this.isPanning = true;
			} else if (this.currentMode === MODE_CREATE_RECT || this.currentMode === MODE_CREATE_CIRCLE) {
				let { x, y } = this.getPointer(mdEvent);
				x0 = x;
				y0 = y;
			}
		});

		this.canvas.on('mouse:move', e => {
			if (this.currentMode === MODE_PAN && this.isPanning && e && e.e) {
				var delta = new fabric.Point(e.e.movementX, e.e.movementY);
				this.canvas.relativePan(delta);
			}
		});

		this.canvas.on('mouse:up', e => {
			if (this.currentMode === MODE_PAN && this.isPanning) {
				this.isPanning = false;
			} else if (this.currentMode === MODE_CREATE_RECT) {
				let { x, y } = this.getPointer(e);
                let left = x0 < x ? x0 : x;
                let top = y0 < y ? y0 : y;
                let width = Math.abs(x0 - x);
                let height = Math.abs(y0 - y);
				this.createRect(left, top, width, height);
			} else if (this.currentMode === MODE_CREATE_CIRCLE) {
				let { x, y } = this.getPointer(e);
                let left = x0 < x ? x0 : x;
                let top = y0 < y ? y0 : y;
                let r = Math.abs(x0 - x) / 2;
                let height = Math.abs(y0 - y);
				this.createCircle(left, top, r, height);
			} else if (this.currentMode === MODE_CREATE_POLYGON) {
				let point = this.getPointer(e);
				this.drawingPolygonPoints.push(point);
				this.drawPolygon();
			}
		});

		this.canvas.on('mouse:dblclick', (e) => {
			if (this.currentMode === MODE_CREATE_POLYGON) {
				let point = this.getPointer(e);
				
				this.drawingPolygonPoints.push(point);
				this.drawPolygon(true);
				
				// back to SELECT mode
				this.switchMode(MODE_SELECT);
			}
		});

		fabric.util.addListener(this.canvas.upperCanvasEl, 'dblclick', (event) => {
			let target = this.canvas.findTarget(event);
			this.canvas.fire('mouse:dblclick', {
				target: target,
				e: event
			});
		});

	}

	/**
     * reset Editor
     */
	resetEditor() {
		this.canvas.clear();
		this.initEditor();
	}

	/**
     * switch mode
     * @param {string} mode 
     */
	switchMode(mode) {
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

		for (let ctrl in this.controls) {
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
	doAction(action) {
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
	addImagefromUrl(imageUrl) {
		if (this.currentEditingImage) {
			this.canvas.remove(this.currentEditingImage);
			this.currentEditingImage = null;
		}

		let img = fabric.Image.fromURL(imageUrl, img => {
			this.currentEditingImage = img;

			// let wRatio = this.canvas.width / img.width;
			// let hRatio = this.canvas.height / img.height;
			// let scale = wRatio > hRatio ? hRatio : wRatio;
			// img.set({
			//     scaleX: scale,
			//     scaleY: scale
			// });

			this.canvas.add(img);
			this.canvas.sendToBack(img);

			this.canvas.renderAll();
		});
	}

	/**
     * turn on select picture mode
     */
	switchToModeSelect() {
		this.toggleSelection(true);
	}

	/**
	 * enable / disable selection / object selectable
	 * @param {boolean} enable 
	 */
	toggleSelection(enable) {
		this.canvas.selection = enable;
		if (this.currentEditingImage) this.currentEditingImage.selectable = enable;
		this.squareSelections.forEach(item => {
			item.selectable = enable;
		});
		this.roundSelections.forEach(item => {
			item.selectable = enable;
		});
		this.polygonSelections.forEach(item => {
			item.selectable = enable;
		});
		this.canvas.discardActiveGroup();
		this.canvas.discardActiveObject();
		this.canvas.renderAll();
	}

	/**
     * switch to selection mode
     */
	switchToModePan() {
		this.toggleSelection(false);
	}

	/**
	 * switch to drawing shape mode (not fabric draw mode)
	 */
	switchToModeDrawSelection() {
		this.canvas.discardActiveObject();
		this.toggleSelection(false);
		this.canvas.selection = true;
	}

	/**
	 * start drawing polying mode
	 */
	switchToModePolygon() {
		this.drawingPolygonPoints = [];
		this.drawingPolygon = null;
		this.toggleSelection(false);
	}

	/**
     * Zoom In Editor
     */
	zoomIn() {
		let zoom = this.canvas.getZoom();
		if (zoom < this.maxZoom) {
			zoom += 0.1;
			this.canvas.setZoom(zoom);
		}
	}

	/**
     * Zoom Out Editor
     */
	zoomOut() {
		let zoom = this.canvas.getZoom();
		if (zoom > this.minZoom) {
			zoom -= 0.1;
			this.canvas.setZoom(zoom);
		}
	}

	/**
	 * Rotate active object of the canvas
	 */
	rotate() {
		let activeObject = this.canvas.getActiveObject();
		if (activeObject) {
			let currentRotate = activeObject.getAngle();
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
	createRect(x, y, width, height) {
		this.switchMode(MODE_SELECT);

		let shape = new fabric.Rect({
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
	createCircle(x, y, r, height) {
		this.switchMode(MODE_SELECT);

		let shape = new fabric.Circle({
			left: x,
			top: y,
			radius: r,
			fill: 'rgba(255, 255, 255, 0.5)',
			strokeWidth: 1,
			strokeDashArray: [3, 3],
			stroke: '#000000'
		});

        let scaleY = height / (r * 2);
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
	drawPolygon(lastPoint) {
		// remove previous state of polygon
		if (this.drawingPolygon) {
			this.canvas.remove(this.drawingPolygon);
		}

		// prepare new state of polygon
		let newPolygon = new fabric.Polygon(this.drawingPolygonPoints, {
			strokeWidth: 0,
			fill: 'rgba(255, 255, 255, 0.5)',
			selectable: false,
			strokeWidth: 1,
			strokeDashArray: [3, 3],
			stroke: '#000000'
		});

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
    exportToImage() {
        let squares = this.squareSelections.map(shape => {
            return this.exportShapeToImage(shape);
        });

        let rounds = this.roundSelections.map(shape => {
            return this.exportShapeToImage(shape);
        });

		let pols = this.polygonSelections.map(shape => {
			return this.exportShapeToImage(shape);
		});

		return [...squares, ...rounds, ...pols];
    }

	/**
	 * Export a selection area to a separated image
	 * @param {Object} originalShape this is Fabric Object class
	 * @return Image
	 */
	exportShapeToImage(originalShape) {
		let offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = this.currentEditingImage.getWidth();
		offscreenCanvas.height = this.currentEditingImage.getHeight();

		let context = offscreenCanvas.getContext('2d');

		let image = new Image();
		let newImg = new Image();

		this.currentEditingImage.render(context);

		let shape = originalShape.clone();
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
	trim(c) {
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
}