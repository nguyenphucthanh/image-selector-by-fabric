const MODE_SELECT = 'MODE_SELECT';
const MODE_PAN = 'MODE_PAN';
const ZOOM_IN = 'ZOOM_IN';
const ZOOM_OUT = 'ZOOM_OUT';
const MODE_CREATE_RECT = 'MODE_CREATE_RECT';
const MODE_CREATE_CIRCLE = 'MODE_CREATE_CIRCLE';

class ImageSelector {
	constructor(container, buttonContainer, width = 640, height = 480) {
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

		let canvas = document.createElement('canvas');
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
		this.controls.btnSelect = buttonContainer.querySelector(`[data-mode="${MODE_SELECT}"]`);
		this.controls.btnMove = buttonContainer.querySelector(`[data-mode="${MODE_PAN}"]`);
		this.controls.btnZoomIn = buttonContainer.querySelector(`[data-action="${ZOOM_IN}"]`);
		this.controls.btnZoomOut = buttonContainer.querySelector(`[data-action="${ZOOM_OUT}"]`);
		this.controls.btnAddRect = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_RECT}"]`);
		this.controls.btnAddCircle = buttonContainer.querySelector(`[data-mode="${MODE_CREATE_CIRCLE}"]`);

		for (let btn in this.controls) {
			this.controls[btn].addEventListener('click', ctrl => {
				let mode = ctrl.target.getAttribute('data-mode');
				let action = ctrl.target.getAttribute('data-action');
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
				this.createRect(x0 < x ? x0 : x, y0 < y ? y0 : y, Math.abs(x0 - x), Math.abs(y0 - y));
			} else if (this.currentMode === MODE_CREATE_CIRCLE) {
				let { x, y } = this.getPointer(e);
				this.createCircle(x0 < x ? x0 : x, y0 < y ? y0 : y, Math.abs(x0 - x) / 2);
			}
		});
	}

	/**
     * reset Editor
     */
	resetEditor() {
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
	switchMode(mode) {
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
	doAction(action) {
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

	switchToModeDrawSelection() {
		this.toggleSelection(false);
		this.canvas.selection = true;
	}

	/**
     * Zoom In Editor
     */
	zoomIn() {
		let zoom = this.canvas.getZoom();
		if (zoom < this.maxZoom) {
			zoom++;
			this.canvas.setZoom(zoom);
		}
	}

	/**
     * Zoom Out Editor
     */
	zoomOut() {
		let zoom = this.canvas.getZoom();
		if (zoom > this.minZoom) {
			zoom--;
			this.canvas.setZoom(zoom);
		}
	}

	createRect(x, y, width, height) {
		this.switchMode(MODE_SELECT);

		let shape = new fabric.Rect({
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

	createCircle(x, y, r) {
		this.switchMode(MODE_SELECT);

		let shape = new fabric.Circle({
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

    exportToImage() {
        this.squareSelections.forEach(shape => {
            this.exportShapeToImage(shape);
        });

        this.roundSelections.forEach(shape => {
            this.exportShapeToImage(shape);
        });
    }

	exportShapeToImage(originalShape) {
		let offscreenCanvas = document.createElement('canvas');
		offscreenCanvas.width = this.canvas.width;
		offscreenCanvas.height = this.canvas.height;

		let context = offscreenCanvas.getContext('2d');

		let image = new Image();

		image.onload = () => {
			context.drawImage(
				image,
				this.currentEditingImage.getLeft(),
				this.currentEditingImage.getTop(),
				this.currentEditingImage.getWidth(),
				this.currentEditingImage.getHeight()
			);

			// context.clip();

			// context.fillStyle = '#FFFFFF';
			// context.fillRect(100 , 100, 100, 100);

			let shape = originalShape.clone();
			shape.globalCompositeOperation = 'destination-in';
			shape.setFill('red');
			shape.setStrokeWidth(0);
			shape.render(context);

			let newImg = new Image();
			newImg.onload = () => {
				document.querySelector('body').appendChild(newImg);
			};
			newImg.src = this.trim(offscreenCanvas).toDataURL('image/png');
		};

		image.src = this.currentEditingImage.getSrc();
	}

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
