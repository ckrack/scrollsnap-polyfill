(function(w, doc, undefined) {
  // Enable strict mode
  'use strict';

  /*
   * alias
   * w: window global object
   * doc: document
   * undefined: undefined
   */

  /**
   * constraint to jumping to the next snap-point.
   * when scrolling further than SNAP_CONSTRAINT snap-points,
   * but the current distance is less than 0.87 (read: 13 percent),
   * the snap-will go back to the closer snap-point.
   */
  var CONSTRAINT = 0.87,
      SNAP_CONSTRAINT = 2;

  /**
   * Feature detect scroll-snap-type, if it exists then do nothing (return)
   */
  if ('scrollSnapType' in doc.documentElement.style ||
      'webkitScrollSnapType' in doc.documentElement.style) {
    return;
  }

  /**
   * doMatched is a callback for Polyfill to fill in the desired behaviour.
   * @param  {array} rules rules found for the polyfill
   */
  function doMatched(rules) {
    rules.each(function(rule) {
      var elements = doc.querySelectorAll(rule.getSelectors()),
          declaration = rule.getDeclaration();
      [].forEach.call(elements, function(obj) {
        setUpElement(obj, declaration);
      });
    });
  }

  /**
   * unDomatched is a callback for polyfill to undo any polyfilled behaviour
   * @param  {[type]} rules [description]
   */
  function undoUnmatched(rules) {
    rules.each(function(rule) {
      var elements = doc.querySelectorAll(rule.getSelectors());
      [].forEach.call(elements, function(item) {
        obj.removeEventListener('scroll', handler, false);
        delete obj._scsnp_declaration;
      });
    });
  }

  /**
   * set up an element for scroll-snap behaviour
   * @param {Object} obj         HTML element
   * @param {Object} declaration CSS declarations
   */
  function setUpElement(obj, declaration) {
    // if (obj.tagName.toLowerCase === "body") {
    // bind to document.scroll
    // }
    obj.addEventListener('scroll', handler, false);
    obj._scsnp_declaration = declaration;
  }

  /**
   * the last created timeOutId for scroll event timeouts.
   * @type int
   */
  var timeOutId = null;

  /**
   * starting point for current scroll
   * @type length
   */
  var scrollStart = null;

  /**
   * scroll handler
   * this is the callback for scroll events.
   */
  var handler = function(evt) {

    // use evt.target as target-element
    var obj = evt.target;

    // if a previous timeout exists, clear it.
    if (timeOutId) {
      // we only want to call a timeout once after scrolling..
      clearTimeout(timeOutId);

      timeOutId = null;
    } else {
      // save new scroll start
      scrollStart = evt.target.scrollTop;
    }

    // set a 30ms timeout for every scroll event.
    // if we have new scroll events in that time, the previous timeouts are cleared.
    // thus we can be sure that the timeout will be called 50ms after the last scroll event.
    timeOutId = setTimeout(function(){
        // detect direction of scroll. negative is up, positive is down.
        var direction = (scrollStart - obj.scrollTop > 0) ? -1 : 1,
            // get the next snap-point to snap-to
            snapPoint = getNextSnapPoint(obj, direction);

        // before doing the move, unbind the event handler
        obj.removeEventListener('scroll', handler, false);

        // smoothly move to the snap point
        smoothScroll(obj, snapPoint, null, function() {
          // after moving to the snap point, rebind the scroll event handler
          obj.addEventListener('scroll', handler, false);
        });

        // we just jumped to the snapPoint, so this will be our next scrollStart
        scrollStart = snapPoint;
    }, 30);
  };

  /**
   * calculator for next snap-point
   * @param  {Object} obj       HTML element
   * @param  {integer} direction signed integer indicating the scroll direction
   * @return {[type]}           [description]
   */
  function getNextSnapPoint(obj, direction) {

    // TODO replace this with a correct calc based on the declaration.

    // this can be Nvh, N%, Npx,
    var vh = Math.max(doc.documentElement.clientHeight, w.innerHeight || 0);

    // calc current and initial snappoint
    var currentPoint = obj.scrollTop / vh,
        initialPoint = scrollStart / vh,
        nextPoint,
        // minimum is top of element
        limit = 0;

    // set target and bounds by direction
    if (direction === -1) {
      // when we go up, we floor the number to jump to the next snap-point in scroll direction
      nextPoint = Math.floor(currentPoint);
    } else {
      // go down, we ceil the number to jump to the next in view.
      nextPoint = Math.ceil(currentPoint);

      // maximum is container height
      limit = obj.offsetHeight;
    }

    // constrain jumping to a point too high/low when scrolling for more than SBAP_CONSTRAINT points.
    // (if the point is 85% further than we are, don't jump..)
    if ((Math.abs(initialPoint - currentPoint) > SNAP_CONSTRAINT) ||
         Math.abs(nextPoint - currentPoint) > CONSTRAINT) {
      // we still need to round...
      nextPoint = Math.round(currentPoint);
    }

    // calculate where to scroll
    var scrollTo = nextPoint * vh;

    // stay in bounds
    return Math.max(scrollTo, limit);
  }

  /**
   * ease in out function thanks to:
   * http://blog.greweb.fr/2012/02/bezier-curve-based-easing-functions-from-concept-to-implementation/
   * @param  {Number} t timing
   * @return {Number}   easing factor
   */
    var easeInOutCubic = function(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    };


  /**
   * calculate the scroll position we should be in
   * @param  {Number} start    the start point of the scroll
   * @param  {Number} end      the end point of the scroll
   * @param  {Number} elapsed  the time elapsed from the beginning of the scroll
   * @param  {Number} duration the total duration of the scroll (default 500ms)
   * @return {Number}          [description]
   */
  var position = function(start, end, elapsed, duration) {
      if (elapsed > duration) return end;
      return start + (end - start) * easeInOutCubic(elapsed / duration); // <-- you can change the easing funtion there
      // return start + (end - start) * (elapsed / duration); // <-- this would give a linear scroll
  };


  /**
   * smoothScroll plugin by Alice Lietieur.
   * @see https://github.com/alicelieutier/smoothScroll
   * we use requestAnimationFrame to be called by the browser before every repaint
   * @param  {Object}   obj      the scroll context
   * @param  {Number}  end      where to scroll to
   * @param  {Number}   duration scroll duration
   * @param  {Function} callback called when the scrolling is finished
   */
  var smoothScroll = function(obj, end, duration, callback){
      // TODO calculate duration based on max-distance/distance
      duration = duration || 200;
      obj = obj || window;
      var start = obj.scrollTop;

      var clock = Date.now();
      var requestAnimationFrame = window.requestAnimationFrame ||
          window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame ||
          function(fn){window.setTimeout(fn, 15);};

      var step = function(){
          var elapsed = Date.now() - clock;
          if (obj !== window) {
            obj.scrollTop = position(start, end, elapsed, duration);
          }
          else {
            window.scroll(0, position(start, end, elapsed, duration));
          }

          if (elapsed > duration) {
              if (typeof callback === 'function') {
                  callback(end);
              }
          } else {
              requestAnimationFrame(step);
          }
      };
      step();
  };

  /**
   * Polyfill object
   * @type Polyfill
   * @see https://github.com/philipwalton/polyfill
   */
  var pf = new Polyfill({
    declarations:["*scroll-snap-type:*", "*scroll-snap-point-y:*"]
  })
  .doMatched(doMatched)
  .undoUnmatched(undoUnmatched);

}(window, document));
