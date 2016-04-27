# scrollsnap-polyfill.js

Polyfill for css scroll snapping draft

## Use

Simply load the bundled file at the end of your body tag.

If you are using the unbundled version, make sure to load polyfill.js first.


## Dependencies

This uses [Polyfill.js](https://github.com/philipwalton/polyfill) by [@philipwalton](https://github.com/philipwalton), which is bundled.
No other dependencies.


Browser Support
---------------

This has been tested successfully in the following browsers:

* Chrome 36
* Firefox 24


Standards documentation
-----------------------

* http://www.w3.org/TR/css-snappoints-1/
* http://blog.gospodarets.com/css-scroll-snap


Limitations
-----------

Length units for ``scroll-snap-point-*: repeat()``, ``scroll-snap-coordinate`` and
``scroll-snap-destination`` are limited to:

* vh/vw
* percentages
* pixels.
