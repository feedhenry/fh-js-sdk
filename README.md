FeedHenry JavaScript SDK
========================
[![browser support](https://ci.testling.com/feedhenry/fh-js-sdk.png)
](https://ci.testling.com/feedhenry/fh-js-sdk)

The JavaScript SDK allows developers to integrate the FeedHenry Cloud into any web-based solution - desktop websites, mobile websites or a stand-alone JavaScript client.

The API is provided in the $fh namespace and uses a common convention for most functions, which takes the format:

    $fh.doSomething(parameterObject, successFunction, failureFunction)

Where parameterObject is an ordinary JavaScript object. The successFunction callback is called if the operation was successful and the failureFunction callback is called if the operation fails. All of these arguments are optional. If there is only one function, it is taken as the success function.

The successFunction callback is called with one argument, a result object, which is again an ordinary JavaScript object. The failureFunction callback is called with two arguments: an error code string, and an object containing additional error properties (if any).

Detailed documentation for the JavaScript SDK's API can be found here: http://docs.feedhenry.com/v2/api_js_client_api.html

Building
=========
The JS SDK is now built using [Browserify](http://browserify.org/). 

### Development

Because of Browserify, you can write any new functions as normal node modules, and use node's "require" to load any other modules, or to be consumed by other modules.

### Testing

Write your tests in test/tests directory. Add the tests to test/browser/suite.js file and run

```
grunt test
```

This will use mocha and phatomjs to run the tests.

In fact, if your module and test don't require a browser environment, you can just run them purely in node. (You may need to add a new grunt task to run them).

To help debugging, you can run

```
grunt local
```

This will start mock servers locally and you can go to http://localhost:8100/example/index.html page to debug. You may want to run 

```
grunt watch
```

In another terminal window to auto generate the combined js sdk file.

### Testling

For browser compatibility testing, we use [Testling](https://ci.testling.com/). The project page is here: https://ci.testling.com/feedhenry/fh-js-sdk.

You can also run testling locally:

```
npm install -g testling
testling
```

If testling can not find any browser locally, you either need to add browser paths to your PATH environment variable, or use

```
testling -u
```
and copy the url to a browser.

### Build

When finish developing and testing, run

```
grunt
```
To generate the release builds.