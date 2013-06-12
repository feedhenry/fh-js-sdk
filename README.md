FeedHenry JavaScript SDK
========================
The JavaScript SDK allows developers to integrate the FeedHenry Cloud into any web-based solution - desktop websites, mobile websites or a stand-alone JavaScript client.

The API is provided in the $fh namespace and uses a common convention for most functions, which takes the format:

    $fh.doSomething(parameterObject, successFunction, failureFunction)

Where parameterObject is an ordinary JavaScript object. The successFunction callback is called if the operation was successful and the failureFunction callback is called if the operation fails. All of these arguments are optional. If there is only one function, it is taken as the success function.

The successFunction callback is called with one argument, a result object, which is again an ordinary JavaScript object. The failureFunction callback is called with two arguments: an error code string, and an object containing additional error properties (if any).

Detailed documentation for the JavaScript SDK's API can be found here: http://docs.feedhenry.com/v2/api_js_client_api.html

Building
========
The jssdk is now build using Grunt (install via npm install). To add new files edit the grunt.js file under concat. Thirdparty libraries should go under libs and our modules go under src.

There are qunit tests. You will need to install phantomjs to run these tests.