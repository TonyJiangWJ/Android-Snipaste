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
  stop = true
})
// 调试模式
let debuging = false
console.show()
setTimeout(() => {
  if (debuging) {
    exit()
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
  drawImage = grayImg
})


let device_width = device.width || originalImg.getWidth() || 1080
let device_height = device.height || originalImg.getHeight() || 2340
// 识别颜色类型 默认彩色
let mode = 2
let cutMode = false
//toastLog("截图成功")

let canvasWindow = floaty.rawWindow(
  <vertical>
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
        <button id="btnColor" layout_weight="1" text="彩色" />
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
    _displayDrawed: false,
    _movingDrawed: false,
    _hideDisplay: false,
    get displayDrawed () {
      return this._displayDrawed
    },
    set displayDrawed (value) {
      if (value != this._displayDrawed) {
        console.log('change display drawed ', this._displayDrawed, ' to:', value)
      }
      this._displayDrawed = value
    },
    get movingDrawed () {
      return this._movingDrawed
    },
    set movingDrawed (value) {
      if (value != this._movingDrawed) {
        console.log('change moving drawed ', this._movingDrawed, ' to:', value)
      }
      this._movingDrawed = value
    },
    get hideDisplay () {
      return this._hideDisplay
    },
    set hideDisplay (value) {
      if (value != this._hideDisplay) {
        console.log('change hide display ', this._hideDisplay, ' to:', value)
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

  this.onMoving = function () {
    _this.displayInfo.movingDrawed = false
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
    _this.displayInfo.displayDrawed = false
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
          _this.displayInfo.displayDrawed = false
          _this.displayInfo.movingDrawed = false
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
    // if (_this.displayInfo.displayDrawed && _this.lastScale == drawScale) {
    //   // console.warn('应当停止绘制')
    //   return
    // }
    _handleCanvasDraw(canvas, true)
    _this.displayInfo.displayDrawed = true
  })

  this.floatyCanvasMoving.canvas.on("draw", (canvas) => {
    if (!_this.displayInfo.hideDisplay) {
      return
    }
    _handleCanvasDraw(canvas)
    _this.displayInfo.movingDrawed = true
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
      console.log('触控点数量：', event.getPointerCount())
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


let canvasWindowCtrl = new FloatyController(canvasWindow, canvasWindow.btnMove, 1, canvasWindow.vertical)

let canvasMove = canvasWindowCtrl.outScreen()

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
    // 将mini按钮移动到屏幕外再贴边
    // miniWindowCtrl.windowMoving({ from: canvasMove.to, to: { X: canvasMove.to.X + 100, Y: canvasMove.to.Y + canvasWindow.getHeight() / 2 } })
    // miniWindowCtrl.windowMoving(miniWindowCtrl.toScreenEdge())
  })
})

// miniWindowCtrl.setClick(function () {
//   //canvasWindow.disableFocus()
//   threads.start(function () {
//     // 将mini按钮移动到屏幕外
//     miniMove = miniWindowCtrl.outScreen()
//     miniWindowCtrl.windowMoving(miniMove)
//     // 将canvas移动回屏幕内
//     ui.post(function () {
//       canvasWindow.canvas.setVisibility(View.VISIBLE)
//     })
//     // canvasWindowCtrl.windowMoving({ from: canvasMove.to, to: canvasWindowCtrl.centerXY(miniWindowCtrl.centerXY(miniMove.from).from).to })
//     canvasWindowCtrl.windowMoving({ from: { X: miniMove.to.X, Y: canvasMove.to.Y }, to: canvasMove.from })
//     canvasWindowCtrl.windowMoving(canvasWindowCtrl.intoScreen())
//   })
// })


canvasWindow.btnCapture.click(function () {
  threads.start(function () {
    // 隐藏悬浮窗
    let canvasMove = canvasWindowCtrl.outScreen()
    canvasWindowCtrl.windowMoving(canvasMove)
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
    canvasWindowCtrl.windowMoving({ from: canvasMove.to, to: canvasMove.from })
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
    // let canvasMove = canvasWindowCtrl.outScreen()
    // canvasWindowCtrl.windowMoving(canvasMove)
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
    // canvasWindowCtrl.windowMoving({ to: canvasMove.from, from: canvasMove.to })
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
        new FloatyImage(clipImg)
      } else {
        toastLog('未框选小图')
      }
    }
    ui.run(function () {
      if (!cutMode) {
        canvasWindow.cutOrPoint.text('贴图')
      } else {
        canvasWindow.cutOrPoint.text('裁切小图')
      }
      cutMode = !cutMode
    })
  })
})

canvasWindow.btnClose.on("click", () => {
  stop = true
  exit()
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

threads.start(function () {
  sleep(100)
  ui.post(() => {
    canvasWindow.setPosition(device_width / 2 - canvasWindow.getWidth() / 2, device_height / 2 - canvasWindow.getHeight() / 2)
  })
  sleep(100)
  data = {
    translate: {
      x: -(canvasWindow.getX() + canvasWindow.canvas.getX()),
      y: -(canvasWindow.getY() + canvasWindow.canvas.getY())
    },
    scale: 1,
  }
})


let globalPointColor


setInterval(() => {
  if (globalPointColor) {
    ui.run(() => {
      canvasWindow.vertical.attr("bg", colors.toString(inverseColor(globalPointColor.color)))
      canvasWindow.horizontal.attr("bg", globalPointColor.colorString)
      canvasWindow.color_value.text(globalPointColor.colorString)
      canvasWindow.position_value.text(globalPointColor.x + ',' + globalPointColor.y)
    })
  }

}, 50)


positions = []
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
    let S = calculateCoordinates(w / 2, h / 2, data, forDrawImg)
    forDrawImg.recycle()
    globalPointColor = S
    if (cutMode && positions && positions.length === 4) {
      paint.setARGB(255, 255, 255, 0)
      canvas.drawRect(convertArrayToRect(positions), paint)
      ui.post(() => {
        canvasWindow.region_position_value.text(displayPositions || '')
      })
    }
  } catch (e) {
    console.error("canvas" + e)
    printExceptionStack(e)
  }
})

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

function calculateCoordinates (X, Y, data, img) {
  let X = X - data.translate.x,
    Y = Y - data.translate.y
  let x = X / data.scale
  let y = Y / data.scale
  x = Math.floor((0 <= x && x < img.getWidth()) ? x : (0 <= x ? img.getWidth() - 1 : 0))
  y = Math.floor((0 <= y && y < img.getHeight()) ? y : (0 <= y ? img.getHeight() - 1 : 0))
  let color = images.pixel(img, x, y)
  let colorString = colors.toString(color)
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


let Touch = new Array
let TouchData = new Array
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
        TouchData = deepCopy(data)
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
          data.scale = TouchData.scale * scaleRate
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
        TouchData = deepCopy(data)
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
          let SS = getDistance(Touch[id1].X - Touch[id].X, Touch[id1].Y - Touch[id].Y)
          let SS1 = getDistance(X1 - X, Y1 - Y)
          let kS = SS1 / SS
          data.scale = TouchData.scale * kS
          data.translate.x = X - Touch[id].X * kS
          data.translate.y = Y - Touch[id].Y * kS
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


function pointRangeBack (x, y, moveRangeInfo) {
  // 修正坐标的所在范围。如果坐标超出了范围，则修正回来。
  x = (moveRangeInfo.from.X < x && x < moveRangeInfo.to.X) ? x : (moveRangeInfo.from.X < x ? moveRangeInfo.to.X : moveRangeInfo.from.X)
  y = (moveRangeInfo.from.Y < y && y < moveRangeInfo.to.Y) ? y : (moveRangeInfo.from.Y < y ? moveRangeInfo.to.Y : moveRangeInfo.from.Y)
  return {
    x: x,
    y: y
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
    console.log('当前位置：', x, y)
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
  threads.start(new java.lang.Runnable(() => {
    this.windowMoving(this.intoScreen())
  }))
}
let iconBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAACXBIWXMAAAsTAAALEwEAmpwYAAAMtElEQVR4nO2deVAUVx7He4/s7h+7/2SPwhy1d4wCCuJ6bUyF0jgYwBjUAEYhUdF4JRoPBFHXgzDiGS2jiYlZNYmA3DLvIacmKh4gLkSNluZAuhHpRjDuruKWv63fgxmYGYbpYcaenqG/Vd+imdfTM+995t2vX3OcJk2aNGnSpEmTJk2aNGnSpEmTJk2PRlLhE0+3lvTLbC3udwfdUuyT01r6RP9H9HGaLNVS7HOypcTny04YPlJrST8wc7FPM4Zx3qqvIONnvGT4Oy8Z4niRbOZFUsCLtIYX6XVBpM2CSO93uBlfaw8jR3iRbsL31EuFo/AarvguCKOl2OcLPGY5wxKGCUq/DM6bJIgFA/hmskKQ6FFBov8WJArOmJfIXUEkhbxE4vmmwmdd8R1ZMWULSEm/Vs7Txd/J/w0vkoW8RM86C0AGoDO8WLigvrX4148ISAvnqWpsLPARRKp3RU5w2CK9J4j0g3qp0OEyn1XgtoGkc56mhoajvxNE+iEr/5UGIVmBuc+LZI9wh/xW7vfH1hRW4JYwWkp8RLH8yac4TxHAmh8LoiFGEGmT20FIVmBu8yJ9GyDjJ3Liwlpaxf0ysM7ocLpHwahrLPwLlt9uT3ipZ/MSrbjZUvAnzpvFi+QV/AW6O7EF+VBa6yVDJOdtwuwvSHSHuxNY6L23YTHLeU2nTiTpKkhUcNI5335b/gs5cdZnjQ3VZ79Yn5I99oY++8XxnFrU1JT7K16ipSpITHCRSzBO9uLdAQKYs8bWcWrJGR29bFOEvm/Ih4Q3X4VLV9LcnbAg1ztSFkChYZvpf14iZVeB/NyjgGB5y0s0wzJyF2oOgs53AJQW7XB7QgsyPX3caNiePN/y9ZyemsVYTDEoWWPr3s0aE8K5W7YqcC8CArxEt3KeoAaJTrEVOW8CIqBFGsGpWY0t5M+8SFr6EJDbqu08ttcb5j3wb+pz4VTFhyYX5KUyIFhR5mVvhOt1Oey8+iYDnK74yHReRcVeqGs40gXkp2bXuXwtwxR29ZtMs7DzF/abwuoaC6yue+NmgSm8+l8HzN575frhzs+sPQiZaethyuhhsHbxNLPz0Bi3dijklCr7KEIzmWf5C0pJnMEA2PLcN6KBXq+ALXs3W4Wt1SexsNzaUtD5+5qFTZ8QwsLQs6dNsXpv+qkjLCx1l94qbMPmNSwsu7rIKuz1iDDTdSeOGtbjd8e4ddYnhjhOhaO2zZZALHPIZ/tWscjEzJwN7+zZB8knqkBfdRlSKr+CpGwCK7MKOmyAd0/XsDD0GlreJawA1pWfNoWtP37WLGy1ocQUlnLuotV1U87UmsJXG8rM3rv+WOd1/0GPwaKdeyDE3xdmhAXbziHtuURyZJT4kYsNocsojy9eSWNAVhzMMEVc7Z74/HOgT5xpFZcf/nMdHj78H/vLcolId3Fq0A2RPOXIfEb+eeL2RNY74PdOnmR1kWU8EAbq4cMHxgr+Xp145EnV9jlsufTbk25PZL0D3l1T0208OnPINfX0TXAO3NFp19xzBW5PZL0D3n7ihFmLz95CCmfm6J0HIpKFjsC4dDUdQvwGQuLhfLcntF6mXw0dD3u2Lpbfd2km89wHxMHVIcaOYfwBz6nUI8YE2+4YdptLaIXb1k05AqOvABFYR5cqv5SUF2mCBoR2C6RBossUByJIpMhRIDjkgb1u7IS5+5evl+nIsFD48L0lDsWTFylxw1pbctdRIGjDV509aU/wzjNn2FibQ0AkctdVa4llCRcv9waGN/VDBDu+KZIRigERJDK7t0AyT2RDSuUltye0Xqa3HiuH74R8h+PJi2SmYkB4kWzpDQycS8dWVmJ6ntsTWi/TU8aHwPubF/UGSKqSQAp6A6SvNHsFZpKnIBBa40lAEtNzYZJuHBslsJzXCA0aArOWJYD+3EXXAhHJBSWBfKcmIDobk0jGuZaJo5+DWeHjYe/WZPho+7tm3piwmIFavGuvS4HwIvlGMSBsQqYXQHCK9KVBfrAym7ocSOKcN0yJjMdGIFhf4bHh8H64VHuyW8dNDIXpb8zo9trRL4fDxzuX9SKH0CYFgXTOfzTePgb32kQ2FI1/G2+X9/hFj35d7vIiSdcDkDdXr4PwoYFQe+ELm0C2rFoOYcOGstxkee1dVZX4a+8NkHtuAYIQugr/V6IfsrqgGCInTIAQP/P59u68JDbaJgw05h5710CHBQ6CpTMj5K28VBZIZ5FlnDkzyjSDZsNp5Wk2K1C9A458eSLE6MZ0Wy9Y+mj+5z0Cwdxj7xroDzatg6jnR8GymZPUVWR1rdQdySHGfkhCWo7TQEL8fRmMnhL6UXhP6lqWU1RVqXdt9prXIU091iGubGXpfAewX63chCwl6bBhyQKI1Y2B8CEBzHicvHQhlJIM2dfBz8TPVlmz1/0dQ51MIDXnj8O6t+eyHDV51CiIj5sHG1euZ8ZjfA3roXWL50Nt9XHXAVG2Y0g2qwGITobH+/vC+EF+sGlVMhTT01BWdM7M+FpqUjI7B881vm9bbDAcXx8B0SMGs//xL/6ftWGW3ByyUTkgkiGuN0CuXs+E0CGDISnX+X6IzncA5K19DcpWBNt0/EtBEDrYH/bv/tQKhKX37z4ILw32g4SwoT1eM2d9rCwg9SKZ4RHD70XXvnBJs1dnB0j6/NGg8xvIcoYx0XMzjsLC6OkQGhjAvCDyNcj8LN8UnrpyA+u1Z8wf7TQQRYffnZmgclU/RGcHyMqwIJg0coSpmEIY4UFDYJy/Pwx/1pf5RX8/9hqG4TkltAImjRwOSeFDnQLCS+QHgMrHFIEBZyOfbquMymyrnvagrXo63L28HBpvpssGcpAc6LZH7GogU0cGQHzcfNOvH3MGwhjY3w+efcafeUB/fxjn7wcLp8aYzoufNQ+mjQpwDohIDcrBqIqWHlRFQ1ffr46FxsZMuzDOnN3HIrNox+5HDiR8sB9rSRkTGosozBVGGEaPGOALYUMCTOfpE9ZCeICfk0UWWaoIEMwZljCMvvv1CqsvVnvpc8jL1Jv8fuoiFpmoiMkwJz4J1hSWscRNPnkelnzwCSzZ/THzO7v3wfpjZ0yJH78/3RSGTsqh9oEE+MHGxHXygAQGdgGyzmkgii0DaquKumMLSFt1jNUX27Q6rscm6aI50+DL77+EPfu3WIWlblvFwkouF0Fo4CCzsJmTwhwushZETmV1BhZTRhgDn2kvst5yZZElklOKwLAPJNa6LG0icO27bJMrTu1lkck+lMxuTcBw47nX6jrPQ1veTt01DFejO1qpY2uqvVL3Y7kCjccThgZB3uEulfqIYc5V6s1krpJAcmwXWQl26xBX3mOos9fsnTeaNWGxKWvW7J0aw+oMNOYMIww01jn4nsO9bPZiy7OupfBxxYDcO/ta/7bKqGarSv3C69B4K0tVQMpWBENC6FDW2cNOn72O4T/fP8DOTQwL6nXHEEcwOKXV3tKKymirimpF36+Oyb/ZmNkmJxGVBlKy/AWY/UIgS2jMKVgkWYLA17Dyx3PmBAdCcXxw74CI9N73TUVPcGoQ24lNRiLWXvycReZY2S6XAJkyMkjemBZb3DAQXhk+HJbPmmsaXMTjV4bjzZ3t4T1dY+pzf4PTnyTAoY3tLUXr70R2dk2TB5VRoW2V0fVtlVE3HpyPVHYDGrxJRe7ucEWF2+HGLYNLgHzkwPB7GTkMKcvegtiQsTAhKIAZj1OWvw3lNNO54XeRiHjzUtc0YSCMDZ6qaOX3OxEk+qaziSw4YJwkwhk8NUxQdTeQ6HYgHRvOVCgFZOnMCDadilDkTL+6wggj8vmRsHzW5K51xwkA+JFlemAxhVAQxoOqKPdsQCM0F/y+t0uEHPWlK2lsbht/rXLnRpw1fhbCMC1yEOnthttH/8ipWYJIJitZdAluMi+Sh7iHJOcJwj0KvR8I3cR5ilh94h37LEK3FukhVW44Y3eLP5EUel3OkOxv8ada4YaRuHGkuxNRcJlJcWNj+S85T1Z7TqGHvCBnZMndJlb16uijbPXc1hTd5HF1hhzxTfTl7vbVUvNW4w0SncJ5s7AjhbNq7k5swZ5FeqLhNv0D1xeEQw34uApepLdUCKK5/XEVXlhEyXvEEd3FnnLjbhAS+S8OoSs646dW4Z6NvET/gWW20iDaF/yR91SxG5zaVNdS+HhDE52vyKgx1mPNZF6fyhHOPLah/pbhGdxVhxcJxaWZLsgJP+CmMLiI7cator9yfVGuekoAQOVj9RIdyUt0Fu6QgPde4A0x7Q+WJFLngyWJ1PHaBTwHz8UtLnDhM0D5T7m+LtU9tqGvS3WPbdCkSZMmTZo0adKkSZMmTZo0adLEebD+D/VOcVn0TqKzAAAAAElFTkSuQmCC"
let floatyButton = new FloatyButton({
  logo_src: iconBase64,
  menu2_text: '显',
  menu2_on_click: function () {
    floatyButton.runInThreadPool(function () {
      if (canvasWindowCtrl.isHide) {
        // 将canvas移动回屏幕内
        ui.post(function () {
          canvasWindow.canvas.setVisibility(View.VISIBLE)
        })
        canvasWindowCtrl.windowMoving({ from: { X: device_width, Y: canvasMove.to.Y }, to: canvasMove.from })
        canvasWindowCtrl.windowMoving(canvasWindowCtrl.intoScreen())
        canvasWindowCtrl.isHide = false
      }
    })
  },
  menu4_on_click: function () {
    exit()
  },
})