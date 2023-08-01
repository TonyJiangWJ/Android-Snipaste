// 杀死当前同名脚本
(() => { let g = engines.myEngine(); let e = engines.all(), n = e.length; let r = g.getSource() + ""; 1 < n && e.forEach(e => { let n = e.getSource() + ""; g.id !== e.id && n == r && e.forceStop() }) })();

importClass(java.io.StringWriter)
importClass(java.io.StringReader)
importClass(java.io.PrintWriter)
importClass(java.io.BufferedReader)
importClass(java.lang.StringBuilder)
importClass(android.view.View)


let resourceMonitor = require('./ResourceMonitor.js')(runtime, global)
let FloatyButton = require('./FloatyButton.js')

let stop = false
events.on('exit', () => {
  console.info('脚本执行结束，标记stop')
  stop = true
})
// 调试模式
let debuging = false

setTimeout(() => {
  if (debuging) {
    _exit()
  }
}, 30000)

let captureImage, drawImage, originalImg, grayImg
let displayPositions = ''
threads.start(function () {
  if (!requestScreenCapture()) {
    toast("请求截图失败")
    exit()
  }

  captureImage = captureScreen()
  originalImg = images.copy(captureImage, true)
  grayImg = images.copy(images.grayscale(captureImage), true)
  drawImage = originalImg
})


let device_width = device.width || originalImg.getWidth() || 1080
let device_height = device.height || originalImg.getHeight() || 2340


function FloatyImage (image) {
  if (!image) {
    return
  }
  function num (v) {
    return v.toFixed(1)
  }
  let forDrawImg = images.copy(image, true)
  let drawScale = 1
  let imageWidth = forDrawImg.getWidth()
  let imageHeight = forDrawImg.getHeight()
  let _this = this
  this.lastScale = 0
  this.displayInfo = {
    _hideDisplay: false,
    get hideDisplay () {
      return this._hideDisplay
    },
    set hideDisplay (value) {
      if (value != this._hideDisplay) {
        // console.log('change hide display ', this._hideDisplay, ' to:', value)
      }
      this._hideDisplay = value
    }
  }
  this.floatyCanvas = floaty.rawWindow(
    <vertical id="canvasContainer">
      <canvas id="canvas" margin="0dp" layout_weight="1" />
    </vertical>
  )

  this.floatyCanvasMoving = floaty.rawWindow(
    <vertical id="canvasContainer" alpha="0">
      <canvas id="canvas" margin="0dp" layout_weight="1" />
    </vertical>
  )
  ui.run(() => {
    this.floatyCanvas.canvasContainer.attr("w", image.getWidth() + 'px')
    this.floatyCanvas.canvasContainer.attr("h", image.getHeight() + 'px')

    this.floatyCanvasMoving.canvasContainer.attr("w", image.getWidth() + 'px')
    this.floatyCanvasMoving.canvasContainer.attr("h", image.getHeight() + 'px')

    this.floatyCanvasMoving.setTouchable(false)
  })

  this.close = function () {
    this.closed = true
    setTimeout(() => {
      if (this.floatyCanvas) {
        this.floatyCanvas.canvas.setVisibility(View.GONE)
        this.floatyCanvas.close()
      }
      if (this.floatyCanvasMoving) {
        this.floatyCanvasMoving.canvas.setVisibility(View.GONE)
        this.floatyCanvasMoving.close()
      }
      forDrawImg.recycle()
    }, 50)
  }

  this.hide = function () {
    if (this.closed) {
      return
    }
    ui.run(() => {
      _this.floatyCanvas.setTouchable(false)
      _this.floatyCanvas.canvasContainer.attr('alpha', '0')
      _this.floatyCanvasMoving.canvasContainer.attr('alpha', '0')
    })
  }

  this.show = function () {
    if (this.closed) {
      return
    }
    ui.run(() => {
      _this.floatyCanvas.setTouchable(true)
      _this.floatyCanvas.canvasContainer.attr('alpha', '1')
      _this.floatyCanvasMoving.canvasContainer.attr('alpha', '0')
    })
  }

  this.onMoving = function () {
    if (_this.displayInfo.hideDisplay) {
      // console.warn('current on moving duplicate invoke')
      return
    }
    _this.displayInfo.hideDisplay = true
    ui.run(() => {
      _this.floatyCanvas.canvasContainer.attr('alpha', '0')
      _this.floatyCanvasMoving.canvasContainer.attr('alpha', '0.8')

      // 因为触控事件依赖，直接隐藏有几率导致卡死
      // _this.floatyCanvas.canvas.setVisibility(View.GONE)
      _this.floatyCanvasMoving.canvas.setVisibility(View.VISIBLE)
    })
  }

  this.onDisplay = function () {
    if (!_this.displayInfo.hideDisplay) {
      // console.warn('current on display duplicate invoke')
      return
    }
    _this.displayInfo.hideDisplay = false
    ui.run(() => {
      _this.floatyCanvas.canvasContainer.attr('alpha', '1')
      _this.floatyCanvasMoving.canvasContainer.attr('alpha', '0')

      // _this.floatyCanvas.canvas.setVisibility(View.VISIBLE)
      setTimeout(() => {
        ui.post(() => {
          _this.floatyCanvasMoving.canvas.setVisibility(View.GONE)
        })
      }, 30)
    })
  }

  function _handleCanvasDraw (canvas, isDisplayCanvas) {
    if (_this.closed) {
      return
    }
    try {
      if (_this.lastScale != drawScale) {
        ui.run(function () {
          if (isDisplayCanvas) {
            _this.floatyCanvas.canvasContainer.attr('w', Math.floor(drawScale * imageWidth) + 'px')
            _this.floatyCanvas.canvasContainer.attr('h', Math.floor(drawScale * imageHeight) + 'px')
          } else {
            _this.floatyCanvasMoving.canvasContainer.attr('w', Math.floor(drawScale * imageWidth) + 'px')
            _this.floatyCanvasMoving.canvasContainer.attr('h', Math.floor(drawScale * imageHeight) + 'px')
          }
        })
        _this.lastScale = drawScale
      }
      // canvas.drawARGB(255, 0, 0, 0)
      let paint = new Paint()
      paint.setTextAlign(Paint.Align.CENTER)
      paint.setStrokeWidth(1)
      paint.setStyle(Paint.Style.STROKE)
      let matrix = new android.graphics.Matrix()
      matrix.postScale(drawScale, drawScale)
      paint.setARGB(255, 0, 0, 0)
      canvas.drawImage(forDrawImg, matrix, paint)
      paint.setARGB(255, 88, 88, 88)
      paint.setStrokeWidth(1)
      canvas.drawRect(convertArrayToRect([0, 0, canvas.getWidth(), canvas.getHeight()]), paint)

    } catch (e) {
      //
    }
  }
  this.floatyCanvas.canvas.on("draw", (canvas) => {
    if (_this.hideDisplay) {
      return
    }
    _handleCanvasDraw(canvas, true)
  })

  this.floatyCanvasMoving.canvas.on("draw", (canvas) => {
    if (!_this.displayInfo.hideDisplay) {
      return
    }
    _handleCanvasDraw(canvas)
  })

  let touchList = new Array
  let touchDownScale = null
  this.startX = null
  this.startY = null
  this.ox = null
  this.oy = null
  this.lastMoveTimestamp = 0
  this.touchTimestamp = 0
  this.touchCount = 0
  this.resetX = null
  this.resetY = null
  this.currentInScale = false
  this.floatyCanvas.canvas.setOnTouchListener(function (view, event) {

    function _handleTouchDown (event) {
      _this.startX = event.getX(0)
      _this.startY = event.getY(0)
      _this.ox = _this.floatyCanvas.getX()
      _this.oy = _this.floatyCanvas.getY()
      _this.resetX = 0
      _this.resetY = 0
      _this.touchTimestamp = new Date().getTime()

      let pointerCount = event.getPointerCount()
      if (pointerCount == 1) {
        _this.onMoving()
      }

      let i = Math.floor(event.getAction() / 256)
      let X = event.getX(i)
      let Y = event.getY(i)
      let id = event.getPointerId(i)
      touchList[id] = {
        X, Y
      }
      // 复制点击时的缩放
      touchDownScale = drawScale
    }

    function _handleTouchMove (event) {
      let pointerCount = event.getPointerCount()
      if (pointerCount == 2) {
        let id1 = event.getPointerId(0)
        let x1 = event.getX(0)
        let y1 = event.getY(0)
        let id2 = event.getPointerId(1)
        let x2 = event.getX(1)
        let y2 = event.getY(1)
        let touchDownDistance = getDistance(touchList[id2].X - touchList[id1].X, touchList[id2].Y - touchList[id1].Y)
        let touchMovingDistance = getDistance(x2 - x1, y2 - y1)
        let touchScale = touchMovingDistance / touchDownDistance
        drawScale = touchDownScale * touchScale
        _this.currentInScale = true
      } else if (pointerCount == 1) {
        setTimeout(() => _this.currentInScale = false, 50)
        let X = event.getX(0) - _this.startX
        let Y = event.getY(0) - _this.startY
        // console.log('move移动x', num(X), 'y', num(Y))
        _this.onMoving()
        ui.run(function () {
          _this.floatyCanvasMoving.setPosition(_this.ox + X, _this.oy + Y)
        })
      }
    }

    function _handleTouchUp (event) {
      // console.log('触控点数量：', event.getPointerCount())
      _this.onDisplay()
      if (event.getPointerCount() == 1 && !_this.currentInScale) {
        if (new Date().getTime() - _this.touchTimestamp <= 100) {
          _this.touchCount++
          if (_this.touchCount >= 2) {
            _this.close()
          }
          return true
        }
        _this.touchCount = 0
        let X = event.getX(0) - _this.startX
        let Y = event.getY(0) - _this.startY
        // console.log('up移动x', X, 'y', Y)
        ui.run(function () {
          _this.floatyCanvas.setPosition(_this.ox + X, _this.oy + Y)
        })
      }
    }

    try {
      switch (event.getAction() <= 2 ? event.getAction() : Math.abs(event.getAction() % 2 - 1)) {
        case event.ACTION_DOWN:
          _handleTouchDown(event)
          break
        case event.ACTION_MOVE:
          _handleTouchMove(event)
          break
        case event.ACTION_UP:
          _handleTouchUp(event)
          break
      }
      return true
    } catch (e) {
      toastLog("Touch: " + e)
      return true
    }
  })

}
function MainCanvasFrame () {
  let _this = this
  // 识别颜色类型 默认彩色
  let mode = 2
  let cutMode = false

  let globalPointColor, lastPointColor = null
  let positions = []
  let canvasMove = null

  this.runningFloaty = []
  this.showFloaty = true
  this.hideFloatyWhenTakeScreenshot = true

  this.toggleFloatyShow = function () {
    if (this.showFloaty) {
      this.hideAll()
    } else {
      this.showAll()
    }
  }

  this.hideAll = function () {
    this.showFloaty = false
    this.runningFloaty.forEach(v => v.hide())
  }

  this.showAll = function () {
    this.showFloaty = true
    this.runningFloaty.forEach(v => v.show())
  }

  let canvasWindow = floaty.rawWindow(
    <vertical id="rootContainer" alpha="0">
      <vertical id="vertical" bg="#aaaaaa" w="{{Math.floor(device_width)}}px" h="{{Math.floor(device_height*0.9)}}px" gravity="center">
        <horizontal id="horizontal" margin="5dp" w="*" gravity="center">
          <button id="cutOrPoint" layout_weight="1" text="裁切小图" />
        </horizontal>
        <canvas id="canvas" margin="5dp" layout_weight="1" />
        <horizontal bg="#ffffff">
          <text id="color_value" />
          <text id="position_value" margin="15dp 0dp" />
        </horizontal>
        <horizontal id="horizontal" margin="5dp" w="*" gravity="center">
          <button id="btnCapture" layout_weight="1" text="截图" />
          <button id="btnColor" layout_weight="1" text="灰度" />
          <button id="btnMove" layout_weight="1" text="移动/贴边" />
          <button id="btnClose" layout_weight="1" text="关闭" />
        </horizontal>
      </vertical>
      <vertical id="previewVertical" bg="#aaaaaa" w="{{Math.floor(device_width)}}px" h="{{Math.floor(device_height*0.05)}}px" gravity="center">
        <horizontal bg="#ffffff" id="region_position_horiz">
          <text text="位置（点击复制）" />
          <text id="region_position_value" margin="1dp 0dp" w="*" />
        </horizontal>
      </vertical>
    </vertical>
  )

  let canvasWindowCtrl = new FloatyController(canvasWindow, canvasWindow.btnMove, 1, canvasWindow.vertical)
  this.canvasWindowCtrl = canvasWindowCtrl
  this.canvasWindow = canvasWindow

  this.isHide = {
    get function () {
      return canvasWindowCtrl.isHide
    },
    set function (value) {
      canvasWindowCtrl.isHide = value
    }
  }

  this.showMainWindow = function () {
    if (canvasWindowCtrl.isHide) {
      // 将canvas移动回屏幕内
      ui.post(function () {
        canvasWindow.canvas.setVisibility(View.VISIBLE)
      })
      canvasWindowCtrl.windowMoving(canvasWindowCtrl.intoScreen())
      canvasWindowCtrl.isHide = false
    }
  }
  this.hideMainWindow = function () {
    if (!canvasWindowCtrl.isHide) {
      let canvasMove = canvasWindowCtrl.outScreen()
      canvasWindowCtrl.windowMoving(canvasMove)
      ui.post(function () {
        // 将CANVAS设为不可见 修改版中可以节省CPU占用
        canvasWindow.canvas.setVisibility(View.GONE)
      })
      canvasWindowCtrl.isHide = true
    }
  }
  this.toggleMainWindow = function () {
    if (canvasWindowCtrl.isHide) {
      this.showMainWindow()
    } else {
      this.hideMainWindow()
    }
  }
  this.takeScreenshot = function () {
    // 隐藏悬浮窗
    this.hideMainWindow()
    let hiddenByTakeScreenshot = false
    if (this.hideFloatyWhenTakeScreenshot) {
      hiddenByTakeScreenshot = true
      _this.hideAll()
    }
    sleep(100)
    captureImage = captureScreen()
    resourceMonitor.delayRecycle(originalImg)
    resourceMonitor.delayRecycle(grayImg)
    originalImg = images.copy(captureImage, true)
    grayImg = images.copy(images.grayscale(originalImg), true)
    if (mode == 1) {
      drawImage = grayImg
    } else {
      drawImage = originalImg
    }
    // 将悬浮窗回归
    this.showMainWindow()
    if (hiddenByTakeScreenshot) {
      _this.showAll()
    }
  }

  canvasWindowCtrl.setClick(function () {
    //canvasWindow.disableFocus()
    threads.start(function () {
      // 将canvas移动到屏幕外
      canvasMove = canvasWindowCtrl.outScreen()
      canvasWindowCtrl.windowMoving(canvasMove)
      ui.post(function () {
        // 将CANVAS设为不可见 修改版中可以节省CPU占用
        canvasWindow.canvas.setVisibility(View.GONE)
      })
      canvasWindowCtrl.isHide = true
    })
  })


  canvasWindow.btnCapture.click(function () {
    threads.start(function () {
      _this.takeScreenshot()
    })
  })

  canvasWindow.region_position_horiz.click(function () {
    if (displayPositions) {
      setClip(displayPositions)
      toastLog('复制成功：' + displayPositions)
    }
  })

  canvasWindow.btnColor.click(function () {
    threads.start(function () {
      if (mode == 1) {
        mode = 2
        drawImage = originalImg
        ui.run(function () {
          canvasWindow.btnColor.text('灰度')
        })
      } else {
        mode = 1
        drawImage = grayImg
        ui.run(function () {
          canvasWindow.btnColor.text('彩色')
        })
      }
    })
  })

  canvasWindow.cutOrPoint.on('click', () => {
    threads.start(function () {
      if (cutMode) {
        if (positions && positions.length === 4) {
          let clipImg = convertAndClip(positions, data, drawImage)
          if (clipImg === null) {
            toastLog('未框选有效图片')
            return
          }
          _this.runningFloaty.push(new FloatyImage(clipImg))
          _this.runningFloaty = _this.runningFloaty.filter(v => !v.closed)
        } else {
          toastLog('未框选小图')
        }
      }
      ui.run(function () {
        if (!cutMode) {
          _this.hideAll()
          canvasWindow.cutOrPoint.text('贴图')
        } else {
          _this.showAll()
          canvasWindow.cutOrPoint.text('裁切小图')
        }
        cutMode = !cutMode
      })
    })
  })

  canvasWindow.btnClose.on("click", () => {
    stop = true
    _exit()
  })

  let paint = new Paint
  paint.setTextAlign(Paint.Align.CENTER)
  paint.setStrokeWidth(5)
  paint.setStyle(Paint.Style.STROKE)
  let data = {
    translate: {
      x: 0,
      y: 0
    },
    scale: 1,
  }
  canvasWindow.canvas.on("draw", function (canvas) {
    if (stop) {
      return
    }
    canvas.drawARGB(255, 127, 127, 127)
    try {
      if (!drawImage || stop) {
        return
      }

      // 复制一份 避免闪退
      let forDrawImg = tryCopy(drawImage)
      if (!forDrawImg) {
        return
      }
      let w = canvas.getWidth()
      let h = canvas.getHeight()
      paint.setStrokeWidth(5)
      let matrix = new android.graphics.Matrix()
      matrix.postScale(data.scale, data.scale)
      matrix.postTranslate(data.translate.x, data.translate.y)
      paint.setARGB(255, 0, 0, 0)
      canvas.drawImage(forDrawImg, matrix, paint)
      // 绘制中心点坐标轴
      drawCenterCoor(canvas, paint, w, h)
      let globalPointColor = calculateCoordinates(w / 2, h / 2, data, forDrawImg)
      forDrawImg.recycle()
      if (cutMode && positions && positions.length === 4) {
        paint.setARGB(255, 255, 255, 0)
        canvas.drawRect(convertArrayToRect(positions), paint)
        ui.post(() => {
          canvasWindow.region_position_value.text(displayPositions || '')
        })
      }
      if (lastPointColor != globalPointColor) {
        lastPointColor = globalPointColor
        ui.run(() => {
          canvasWindow.vertical.attr("bg", colors.toString(inverseColor(globalPointColor.color)))
          canvasWindow.horizontal.attr("bg", globalPointColor.colorString)
          canvasWindow.color_value.text(globalPointColor.colorString)
          canvasWindow.position_value.text(globalPointColor.x + ',' + globalPointColor.y)
        })
      }
    } catch (e) {
      console.error("canvas" + e)
      printExceptionStack(e)
    }
  })

  let Touch = new Array
  let touchDownScale = null
  let Wx, Wy, copyId = 0,
    isCoping = false
  let cutStartX, cutStartY, cutEndX, cutEndY
  canvasWindow.canvas.setOnTouchListener(function (view, event) {
    try {
      if (cutMode) {
        function _handleCutTouchDown (event) {
          let i = Math.floor(event.getAction() / 256)
          let X = event.getX(i)
          let Y = event.getY(i)
          id = event.getPointerId(i)
          if (pointerCount == 1) {
            cutStartX = event.getX(i)
            cutStartY = event.getY(i)
          }
          Touch[id] = {
            X: X - data.translate.x,
            Y: Y - data.translate.y
          }
          //复制对象。
          touchDownScale = deepCopy(data)
        }
        function _handleCutTouchMove (event) {
          if (pointerCount == 1) {
            cutEndX = event.getX(0)
            cutEndY = event.getY(0)
            positions = [cutStartX, cutStartY, cutEndX, cutEndY]
          } else {
            let id = event.getPointerId(0)
            let X = event.getX(0)
            let Y = event.getY(0)
            let id1 = event.getPointerId(1)
            let X1 = event.getX(1)
            let Y1 = event.getY(1)
            let touchStartDistance = getDistance(Touch[id1].X - Touch[id].X, Touch[id1].Y - Touch[id].Y)
            let touchEndDistance = getDistance(X1 - X, Y1 - Y)
            let scaleRate = touchEndDistance / touchStartDistance
            data.scale = touchDownScale.scale * scaleRate
            data.translate.x = X - Touch[id].X * scaleRate
            data.translate.y = Y - Touch[id].Y * scaleRate
          }
        }
        let pointerCount = event.getPointerCount()
        switch (event.getAction() <= 2 ? event.getAction() : Math.abs(event.getAction() % 2 - 1)) {
          case event.ACTION_DOWN:
            _handleCutTouchDown(event)
            break
          case event.ACTION_MOVE:
            _handleCutTouchMove(event)
            break
          case event.ACTION_UP:
            break
        }
      } else {
        positions = []
        function _handleTouchDown (event) {
          let i = Math.floor(event.getAction() / 256)
          let id = event.getPointerId(i)
          let X = event.getX(i)
          let Y = event.getY(i)
          if (getDistance(view.width / 2 - X, view.height / 2 - Y) <= 50) {
            Wx = X
            Wy = Y
            isCoping = true
            copyId = id
            return
          }
          let PC = event.getPointerCount()
          if (PC >= 3) {
            data = {
              translate: {
                x: -(canvasWindow.getX() + canvasWindow.canvas.getX()),
                y: -(canvasWindow.getY() + canvasWindow.canvas.getY())
              },
              scale: 1,
            }
          }
          Touch[id] = {
            X: X - data.translate.x,
            Y: Y - data.translate.y
          }
          touchDownScale = deepCopy(data)
        }
        function _handleTouchMove (event) {
          if (isCoping) {
            return
          }
          PC = event.getPointerCount()
          if (PC == 1) {
            let id = event.getPointerId(0)
            let X = event.getX(0)
            let Y = event.getY(0)
            data.translate.x = X - Touch[id].X
            data.translate.y = Y - Touch[id].Y
          } else if (PC == 2) {
            let id = event.getPointerId(0)
            let X = event.getX(0)
            let Y = event.getY(0)
            let id1 = event.getPointerId(1)
            let X1 = event.getX(1)
            let Y1 = event.getY(1)
            let touchDownDistance = getDistance(Touch[id1].X - Touch[id].X, Touch[id1].Y - Touch[id].Y)
            let currentDistance = getDistance(X1 - X, Y1 - Y)
            let currentScale = currentDistance / touchDownDistance
            data.scale = touchDownScale.scale * currentScale
            data.translate.x = X - Touch[id].X * currentScale
            data.translate.y = Y - Touch[id].Y * currentScale
          } else {
            data = {
              translate: {
                x: -(canvasWindow.getX() + canvasWindow.canvas.getX()),
                y: -(canvasWindow.getY() + canvasWindow.canvas.getY())
              },
              scale: 1,
            }
          }
        }
        function _handleTouchUp (event) {
          i = Math.floor(event.getAction() / 256)
          id = event.getPointerId(i)
          if (isCoping && id == copyId) {
            if (getDistance(event.getX(i) - Wx, event.getY(i) - Wy) <= 10) {
              setClip(JSON.stringify(globalPointColor))
              toastLog("已复制 \n" + JSON.stringify(globalPointColor))
            }
            isCoping = false
            return
          }
          Touch[id] = undefined
          PC = event.getPointerCount()
          for (let idx = 0; idx < PC; idx++) {
            let id1 = event.getPointerId(idx)
            let X = event.getX(idx)
            let Y = event.getY(idx)
            if (id1 != id) {
              Touch[id1] = {
                X: X - data.translate.x,
                Y: Y - data.translate.y
              }
            }
          }
        }
        switch (event.getAction() <= 2 ? event.getAction() : Math.abs(event.getAction() % 2 - 1)) {
          case event.ACTION_DOWN:
            _handleTouchDown(event)
            //复制对象。
            break
          case event.ACTION_MOVE:
            _handleTouchMove(event)
            break
          case event.ACTION_UP:
            _handleTouchUp(event)
            break
        }
      }
      return true
    } catch (e) {
      toastLog("Touch: " + e)
      return true
    }
  })

  function drawCenterCoor (canvas, paint, w, h) {
    paint.setStrokeWidth(5)
    paint.setStyle(Paint.Style.STROKE)
    paint.setARGB(255, 255, 255, 0)
    canvas.drawLine(w / 2 - 50, h / 2, w / 2 - 100, h / 2, paint)
    paint.setARGB(255, 255, 0, 255)
    canvas.drawLine(w / 2, h / 2 - 50, w / 2, h / 2 - 100, paint)
    canvas.drawPoint(w / 2, h / 2, paint)
    paint.setARGB(255, 255, 0, 0)
    canvas.drawLine(w / 2 + 50, h / 2, w / 2 + 100, h / 2, paint)
    paint.setARGB(255, 0, 0, 255)
    canvas.drawLine(w / 2, h / 2 + 50, w / 2, h / 2 + 100, paint)
  }

  function calculateCoordinates (centerX, centerY, data, img) {
    // console.verbose('准备计算中心点颜色,center X:', centerX, 'Y:', centerX, ' scaleData:', JSON.stringify(data))
    let X = centerX - data.translate.x,
      Y = centerY - data.translate.y
    let x = X / data.scale
    let y = Y / data.scale
    x = Math.floor((0 <= x && x < img.getWidth()) ? x : (0 <= x ? img.getWidth() - 1 : 0))
    y = Math.floor((0 <= y && y < img.getHeight()) ? y : (0 <= y ? img.getHeight() - 1 : 0))
    let color = images.pixel(img, x, y)
    let colorString = colors.toString(color)
    // console.verbose('计算中心点颜色,x:', x, 'y:', y, 'color:', colorString)
    return {
      x: x,
      y: y,
      color: color,
      colorString: String(colorString)
    }
  }

  function getRealRegion (positions, data, img) {
    let scaledPositions = [
      positions[0] - data.translate.x,
      positions[1] - data.translate.y,
      positions[2] - data.translate.x,
      positions[3] - data.translate.y
    ].map(v => v / data.scale)
    let tmp
    if (scaledPositions[0] > scaledPositions[2]) {
      tmp = scaledPositions[0]
      scaledPositions[0] = scaledPositions[2]
      scaledPositions[2] = tmp
    }
    if (scaledPositions[1] > scaledPositions[3]) {
      tmp = scaledPositions[1]
      scaledPositions[1] = scaledPositions[3]
      scaledPositions[3] = tmp
    }
    function rangeX (x) {
      return Math.floor((0 <= x && x < img.getWidth()) ? x : (0 <= x ? img.getWidth() - 1 : 0))
    }
    function rangeY (y) {
      return Math.floor((0 <= y && y < img.getHeight()) ? y : (0 <= y ? img.getHeight() - 1 : 0))
    }
    let left = rangeX(scaledPositions[0])
    let right = rangeX(scaledPositions[2])
    let top = rangeY(scaledPositions[1])
    let bottom = rangeY(scaledPositions[3])
    return { left: left, right: right, top: top, bottom: bottom, width: right - left, height: bottom - top }
  }

  function convertAndClip (positions, data, img) {
    let { left, right, top, bottom, width, height } = getRealRegion(positions, data, img)
    displayPositions = [left, top, width, height].join(',')
    // console.log('截取范围：', left, right, top, bottom, displayPositions)
    if (width == 0 || height == 0) {
      return null
    }
    return images.clip(img, left, top, width, height)
  }

}

function printExceptionStack (e) {
  if (e) {
    console.error(util.format('fileName: %s line:%s typeof e:%s', e.fileName, e.lineNumber, typeof e))
    let throwable = null
    if (e.javaException) {
      throwable = e.javaException
    } else if (e.rhinoException) {
      throwable = e.rhinoException
    }
    if (throwable) {
      let scriptTrace = new StringBuilder(e.message == null ? '' : e.message + '\n')
      let stringWriter = new StringWriter()
      let writer = new PrintWriter(stringWriter)
      throwable.printStackTrace(writer)
      writer.close()
      let bufferedReader = new BufferedReader(new StringReader(stringWriter.toString()))
      let line
      while ((line = bufferedReader.readLine()) != null) {
        scriptTrace.append("\n").append(line)
      }
      console.error(scriptTrace.toString())
    } else {
      let funcs = Object.getOwnPropertyNames(e)
      for (let idx in funcs) {
        let func_name = funcs[idx]
        console.verbose(func_name)
      }
    }
  }
}

function tryCopy (src) {
  if (stop) {
    return false
  }
  try {
    return images.copy(src)
  } catch (e) {
    return null
  }
}

function convertArrayToRect (a) {
  // left top right bottom
  return new android.graphics.Rect(a[0], a[1], a[2], a[3])
}

function inverseColor (color) {
  return (-1 - colors.argb(0, colors.red(color), colors.green(color), colors.blue(color)))
}

function getDistance (dx, dy) {
  //数组所有值平方和开方
  return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2))
}

function convertArrayToReadable (array) {
  return {
    from: {
      X: array[0][0],
      Y: array[0][1]
    },
    to: {
      X: array[1][0],
      Y: array[1][1],
    }
  }
}


function deepCopy (obj) {
  if (typeof obj != 'object') {
    return obj
  }
  let newobj = {}
  for (let attr in obj) {
    newobj[attr] = deepCopy(obj[attr])
  }
  return newobj
}


function FloatyController (window, windowMoveId, isCanvasWinow) {
  this.orientation = context.resources.configuration.orientation
  this.width = this.orientation == 1 ? device_width : device_height
  this.height = this.orientation == 2 ? device_width : device_height
  this.isAutoIntScreen = true
  this.isHide = false
  let EMPTY_FUNC = () => { }
  this.Click = EMPTY_FUNC
  this.move = EMPTY_FUNC
  this.LongClick = EMPTY_FUNC
  this.setClick = (fun) => {
    fun = fun || EMPTY_FUNC
    this.Click = fun
  }
  this.setMove = (fun) => {
    fun = fun || EMPTY_FUNC
    this.move = fun
  }
  this.setLongClick = (fun, threshold) => {
    fun = fun || EMPTY_FUNC
    this.LongClick = fun
    if (parseInt(threshold)) {
      this.longClickThreshold = parseInt(threshold) / 50
    }
  }

  this.windowStartX = 0
  this.windowStartY = 0
  this.eventStartX = 0
  this.eventStartY = 0
  this.eventMoving = false
  this.eventKeep = false
  this.longClickThreshold = 12
  this.keepTime = 0
  setInterval(() => {
    if (this.eventKeep) {
      this.keepTime++
      if (!this.eventMoving && this.keepTime > this.longClickThreshold) {
        //非移动且按下时长超过1秒判断为长按
        this.eventKeep = false
        this.keepTime = 0
        this.LongClick()
      }
    }
  }, 50)
  if (windowMoveId) {
    windowMoveId.setOnTouchListener(new View.OnTouchListener((view, event) => {
      this.move(view, event)
      try {
        switch (event.getAction()) {
          case event.ACTION_DOWN:
            this.eventStartX = event.getRawX()
            this.eventStartY = event.getRawY()
            this.windowStartX = window.getX()
            this.windowStartY = window.getY()
            this.eventKeep = true; //按下,开启计时
            break
          case event.ACTION_MOVE:
            let sx = event.getRawX() - this.eventStartX
            let sy = event.getRawY() - this.eventStartY
            if (!this.eventMoving && this.eventKeep && getDistance(sx, sy) >= 10) {
              this.eventMoving = true
            }
            if (this.eventMoving && this.eventKeep) {
              ui.post(() => {
                window.setPosition(this.windowStartX + sx, this.windowStartY + sy)
              })
            }
            break
          case event.ACTION_UP:
            if (!this.eventMoving && this.eventKeep && this.keepTime < 7) {
              this.Click()
            }
            this.eventKeep = false
            this.keepTime = 0
            if (this.eventMoving) {
              if (this.isAutoIntScreen) {
                threads.start(new java.lang.Runnable(() => {
                  this.windowMoving(this.intoScreen())
                  if (!isCanvasWinow) {
                    // mini 悬浮窗自动贴边
                    this.windowMoving(this.toScreenEdge())
                  }
                }))
              } else {
                threads.start(new java.lang.Runnable(() => {
                  this.windowMoving(this.viewIntoScreen())
                }))

              }
              this.eventMoving = false
            }
            break
        }
      } catch (e) {
        console.error('异常' + e)
      }
      return true
    }))
  }
  this.moveRange = (win, view) => {
    //返回悬浮窗的坐标范围。
    let border = 36, //悬浮窗的隐形边矩
      barHeight = 66, //手机通知栏的高度
      bottomHeight = 100; //虚拟按键的高度。(大概)
    if (!isCanvasWinow) {
      if (view) {
        return convertArrayToReadable([
          [-view.getX(), -view.getY()],
          [this.width - (view.getX() + view.getWidth()), this.height - (view.getY() + view.getHeight()) - barHeight - border - bottomHeight]
        ])

      } else {
        return convertArrayToReadable([
          [0, 0],
          [this.width - win.getWidth() + border * 2, this.height - win.getHeight() - barHeight + border * 2 - bottomHeight]
        ])
      }
    } else {
      if (view) {
        return convertArrayToReadable([
          [-view.getX(), barHeight - view.getY()],
          [this.width - (view.getX() + view.getWidth()), this.height - (view.getY() + view.getHeight()) - bottomHeight]
        ])
      } else {
        return convertArrayToReadable([
          [0, barHeight],
          [this.width - win.getWidth(), this.height - win.getHeight() - bottomHeight]
        ])
      }
    }
  }
  this.windowMoving = (moveInfo) => {
    //移动悬浮窗的动画效果。
    let sx = moveInfo.to.X - moveInfo.from.X,
      sy = moveInfo.to.Y - moveInfo.from.Y
    let sd = getDistance(sx, sy) / 10
    let X = sx / sd,
      Y = sy / sd
    let x = 0,
      y = 0
    for (let i = 0; i < sd; i++) {
      x += X
      y += Y
      sleep(1)
      ui.post(() => {
        window.setPosition(moveInfo.from.X + x, moveInfo.from.Y + y)
      })
    }
    ui.post(() => {
      window.setPosition(moveInfo.to.X, moveInfo.to.Y)
    })
  }
  this.windowSetPosition = (x, y) => {
    window.setPosition(x, y)
  }
  this.outScreen = () => {
    //算出最短的距离到达屏幕之外。
    let moveRangeInfo = this.moveRange(window)
    let x = window.getX(),
      y = window.getY()
    let centerX = x + window.getWidth() / 2
    let toLeft = centerX < this.width / 2
    // 如果在左侧 向左移动（x+width） 右侧直接移动到屏幕外
    let targetX = toLeft ? - (x + window.getWidth()) : this.width + 10
    return convertArrayToReadable([
      [x, y],
      [targetX, y]
    ])
  }
  this.toScreenEdge = () => {
    //返回到屏幕边缘的坐标。
    let x = window.getX(),
      y = window.getY()
    // console.log('当前位置：', x, y)
    // 中心点位置
    let centerX = window.getX() + window.getWidth() / 2
    // 左侧贴坐标，右侧贴右边
    let cx = centerX < this.width / 2 ? -window.getWidth() / 3 : (this.width - window.getWidth() / 2)
    return convertArrayToReadable([
      [x, y],
      [cx, y]
    ])
  }
  this.centerXY = (point) => {
    //返回距离中心位置的一个方形两个坐标。
    let w = window.getWidth()
    let h = window.getHeight()
    return {
      from: {
        X: point.X + w / 2,
        Y: point.Y + h / 2
      },
      to: {
        X: point.X - w / 2,
        Y: point.Y - h / 2
      }
    }
  }
  this.intoScreen = () => {
    //当悬浮超出屏幕之外之后进入的坐标。
    let point = pointRangeBack(window.getX(), window.getY(), this.moveRange(window))
    return convertArrayToReadable([
      [window.getX(), window.getY()],
      [point.x, point.y]
    ])
  }
  this.viewIntoScreen = () => {
    //当悬浮超出屏幕之外之后进入的坐标。
    let point = pointRangeBack(window.getX(), window.getY(), this.moveRange(window, windowMoveId))
    return convertArrayToReadable([
      [window.getX(), window.getY()],
      [point.x, point.y]
    ])
  }

  function pointRangeBack (x, y, moveRangeInfo) {
    // 修正坐标的所在范围。如果坐标超出了范围，则修正回来。
    x = (moveRangeInfo.from.X < x && x < moveRangeInfo.to.X) ? x : (moveRangeInfo.from.X < x ? moveRangeInfo.to.X : moveRangeInfo.from.X)
    y = (moveRangeInfo.from.Y < y && y < moveRangeInfo.to.Y) ? y : (moveRangeInfo.from.Y < y ? moveRangeInfo.to.Y : moveRangeInfo.from.Y)
    return {
      x: x,
      y: y
    }
  }

}


let iconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGx2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuZGFiYWNiYiwgMjAyMS8wNC8xNC0wMDozOTo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA3LTI3VDIyOjI5OjIwKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOC0wMVQxNToyODoxNyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wOC0wMVQxNToyODoxNyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo5YzExNmY1My1kZTlkLTQ4YjgtOWVhYS02ZDRiOTNiMTQzYWEiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoyMjUyMmVhZi0yZmY5LWEzNGYtOWVjMS1iNzRlNjM4MTkzMjAiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo0OTI1M2Q5My03NTk5LTQyOTMtYTVkMC0xMzcxNDE3Yzg2Y2EiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjQ5MjUzZDkzLTc1OTktNDI5My1hNWQwLTEzNzE0MTdjODZjYSIgc3RFdnQ6d2hlbj0iMjAyMy0wNy0yN1QyMjoyOToyMCswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmViNjk1ZjE5LTc2NTgtNGI3My05MjJmLTMwNTBkZmJlNTc2YyIgc3RFdnQ6d2hlbj0iMjAyMy0wOC0wMVQxNToyODoxNyswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOjljMTE2ZjUzLWRlOWQtNDhiOC05ZWFhLTZkNGI5M2IxNDNhYSIgc3RFdnQ6d2hlbj0iMjAyMy0wOC0wMVQxNToyODoxNyswODowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+P8PxcgAALWRJREFUeJzt3XecLUW1B/pv9d575gQOSRAQyYogQUCSYACuCZWgIOLFgAHMkWfCwBPTNYGJp6KiklTgCuhVMIEIBlAQARUQFImCIPGEmdnd9f5Y3bP3zJmZM2cG5XrPWZ9PfWZPd3VVddWvVqpV1SnnbCWtuFQ81A1YSQ8trQTACk4rAbCC00oArOC0EgArOK0EwApOKwGwgtNKAKzgtBIAKzitBMAKTisBsILTSgCs4LQSACs4tWf6YHL/DJ+sRksIyn2/k8BkVf+u+n4XfddyX76MVl/5ubn/SLobUGyNx1JtTvEoPByrT9K4+3An+c+4luJqyito3YibaHej7G5df1m3qUn9K6tV3a7melU/0+RJfdead2za3+r7f3qUzV+u/A3NGAD/C2kH8rZ4NHahejJFpwbYA7RuJt+GP5OGyV0xglCQ2uQBzKFYl7wjefW+QbuY8iLS1ZH83NgR/7ekNNN4gP8lHGAT8itIz8S25E5d1rXkH1JcjGtIN1H9nVQuXb9x5baa8tciPxKbUe2Mp2KHXv70e6rzSV8jXfrvygH+HQGwNvl5pEOpdq0H4zbyt8k/Il1EuqvXiV1Uq2ET0qPI65DnB3doMqWScgSLKf5OvkGIgLt6alKFagF2Je1Beh7VFnXbr6I4lXwq/trLvxIAE9CMAfAo8jPxaXJBvonWr0mfobygHqgO1aakOXX+x5E3wANUdwbrb49QDlMtJo3UFbfjGYM1F+mQ1yCtjjtJv8Pv6Q6RbqG4r+YSW5PeRHePABekD+B0qitXAmBCWm4ArIsPUBxCNRf/gxNofY88XIvxPWltR9qBaiF+Tr6ePEK6h+L6KCyPq3fsG/Xa14iBvFFwnNSmWJ/8FNLDyb+l+j3F//QGrHw6+YUUh9bln0HrgwGelQDoo2kDYAHVW8lvFlr7j2h9mO5P6w7amu6e5BbtrfBb8o/J1/bKLQaptqHamM76VJtRbUjRWAKduuKSfB/pDvLNtK6jvBk30bqS6r7eYBUbhgiwO+Wf6C5i4GqcVw/e4+i+lfySEC3pOIqPR3krAWDZAGihfBbVKVSrU/yO9qGMXB55ip1IryTNI/+G6kSqu+NeC3Yh70s+qMeWCW6RhtVKQZ1qEZA6KEK0aIU1kAb7nv0bTiOdRfoleUnN2gdIzyc9vX7+JKofxjt1Hk4+he5T64F/Ba0TVgJgagCsj/dRHo7rKd5POik6aWQfvIh0FdWfaZ8S7L9YjXwA+ckxEHk9UiZdTL4qtHV/I/+ddCPuwL1jNf9O3YaRVYI7VBuQ1sFa5C1J22An8jwsIf8P6eekb5NvrAfxueFrSDuQzqX4al3HcyjfQ9qF4js4sm6TlQBAHwD2JJ9M9Qg6n6N6J2khrceSX0t3E/LxtM6unTGbULyZtD9pw3pm/YB0Gi7tyV7j6xn3uxmEqWZkgfwYbId9yAcLTnEPvkNxHC4Jt0r1ZLpvIS2m9UXyBcF0Wm+n+ihpEek1pBNXAgD1YLyf/D6qeymez+CP6LbJn6F8OO2TyWfVnbMz1WcodyYl0q9J76P6Q8zw8UrkeBGDWs5Qvpa0LsX7QpdoHEPtOssSY30DjcevegRpM/LbyPvUZf6FeW+i+m4tWZ5MdVg8ULyZ4k7Kbam+jJ0oTiEfStF9KAHwUK8FrIqTY/B9l9ZWFD+i3JvqtFrWHkZ5VrBXJ9C9mHILnEnaPQDhXNwYRTbifRTYG9X16N0vB6PO9HG8h3wMab3o9LYQCcUaeJRR13K/P8KtuJC0L7YgnUCaw+LvMHwueWfKn9F6Mela8hcpXk5xRbS3fRzlIeRzSY/8Z3XudOih5AAPx7lU21N8AO+rZ9iHw8FTfRg/rjv8U5RvqmfFJ8ifJt3cw28z2xMMUG1NsSVqP0D+CK6IPLW+Z+QY0lvqAr5H+2A80Gtn3onu23Ar6fLQ+DtX0r5vVHccrRfSfKo34mi0Kb5F+/V076S7FQMfCmU1HS78D4fS/Spuw3/Q+mMPbP/3RcBW+DHWpTic6kukTXBUKHDla7CE9GIcTd6Y1omkT1Ne1mPHo6bZXPITsRfpbqoRihb5GvJfYvDyELWrX8Lwixl+H4bpnEn7PVFuGZfCCtiE9gbYkpHBGJhiDarL8X2KB2pFtH63EsWjyYeR3kb+B8VHyR+Le+1PxrtU/x/tn5D3pHsmaYDWQaFc/p8EQL+fvHxMaNAeRn4unbPIj6X8LOUvGHhvKE0+RDqSfH/NPs+onxdsusTwoxjYHrvFDOxeHs6Z4q5QIBtRUBqr7UPegep20pIafJerK+61Neutl5VzsAZ5L9KTw6QsLqX7GzpXGV0lHNUXdmLkG7Q2C4WvfD2d++kejpcGMNJ3anfyhVRrUTwDPxy7ujk9eggAcN80c45ZNt2M7nlhqg3uFatr1X60PkL1FvyA1kaUp2MnnEz1Olr3jZ1l7XUoX0neLUyu8he0Lp1g3cBYALSNVbb6FcSJaAwA+q4ltXm4K9U+dG7GcYxcE1xGXfdIQetIfIB8O+1nUV0WgE+n1MA4NpxL+cJwUqVn0TpnedWzhwAA904zZweL0V6P6rcxeHknqt9QPI98BK0jyL/CXqH8WRDKnxOj41tqU2xVqhdR7EprMcVnGbmqN/P+pQCo/68ewZzX0N2Y8nIGvkHn1hAjw02dTyOfSF4nXNrlN2g/MpxY5Znkz2JdWr+kXD+4x5zf9fSLZdP/8niAtIDie3TXwT4M/IaFB+LdtJ5Pvo7qUHyV6gGKJ+Ping0+6kLdkLRldFjx67F2/kNGt1K8F5vSeiXVoxm6tc9/gPSjcASVPySfGiKn+jDlfqRzImPxadKeVL9j4GKGHkfrmh7w/jn0L+AAg1j0NdovxcGhHXsuI28mvSk0bIfheFp/Jj+D6rqxs6yRqzoikCP33Phd0+MATTkPOgfAXGEZJOROKKGpL28DhGJ1fJXu/vgv0rvIa8e11gXkj5N3x0V0f87gHgx3p2hgX0vXnE62pWgWfoBqGWlU6Xs/xUsZOToGv7U53Q8x8C5cHs4Qx5MvIe2M66aodMQyp/1EA1q7+JeZbyJqgDJtGpmi7HtoPRcnkd6Jj1H+HW9g5Hl4Gq2fk55Pa3eq08cC9sGnWYiAqWROEmM1/FSG3kdxPvOPotiURccz8EqKXzD8n/iqCK96OhbNvD0NjQhFrJ919g9InuT6ZO8xkedytpRfIhr6NhGEchQD+zB0Fq2SeWdw/3GUr8PhDBwfHG/6OsF0aRYiYFk0shb3/448l3lbMfc2HvgK91/Dwz7G0FOpfiRCq56Eu3sv2bDypURA399+EdAoiiP177kefNnZz8r7OdxSImBcW8eIAD0Xc4Him5QvwGuY+wXKgyhfxPwDuWeY/FPSU5i3A3N+O9U75RmYjswKACNT3C2w5GssfimdXZh/CUNHMbQarbcyZy0W/j6cLfO2ZvHN8dxMAFDqSYYmWneOfx4AGqr0rIuZACBh/gCLrqL7aAafyODPWXIE1ePovISRdaj+RvtnDD5lKu6TDU56byqahQ4wPEkawcKnsuSlzP9KDH56Ct0nM/hB5gyw+ELaq1D9B/nmmdXfdGzjuetaXu/Z7Kg/3GumlIcpd6P1J7pn0FqT4pMMDTLwUubfzsDrGX4yi98a7zgySZoZzQIAaZJkbigvrqfzSlqr8MBrab2D6h8MHR2LOfmNdC6NxjemXv/q3VQdm0RnPKB22/rXDj49C2FgWRnHURr3u7gzfB7ddVl0cpQ7cBiL9wmFuXMcAz+h+iRpoyn6fUb0IFsBGeVbyauHS7fCkveTbqD8DcMHUb6DOV+m9ZVeOQ1NZzY1s36JHpv/Vw9+PzXtmartuS/1i6bmd3kBrTfT3ZuRo8j3UZ7Log/E/fa76j7+RM8NPr7vZ0az0AEWLnUlduJUV+GWCOQY3IDFH6PzelrDjFzH0Hw669J5oDd7J6L+do0GaYqXr10BEz6bMHdNugcKZWBadvQU1CaXFD+juHLqrP0D3fzfz9maaxMFpiDCyzcmb4W/0voU6dv4GdWp5BfS3o3yl+PfPVswo5ebBQAWj7tSYPh4uocx/7Es+SPpUwx8l6GfUH2ktn33pzi7Z2JNBwANm2tm/pSMq0Xn+yJO78GkG2k9ETdNna1pd9Pe5tp0+jk9mva1dH9I5xmkrSk/ENbBIIaGcRHtJ40vb6YAmIUIKPpSSyzwVC+jOA9/pNyHcjNaP6G9SYR45VMjpCuaPDXr7pdtjcZNdERnqrQunjZ5uTNW2jak3D3aMVVqWPJ4K2Qy2T0m/Ynue6meTtqDdBXproiFGBohH4snkreZ6UuMp1k4gsZ3ZHkgVZu5R9ZmzgsoPhdKXvX/xgu2Prh8A9DviOm/NiXNEZs8V6v/v0tEC7XCjZyGSFvFwlK6jnyvHp9uRq5B9UZYaznqnuI9pp33S6Qj6H6M+Ttz38fDZZzEErLXUL6T9iEzbMwYmgUH6Ed9dxXKo/HjCNlK2+CPpB9QbEP5Elr/H+mPk5c3vpPGK0zL1bB+1ByHXcm70no8nTeL8G/4JWlH0g7YETvjCdglrvvkuAbNQJ9oLW+6nfRWqp0Yfm0sMeff0Xkh7dvxGfJ/0tom5m+TZkYPEgDKQ0Lzzx+vWfvrSPUGjeGvU91P+d7gBt1J0vh7bROz0pk0NA2TFmNryq+SV4lbeV/yB/AxHI9v4vs4E08j3TbbynuOqiYNm9yWb1J5IvkWhj8WZmbxm/AYVol8QrxP+dqxYzAzmoUI6H905FVUdzF4AWnbWPdOZ9Fdn7Q9xTnhA5iKst4saDx69Bw+MzZ15obesGQPuidTrN/HbVYTQaETtWct0jdmWunSOs54r+BUlEp8HUdSPE0sJ7+MfACtMyj/QvdgWq+ZefuCZskBuiKAIW9P+yKqIYZ2D9bfHSG/rZb971mG4iaQPt6xUQmgTafTJqXr6D4HPxIbT2pKt+EPuBrjvJGVCFRNd8ys3sZR1Xgnm9REHM+ZRhr8GEq6b4/3H/gy3YdF2wa/jtWp9p/BauUYmgUAGkR3X1cX9dFaRLYZOom0Jq3/JP2W4rKJtd7Gimj+H7b0y2S9WL4ZDUY3llpze5yecRPpubSeHG0cU/YRYovXpsuv+DXtHO+abkAxrOc4miq5N4JEij0Y2ZbFv8CmFOtSfKqeFIc/hABolI/i2bTuoPoleXcGdqZaSLUvaW3abxs72P2JsQM7WXNaU9xbFqW5DH45NH7HioBU5B3wTarvkp9aD9bdtfVyTJ1nZnFWk+ouDdAbnadxEE2WWl+gaFMdGGJs7ip0n8HIYqNRRp1HPERKYBcjO2BLqm/WfvHdaNVbpIq96o64aqxy1yhFozEDli3fs+X3uY8++0iqX2Br8tfJV9eAa4foyruI5Ty4gtzPDWYYnzCVh3O0XXp9MtnC2vCtVLdSPKsGz2kUO5MK0unkNal2eYg4ANiG3MGPKedix5hRRUHxTNK54tAlvdR4/5Z3EaORoctL+UZGniI0+8vEkTKTZX4Kfo/vk59IvnX529i4qadLDfj7ReGoiFxI+jLp8ZQPI19M2lhsXv1xvSC1aQ+/y0+zBcBm9d+LSBtgiKG/0t2GvDbt0+iUY5W9lt7eu+V1CrWX8xlCe04/xd71zOm7V3yd4gD8NNpONDLtjfOw73JWZvkB0C8em9XFJnXQ/lGUN3wgw0tCNxlZQPcvpNsZ3n02gVSzcQUnPAl/orhbqK7nkDIOClOm+uXS9v1MV68akdGIj2k/N0xqeugeYxbP8zoYoDie9AmcL/b9dUNxLf4+/cFsZn+zB2J5qF8cNFxyNDDmtxR/Ih9W99uvaK1bg+b7VHvFppKZ0WysgEfU3rVz6kiezRiuo3nTS8J5UVyzNFubLS0vB8jfxp54L3Ym1SHnkJ8ZMfrVSXg6+TTyzqHAtp5uqS3my6LZxOw1yvCIYEZL6rR4YeyhaD2e3KKbImx+AK3zyavR2WSmtc4mImgD8hzSr2o2tlO4WIs5Ysfr7yjygw+A5aVqXfIl+CB5kVjafWO4W32e9F0sCtdrezM6t+AcuvfFs//qNidLu4fTpfW9bfAPbBxg6/4x8g89bqa1zcITOLBV7Xa/NhDb2pDOXQzXPup85VjXeSPrmt8PFjdYVjnN/WJLqgtDc87Xkf+OK8kXkSqK9chfjo4dUFswU4V4L0cblpeW8hjeVHOXLZh/Gt17WLJGhJK5O8xBX55JTbMAQLUtaSHtm+iuypJ7aN1Ae7v6Je4cm7/f3q/UVsMB+B7ujut5gxAr+YLwwplnUg2niYLtD7aYiFKKPEMl7cXxf360OFF0t3rwlohO/lwdhPlFXERVTL1Rswn4+GfQmFiJ20hD2JiFVYC3tS1zLmDougginRnNBgCbx+CP3EXeluIOim6cxjU0TNkHgP5qWlswvCXdF1C8QGwT/wLpYlovoPw46S1xQoj9SUfEPXod0nT8HIGPJq5wQror/pTX0t42bOq8AR4pNmluFB6/BhQJ1a+pLqpBOAk1q5VNBHKjwPVH/tgQ2wuAVX03xrsIG3fn3/Hr3uXRd/pTnFHY2qpeJBsmbcHQBbEG4/GTt3NqmgUA0iakv1GUEdachuIdhx8Vv4u/9vKOcVd+QdjbzbWnhieufAftP9Yu1CV0y9gdk89iyU6km5e2AKbjBs2PJT2F+R3KB8Iy8f36HTbAFjgEe4dPo7gXd4QyWGw3ebn949n8bdYtIC8gfSXerb+9qTIpWtP95NfhpPr/5sbtFBUjWwVH6iyMfReL0FlCZ7UJi5sGzQYA61H+uWZVD2ewrE2ZDWN3S/pb5MvCq9XQwAdJ/41n4xm4hHQK5c8odqnLfjj5WNK+lH9i4O/RZ3ez7Pj38QL5pXgBZf+GwS4Wh1I4Gthf387zKL9IagkRNEHZk4md0egopHlUj61B+iPSLbQ7VIeQfyI4X6P2b4ZXYIEA5HjKwoStNwB27iHXC1tpCdVM3aSz2h28gGKklufzKesgwfRwckV+YOlH0ttjBcst2Ly+uA5pDxxG9Zh6jN4j9gyOxCyt9o1Q86lm+yg3KEj9Cz/JxK6yVSYpqPFYGcetE3luz2afSJHt5wa5q6e/1PGJ1SfqPA+EfZ/nRXur8ygeiz3EQNc0Jv7kVlobRJ3D98TfjhAHMzc/ZxMSVns+OijbdBfXnbJasLnUN1rNrM1dygWkZ4gzeH8avvi8A24PpdLqUW4awQ2kQYYGjMYL2LVOn6oHYF+qObROq+u/XZgl/VGSd1g+db1ue1pn7OXiL3oeyQ0ZeSU+V5f/NDxKBJY0K0EVFooYvreQXxZtK/Yj79crt30y1ZKJ1YNRukccL1OIU02Hol/zzHeFmJ0IQFnWjWzrHbw8EAPdj95mG1c6huqrQtH5GvlL5BtoHU/+FPmFwpz5bxyObUh30/lTvccAgxXFsVH3A1dRnc2CN0UdXQw9gDcxcmTIzfwx0kWmB4CMhZEvzaPzeIbfKzjIt6Kcxp2dqzqA8xGkd9SRvN8NC2LUHZxxJ8UL8TJxUsZdVJ8nHSgilM6keBMmCD4Zw/EWCu42EGw/VYHzNDQbM/RBOCAiq2f7FK3o1wGKvYTMOxKvI80hvz84QfW9Wj+6Tcjoc8gXYv/6WRSXUOzPki9SzMWn6Hymp5VnpFNrPaOy1L6pplPHN7dh6Y35VaD6qzBTi2hP0tP4080M7BrnAPkjnRNJhwfoei+LR5KOIn+G9HnyPvF/GiBfz+CryPeER2/aA5nHKsAzB8AsA0LajZ1chZuSmP2p3ROlzQJOJk7Y/HpdwHW4Pn5WN4XruD1U59td7KFfs9fGpCe2y7NjY0mxKp2jgjPcLf7WzTE4ZLk3zeUn4jzSWVTb1FbHkNHBFz/dL8R7ujgUvO7aOI7W0Lg4gPqf/O4AQH6m6LDLyZeJj1Gch/dTNIpc32iO8aLOMao0VoMhCgbRGli2JTQ5zVIEaNdBiV06c+ob95HXHtuoUR1sx9gZNPqO9WxJmfzT2BSRR8i7Ybfa3v9irWfoKc3prVhAvgL/zfA+Rg9wTqieSvcVmE8aF8mbBvCAOJzy2t71DO8h7VkvxAwFYKvcW6ptNqE2/3sm6YUU5+KjtPZnyb19lZUCMe+MSeG34qsjS+qFnBvoPon2c0XYurG605iBXS3KK0px5M5A3X0ds6DZiICFdGv0FYtpDdaD9HfSo6lqL94Yh8a7a9Z6hDihu0Z9NUB7I6pLxGERe9RK37dI3+vZ/wXyi6g+yYIXcN8VVH+k/SmK14oe2RqnUa6xDNa4LvbB/RPnKwZotk31ezGbwc87MnwO6b8YOIru7Sw+i/YzKfuWls0l7UpeTNoQT6HaIw5/aH9JrJyuSnXu0m3oH55qPUbqCdNZLZTwEdGHD4kIcHss/LTgzvpsXyLWrqD18F4o11CThnBB3eBmpQNpLrkdIqD4Sx2UeQ3F66leLT7UILxuA13SO0PrdzXVM6LOgXbUVe6AZQx+RrEbA+uMmwNL+n7/bayp13gf56rX6zPpI/gQg8MMPJPqZ7EbeowJ2sJvSBuJQJOXiZGbS/UoWmvQujtY+mR6SYKH4b56/WUNhhfVE27QLPY/zsYVfAPttSkT1Z8pNq2VtOviVM28EW6IvGNwtl4NlCvFjp0dKX4fnTd8GA6p++1Oyr0pP0/r+1QX1O/5zShmlD3+MNKoUjTUqyrdiLNC2cp1xFLaP8CW7g3xMClQdsTr9AzuUpxGfk3NxS7FpX35Lzbqsp6Qvi++YfBY0i7kguolWJf8DIrbl35kVJ9ck6pN++paPC0g1+snaQ7p/inqnZJmowP8Kez3zurRKeVB9cy9OWz39PBe3jERsp3693NoTpvMO5HOFmf8wr2M7C4Og8bQJTGu8wUXmIhGAVD/SIn8ndhXlzp0aoWwvBnrB3uf0pW8Y5366Vrys016kFVjRVSEJ7EewXw++VbxQanFuAabhpKbd6c8neJJdSF9rs7Rtm1OHiBf1fO7+FOdZ40a6DOiWQCgdRXlqyjWjxncXptyQ4ZuqQ9kXrOXd7RTkH5H+2YRlPEzo56VfBf+H5zNwFcY+Tb5cbQuIh+39I4vljGAhIPmiTiX/Edaz6D7D6w/1UMTU4G8OcOPwXXjdJu+9oy2scIa9e89xnGaxp2YMZ/iwL57jVjsz74+Bqmur2+vSfty8ny6m0WY2MxoFgAYvrKW8Y+muIqROyjXZfCK2le+VU9hGtCL/k0XYRcRetVHCeXXjC6MpScGh8l/IN05Vh5j1DM4ZvVt3H3r0T4sOqrakbxfOFCmZTYtFv4Iop+G8APhw9cb7P4Yh7Lv/3wnjqF4PPm/6/Kac2X6WUWD4qdjbYpTe2WNhpetFxytdT2LNyatQ/vv2Co4bXXJdF5oIpoFAAZvoKwodySdSf5NvEhxb7x8elxPe24CQUf39t86abE9ekBwiElo1DVsigGd22P1RWZgcIyKMCXls0nvMKrI5SGqW5bP5s4fHatETknfHZun4XgJre1rUFwmdmH9jVZFfkxtll62HI0aQ7OwAtLNuIzy2XUjfh/IHEE+g2p78oZGPXRN1OvMnRZ1vXUZS0xDBHT1RryMQVxm4Q0tIt8o5PafcUsverc/zdwEm5j6rY15mNeKcLtuHRNQdMWJISifiBHxreMZ0SwAUJak82OmV/OiIek59UucKhZjntAzBVtCv3mwOmzaO2InXV2hSuMsqL5jT1Ke2ASc35fm6X1/YJlgXI7mju67RHc78jakE+q6tqk3h6LcN46Ybf1tprXNNp7pmtp7tav4uva6DK5H+1e4l3K/Hitr/o6JdVtOasTnTGbeeB1CO84tAhvUqW8FMa8ilMUN63tTUPNeA2YHgn7VoEnlHnFv8FRaHdr7UQwFt82b0D6fOTOudLYAuLru1L3I91P+hvT0CKYsz8OBcfZds8lhQMycmcQvJDPbF9DQGA0dxW20Foi1iQvrtFdfffvhorieLopVR5tOXnYh3nE2AGjW1EaBPpfi5eHtrG4MH8LI3XRuoLVX3SfXW+q8punTLADQRudXwh59Qe2nv4T81Jodnhf2d2vTpWVmW7CzmXCDZbL+vgKT0J6TUAaH6x5OcEu9Zewl4iiYjYx1MszBxoIDbEjel6FX9Hk1x6Ulxp5rMB3KfakxCPoPfageHoNenVN7Hw8m/1rMgv2wkHTpbEA3CwB0Rdxe9ePapbk5Az+le0V4Bztnkh9gydHRQc2Gx+Z34xwaNZumUWfDYqdM7Sg4E06nZlCHyUuMmg7VPBEcuqRX/5hI3HGUkFebuu7loYZrNNvk2hMkB0Y/DZ5dH4y5WmzEKRLd55MvpbpuNgCYZTxAFmf/5NeQ30n1crr3M/cgfCucOV5C3lRo0uOepccFlhXWNNf0rYhmIPO6YvMqLKF1I+YYDR3Ld5LK+j2uJB8vzvofEOu9q5LfSNq4LmMavLZ/4WgyakzY5lCMCanDkvfRupzORcEJFl1B5y/kl5ELOifNVqmeBQcY3blyFf4cp1wWGLwazwsNu3NMNLB7VPTn4glSc33I1CAYMLEZtlT6hdiRvIR8CzauZWub9nVxRlAxTPcsqmtJc4Pdti+rv1j6RXwWX8Gxwm27nLSsbm1A0r8FbKn0aspVxZfGKoZfxZxFtWv8DfXDX56t9TELAPRrqsVXKNZlaFeqn4rYv+cw/DvhA99bLIuaOmUTz6B+GbnM9Ffys7AnA+cY1eDzjWG6Fh8RewSPEYGp9SpctRqtNK5L5pEmCx6dIfW/62SpEodAJXGu0dA2eDTFmVSPjODZ9v+M7buZ0YPBARj9Knbxhlo5/DLVFrXWfxjWZu6ba8fGMlJbL/hD/bfh4tONfk2/DgW1enKIgITit+SP43uUt4dDpVi9TxTdS5nHdmZeFNbNTGiypd3x/0+Ynk7agoGPBjcYeYo4cu9+0gtENPGnZ9ausTSbqOC+3+lvpA/TOpLWUSw5Hy8n7RjHtnbOpfseqm/EMvJ0ENtffj8opqMHlKjWpzqg5ip/oPMDhk9Ei3SOCP+6J/IX6G5OdUhfJSNhxSzLBzAZ9c/06VJGsYDqC6SbGHwnS9bD1gy/gfZq4kNbP6S88MFwPM3WD1BTRqvenLj4Q7US9gOG3x6iqvPuQG31xqVNnclS/1pJM/OXJUJGO71N90N4RG12/pby1Jj5kLajeC75mqggoXwCTsYpwjdwav13q+Xvi6btxr3DshJUz6fahM7bwtrrvInqHozQfVUEg7SOXlr3mRnNMih0jAn0F5xNPoj5a+FksWtlF6rLSKfSeYspt1uNp34zsf/alOlhpG9SvLT3zNAZ0cGdE/ra/PgwU5tpNC05Og2O2dY74aNlaUBPmdYgfYLOdVSnsXh9qu2Yc0w4KYsjqa4O8+/BcDvPCgDjz/lrY/AdpBGWnFZ7/46h+8q4Oedt5HuovhPP98t4fb8ne7GGnTYHS02a9hK7juv8xRcZ+Z94rn10rJylv5BPDDnbH3WsK4TusLEfJGja1l62D2DQWH2mn5ZpHp7KyBoM7k8rU7yK1ueZewfDH8ZqtN4bR8X0n7oy44iwB00JrFPnGtrHM7In1dNIl4cnbvgNceJVOorOBqR390CzQG9T5VzhgGscIROdI1QZe+LYUuk8fDu0/vQuilfrhX6NkPYm7R5KoZv0Vgi/SdpW7ObdLlLelvyDeM7NDJ4eAzw+NT6KfnbfAKNZCGvWCiq9Y3OaqPU28am4Z9L6Iot/T94/toB3zmZkM5a8i+IC2mdMzPlmRg/i9wJGaU2G7gg2VexCZz1GPsPwG+ncRvsbLDmYuc+m/H7MlIWiY/pC30epMQ2Z2ISauHXk+aSF0fmLjAbojvn0YEbag+5atL5LGlqaI1XzKLYn3ci8m5auq2D0OwaVWOto4j4a/0YD5HZ9rdnOXgkAzdmchX9k7nUMbsn9idYpzD2WfDGLv4GDGdgOvxvbJ01Lx+9jnR49iDpAk9I/xCdUdw521bmNVU6ndRx5gJHDad1MdRzddacvAvqpWU+YUsteOM0X+SnOMHmkyCIRqn7T0sDrd+ZMx0Qd/ywR31eeSLvLwN5UFeVnwoxtXUz1HMqDcRzd3/UO2hrP+WZGs+AAy4qtGD43TrUc2JjOXxn5Ur2O/WEGd2DoUoobWPBYHljcmw3ZWJk2EQcgsDvSd32MWdr33DI5QF1fa4JyGnbeLGI1G1yafMPGHk6RTc0BmjjRZkUzIZ9BPoCBlzD3pPiYZvdQVnkmC1eluilWAm011eR4CD4dO5EOMKoLoP2meNmhb0cHz3t1+AXKFzN4GcUrSRuz5OSZt4EHQw4uP1V6Z/4ubxf26zftD9M6gM7RDJ7EyBMYfgnzX8ZQxfBnKVehc8TEukd/mhnNAgBTauLiQwfFiyh2YOircUbPnGMYeDXVurS/Qvk+hp9H9bXZDWD/bJ9KL0h9+cfnm+y5MeJNzOhFxgaELm9bM/J76b6LdBZzj2K4w8IPM/S1iD0cOiL6b/Aj4Uhr6p8szYxmIQLumuJuf2OLU8j/SfFiBk+muyfDH6d1MN3raP8X3oGv0zl0+UVA/71Gscrj8g/VfwfG3W9WIhv23NRXjbvfH/nb7buXjJX90xEBCSNvJ3001vk9i8F5DH8TZzFwQkQSL/4N1eV0tg/leOpAmJkqgQ/C9vCJqH+mtQ4JZa86iepmqvNpn0L1WYpDSe+sB+QdVKuIffST+d+bQwAmQW0DlvG3E6OHVE8Uy9/PPRqnzCiA+54ZnqT8MXUNiNNJTTJgH8B7cAbF86OuxceFhZFOYGhT/LKOANr7wXL4TEb/JB2gPxXoHE6xiMXfF2cDHEs+l3QG1fwaBEfRPYDuhaT1Jql0C/KnyeN37EyDlsUqJ3JMNf/3i4BJaUt8muoJY2MgR+ufT/dURt4T7+359Y1vU9xO8bowORd9i6pD+2CKvy0bcLOjf9LHo/upYX0Lt2b4NwzcQXcX8m0Ur6fYl3SoOJn7xVQnkm4iH0K6cJwIWJXqRbR2oVjMyOdIVzUt6uUbv3bQbEppGzuIjchozEr6DoDou9bMk4b9N2Ihodocr8equCz8HMXfe18yb8G25C+LLXBH4eg4MKr8GuVfSUcG53Aeeffok/Z3l2fgs/nTzttPswDA8LIz9eWuw8CeETPfTeL7dzfSOoJ0MPmF4qMOu4VszKuS3kj+7FhGVWFgXcqXx/7B9jnhLEm//hcDYDvxNbJnka/E5ylu7nkEGy7QOpB8MnmQ1n+SvxFAdrrY3fwmsTv6HLpPYe5bScdOf+m7adH/egB01UfFPD3cq+mOQHvnOhzAyFtIx5NOpFgrZky5nzhz+GCjEcilUOZKcSbhwPbBdotVxI7js8XhiQuXBkBHn36yC8UtVCVpI9oXI4+10/sBkOYxsiaeTX48xUKKX1FeTr6mx6kazpDXqrnZ3hRXkF4UQMm74WNU36Lz2Tg0K5+D3fHqOGNo+dn+vwEAmpDujPY+VKdT3h9x7vkX5GeTDiP/QXwtC+UHcESER+cjKb5OdetYsVCgnEvaDf9Bulf49zuka0g3MHQ9eWHPBs/wOvIR5EznS7U1oufcSR3aj8EmpM3jobJNsQb5Z7gg9JpmtnfrsotVSIeQ/4tydYrP0XlDrRO8ivxc8pnh87cO3W/T3o3iLVSfmtghtWz6NwJA4/GzNUPnUawdHebUOFyh/FK4jPObxWETm+IzVM+mdTvVe8lf6i2yNPb46AJMh2IrbEnaGpvT/Rwu6JPdbfIX8Iq4Nud05rw0jrqrDwljY9LRpNvDHKuuicDR/vWChsM0Fkb7INK7ydvS/nW8Q/kLcYrH5yg2I78G15J2pzqTcm0G96P4ToBvmS7uCenfEQDoboSTqJ6EY0hH1AP7Rrp71DPtU/WAPAsfEDuGryOdTvFp8u3B2hultH9wWqg2EmFd/+hdtwbVG/BeciJ9JGaq2/s6fh7lw2jf1DMPG19Bv45RzKM6nPJQiseRbg4QVCdGnuKlwd1aV5GPrr2Hb6f8aHCn4pAIZC2sgAAYQTFHfMzpIKrzYiGp/Rfyo2PdwN3BLnN9GkfrNYx8hLxa/F98kvYJjNyKe8Y6dxrlrWHTo53bIpehgJlD/qhRNtIocQ013GWMIjofj8D+4dGzgLSE9jFU76650aPwKootaR1DOi+ifMtjSS8X5yMcGAtjje6wYgKg/l29ivy5YM/pNaQvxPW8r4gvvJeRT1BcWTtt9sdrxJe2kW/C12mdT7qY7sKxGn8DAHqd2z+TGyr6rveLlk6baqdQ4vKh2LrmCr8kf5XiS0Y/pNk+grQV6RSKE2sOsj/phIj6KY7FW3sm8koA1NfT9vgk5Z4UP6Z4P+kichFHvdiR9FvSJaSfxbPdnaj2pdiD/MR6MP+AK8SxbDfiZqrrad/WV5ex4qLfPVw9DI+i2IBqfWwnPom7Q62AXkn1Q1rn0vpxvRy7LXkvqq1wL50Pk/5B3pLqbZQvE9/+eW0804BsJQDq36Pu1wHK15GOqWfIqaRXMLKEok06CAeISOQz6J7f2zJWPgL7Ub2Y9IQoNwvFzZA4g/je2ul0D3lxZEhzyQsEW19THFkzSOrbz15dGesaxZl0r4136CJvR/Ey8oakC6m+QnVvbXJ+iOEj6yI+RXE0+e6xXGYlAOrf/f73SrBQ7yC/OC7kT1J8VjiRkA6II2nyJgxmqu9R/VoczqzuwO1JjxKz+bGUW5JXF6dy9nuFsjhAYoT8AMXVpD+Q/4Q/i9NPRmrfQIvhbUNzH1mT8mo6i8gnkUrSqnQPIx0pwPR9Wh+k/GVvYFcCoL4+FQDU94r/oPt2o0eup/+iOk1s9EBal3Jvim0pHkm+UHz9c5h0V2wHG9JT7prOLovgNk1DUrm0BzGh2jCAVnTEEW97BEiqy2j9FNfU+TYlPy/2RlRrkC+h9Rmc0jMVVwLADACg3hTyBHGC+KFxIf+B1jeCK5QP1J26EXlVrE/aOdhysZDuHRQjWEj7Hqr7KO+pRQMhQxZQrBYcwgKqAYo1w9pIt+PiiGhKiwNUo2A6nO7h5M3jufSjMCvzRXWdVgLgwQFAU9b2pMNDq1bHFLZ+QD4bPwxlr3ESdZEeRt6K/BisTZpPKjBErlX8XNCqd5/mheR/UF1H64rwM7Rzn2//EaQ9Q/HMB9YNHAndoPp8KKeqsWboSgB4EAFQ/82wH/nlpJ3I69Ud9w+Ks0nnh3wurqN9d6/+5rz/Zn2iGZB6N9joCl4b3QXi20hbhIVR7SM8hHBv+CaKb5K+juHeO7ASAONy/5MA0FxbN0REsVnY6dVeWK3Oeyfpr7FAlBeJ83WGovI8XBc0EBZGNUieg7nh8682FN8TFI1IP6G4MLiMXweXKPratBIAk+b+JwNAz9FToVxHnD7+OPLOYk1gU9Lq5EkOKGoWmFKXfI+ISfh9WADFpeS/UtzU4xRNm1dQAKyk/xs0i5CwlfR/gVYCYAWnlQBYwWklAFZwWgmAFZxWAmAFp5UAWMFpJQBWcFoJgBWcVgJgBaeVAFjBaSUAVnBaCYAVnP5/NibxjjUCQN0AAAAASUVORK5CYII="
let menu1Base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAYAAAA4TnrqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFG2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuZGFiYWNiYiwgMjAyMS8wNC8xNC0wMDozOTo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA4LTAxVDE1OjIwOjQzKzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOC0wMVQxNToyNzowMyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wOC0wMVQxNToyNzowMyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpjNjFjMjQ5ZS1iOTRl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"
let menu3Base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEsAAABLCAYAAAA4TnrqAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFG2lUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNi4wLWMwMDYgNzkuZGFiYWNiYiwgMjAyMS8wNC8xNC0wMDozOTo0NCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iIHhtbG5zOnBob3Rvc2hvcD0iaHR0cDovL25zLmFkb2JlLmNvbS9waG90b3Nob3AvMS4wLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0RXZ0PSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VFdmVudCMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDIyLjQgKE1hY2ludG9zaCkiIHhtcDpDcmVhdGVEYXRlPSIyMDIzLTA4LTAxVDE1OjIxOjE5KzA4OjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMy0wOC0wMVQxNToyNjoxNyswODowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMy0wOC0wMVQxNToyNjoxNyswODowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDphNWUwZDUzMy0zZmNjLTQyYjQtYmRlZi1mNGUxMTkwNGViNDkiIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6YTVlMGQ1MzMtM2ZjYy00MmI0LWJkZWYtZjRlMTE5MDRlYjQ5IiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6YTVlMGQ1MzMtM2ZjYy00MmI0LWJkZWYtZjRlMTE5MDRlYjQ5Ij4gPHhtcE1NOkhpc3Rvcnk+IDxyZGY6U2VxPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0iY3JlYXRlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDphNWUwZDUzMy0zZmNjLTQyYjQtYmRlZi1mNGUxMTkwNGViNDkiIHN0RXZ0OndoZW49IjIwMjMtMDgtMDFUMTU6MjE6MTkrMDg6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi40IChNYWNpbnRvc2gpIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Ph029YAAAAE6SURBVHic7dpBCsIwEEDRiXgq8fatiKeKK0Fc2Px2UqP+B1211PgxMhZLrTXU5vDpBXwTYwHGAowFGAswFmAswFiAsQBjAcYCjAUYCzAWYCyi1rrpiIhLRNSFY3p6yanD+XfXp73vjE/WqeGapSeMW8+/OsPrm5StT0pLKY8blO3LSdG0njXv2+8swFiAsQBjAcYCjAUcE+4xB5+Deuq2now5K2kp+3LO6iwj1i0irgn3ydJtPf7cAdyGgLEAYwHOWYBzFuA2BJyzAOcswG0IGAswFuCcBThnAW5DwDkLcM4C3IaAsQBjAcYCjAUYC8iMNcp/Sul6mmXEmhuu2fs/pUtW3e8Xfxs6lI7AWICxAGMBxgKMBWQ8gx/NuM/g/4nbEDAWYCzAWICxAGMBxgKMBRgLMBZgLMBYwB0ppPRACKQd2wAAAABJRU5ErkJggg=="
let mainCanvasWindow = new MainCanvasFrame()

// 延迟显示
setTimeout(() => {
  mainCanvasWindow.hideMainWindow()
  mainCanvasWindow.canvasWindow.rootContainer.attr('alpha', '1')
}, 100)
function _exit () {
  mainCanvasWindow.hideAll()
  ui.post(function () {
    mainCanvasWindow.canvasWindow.canvas.setVisibility(View.GONE)
  })
  setTimeout(() => exit(), 50)
}
let floatyButton = new FloatyButton({
  logo_src: iconBase64,
  menu1_src: menu1Base64,
  menu1_on_click: function () {
    mainCanvasWindow.toggleFloatyShow()
  },
  menu2_text: '截',
  menu2_on_click: function () {
    floatyButton.runInThreadPool(() => {
      if (mainCanvasWindow.isHide) {
        // 等待按钮关闭
        sleep(350)
      }
      mainCanvasWindow.takeScreenshot()
    })
  },
  menu3_src: menu3Base64,
  menu3_on_click: function () {
    floatyButton.runInThreadPool(function () {
      mainCanvasWindow.toggleMainWindow()
    })
  },
  menu4_on_click: function () {
    _exit()
  },
  menu5_on_click: function () {
    floatyButton.runInThreadPool(() => {
      mainCanvasWindow.showConsole = !!mainCanvasWindow.showConsole
      let currentEnabled = [mainCanvasWindow.hideFloatyWhenTakeScreenshot ? 0 : null, mainCanvasWindow.showConsole ? 1 : null, 99].filter(v => v != null)
      
      dialogs.multiChoice('功能设置', ['截图时隐藏贴图', '显示console'], currentEnabled, (enabled) => {
        // console.log('当前已启用的：' + JSON.stringify(enabled))
        if (enabled.indexOf(99) < 0) {
          return
        }
        mainCanvasWindow.hideFloatyWhenTakeScreenshot = enabled.indexOf(0) > -1
        mainCanvasWindow.showConsole = enabled.indexOf(1) > -1
        floatyButton.runInThreadPool(function () {
          if (mainCanvasWindow.showConsole) {
            console.show()
          } else {
            console.hide()
          }
        })
      })
    })
  }
})