#FeedHenry App Form Javascript SDK


##Grunt Tasks

Install grunt

In appforms folder run:
    
    npm install .

Start TestServer:

    grunt testServer

Test server contains / runs all tests which indicate how to use each module.

Each test is an example of how to use a particular module.

Run App: 
grunt app

it connected to a mockup server and render the form to browser. It is able to save draft / submit .

Build:
grunt build

Concat all source files and uglify them. It will output 4 files in dist folder:

* appFormjs-core.js: contains core modules which only depends on $fh apis
* appFormjs-backbone.js: contains Backbone.JS based views.
* appFormjs-core.min.js: minified version of core lib
* appFormjs-backbone.min.js: minified version of backbone lib

##Core development document

After starting test server, goto http://127.0.0.1:3001. It will run all tests. The test itself contains how to use the modules like how to save content to a file etc.

##Grunt app

grunt app runs on a mockup server which sends a sample form. 

* http://127.0.0.1:3011: Show the form list from the mockserver
* http://127.0.0.1:3011/#form: Render the first form from the mockserver
* http://127.0.0.1:3011/#submission: Show the last draft saved
* http://127.0.0.1:3011/#json: Show JSON to Form page which renders a raw JSON string to form view.



##Core structure

See structure of core lib [here](https://docs.google.com/a/feedhenry.com/drawings/d/1cq7LAcKLmZzj8A9BipyK6GZh7-HRlwpD6dAztDILIEs/edit)

## Validation

It contains a RuleEngine which covers:

* User input value validation: It happens when a blur event triggered on an input field. It will call FieldModel.validate(value, callback);
* Rules check: It happens when a blur event triggered on an input field. It will call Submission.checkRules(callback);
* Overall validation before submission: It happens when a submission goes to "submit" status. It will call ruleEngine.validateForm() which is wrapped in Submission.submit method.

## Uploading

Uploading consists of upload manager and upload task.

Upload manager will handle upload request from submissions with UploadManager.queueSubmission(submissionObject,cb); It mainly operates a UploadTask queue which will be looped and processed by a time ticker. Upload manager can start or stop the timer ticker.

UploadTask is a single task which is mapped to one submission. It will separate the submission into smaller pieces like Submission Form, Submission Files, Submission Base64 Files etc. It will record the progress of pieces being uploaded and can be resumed in any point. 

### Upload Task

Uploading task object is created from a submission object. It contains a property "currentTask" to indicate current progress.

The status of a upload task has following definition:

* currentTask == null: Upload Task not started . same as using UploadTask.isFormCompleted()
* currentTask is Numeric and not larger than files' length: form is uploaded. uploading files. the currentTask indicate the index of file to be uploaded. Check UploadTask.isFileCompleted()
* currentTask == files length but iscomplete != true: files uploading finished, but have not called mbaas completeSubmission yet. UploadTask.isMBaaSCompleted()
* iscomplete == true: finished successfully. UploadTask.isCompleted()
* isError() == true: error happens. UploadTask.isError()


##Creating Tests

The project follows one source file has one test file conveniention. If one source created (myModule.js) it should have a corresponding test file in test folder with same name (myModule.js). And add the module name to test/modules.js file (myModule) in this instance. Require.JS and Mocha will hand rest of things.


## How to run the App Template locally

1. Check out app template app
2. create a hard link between files in src/appforms/dist to client/default/lib  
3. run grunt build to build latest dist files in appforms folder
4. run grunt testServer so that you have a mockup mbaas server running
5. In Template app's router.js, Add following parameters to $fh.forms.init function:
    
          {
              config: {
                "cloudHost": "http://127.0.0.1:3001" // or to an mbaas server (like https://testing.feedhenry.me). need care about the cross origin issues.
              }
            }

This will change the mBaas host to your local mockup server (or to the server you entered).

6. run fhc local in template app and you are ready to go.


