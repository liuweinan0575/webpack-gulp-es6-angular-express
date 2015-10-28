# Yet another full stack javascript boilerplate for building wep applications using gulp + webpack + bootstrap + angular + express

That repository contains the result of my experiments of using webpack for building a web application
using full stack javascript, i.e. a backend server application powered by node.js coupled to a frontend GUI application
executed in the browser. It aims to provide a state of the art workflow for building such applications
in an efficient way, from development to production.  

A simple demo application using that workflow for its build process is provided  as an example:
  * its backend part is powered by the express framework for node.js
  * its frontend part is powered by angular and bootstrap

I used the [backend-with-webpack](https://github.com/jlongster/backend-with-webpack) project from [James Long](https://github.com/jlongster)
 as a starting point, thanks to him for that great work.

This is still a work in progress and is likely to evolve over time.

## Features  

Below is a list of features offered by that workflow:

  * Use gulp as a task runner for its simplicity of use
  * Use webpack to bundle the backend and frontend parts of the application
  * Automatically apply jshint on all source files when building the application
  * ECMAScript 6 (aka ES6 or ES2015) support thanks to babel
  * Development server for the frontend application with hot reloading
  * Automatic restart of the backend application in development mode by watching source files changes
  * Production builds with cache busting and assets minification.
  * Experiment ES6 syntax with Angular 1.x (in particular use classes for all angular components)
  * Optional use of jsbeautify to prettify javascript source files

## Installation

To use it, just clone this repository and install the npm dependencies:

```shell
$ git clone https://github.com/anlambert/webpack-gulp-es6-angular-express
$ cd webpack-gulp-es6-angular-express
$ npm install
```

## Scripts

All scripts are run with `npm run [script]`, for example: `npm run start-dev`.

* `build` - generate a minified production build with stylesheets extraction to the build folder
* `build-dev` - generate a development build (no minification, inlined css) to the build folder
* `start` - build and start the application in production mode. Open up http://localhost:4000/ in your browser to see it in action.
* `start-dev` - build and start the application in development mode. No assets will be generated to the build/website folder
  as we use the webpack-dev-server in order to get hot reloading on source files changes.
  Open up http://localhost:4000/ in your browser to see it in action.
* `beautify` - beautify source code files (javascript only for the moment)

See what each script does by looking at the `scripts` section in [package.json](./package.json).

## References

Some useful references and repositories about working with webpack I found by digging on the subject:

  * http://jlongster.com/Backend-Apps-with-Webpack--Part-I
  * http://putaindecode.fr/posts/webpack/premier-exemple/
  * https://github.com/angular-class/NG6-starter
  * http://dmachat.github.io/angular-webpack-cookbook/
  * https://github.com/esayemm/gulp-webpack-starter
  * https://medium.com/@okonetchnikov/long-term-caching-of-static-assets-with-webpack-1ecb139adb95#.3ojwvxkul
  * https://github.com/chyld/angular-webpack-es6-babel
  * https://github.com/tthew/gulp-angular-webpack-seed
  * https://github.com/Foxandxss/angular-webpack-workflow
  * http://dontkry.com/posts/code/single-page-modules-with-webpack.html

For those interested by working with Angular and ES6, you can also check those ones :

  * http://www.michaelbromley.co.uk/blog/350/exploring-es6-classes-in-angularjs-1-x%20nice
  * https://github.com/michaelbromley/angular-es6

## License

The MIT License (MIT)

Copyright (c) 2015 Antoine Lambert

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
