# Changelog - FeedHenry Javascript SDK

## 3.1.0 - 2019-04-15
### Change
- Upgrade version of fh-sync-js from 1.3.2 to 1.4.0
- Add lawnchair files changed at the version 1.4.0 of fh-sync-js

## 3.0.12 - 2018-11-30
### Fix
- Add default result for init requests across domains when the result is not successful which is expected when the connection tag is disable.

## 3.0.11 - 2018-08-29
### Fix
- Unable to build client app regards issue introduce in the changes made in the version 3.0.3.
**NOTE:** The tag 3.0.3 and its intermediate ones were deprecated regards this issue.

## 3.0.10 - 2018-09-27 - [DEPRECATED]
### Changes
- Upgrade version used of fh-sync-js to 1.3.2

## 3.0.9 - 2018-08-24 - [DEPRECATED]
### Fix
- Downgrade development dependencies and browserify for the same versions used/released at 3.0.2 for it still compatible with client app forms.

## 3.0.8 - 2018-08-23 - [DEPRECATED]
### Changes
- Upgrade version used of fh-sync-js to 1.3.1
- Change trevis to test project with NodeJS 10
- Change trevis for don't test project with NodeJS 4
- Replace npm-shrinkwrap.json by json package-lock.json.
### Fix
- Add decode module to fix issue client forms app

## 3.0.7 - 2018-08-21 - [DEPRECATED]
- Fix date form component which is not working when the button is used

## 3.0.6 - 2018-07-20 - [DEPRECATED]
- Fix header parameters

## 3.0.5 - 2018-06-12 - [DEPRECATED]
- Add scripts to update the licenses automatically
- Update automatically lock dependencies file (npm-shrinkwrap.json) and licenses
- CVE-2017-18214 : Remove unused moment dependency

## 3.0.4 - 2018-05-10 - [DEPRECATED]
* Upgrade dependencies which do not have break changes
* Update licenses manually

## 3.0.3 - 2018-05-09 - [DEPRECATED]
* Fix Security vulnerabilities: Upgrade browserify dependencies
* Add licenses manually

## 3.0.2 - 2018-04-30
* Add missing argument to `sync.setQueryParams` definition

## 3.0.1 - 2018-04-26
* Add missing callback parameter in `sync.getPending`

## 3.0.0 - 2018-02-01
* Remove titanium option as per ticket FH-3250 we are no longer supporting Titanium/appcelerator apps.

## 2.24.1 - 2018-02-01
* FIX: RHMAP-19268 - Client gets null pointer exception when connection tag is disabled and the app is running localy

## 2.24.0 - 2018-01-25
* Added `headers` parameter to CloudOptions

## 2.20.0 - 2017-06-30

* RHMAP-4738 - Upgraded the rules engine to validate repeating sections.

## 2.19.0 - 2017-06-29

* RHMAP-16063 fix Client apps with disabled connection tags still working and the cloud calls not fail
* Fix sync namespace to user lowercase name
* Add browserify-shim as a dependency
* Move fh-js-sdk to use upstream sync client

## 2.18.5 - 2017-05-08

* Recreate mock_uuid cookie if blank string
* RHMAP-15272 - fh-wfm-sync does not allow overwriting sync options per dataset
* FH-2763 - Write JavaScript documentation (JSDoc) for the public API in fh-js-sdk

## 2.18.4 - 2017-02-20

* RHMAP-13542 - Cannot Submit Map Location Data in Android Apps Built Using Android Form Builder

## 2.18.3 - 2017-02-16

* RAINCATCH-570 - update to the new browser api

## 2.18.2 - 2017-02-03

* RHMAP-12426 - Bug when section break component is used more than 10 times in an form with pages

## 2.18.1 - 2017-01-04

* RHMAP-12719 - Add an exception handler around doCloudCall so any exceptions can call the failure callback
* RHMAP-11544 - Forms - "Blank" Dropdown options pass the required validation
* fhconfig.json with local:true and host will skip FH.init for local dev
* RHMAP-7811 - Add declaration file for TypeScript

## 2.17.5 - 2016-11-18

* RHMAP-11349 Stop submitting value in hidden field

## 2.17.4 - 2016-11-09 - Niall Donnelly

* Added getUID function to public $fh.sync API.

## 2.17.3 - 2016-11-09 - Niall Donnelly

* Added pre-publish script to package.json to generate the dist folder.

## 2.17.2 - 2016-11-08 - Niall Donnelly
* RHMAP-10243 - Applying default values to new submissions.

## 2.17.1 - 2016-08-18 - Erik Jan de Wit
* Use window object instead of this

## 2.16.3 - 2016-08-12 - Niall Donnelly
* RHMAP-9444 - Applying field and page rules whenever a field value changes.

## 2.16.2 - 2016-07-28 - Wei Li
* RHMAP-5793 - Decode the parameters in the url query string.

## 2.16.1 - 2016-06-10 - Alan Moran

* RHMAP-7618 - Client Form App - Submissions stuck in review when field is deleted from server side

## 2.15.4 - 2016-05-12 - Erik Jan de Wit

* Added titanium lawn chair storage adaptor

## 2.16.0 - 2016-05-13 - Niall Donnelly

* RHMAP-4770 - Added dateTime custom format rendering and validation.

## 2.15.3 - 2016-05-10 - Niall Donnelly

* RHMAP-4759 - Added blank option to dropdown field

## 2.15.1 - 2016-05-10 - Erik Jan de Wit

* RHMAP-6428 - Saving to draft removed pictures.

## 2.14.5 - 2016-05-05 - Niall Donnelly

* RHMAP-4758 - Added appforms rules engine update for blank option in dropdown fields.

## 2.14.3 - 2016-03-16 - Wei Li, Brian Leathem
* Make sure $fh.auth is calling the cloud app for local development
* Added a check if the uid === 0 when retrieving the uid from the uid_map

## 2.14.2 - 2016-03-09 - Niall Donnelly

* RHMAP-4862 - Removing field values if the field entry is not defined.

## 2.14.1 - 2016-02-26 - Niall Donnelly

* RHMAP-3874 - Update Rules Engine For Appforms.

## 2.14.0 - 2016-02-26 - Niall Donnelly
* RHMAP-2950 - Added A Read Only Field To Forms Apps

## 2.13.2 - 2015-12-04 - Wei Li
* RHMAP-3240 - Make sure the media stream is reset after camera is closed in the browsers.

## 2.13.1 - 2015-12-04 - Wojciech Trocki
* RHMAP-3240 - Photo Capture on Forms is broken in Preview in Studio

## 2.13.0 - 2015-12-02 - Erik Jan de Wit
* RHMAP-2970 - Wait for cloud to be ready before registering push

## 2.12.0 - 2015-11-24 - Erik Jan de Wit
* RHMAP-2970 - Removed api override

## 2.11.0 - 2015-10-15 - Wei Li
* RHMAP-2455 - Fix a few issues with the sync framework
  * Make sure the user changes are not reverted if cloud is slow to response
  * Remove some of the unused code to make the sync client simpler

## 2.10.1 - 2015-10-14 - Niall Donnelly
* FH-2290 - Fixed File Extension For Cached Files

## 2.10.0 - 2015-10-07 - Niall Donnelly

* FH-2290 - Added Event Driven Approach To $fh.forms.downloadSubmission API.

## 2.9.0 - 2015-10-06 - Niall Donnelly

* FH-2330 - Added A Global Event Listener For Appforms Models
* FH-2340 - Populating the _id parameter for uploaded submissions.

## 2.8.0 - 2015-10-02 - Niall Donnelly/Wei Li/Shannon Poole

* FH-2299 - Added New Submissions Accessor Functions. Added Progress JSON update. - Niall Donnelly
* FH-2052 - Make sure it's possible to link the new uid with the old uid for newly created records - Wei Li
* FH-2366 - Stringify payload for PUT, PATCH, and DELETE cloud calls - Shannon Poole

## 2.7.5 - 2015-10-01 - Brian Gallagher, Evan Shortiss
* Include the indexed-db adapter in the grunt build and minor updates to the lawnchair adapter
* Propagate exception if decrypt receives bad data
* Update bower file

## 2.7.4 - 2015-08-21 - Niall Donnelly

* FH-1707 - Add Page Description Field

## 2.7.0 - 2015-07-13 - Jason Madigan
* FHMOBSDK-78 - Add option to allow users to define custom headers to send via $fh.cloud/$fh.act

## 2.6.1 - 2015-04-10 - Gerard Ryan
* FH-137: Remove -BUILD-NUMBER from version
* Add npm-shrinkwrap.json file to lock dependency versions

##2.6.0 - 2015-03-26 - Wei Li
* FHMOBSDK-53 - Fix an issue with local params
* FHMOBSDK-56 - Fix an issue with the sync framework.
* FHMOBSDK-57 - New APIs for $fh.auth
* FHMOBSDK-59 - Fix an issue with Titanium SDK

## 2.5.1 - 2014-12-01 - IR242 - Martin Murphy
* 8319 - fix location button label in apppforms app

## 2.5.0 - 2014-11-03 - IR240 - Niall Donnelly
* 7890 Added barcode Scanner

## 2.4.4 - 2014-10-21 - IR239 - Martin Murphy
* 8186 - Fix cloud api for GET requests

## 2.4.3 - 2014-09-23 - IR237 - Niall Donnelly
* 7986 - Added support for field codes for form fields.

## 2.4.2 - 2014-09-22 - IR237 - Niall Donnelly
* 7823 - Fixed forms bugs related to new forms integration app.

## 2.4.1 - 2014-09-19 - IR236 - Wei Li
* 7913 Bug fixes & improvements for sync client and Titanium build

## 2.4.0 - 2014-07-28 - IR235 - Niall Donnelly
* 7822 Added handling for admin fields in forms.

## 2.3.0 - 2014-07-20 - IR234 - Niall Donnelly
* 7821 Added multiple rule target upgraded rules engine.

## 2.2.1 - 2014-07-18 - IR234 - Niall Donnelly
* 7824 Added photo capture configuration options.

## 2.2.0 - 2014-07-11 - IR231 - Niall Donnelly
* 7414 - Upgraded forms to bootstrap rendering.

## 2.1.4 - 2014-07-31 - IR233 - Niall Donnelly

* 7656 - Refactored photo capture to return file URI instead of base64 string.

## 2.1.3 - 2014-07-17 - IR232 - Niall Donnelly

7637 - Updated rules engine related to ticket 7637

## 2.1.2 - 2014-07-04 - IR231 - Niall Donnelly
7569 - Added validate submission to submission model.

## 2.1.1 - 2014-07-02 - IR231 - Niall Donnelly

7550 - Added signature to file download

## 2.1.0 - 2014-06-23 - IR230 - Jason Madigan

* 7468 - Admin calls fail in the preview

## 2.0.28 - 2014-06-17 - IR230 - Wei Li

* 7449 - Init FH JS SDK on deviceready when deployed to cordova apps

## 2.0.27-alpha - 2014-06-11 - IR229 - Niall Donnelly

* 7366 - Fixed mbaas cloudhost being saved in local storage.

## 2.0.26-alpha - 2014-05-29 - IR228 - Niall Donnelly

* 7324 - Fixed map rendering and checkboxed from drafts.
* 7093 - Removed for description from the form display.

## 2.0.25-alpha - 2014-05-29 - IR228 - Niall Donnelly

* 7301 - Fixed forms rules engine and preview rendering

## 2.0.24-alpha - 2014-05-26 - IR228 - Wei Li

* 7313 - Fix file upload issue on WP8

## 2.0.23-alpha - 2014-05-20- IR228 - Niall Donnelly

* 7113 - Poll mbaas to determine if it is available to upload submissions.

## 2.0.22-alpha - 2014-05-19- IR228 - Jason Madigan

* 7168 - Emit event when SDK config loaded

## 2.0.21-alpha - 2014-05-16 - IR227 - Niall Donnelly

* 6878 no forms exist when adding form


## 2.0.20-alpha - 2014-05-12 - IR227 - Niall Donnelly

* 6438 Add remove button to location fields for appforms.

## 2.0.19-alpha - 2014-05-12 - IR227 - Niall Donnelly

* 6966 Position screen at top of form when navigating between pages.
* 6920 Add functionality to alert studio users when submitting forms in non-mbaas backed forms.

## 2.0.18-alpha - 2014-05-12 - IR227 - Wei Li

* 7166 Fix AF3 crashing issue when running on WP8

## 2.0.17-alpha - 2014-05-01 - IR227 - Niall Donnelly

* 6693 Handle Back Button.
* 6921 Fix Broken Html5 Camera.

## 2.0.16-alpha - 2014-05-07 - IR227 - Wei Li

* 7120 - Fix an issue when checking if a request is cross domain call

## 2.0.15-alpha - 2014-05-01 - IR226 - Niall Donnelly

* 6844 Fixed validaton error for repeating fields.

## 2.0.14-alpha - 2014-05-01 - IR226 - Niall Donnelly

* 7048 Added DeviceId to config view

## 2.0.13-alpha - 2014-05-01 - IR226 - Niall Donnelly

* 7047 - Fixed invalid file saving in draft.

## 2.0.12-alpha - 2014-04-30 - IR226 - Niall Donnelly

* 5824 - fixed date fields not populating across devices

## 2.0.11-alpha - 2014-04-28 - IR226 - Niall Donnelly

* 7007 - fixed file fields not working on Android

## 2.0.10-alpha - 2014-04-28 - IR226 - Niall Donnelly

* 6742 fixed config visible by non admin users. Fixed offline functionality.

## 2.0.9-alpha - 2014-04-25 - IR226 - Cbrookes

* 6440-default-values-set set default values if present

## 2.0.8-alpha - 2014-04-25 - IR226 - Niall Donnelly

* 6802 Fix validation on hidden page for forms

## 2.0.7-alpha - 2014-04-25 - IR226 - Wei Li

* Add support for Titanium

## 2.0.6-alpha - 2014-04-4 - IR226 - Wei Li

* 6635 - Bug fixes and tests for sync client.

## 2.0.5 - IR226 - 2014-04-24 - Niall Donnelly

* 6837 - Fixed draft photo missing on device bug

## 2.0.4 - IR226 - 2014-04-22 - Wei Li

* 6927 - Fix uncaught security execeptions when using JS SDK inside browsers which don't allow saving data
