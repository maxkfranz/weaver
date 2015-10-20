When code is run through a minifer like [UglifyJS](https://github.com/mishoo/UglifyJS2), the names of variables can be mangled.  This means that the name specified in your code for a function or object may not be the same when it is minified.

Because Weaver is limited to what JS engines provide in terms of live code inspection, this means that minification can break the references made in `thread.run()`.

In order to minify Weaver-using code, it is necessary to have more fastidious use of references.  By explicitly naming references using  [`thread.require( obj, 'obj' )`](#thread/execution/thread.require) and [`_ref_( 'obj' )`](#thread/globals/_ref_), minification will work properly.
