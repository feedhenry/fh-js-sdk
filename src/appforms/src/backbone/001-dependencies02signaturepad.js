/**
 * @preserve SignaturePad: A jQuery plugin for assisting in the creation of an HTML5 canvas
 * based signature pad. Records the drawn signature in JSON for later regeneration.
 *
 * Dependencies: FlashCanvas/1.5, json2.js, jQuery/1.3.2+
 *
 * @project ca.thomasjbradley.applications.signaturepad
 * @author Thomas J Bradley <hey@thomasjbradley.ca>
 * @link http://thomasjbradley.ca/lab/signature-pad
 * @link http://github.com/thomasjbradley/signature-pad
 * @copyright Copyright MMXI, Thomas J Bradley
 * @license New BSD License
 * @version {{version}}
 */
/**
 * Usage for accepting signatures:
 *  $('.sigPad').signaturePad()
 *
 * Usage for displaying previous signatures:
 *  $('.sigPad').signaturePad({displayOnly:true}).regenerate(sig)
 *  or
 *  var api = $('.sigPad').signaturePad({displayOnly:true})
 *  api.regenerate(sig)
 */
(function ($) {
  function SignaturePad(selector, options) {
    /**
   * Reference to the object for use in public methods
   *
   * @private
   *
   * @type {Object}
   */
    var self = this, settings = $.extend({}, $.fn.signaturePad.defaults, options), context = $(selector), canvas = $(settings.canvas, context), element = canvas.get(0), canvasContext = null, previous = {
        'x': null,
        'y': null
      }, output = [], mouseLeaveTimeout = false, touchable = false, eventsBound = false;
    /**
   * Draws a line on canvas using the mouse position
   * Checks previous position to not draw over top of previous drawing
   *  (makes the line really thick and poorly anti-aliased)
   *
   * @private
   *
   * @param {Object} e The event object
   * @param {Number} newYOffset A pixel value for drawing the newY, used for drawing a single dot on click
   */
    function drawLine(e, newYOffset) {
      var offset = $(e.target).offset(), newX, newY;
      clearTimeout(mouseLeaveTimeout);
      mouseLeaveTimeout = false;
      if (typeof e.changedTouches !== 'undefined') {
        newX = Math.floor(e.changedTouches[0].pageX - offset.left);
        newY = Math.floor(e.changedTouches[0].pageY - offset.top);
      } else {
        newX = Math.floor(e.pageX - offset.left);
        newY = Math.floor(e.pageY - offset.top);
      }
      if (previous.x === newX && previous.y === newY)
        return true;
      if (previous.x === null)
        previous.x = newX;
      if (previous.y === null)
        previous.y = newY;
      if (newYOffset)
        newY += newYOffset;
      canvasContext.beginPath();
      canvasContext.moveTo(previous.x, previous.y);
      canvasContext.lineTo(newX, newY);
      canvasContext.lineCap = settings.penCap;
      canvasContext.stroke();
      canvasContext.closePath();
      output.push({
        'lx': newX,
        'ly': newY,
        'mx': previous.x,
        'my': previous.y
      });
      previous.x = newX;
      previous.y = newY;
    }
    /**
   * Callback registered to mouse/touch events of the canvas
   * Stops the drawing abilities
   *
   * @private
   *
   * @param {Object} e The event object
   */
    function stopDrawing() {
      if (touchable) {
        canvas.each(function () {
          this.ontouchmove = null;
        });
      } else {
        canvas.unbind('mousemove.signaturepad');
      }
      previous.x = null;
      previous.y = null;
      if (output.length > 0)
        $(settings.output, context).val(JSON.stringify(output));
    }
    /**
   * Draws the signature line
   *
   * @private
   */
    function drawSigLine() {
      if (!settings.lineWidth)
        return false;
      canvasContext.beginPath();
      canvasContext.lineWidth = settings.lineWidth;
      canvasContext.strokeStyle = settings.lineColour;
      canvasContext.moveTo(settings.lineMargin, settings.lineTop);
      canvasContext.lineTo(element.width - settings.lineMargin, settings.lineTop);
      canvasContext.stroke();
      canvasContext.closePath();
    }
    /**
   * Clears all drawings off the canvas and redraws the signature line
   *
   * @private
   */
    function clearCanvas() {
      stopDrawing();
      canvasContext.clearRect(0, 0, element.width, element.height);
      canvasContext.fillStyle = settings.bgColour;
      canvasContext.fillRect(0, 0, element.width, element.height);
      if (!settings.displayOnly)
        drawSigLine();
      canvasContext.lineWidth = settings.penWidth;
      canvasContext.strokeStyle = settings.penColour;
      $(settings.output, context).val('');
      output = [];
    }
    /**
   * Callback registered to mouse/touch events of canvas
   * Triggers the drawLine function
   *
   * @private
   *
   * @param {Object} e The event object
   * @param {Object} o The object context registered to the event; canvas
   */
    function startDrawing(e, o) {
      if (touchable) {
        canvas.each(function () {
          this.addEventListener('touchmove', drawLine, false);
        });
      } else {
        canvas.bind('mousemove.signaturepad', drawLine);
      }
      // Draws a single point on initial mouse down, for people with periods in their name
      drawLine(e, 1);
    }
    /**
   * Removes all the mouse events from the canvas
   *
   * @private
   */
    function disableCanvas() {
      eventsBound = false;
      if (touchable) {
        canvas.each(function () {
          this.removeEventListener('touchstart', stopDrawing);
          this.removeEventListener('touchend', stopDrawing);
          this.removeEventListener('touchmove', drawLine);
        });
      } else {
        canvas.unbind('mousedown.signaturepad');
        canvas.unbind('mouseup.signaturepad');
        canvas.unbind('mousemove.signaturepad');
        canvas.unbind('mouseleave.signaturepad');
      }
      $(settings.clear, context).unbind('click.signaturepad');
    }
    /**
   * Lazy touch event detection
   * Uses the first press on the canvas to detect either touch or mouse reliably
   * Will then bind other events as needed
   *
   * @private
   *
   * @param {Object} e The event object
   */
    function initDrawEvents(e) {
      if (eventsBound)
        return false;
      eventsBound = true;
      if (typeof e.changedTouches !== 'undefined')
        touchable = true;
      if (touchable) {
        canvas.each(function () {
          this.addEventListener('touchend', stopDrawing, false);
          this.addEventListener('touchcancel', stopDrawing, false);
        });
        canvas.unbind('mousedown.signaturepad');
      } else {
        canvas.bind('mouseup.signaturepad', function (e) {
          stopDrawing();
        });
        canvas.bind('mouseleave.signaturepad', function (e) {
          if (!mouseLeaveTimeout) {
            mouseLeaveTimeout = setTimeout(function () {
              stopDrawing();
              clearTimeout(mouseLeaveTimeout);
              mouseLeaveTimeout = false;
            }, 500);
          }
        });
        canvas.each(function () {
          this.ontouchstart = null;
        });
      }
    }
    /**
   * Triggers the abilities to draw on the canvas
   * Sets up mouse/touch events, hides and shows descriptions and sets current classes
   *
   * @private
   */
    function drawIt() {
      $(settings.typed, context).hide();
      clearCanvas();
      canvas.each(function () {
        this.ontouchstart = function (e) {
          e.preventDefault();
          initDrawEvents(e);
          startDrawing(e, this);
        };
      });
      canvas.bind('mousedown.signaturepad', function (e) {
        initDrawEvents(e);
        startDrawing(e, this);
      });
      $(settings.clear, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        clearCanvas();
      });
      $(settings.typeIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        typeIt();
      });
      $(settings.drawIt, context).unbind('click.signaturepad');
      $(settings.drawIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
      });
      $(settings.typeIt, context).removeClass(settings.currentClass);
      $(settings.drawIt, context).addClass(settings.currentClass);
      $(settings.sig, context).addClass(settings.currentClass);
      $(settings.typeItDesc, context).hide();
      $(settings.drawItDesc, context).show();
      $(settings.clear, context).show();
    }
    /**
   * Triggers the abilities to type in the input for generating a signature
   * Sets up mouse events, hides and shows descriptions and sets current classes
   *
   * @private
   */
    function typeIt() {
      clearCanvas();
      disableCanvas();
      $(settings.typed, context).show();
      $(settings.drawIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
        drawIt();
      });
      $(settings.typeIt, context).unbind('click.signaturepad');
      $(settings.typeIt, context).bind('click.signaturepad', function (e) {
        e.preventDefault();
      });
      $(settings.output, context).val('');
      $(settings.drawIt, context).removeClass(settings.currentClass);
      $(settings.typeIt, context).addClass(settings.currentClass);
      $(settings.sig, context).removeClass(settings.currentClass);
      $(settings.drawItDesc, context).hide();
      $(settings.clear, context).hide();
      $(settings.typeItDesc, context).show();
    }
    /**
   * Callback registered on key up and blur events for input field
   * Writes the text fields value as Html into an element
   *
   * @private
   *
   * @param {String} val The value of the input field
   */
    function type(val) {
      $(settings.typed, context).html(val.replace(/>/g, '&gt;').replace(/</g, '&lt;'));
      while ($(settings.typed, context).width() > element.width) {
        var oldSize = $(settings.typed, context).css('font-size').replace(/px/, '');
        $(settings.typed, context).css('font-size', oldSize - 1 + 'px');
      }
    }
    /**
   * Default onBeforeValidate function to clear errors
   *
   * @private
   *
   * @param {Object} context current context object
   * @param {Object} settings provided settings
   */
    function onBeforeValidate(context, settings) {
      $('p.' + settings.errorClass, context).remove();
      context.removeClass(settings.errorClass);
      $('input, label', context).removeClass(settings.errorClass);
    }
    /**
   * Default onFormError function to show errors
   *
   * @private
   *
   * @param {Object} errors object contains validation errors (e.g. nameInvalid=true)
   * @param {Object} context current context object
   * @param {Object} settings provided settings
   */
    function onFormError(errors, context, settings) {
      if (errors.nameInvalid) {
        context.prepend([
          '<p class="',
          settings.errorClass,
          '">',
          settings.errorMessage,
          '</p>'
        ].join(''));
        $(settings.name, context).focus();
        $(settings.name, context).addClass(settings.errorClass);
        $('label[for=' + $(settings.name).attr('id') + ']', context).addClass(settings.errorClass);
      }
      if (errors.drawInvalid)
        context.prepend([
          '<p class="',
          settings.errorClass,
          '">',
          settings.errorMessageDraw,
          '</p>'
        ].join(''));
    }
    /**
   * Validates the form to confirm a name was typed in the field
   * If drawOnly also confirms that the user drew a signature
   *
   * @private
   *
   * @return {Boolean}
   */
    function validateForm() {
      var valid = true, errors = {
          drawInvalid: false,
          nameInvalid: false
        }, onBeforeArguments = [
          context,
          settings
        ], onErrorArguments = [
          errors,
          context,
          settings
        ];
      if (settings.onBeforeValidate && typeof settings.onBeforeValidate === 'function') {
        settings.onBeforeValidate.apply(self, onBeforeArguments);
      } else {
        onBeforeValidate.apply(self, onBeforeArguments);
      }
      if (settings.drawOnly && output.length < 1) {
        errors.drawInvalid = true;
        valid = false;
      }
      if ($(settings.name, context).val() === '') {
        errors.nameInvalid = true;
        valid = false;
      }
      if (settings.onFormError && typeof settings.onFormError === 'function') {
        settings.onFormError.apply(self, onErrorArguments);
      } else {
        onFormError.apply(self, onErrorArguments);
      }
      return valid;
    }
    /**
   * Redraws the signature on a specific canvas
   *
   * @private
   *
   * @param {Array} paths the signature JSON
   * @param {Object} context the canvas context to draw on
   * @param {Boolean} saveOutput whether to write the path to the output array or not
   */
    function drawSignature(paths, context, saveOutput) {
      for (var i in paths) {
        if (typeof paths[i] === 'object') {
          context.beginPath();
          context.moveTo(paths[i].mx, paths[i].my);
          context.lineTo(paths[i].lx, paths[i].ly);
          context.lineCap = settings.penCap;
          context.stroke();
          context.closePath();
          if (saveOutput) {
            output.push({
              'lx': paths[i].lx,
              'ly': paths[i].ly,
              'mx': paths[i].mx,
              'my': paths[i].my
            });
          }
        }
      }
    }
    /**
   * Initialisation function, called immediately after all declarations
   * Technically public, but only should be used internally
   *
   * @private
   */
    function init() {
      // Fixes the jQuery.fn.offset() function for Mobile Safari Browsers i.e. iPod Touch, iPad and iPhone
      // https://gist.github.com/661844
      // http://bugs.jquery.com/ticket/6446
      if (parseFloat((/CPU.+OS ([0-9_]{3}).*AppleWebkit.*Mobile/i.exec(navigator.userAgent) || [
          0,
          '4_2'
        ])[1].replace('_', '.')) < 4.1) {
        $.fn.Oldoffset = $.fn.offset;
        $.fn.offset = function () {
          var result = $(this).Oldoffset();
          result.top -= window.scrollY;
          result.left -= window.scrollX;
          return result;
        };
      }
      // Disable selection on the typed div and canvas
      $(settings.typed, context).bind('selectstart.signaturepad', function (e) {
        return $(e.target).is(':input');
      });
      canvas.bind('selectstart.signaturepad', function (e) {
        return $(e.target).is(':input');
      });
      if (!element.getContext && FlashCanvas)
        FlashCanvas.initElement(element);
      if (element.getContext) {
        canvasContext = element.getContext('2d');
        $(settings.sig, context).show();
        if (!settings.displayOnly) {
          if (!settings.drawOnly) {
            $(settings.name, context).bind('keyup.signaturepad', function () {
              type($(this).val());
            });
            $(settings.name, context).bind('blur.signaturepad', function () {
              type($(this).val());
            });
            $(settings.drawIt, context).bind('click.signaturepad', function (e) {
              e.preventDefault();
              drawIt();
            });
          }
          if (settings.drawOnly || settings.defaultAction === 'drawIt') {
            drawIt();
          } else {
            typeIt();
          }
          if (settings.validateFields) {
            if ($(selector).is('form')) {
              $(selector).bind('submit.signaturepad', function () {
                return validateForm();
              });
            } else {
              $(selector).parents('form').bind('submit.signaturepad', function () {
                return validateForm();
              });
            }
          }
          $(settings.sigNav, context).show();
        }
      }
    }
    $.extend(self, {
      init: function () {
        init();
      }  /**
     * Regenerates a signature on the canvas using an array of objects
     * Follows same format as object property
     * @see var object
     *
     * @param {Array} paths An array of the lines and points
     */,
      regenerate: function (paths) {
        self.clearCanvas();
        $(settings.typed, context).hide();
        if (typeof paths === 'string')
          paths = JSON.parse(paths);
        drawSignature(paths, canvasContext, true);
        if ($(settings.output, context).length > 0)
          $(settings.output, context).val(JSON.stringify(output));
      }  /**
     * Clears the canvas
     * Redraws the background colour and the signature line
     */,
      clearCanvas: function () {
        clearCanvas();
      }  /**
     * Returns the signature as a Js array
     *
     * @return {Array}
     */,
      getSignature: function () {
        return output;
      }  /**
     * Returns the signature as a Json string
     *
     * @return {String}
     */,
      getSignatureString: function () {
        return JSON.stringify(output);
      }  /**
     * Returns the signature as an image
     * Re-draws the signature in a shadow canvas to create a clean version
     *
     * @return {String}
     */,
      getSignatureImage: function () {
        var tmpCanvas = document.createElement('canvas'), tmpContext = null, data = null;
        tmpCanvas.style.position = 'absolute';
        tmpCanvas.style.top = '-999em';
        tmpCanvas.width = element.width;
        tmpCanvas.height = element.height;
        document.body.appendChild(tmpCanvas);
        if (!tmpCanvas.getContext && FlashCanvas)
          FlashCanvas.initElement(tmpCanvas);
        tmpContext = tmpCanvas.getContext('2d');
        tmpContext.fillStyle = settings.bgColour;
        tmpContext.fillRect(0, 0, element.width, element.height);
        tmpContext.lineWidth = settings.penWidth;
        tmpContext.strokeStyle = settings.penColour;
        drawSignature(output, tmpContext);
        data = tmpCanvas.toDataURL.apply(tmpCanvas, arguments);
        document.body.removeChild(tmpCanvas);
        tmpCanvas = null;
        return data;
      }
    });
  }
  /**
 * Create the plugin
 * Returns an Api which can be used to call specific methods
 *
 * @param {Object} options The options array
 *
 * @return {Object} The Api for controlling the instance
 */
  $.fn.signaturePad = function (options) {
    var api = null;
    this.each(function () {
      api = new SignaturePad(this, options);
      api.init();
    });
    return api;
  };
  /**
 * Expose the defaults so they can be overwritten for multiple instances
 *
 * @type {Object}
 */
  $.fn.signaturePad.defaults = {
    defaultAction: 'typeIt',
    displayOnly: false,
    drawOnly: false,
    canvas: 'canvas',
    sig: '.sig',
    sigNav: '.sigNav',
    bgColour: '#ffffff',
    penColour: '#145394',
    penWidth: 2,
    penCap: 'round',
    lineColour: '#ccc',
    lineWidth: 2,
    lineMargin: 5,
    lineTop: 35,
    name: '.name',
    typed: '.typed',
    clear: '.clearButton',
    typeIt: '.typeIt a',
    drawIt: '.drawIt a',
    typeItDesc: '.typeItDesc',
    drawItDesc: '.drawItDesc',
    output: '.output',
    currentClass: 'current',
    validateFields: true,
    errorClass: 'error',
    errorMessage: 'Please enter your name',
    errorMessageDraw: 'Please sign the document',
    onBeforeValidate: null,
    onFormError: null
  };
}(jQuery));
var toBitmapURL = function ($fromCharCode, FF, MAX_LENGTH) {
    /**
     * (C) WebReflection - Mit Style License
     *      given a canvas, returns BMP 32bit with alpha channel data uri representation
     *
     * Why ?
     *      because many canvas implementation may not support toDataURL
     *      ( HTMLCanvasElement.prototype.toDataURL || HTMLCanvasElement.prototype.toDataURL = function () {return toBitmapURL(this)}; )
     *
     * I mean ... Why BMP 32 rather than PNG ?!!!
     *      because JavaScript size matter as well as computation time.
     *      PNG requires DEFLATE compression and multiple pass over the data.
     *      BMP is straight forward
     *
     * Fine, but which browser supports BMP in 2011 ?
     *      pretty much all of them, except some version of Chrome. Safari and Webkit are fine as well as Firefox, Opera and of course IE
     *
     * Sure, but why on earth should I use BMP as data uri ?
     *      this method is about creation of canvas snapshots. If toDataURL is not presemt
     *      there is still a way to create a portable, NOT COMPRESSED, bitmap image
     *      that could be optionally sent to the server and at that point converted into proper PNG
     *      Bitmap format was fast enough to parse (on mobile as well) and it was RGBA compatible plus widely supported.
     *
     * I think this was a wasteof time
     *      well, if you still think so, I can say that was actually fun to create a proper
     *      32 bit image format via JavaScript on the fly.
     *      However, please share your own toDataURL version with full mime type support in JavaScript :P
     *      Moreover, have you ever tried to use native toDataURL("image/bmp") ?
     *      Most likely you gonna have max 24bit bitmap with all alpha channel info lost.
     */
    function fromCharCode(code) {
      for (var result = [], i = 0, length = code.length; i < length; i += MAX_LENGTH) {
        result.push($fromCharCode.apply(null, code.slice(i, i + MAX_LENGTH)));
      }
      return result.join('');
    }
    function numberToInvertedBytes(number) {
      return [
        number & FF,
        number >> 8 & FF,
        number >> 16 & FF,
        number >> 24 & FF
      ];
    }
    function swapAndInvertY(data, width, height) {
      /**
         * Bitmap pixels array is stored "pseudo inverted"
         * RGBA => BGRA (read as Alpha + RGB)
         * in few words this canvas pixels array
         * [
         *   0, 1,  2,  3,  4,  5,  6,  7,
         *   8, 9, 10, 11, 12, 13, 14, 15
         * ]
         * is stored as bitmap one like
         * [
         *   10, 9, 8, 11, 14, 13, 12, 15,
         *   2, 1, 0,  3,  6,  5,  4,  7
         * ]
         */
      for (var i, j, x0, x1, y0, y1, sizeX = 4 * width, sizeY = height - 1, result = []; height--;) {
        y0 = sizeX * (sizeY - height);
        y1 = sizeX * height;
        for (i = 0; i < width; i++) {
          j = i * 4;
          x0 = y0 + j;
          x1 = y1 + j;
          result[x0] = data[x1 + 2];
          result[x0 + 1] = data[x1 + 1];
          result[x0 + 2] = data[x1];
          result[x0 + 3] = data[x1 + 3];
        }
      }
      return result;
    }
    function toBitmapURL(canvas) {
      var width = canvas.width, height = canvas.height, header = [].concat(numberToInvertedBytes(width), numberToInvertedBytes(height), 1, 0, 32, 0, 3, 0, 0, 0, numberToInvertedBytes(width * height * 4), 19, 11, 0, 0, 19, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, FF, 0, 0, FF, 0, 0, FF, 0, 0, 0, 0, 0, 0, FF, 32, 110, 105, 87), data = swapAndInvertY(canvas.getContext('2d').getImageData(0, 0, width, height).data, width, height), offset;
      header = numberToInvertedBytes(header.length).concat(header);
      offset = 14 + header.length;
      return 'data:image/bmp;base64,' + btoa(fromCharCode([
        66,
        77
      ].concat(numberToInvertedBytes(offset + data.length), 0, 0, 0, 0, numberToInvertedBytes(offset), header, data)));
    }
    return toBitmapURL;
  }(String.fromCharCode, 255, 32767);