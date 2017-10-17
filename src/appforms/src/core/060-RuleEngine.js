/*! fh-forms - v1.13.0 -  */
/*! async - v0.2.9 -  */
/*! 2017-06-30 */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
  (function() {

    var async = require('async');
    var _ = require('underscore');
    var moment = require('moment');

    /*
     * Sample Usage
     *
     * var engine = formsRulesEngine(form-definition);
     *
     * engine.validateForms(form-submission, function(err, res) {});
     *      res:
     *      {
     *          "validation": {
     *              "fieldId": {
     *                  "fieldId": "",
     *                  "valid": true,
     *                  "errorMessages": [
     *                      "length should be 3 to 5",
     *                      "should not contain dammit",
     *                      "should repeat at least 2 times"
     *                  ]
     *              },
     *              "fieldId1": {
     *
     *              }
     *          }
     *      }
     *
     *
     * engine.validateField(fieldId, submissionJSON, function(err,res) {});
     *      // validate only field values on validation (no rules, no repeat checking)
     *      res:
     *      "validation":{
     *              "fieldId":{
     *                  "fieldId":"",
     *                  "valid":true,
     *                  "errorMessages":[
     *                      "length should be 3 to 5",
     *                      "should not contain dammit"
     *                  ]
     *              }
     *          }
     *
     * engine.checkRules(submissionJSON, unction(err, res) {})
     *      // check all rules actions
     *      res:
     *      {
     *          "actions": {
     *              "pages": {
     *                  "targetId": {
     *                      "targetId": "",
     *                      "action": "show|hide"
     *                  }
     *              },
     *              "fields": {
     *
     *              }
     *          }
     *      }
     *
     */

    var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY = "date";
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY = "time";
    var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME = "datetime";

    var formsRulesEngine = function(formDef) {
      var initialised;

      var definition = formDef;
      var submission;

      var fieldMap = {};
      var adminFieldMap ={}; //Admin fields should not be part of a submission
      var requiredFieldMap = {};
      var submissionRequiredFieldsMap = {}; // map to hold the status of the required fields per submission
      var fieldRulePredicateMap = {};
      var fieldRuleSubjectMap = {};
      var pageRulePredicateMap = {};
      var pageRuleSubjectMap = {};
      var submissionFieldsMap = {};

      //Mapping fieldId to their section Ids if a field is contained in a section
      var fieldSectionMapping = {};

      var validatorsMap = {
        "text": validatorString,
        "textarea": validatorString,
        "number": validatorNumericString,
        "emailAddress": validatorEmail,
        "dropdown": validatorDropDown,
        "radio": validatorRadio,
        "checkboxes": validatorCheckboxes,
        "location": validatorLocation,
        "locationMap": validatorLocationMap,
        "photo": validatorFile,
        "signature": validatorFile,
        "file": validatorFile,
        "dateTime": validatorDateTime,
        "url": validatorString,
        "sectionBreak": validatorSection,
        "barcode": validatorBarcode,
        "sliderNumber": validatorNumericString,
        "readOnly": function() {
          //readonly fields need no validation. Values are ignored.
          return true;
        }
      };

      var validatorsClientMap = {
        "text": validatorString,
        "textarea": validatorString,
        "number": validatorNumericString,
        "emailAddress": validatorEmail,
        "dropdown": validatorDropDown,
        "radio": validatorRadio,
        "checkboxes": validatorCheckboxes,
        "location": validatorLocation,
        "locationMap": validatorLocationMap,
        "photo": validatorAnyFile,
        "signature": validatorAnyFile,
        "file": validatorAnyFile,
        "dateTime": validatorDateTime,
        "url": validatorString,
        "sectionBreak": validatorSection,
        "barcode": validatorBarcode,
        "sliderNumber": validatorNumericString,
        "readOnly": function() {
          //readonly fields need no validation. Values are ignored.
          return true;
        }
      };

      var fieldValueComparison = {
        "text": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "textarea": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "number": function(fieldValue, testValue, condition) {
          return this.numericalComparison(fieldValue, testValue, condition);
        },
        "emailAddress": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "dropdown": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "radio": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "checkboxes": function(fieldValue, testValue, condition) {
          fieldValue = fieldValue || {};
          var valueFound = false;

          if (!(fieldValue.selections instanceof Array)) {
            return false;
          }

          //Check if the testValue is contained in the selections
          for (var selectionIndex = 0; selectionIndex < fieldValue.selections.length; selectionIndex++ ) {
            var selectionValue = fieldValue.selections[selectionIndex];
            //Note, here we are using the "is" string comparator to check if the testValue matches the current selectionValue
            if (this.comparisonString(selectionValue, testValue, "is")) {
              valueFound = true;
            }
          }

          if (condition === "is") {
            return valueFound;
          } else {
            return !valueFound;
          }

        },
        "dateTime": function(fieldValue, testValue, condition, fieldOptions) {
          var valid = false;

          fieldOptions = fieldOptions || {definition: {}};

          //dateNumVal is assigned an easily comparable number depending on the type of units used.
          var dateNumVal = null;
          var testNumVal = null;

          switch (fieldOptions.definition.datetimeUnit) {
            case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
              try {
                dateNumVal = new Date(new Date(fieldValue).toDateString()).getTime();
                testNumVal = new Date(new Date(testValue).toDateString()).getTime();
                valid = true;
              } catch (e) {
                dateNumVal = null;
                testNumVal = null;
                valid = false;
              }
              break;
            case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
              var cvtTime = this.cvtTimeToSeconds(fieldValue);
              var cvtTestVal = this.cvtTimeToSeconds(testValue);
              dateNumVal = cvtTime.seconds;
              testNumVal = cvtTestVal.seconds;
              valid = cvtTime.valid && cvtTestVal.valid;
              break;
            case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
              try {
                dateNumVal = (new Date(fieldValue).getTime());
                testNumVal = (new Date(testValue).getTime());
                valid = true;
              } catch (e) {
                valid = false;
              }
              break;
            default:
              valid = false;
              break;
          }

          //The value is not valid, no point in comparing.
          if (!valid) {
            return false;
          }

          if ("is at" === condition) {
            valid = dateNumVal === testNumVal;
          } else if ("is before" === condition) {
            valid = dateNumVal < testNumVal;
          } else if ("is after" === condition) {
            valid = dateNumVal > testNumVal;
          } else {
            valid = false;
          }

          return valid;
        },
        "url": function(fieldValue, testValue, condition) {
          return this.comparisonString(fieldValue, testValue, condition);
        },
        "barcode": function(fieldValue, testValue, condition) {
          fieldValue = fieldValue || {};

          if (typeof(fieldValue.text) !== "string") {
            return false;
          }

          return this.comparisonString(fieldValue.text, testValue, condition);
        },
        "sliderNumber": function(fieldValue, testValue, condition) {
          return this.numericalComparison(fieldValue, testValue, condition);
        },
        "comparisonString": function(fieldValue, testValue, condition) {
          var valid = true;

          if ("is" === condition) {
            valid = fieldValue === testValue;
          } else if ("is not" === condition) {
            valid = fieldValue !== testValue;
          } else if ("contains" === condition) {
            valid = fieldValue.indexOf(testValue) !== -1;
          } else if ("does not contain" === condition) {
            valid = fieldValue.indexOf(testValue) === -1;
          } else if ("begins with" === condition) {
            valid = fieldValue.substring(0, testValue.length) === testValue;
          } else if ("ends with" === condition) {
            valid = fieldValue.substring(Math.max(0, (fieldValue.length - testValue.length)), fieldValue.length) === testValue;
          } else {
            valid = false;
          }

          return valid;
        },
        "numericalComparison": function(fieldValue, testValue, condition) {
          var fieldValNum = parseInt(fieldValue, 10);
          var testValNum = parseInt(testValue, 10);

          if (isNaN(fieldValNum) || isNaN(testValNum)) {
            return false;
          }

          if ("is equal to" === condition) {
            return fieldValNum === testValNum;
          } else if ("is less than" === condition) {
            return fieldValNum < testValNum;
          } else if ("is greater than" === condition) {
            return fieldValNum > testValNum;
          } else {
            return false;
          }
        },
        "cvtTimeToSeconds": function(fieldValue) {
          var valid = false;
          var seconds = 0;
          if (typeof fieldValue === "string") {
            var parts = fieldValue.split(':');
            valid = (parts.length === 2) || (parts.length === 3);
            if (valid) {
              valid = isNumberBetween(parts[0], 0, 23);
              seconds += (parseInt(parts[0], 10) * 60 * 60);
            }
            if (valid) {
              valid = isNumberBetween(parts[1], 0, 59);
              seconds += (parseInt(parts[1], 10) * 60);
            }
            if (valid && (parts.length === 3)) {
              valid = isNumberBetween(parts[2], 0, 59);
              seconds += parseInt(parts[2], 10);
            }
          }
          return {valid: valid, seconds: seconds};
        }
      };



      var isFieldRuleSubject = function(fieldId) {
        return !!fieldRuleSubjectMap[fieldId];
      };

      var isPageRuleSubject = function(pageId) {
        return !!pageRuleSubjectMap[pageId];
      };

      /**
       *
       * Builds two field maps, both indexed by the field ID.
       *
       * - One for all of the fields (fieldMap)
       * - One for just the required fields (requiredFieldMap)
       *
       */
      function buildFieldMap() {
        // Iterate over all fields in form definition & build fieldMap
        _.each(definition.pages, function(page) {
          _.each(page.fields, function(field) {
            field.pageId = page._id;

            /**
             * If the field is an admin field, then it is not considered part of validation for a submission.
             */
            if (field.adminOnly) {
              adminFieldMap[field._id] = field;
              return;
            }

            field.fieldOptions = field.fieldOptions ? field.fieldOptions : {};
            field.fieldOptions.definition = field.fieldOptions.definition ? field.fieldOptions.definition : {};
            field.fieldOptions.validation = field.fieldOptions.validation ? field.fieldOptions.validation : {};

            fieldMap[field._id] = field;

            //Section/Page Breaks are not considered to be required as they are
            //structural fields only
            if (field.required && field.type !== "sectionBreak" && field.type !== "pageBreak") {
              requiredFieldMap[field._id] = {
                field: field,
                //Validation details for each section index
                sections: {},
                validated: false,
                valueRequired: field.required
              };
            }

          });
        });
      }

      /**
       *
       * Building a map of all of the field targets of different field rules.
       *
       * This makes it easier to check if any field is the target of a field rule.
       *
       */
      function buildFieldRuleMaps() {
        // Iterate over all rules in form definition & build ruleSubjectMap
        _.each(definition.fieldRules, function(rule) {
          _.each(rule.ruleConditionalStatements, function(ruleConditionalStatement) {
            var fieldId = ruleConditionalStatement.sourceField;
            fieldRulePredicateMap[fieldId] = fieldRulePredicateMap[fieldId] || [];
            fieldRulePredicateMap[fieldId].push(rule);
          });
          /**
           * Target fields are an array of fieldIds that can be targeted by a field rule
           * To maintain backwards compatibility, the case where the targetPage is not an array has to be considered
           * @type {*|Array}
           */
          if (_.isArray(rule.targetField)) {
            _.each(rule.targetField, function(targetField) {
              fieldRuleSubjectMap[targetField] = fieldRuleSubjectMap[targetField] || [];
              fieldRuleSubjectMap[targetField].push(rule);
            });
          } else {
            fieldRuleSubjectMap[rule.targetField] = fieldRuleSubjectMap[rule.targetField] || [];
            fieldRuleSubjectMap[rule.targetField].push(rule);
          }
        });
      }

      /**
       *
       * Building a map of all of the page targets of different page rules.
       *
       * This makes it easier to check if any page is the target of a page rule.
       *
       */
      function buildPageRuleMap() {
        // Iterate over all rules in form definition & build ruleSubjectMap
        _.each(definition.pageRules, function(rule) {
          _.each(rule.ruleConditionalStatements, function(ruleConditionalStatement) {
            var fieldId = ruleConditionalStatement.sourceField;
            pageRulePredicateMap[fieldId] = pageRulePredicateMap[fieldId] || [];
            pageRulePredicateMap[fieldId].push(rule);
          });

          /**
           * Target pages are an array of pageIds that can be targeted by a page rule
           * To maintain backwards compatibility, the case where the targetPage is not an array has to be considered
           * @type {*|Array}
           */
          if (_.isArray(rule.targetPage)) {
            _.each(rule.targetPage, function(targetPage) {
              pageRuleSubjectMap[targetPage] = pageRuleSubjectMap[targetPage] || [];
              pageRuleSubjectMap[targetPage].push(rule);
            });
          } else {
            pageRuleSubjectMap[rule.targetPage] = pageRuleSubjectMap[rule.targetPage] || [];
            pageRuleSubjectMap[rule.targetPage].push(rule);
          }
        });
      }

      /**
       *
       * Building an index of all of the values made for the submission
       *
       * @returns {*}
       */
      function buildSubmissionFieldsMap() {
        submissionRequiredFieldsMap = JSON.parse(JSON.stringify(requiredFieldMap)); // clone the map for use with this submission
        submissionFieldsMap = {}; // start with empty map, rulesEngine can be called with multiple submissions
        var error;

        // iterate over all the fields in the submissions and build a map for easier lookup
        _.each(submission.formFields, function(formField) {
          if (!formField.fieldId) {
            error = new Error("No fieldId in this submission entry: " + JSON.stringify(formField));
            return;
          }

          //The section index should be part of the field input, however for backwards compatibility, it should
          //default to 0
          formField.sectionIndex = formField.sectionIndex || 0;

          /**
           * If the field passed in a submission is an admin field, then return an error.
           */
          if (adminFieldMap[formField.fieldId]) {
            error = "Submission " + formField.fieldId + " is an admin field. Admin fields cannot be passed to the rules engine.";
            return;
          }

          //Including the section index the the submission field map. Otherwise submissions with the same field ID but different
          //section Indexes would overwrite eachother.
          //This also has an impact when considering the rules. If a rule sources its value from a field in a repeating section and targets a
          //value in the same section, then the value has to come from the same section index.
          submissionFieldsMap[formField.fieldId] = submissionFieldsMap[formField.fieldId] || {};
          submissionFieldsMap[formField.fieldId][formField.sectionIndex] = formField;
        });
        return error;
      }

      /**
       *
       * Initialising the rules engine for a single form.
       *
       * This builds up the metadata required to process all rules.
       *
       */
      function init() {
        if (initialised) {
          return;
        }
        buildSectionMap();
        buildFieldMap();
        buildFieldRuleMaps();
        buildPageRuleMap();

        initialised = true;
      }

      /**
       *
       * Processing a single
       *
       * @param {Object} formSubmission - The full JSON definition of the form.
       * @returns {*}
       */
      function initSubmission(formSubmission) {

        //Ensuring that the form metadata has been initialised first.
        init();

        submission = formSubmission;
        return buildSubmissionFieldsMap();
      }

      /**
       *
       * Getting all of the fields that are in a section
       *
       * @param {string} sectionId
       */
      function getSectionFields(sectionId) {
        var allSectionFields = _.map(fieldSectionMapping, function(_sectionId, fieldId) {
          return sectionId === _sectionId ? fieldMap[fieldId] : null;
        });

        return _.compact(allSectionFields);
      }

      /**
       *
       * Checking for too many repeating sections passed.
       *
       * @param {object} validationResponse - The full validation response to update
       * @param {function} callback - Used because it is part of an async.waterfall in the validateForm function
       */
      function checkForTooManyRepeatingSections(validationResponse, callback) {
        var repeatingSections = getAllRepeatingSections();

        //For each of the repeating sections, check that no values have been submitted with an index too large.
        _.each(repeatingSections, function(repeatingSection) {
          var maxRepeat = getSectionMaxRepeat(repeatingSection._id);

          //All of the fields assigned to the repeating section
          var allSectionFields = getSectionFields(repeatingSection._id);

          //For each of these fields, check that there isn't a section index larger than the max number of section repetitions
          _.each(allSectionFields, function(sectionField) {
            var invalidFieldValues = _.filter(submissionFieldsMap[sectionField._id], function(sectionValues, sectionIndex) {
              return parseInt(sectionIndex) >= maxRepeat;
            });

            //For each of the invalid field entries, assign the correct messages
            return _.each(invalidFieldValues, function(invalidFieldValue) {
              var resField = {};
              resField.fieldId = invalidFieldValue.fieldId;
              resField.valid = false;
              resField.fieldErrorMessage = ["Expected a maximum of " + maxRepeat + " sections but got " + (invalidFieldValue.sectionIndex + 1) + "."];
              resField.sectionId = fieldSectionMapping[invalidFieldValue.fieldId];
              resField.sectionIndex = invalidFieldValue.sectionIndex;

              assignValidationResponse(repeatingSection._id, invalidFieldValue.sectionIndex, validationResponse.validation, resField);
              validationResponse.validation.valid = false;
            });
          });
        });

        callback(undefined, validationResponse);
      }

      /**
       *
       * Getting previous values for a single field from a previous submission
       *
       * @param {object} submittedField - The field submitted
       * @param {object|null} previousSubmission - Full JSON definition of the previous submission to get the values from
       * @param {function} cb
       * @returns {*}
       */
      function getPreviousFieldValues(submittedField, previousSubmission, cb) {
        if (previousSubmission && previousSubmission.formFields) {
          async.filter(previousSubmission.formFields, function(formField, cb) {
            return cb(formField.fieldId.toString() === submittedField.fieldId.toString());
          }, function(results) {
            var previousFieldValues = null;
            if (results && results[0] && results[0].fieldValues) {
              previousFieldValues = results[0].fieldValues;
            }
            return cb(undefined, previousFieldValues);
          });
        } else {
          return cb();
        }
      }

      /**
       *
       * Validating a full submission against a form definition
       *
       * @param {object} submission - The full JSON definition of the submission.
       * @param {object} [previousSubmission] - Optional previous submission if values need to be compared.
       * @param {function} cb
       * @returns {*}
       */
      function validateForm(submission, previousSubmission, cb) {
        if ("function" === typeof previousSubmission) {
          cb = previousSubmission;
          previousSubmission = null;
        }

        //Ensuring the form metadata is initialised
        init();

        //Initialising the submission metatadata for validation
        var err = initSubmission(submission);
        if (err) {
          return cb(err);
        }

        //All of the steps required to validate the submission against the form definition
        async.waterfall([
          function(cb) {
            var response = {
              validation: {
                valid: true
              }
            };

            //First, validate each of the fields in the passed submission
            validateSubmittedFields(response, previousSubmission, cb);
          },
          //Now check if any required fields were not submitted
          checkIfRequiredFieldsNotSubmitted,
          //Now check if too many repeating section field values were passed for any repeating section
          checkForTooManyRepeatingSections
        ], function(err, results) {
          if (err) {
            return cb(err);
          }

          return cb(undefined, results);
        });
      }

      /**
       *
       * Validating the submitted fields for a single submission
       *
       * @param {object} validationResponse - The full validation response
       * @param {object|null} previousSubmission - A previous submission to compare against
       * @param {function} cb
       */
      function validateSubmittedFields(validationResponse, previousSubmission, cb) {

        // for each field, validate that the submitted values are valid
        async.each(submission.formFields, function(submittedField, callback) {
          var fieldID = submittedField.fieldId;
          var fieldDef = fieldMap[fieldID];

          //The section index is used to ensure that comparisons are made against the correct section index.
          //This is used when comparing rule source field values targeting fields in the same section
          //It is also used when assigning error messages to the validationResponse
          var sectionIndex = submittedField.sectionIndex || 0;

          getPreviousFieldValues(submittedField, previousSubmission, function(err, previousFieldValues) {
            if (err) {
              return callback(err);
            }

            //Validing the submitted field against the field definition
            getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, function(err, fieldRes) {
              if (err) {
                return callback(err);
              }

              if (!fieldRes.valid) {
                validationResponse.validation.valid = false; // indicate invalid form if any fields invalid
                assignValidationResponse(fieldID, sectionIndex, validationResponse.validation, fieldRes);
              }

              return callback();
            });
          });
        }, function(err) {
          return cb(err, validationResponse);
        });
      }

      /**
       *
       * Building a map of all of the sections along with the fields contained in them
       *
       */
      function buildSectionMap() {
        var sectionId = null;

        _.each(definition.pages, function(page) {

          //Resetting the section ID. Sections never cross pages.
          sectionId = null;

          _.each(page.fields, function(field) {
            if (field.type === "sectionBreak") {
              //If the field is a section break, then we are starting a new section
              sectionId = field._id;
            } else if (field.type !== "pageBreak") {
              //It's not a page or section break field.
              //Assign the section id to the section map
              fieldSectionMapping[field._id] = sectionId;
            }
          });
        });
      }

      /**
       *
       * Assiging a field validation response to the correct section index
       *
       * @param {string} fieldId
       * @param {number} sectionIndex
       * @param {object} globalValidationResponse
       * @param {object} fieldValidationResponse
       */
      function assignValidationResponse(fieldId, sectionIndex, globalValidationResponse, fieldValidationResponse) {
        globalValidationResponse[fieldId] = globalValidationResponse[fieldId] || {sections: {}};
        globalValidationResponse[fieldId].sections[sectionIndex] = fieldValidationResponse;

        //For backwards compatiblility, the section 0 validation response is assigned field validation response
        if (sectionIndex === 0) {
          _.defaults(globalValidationResponse[fieldId], globalValidationResponse[fieldId].sections[0]);
        }
      }

      /**
       *
       * Getting the minimum number of repetitions for a field in a repeating section
       *
       * @param fieldId
       * @returns {number}
       */
      function getSectionMinRepeat(fieldId) {
        //If the field is in a repeating section, need to check each repeating section
        var sectionId = fieldSectionMapping[fieldId];
        var section = sectionId ? fieldMap[sectionId] : null;

        //The field is in a repeating section.
        return section && section.repeating && section.fieldOptions.definition.minRepeat ? section.fieldOptions.definition.minRepeat : 1;
      }

      /**
       *
       * Getting all repeating sections belonging to this form.
       *
       * @returns {Array}
       */
      function getAllRepeatingSections() {
        return _.filter(fieldMap, function(field) {
          return field.type === "sectionBreak" && field.fieldOptions && field.fieldOptions.definition && field.fieldOptions.definition.maxRepeat;
        });
      }

      /**
       *
       * Getting the maximum number of times that a section can repeat.
       *
       * @param {string} sectionId
       * @returns {number} - the number of times a section repeats.
       */
      function getSectionMaxRepeat(sectionId) {
        var section = fieldMap[sectionId];

        return section && section.repeating && section.fieldOptions.definition.maxRepeat ? section.fieldOptions.definition.maxRepeat : 1;
      }


      /**
       *
       * Checking for any required fields that were not submitted.
       *
       * @param {object} validationResponse - The validation response to update with any errors.
       * @param {function} cb
       */
      function checkIfRequiredFieldsNotSubmitted(validationResponse, cb) {

        //For each of the required fields, check that the fields have submission values
        async.each(Object.keys(submissionRequiredFieldsMap), function(requiredFieldId, cb) {
          var requiredField = submissionRequiredFieldsMap[requiredFieldId];

          //The minimum number of times a section must repeat, means that the required fields in the section must have valid entries for each
          //repetition of the field.
          var minRepeat = getSectionMinRepeat(requiredFieldId);

          async.each(_.range(minRepeat), function(sectionIndex, sectionCb) {
            var isSubmitted = requiredField && requiredField.sections && requiredField.sections[sectionIndex] && requiredField.sections[sectionIndex].submitted;

            if (!isSubmitted) {
              //Checking if the field for this section index is visible.
              //This can change based on the section index as rules within the section may source
              //their values from within the repeating section.
              isFieldVisible(requiredFieldId, true, sectionIndex, function(err, visible) {
                var fieldValidationDetails = {};
                if (err) {
                  return sectionCb(err);
                }

                if (visible && requiredField.valueRequired) { // we only care about required fields if they are visible
                  fieldValidationDetails.fieldId = requiredFieldId;
                  fieldValidationDetails.valid = false;
                  fieldValidationDetails.fieldErrorMessage = ["Required Field Not Submitted"];
                  fieldValidationDetails.sectionId = fieldSectionMapping[requiredFieldId];
                  fieldValidationDetails.sectionIndex = sectionIndex;

                  assignValidationResponse(requiredFieldId, sectionIndex, validationResponse.validation, fieldValidationDetails);
                  validationResponse.validation.valid = false;
                }
                return sectionCb();
              });
            } else { // was included in submission
              return sectionCb();
            }
          }, cb);
        }, function(err) {
          return cb(err, validationResponse);
        });
      }

      /**
       * validate only field values on validation (no rules, no repeat checking)
       *     res:
       *     "validation":{
     *             "fieldId":{
     *                 "fieldId":"",
     *                 "valid":true,
     *                 "errorMessages":[
     *                     "length should be 3 to 5",
     *                     "should not contain dammit"
     *                 ]
     *             }
     *         }
       */
      function validateField(fieldId, submission, sectionIndex, cb) {
        init();

        if (_.isFunction(sectionIndex)) {
          cb = sectionIndex;
          sectionIndex = 0;
        }

        var err = initSubmission(submission);
        if (err) {
          return cb(err);
        }

        var submissionField = submissionFieldsMap[fieldId][sectionIndex];
        var fieldDef = fieldMap[fieldId];

        getFieldValidationStatus(submissionField, fieldDef, null, function(err, res) {
          if (err) {
            return cb(err);
          }
          var ret = {
            validation: {}
          };

          assignValidationResponse(fieldId, sectionIndex, ret.validation, res);
          return cb(undefined, ret);
        });
      }

      /*
       * validate only single field value (no rules, no repeat checking)
       * cb(err, result)
       * example of result:
       * "validation":{
       *         "fieldId":{
       *             "fieldId":"",
       *             "valid":true,
       *             "errorMessages":[
       *                 "length should be 3 to 5",
       *                 "should not contain dammit"
       *             ]
       *         }
       *     }
       */
      function validateFieldValue(fieldId, inputValue, valueIndex, sectionIndex, cb) {
        if ("function" === typeof valueIndex) {
          cb = valueIndex;
          valueIndex = 0;
          sectionIndex = 0;
        }

        if (_.isFunction(sectionIndex)) {
          cb = sectionIndex;
          sectionIndex = 0;
        }

        init();

        var fieldDefinition = fieldMap[fieldId];

        var required = false;
        if (fieldDefinition.repeating &&
          fieldDefinition.fieldOptions &&
          fieldDefinition.fieldOptions.definition &&
          fieldDefinition.fieldOptions.definition.minRepeat) {
          required = (valueIndex < fieldDefinition.fieldOptions.definition.minRepeat);
        } else {
          required = fieldDefinition.required;
        }

        var validation = (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) ? fieldDefinition.fieldOptions.validation : undefined;

        if (validation && false === validation.validateImmediately) {
          var ret = {
            validation: {valid: true}
          };

          assignValidationResponse(fieldId, sectionIndex, ret.validation, {
            "valid": true
          });

          return cb(undefined, ret);
        }

        var requiredFieldEntry = requiredFieldMap[fieldDefinition._id] || {valueRequired: required};

        if (fieldEmpty(inputValue)) {
          if (required && requiredFieldEntry.valueRequired) {
            return formatResponse("No value specified for required input", cb);
          } else {
            return formatResponse(undefined, cb); // optional field not supplied is valid
          }
        }

        // not empty need to validate
        getClientValidatorFunction(fieldDefinition.type, function(err, validator) {
          if (err) {
            return cb(err);
          }

          validator(inputValue, fieldDefinition, undefined, function(err) {
            var message;
            if (err) {
              if (err.message) {
                message = err.message;
              } else {
                message = "Unknown error message";
              }
            }
            formatResponse(message, cb);
          });
        });

        function formatResponse(msg, cb) {
          var messages = {
            errorMessages: []
          };
          if (msg) {
            messages.errorMessages.push(msg);
          }
          return createValidatorResponse(fieldId, messages, sectionIndex, function(err, res) {
            if (err) {
              return cb(err);
            }
            var ret = {
              validation: {}
            };

            assignValidationResponse(fieldId, sectionIndex, ret.validation, res);

            return cb(undefined, ret);
          });
        }
      }

      function createValidatorResponse(fieldId, messages, sectionIndex, cb) {
        // intentionally not checking err here, used further down to get validation errors
        var res = {};
        res.fieldId = fieldId;
        res.sectionIndex = sectionIndex;
        res.errorMessages = messages.errorMessages || [];
        res.fieldErrorMessage = messages.fieldErrorMessage || [];
        async.some(res.errorMessages, function(item, cb) {
          return cb(item !== null);
        }, function(someErrors) {
          res.valid = !someErrors && (res.fieldErrorMessage.length < 1);

          return cb(undefined, res);
        });
      }

      function getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, cb) {
        var sectionIndex = submittedField.sectionIndex || 0;

        isFieldVisible(fieldDef._id, true, sectionIndex, function(err, visible) {
          if (err) {
            return cb(err);
          }

          validateFieldInternal(submittedField, fieldDef, previousFieldValues, visible, function(err, messages) {
            if (err) {
              return cb(err);
            }

            createValidatorResponse(submittedField.fieldId, messages, sectionIndex, cb);
          });
        });
      }

      function getMapFunction(key, map, cb) {
        var validator = map[key];
        if (!validator) {
          return cb(new Error("Invalid Field Type " + key));
        }

        return cb(undefined, validator);
      }

      function getValidatorFunction(fieldType, cb) {
        return getMapFunction(fieldType, validatorsMap, cb);
      }

      function getClientValidatorFunction(fieldType, cb) {
        return getMapFunction(fieldType, validatorsClientMap, cb);
      }

      function fieldEmpty(fieldValue) {
        return ('undefined' === typeof fieldValue || null === fieldValue || "" === fieldValue); // empty string also regarded as not specified
      }

      function validateFieldInternal(submittedField, fieldDef, previousFieldValues, visible, cb) {

        previousFieldValues = previousFieldValues || null;
        countSubmittedValues(submittedField, function(err, numSubmittedValues) {
          if (err) {
            return cb(err);
          }
          //Marking the visibility of the field on the definition.
          fieldDef.visible = visible;
          async.series({
            valuesSubmitted: async.apply(checkValueSubmitted, submittedField, fieldDef, visible),
            repeats: async.apply(checkRepeat, numSubmittedValues, fieldDef, visible),
            values: async.apply(checkValues, submittedField, fieldDef, previousFieldValues)
          }, function(err, results) {
            if (err) {
              return cb(err);
            }

            var fieldErrorMessages = [];
            if (results.valuesSubmitted) {
              fieldErrorMessages.push(results.valuesSubmitted);
            }
            if (results.repeats) {
              fieldErrorMessages.push(results.repeats);
            }
            return cb(undefined, {
              fieldErrorMessage: fieldErrorMessages,
              errorMessages: results.values
            });
          });
        });

        return; // just functions below this

        function checkValueSubmitted(submittedField, fieldDefinition, visible, cb) {
          if (!fieldDefinition.required) {
            return cb(undefined, null);
          }

          var valueSubmitted = submittedField && submittedField.fieldValues && (submittedField.fieldValues.length > 0);
          //No value submitted is only an error if the field is visible.

          //If the field value has been marked as not required, then don't fail a no-value submission
          var valueRequired = requiredFieldMap[fieldDefinition._id] && requiredFieldMap[fieldDefinition._id].valueRequired;

          if (!valueSubmitted && visible && valueRequired) {
            return cb(undefined, "No value submitted for field " + fieldDefinition.name);
          }
          return cb(undefined, null);

        }

        function countSubmittedValues(submittedField, cb) {
          var numSubmittedValues = 0;
          if (submittedField && submittedField.fieldValues && submittedField.fieldValues.length > 0) {
            for (var i = 0; i < submittedField.fieldValues.length; i += 1) {
              if (submittedField.fieldValues[i]) {
                numSubmittedValues += 1;
              }
            }
          }
          return cb(undefined, numSubmittedValues);
        }

        function checkRepeat(numSubmittedValues, fieldDefinition, visible, cb) {
          //If the field is not visible, then checking the repeating values of the field is not required
          if (!visible) {
            return cb(undefined, null);
          }

          if (fieldDefinition.repeating && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.definition) {
            if (fieldDefinition.fieldOptions.definition.minRepeat) {
              if (numSubmittedValues < fieldDefinition.fieldOptions.definition.minRepeat) {
                return cb(undefined, "Expected min of " + fieldDefinition.fieldOptions.definition.minRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
              }
            }

            if (fieldDefinition.fieldOptions.definition.maxRepeat) {
              if (numSubmittedValues > fieldDefinition.fieldOptions.definition.maxRepeat) {
                return cb(undefined, "Expected max of " + fieldDefinition.fieldOptions.definition.maxRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
              }
            }
          } else if (numSubmittedValues > 1) {
            return cb(undefined, "Should not have multiple values for non-repeating field");
          }

          return cb(undefined, null);
        }

        function checkValues(submittedField, fieldDefinition, previousFieldValues, cb) {
          var sectionIndex = submittedField.sectionIndex || 0;

          getValidatorFunction(fieldDefinition.type, function(err, validator) {
            if (err) {
              return cb(err);
            }

            async.map(submittedField.fieldValues, function(fieldValue, cb) {
              if (fieldEmpty(fieldValue)) {
                return cb(undefined, null);
              } else {
                validator(fieldValue, fieldDefinition, previousFieldValues, function(validationError) {
                  var errorMessage;
                  if (validationError) {
                    errorMessage = validationError.message || "Error during validation of field";
                  } else {
                    errorMessage = null;
                  }

                  submissionRequiredFieldsMap[fieldDefinition._id] = submissionRequiredFieldsMap[fieldDefinition._id] || {sections: {}};
                  submissionRequiredFieldsMap[fieldDefinition._id].sections[sectionIndex] = submissionRequiredFieldsMap[fieldDefinition._id].sections[sectionIndex] || {};
                  var sectionValues = submissionRequiredFieldsMap[fieldDefinition._id].sections[sectionIndex];

                  if (sectionValues) { // set to true if at least one value
                    sectionValues.submitted = true;
                  }

                  return cb(undefined, errorMessage);
                });
              }
            }, function(err, results) {
              if (err) {
                return cb(err);
              }

              return cb(undefined, results);
            });
          });
        }
      }

      function convertSimpleFormatToRegex(field_format_string) {
        var regex = "^";
        var C = "c".charCodeAt(0);
        var N = "n".charCodeAt(0);

        var i;
        var ch;
        var match;
        var len = field_format_string.length;
        for (i = 0; i < len; i += 1) {
          ch = field_format_string.charCodeAt(i);
          switch (ch) {
            case C:
              match = "[a-zA-Z0-9]";
              break;
            case N:
              match = "[0-9]";
              break;
            default:
              var num = ch.toString(16).toUpperCase();
              match = "\\u" + ("0000" + num).substr(-4);
              break;
          }
          regex += match;
        }
        return regex + "$";
      }

      function validFormatRegex(fieldValue, field_format_string) {
        var pattern = new RegExp(field_format_string);
        return pattern.test(fieldValue);
      }

      function validFormat(fieldValue, field_format_mode, field_format_string) {
        var regex;
        if ("simple" === field_format_mode) {
          regex = convertSimpleFormatToRegex(field_format_string);
        } else if ("regex" === field_format_mode) {
          regex = field_format_string;
        } else { // should never be anything else, but if it is then default to simple format
          regex = convertSimpleFormatToRegex(field_format_string);
        }

        return validFormatRegex(fieldValue, regex);
      }

      function validatorString(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof fieldValue !== "string") {
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        var validation = {};
        if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
          validation = fieldDefinition.fieldOptions.validation;
        }

        var field_format_mode = validation.field_format_mode || "";
        field_format_mode = field_format_mode.trim();
        var field_format_string = validation.field_format_string || "";
        field_format_string = field_format_string.trim();

        if (field_format_string && (field_format_string.length > 0) && field_format_mode && (field_format_mode.length > 0)) {
          if (!validFormat(fieldValue, field_format_mode, field_format_string)) {
            return cb(new Error("field value in incorrect format, expected format: " + field_format_string + " but submission value is: " + fieldValue));
          }
        }

        if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
          if (fieldValue.length < fieldDefinition.fieldOptions.validation.min) {
            return cb(new Error("Expected minimum string length of " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
          }
        }

        if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.max) {
          if (fieldValue.length > fieldDefinition.fieldOptions.validation.max) {
            return cb(new Error("Expected maximum string length of " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
          }
        }

        return cb();
      }

      function validatorNumericString(fieldValue, fieldDefinition, previousFieldValues, cb) {
        var testVal = (fieldValue - 0); // coerce to number (or NaN)
        /* eslint-disable eqeqeq */
        var numeric = (testVal == fieldValue); // testVal co-erced to numeric above, so numeric comparison and NaN != NaN

        if (!numeric) {
          return cb(new Error("Expected numeric but got: " + fieldValue));
        }

        return validatorNumber(testVal, fieldDefinition, previousFieldValues, cb);
      }

      function validatorNumber(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof fieldValue !== "number") {
          return cb(new Error("Expected number but got " + typeof(fieldValue)));
        }

        if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
          if (fieldValue < fieldDefinition.fieldOptions.validation.min) {
            return cb(new Error("Expected minimum Number " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
          }
        }

        if (fieldDefinition.fieldOptions.validation.max) {
          if (fieldValue > fieldDefinition.fieldOptions.validation.max) {
            return cb(new Error("Expected maximum Number " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
          }
        }

        return cb();
      }

      function validatorEmail(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof(fieldValue) !== "string") {
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        if (fieldValue.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/g) === null) {
          return cb(new Error("Invalid email address format: " + fieldValue));
        } else {
          return cb();
        }
      }

      /**
      * isSafeString - Checks if special characters in strings have already been escaped.
      *
      * @param  {string} str               The string to check.
      * @return {boolean}
      */
      function isSafeString(str) {
        var escape = ['&amp;', '&lt;', '&gt;', '&quot;', '&#x27;', '&#96;'];
        if (escape.some(function (specialChar) { return str.indexOf(specialChar) >= 0; })) {
          return true;
        }
      }

      /**
       * validatorDropDown - Validator function for dropdown fields.
       *
       * @param  {string} fieldValue        The value to validate
       * @param  {object} fieldDefinition   Full JSON definition of the field
       * @param  {array} previousFieldValues Any values previously stored with the fields
       * @param  {function} cb               Callback function
       */
      function validatorDropDown(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof(fieldValue) !== "string") {
          return cb(new Error("Expected submission to be string but got " + typeof(fieldValue)));
        }

        fieldDefinition.fieldOptions = fieldDefinition.fieldOptions || {};
        fieldDefinition.fieldOptions.definition = fieldDefinition.fieldOptions.definition || {};

        //Check values exists in the field definition
        if (!fieldDefinition.fieldOptions.definition.options) {
          return cb(new Error("No options exist for field " + fieldDefinition.name));
        }

        //Finding the selected option
        var found = _.find(fieldDefinition.fieldOptions.definition.options, function(dropdownOption) {
          //check if fieldValue and the label need to be escaped
          isSafeString(fieldValue) ? null : fieldValue = _.escape(fieldValue);
          return dropdownOption.label === fieldValue;
        });

        //Valid option, can return
        if (found) {
          return cb();
        }

        //If the option is empty and the field is required, then the blank option is being submitted
        //The blank option is not valid for a required field.
        if (found === "" && fieldDefinition.required && fieldDefinition.fieldOptions.definition.include_blank_option) {
          return cb(new Error("The Blank Option is not valid. Please select a value."));
        } else {
          //Otherwise, it is an invalid option
          return cb(new Error("Invalid option specified: " + fieldValue));
        }
      }

      /**
       * validatorRadio - Validator function for radio fields.
       *
       * @param  {string} fieldValue        The value to validate
       * @param  {object} fieldDefinition   Full JSON definition of the field
       * @param  {array} previousFieldValues Any values previously stored with the fields
       * @param  {function} cb               Callback function
       */
      function validatorRadio(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof(fieldValue) !== "string") {
          return cb(new Error("Expected submission to be string but got " + typeof(fieldValue)));
        }

        //Check value exists in the field definition
        if (!fieldDefinition.fieldOptions.definition.options) {
          return cb(new Error("No options exist for field " + fieldDefinition.name));
        }

        async.some(fieldDefinition.fieldOptions.definition.options, function(dropdownOption, cb) {
          //check if fieldValue and the label need to be escaped
          isSafeString(fieldValue) ? null : fieldValue = _.escape(fieldValue);
          return cb(dropdownOption.label === fieldValue);
        }, function(found) {
          if (!found) {
            return cb(new Error("Invalid option specified: " + fieldValue));
          } else {
            return cb();
          }
        });
      }

      function validatorCheckboxes(fieldValue, fieldDefinition, previousFieldValues, cb) {
        var minVal;

        if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
          minVal = fieldDefinition.fieldOptions.validation.min;
        }
        var maxVal;
        if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
          maxVal = fieldDefinition.fieldOptions.validation.max;
        }

        if (minVal) {
          if (fieldValue.selections === null || fieldValue.selections === undefined || fieldValue.selections.length < minVal && fieldDefinition.visible) {
            var len;
            if (fieldValue.selections) {
              len = fieldValue.selections.length;
            }
            return cb(new Error("Expected a minimum number of selections " + minVal + " but got " + len));
          }
        }

        if (maxVal) {
          if (fieldValue.selections) {
            if (fieldValue.selections.length > maxVal) {
              return cb(new Error("Expected a maximum number of selections " + maxVal + " but got " + fieldValue.selections.length));
            }
          }
        }

        var optionsInCheckbox = [];

        async.eachSeries(fieldDefinition.fieldOptions.definition.options, function(choice, cb) {
          for (var choiceName in choice) { // eslint-disable-line guard-for-in
            optionsInCheckbox.push(choice[choiceName]);
          }
          return cb();
        }, function() {
          async.eachSeries(fieldValue.selections, function(selection, cb) {
            if (typeof(selection) !== "string") {
              return cb(new Error("Expected checkbox submission to be string but got " + typeof(selection)));
            }

            //selection needs to be escaped here
            selection = _.escape(selection);
            if (optionsInCheckbox.indexOf(selection) === -1) {
              return cb(new Error("Checkbox Option " + selection + " does not exist in the field."));
            }

            return cb();
          }, cb);
        });
      }

      function validatorLocationMap(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (fieldValue.lat && fieldValue["long"]) {
          if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
            return cb(new Error("Invalid latitude and longitude values"));
          } else {
            return cb();
          }
        } else {
          return cb(new Error("Invalid object for locationMap submission"));
        }
      }


      function validatorLocation(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (fieldDefinition.fieldOptions.definition.locationUnit === "latlong") {
          if (fieldValue.lat && fieldValue["long"]) {
            if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
              return cb(new Error("Invalid latitude and longitude values"));
            } else {
              return cb();
            }
          } else {
            return cb(new Error("Invalid object for latitude longitude submission"));
          }
        } else if (fieldValue.zone && fieldValue.eastings && fieldValue.northings) {
          //Zone must be 3 characters, eastings 6 and northings 9
          return validateNorthingsEastings(fieldValue, cb);
        } else {
          return cb(new Error("Invalid object for northings easting submission. Zone, Eastings and Northings elements are required"));
        }

        function validateNorthingsEastings(fieldValue, cb) {
          if (typeof(fieldValue.zone) !== "string" || fieldValue.zone.length === 0) {
            return cb(new Error("Invalid zone definition for northings and eastings location. " + fieldValue.zone));
          }

          var east = parseInt(fieldValue.eastings, 10);
          if (isNaN(east)) {
            return cb(new Error("Invalid eastings definition for northings and eastings location. " + fieldValue.eastings));
          }

          var north = parseInt(fieldValue.northings, 10);
          if (isNaN(north)) {
            return cb(new Error("Invalid northings definition for northings and eastings location. " + fieldValue.northings));
          }

          return cb();
        }
      }

      function validatorAnyFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
        // if any of the following validators return ok, then return ok.
        validatorBase64(fieldValue, fieldDefinition, previousFieldValues, function(err) {
          if (!err) {
            return cb();
          }
          validatorFile(fieldValue, fieldDefinition, previousFieldValues, function(err) {
            if (!err) {
              return cb();
            }
            validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, function(err) {
              if (!err) {
                return cb();
              }
              return cb(err);
            });
          });
        });
      }

      /**
       * Function to validate a barcode submission
       *
       * Must be an object with the following contents
       *
       * {
     *   text: "<<content of barcode>>",
     *   format: "<<barcode content format>>"
     * }
       *
       * @param fieldValue
       * @param fieldDefinition
       * @param previousFieldValues
       * @param cb
       */
      function validatorBarcode(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof(fieldValue) !== "object" || fieldValue === null) {
          return cb(new Error("Expected object but got " + typeof(fieldValue)));
        }

        if (typeof(fieldValue.text) !== "string" || fieldValue.text.length === 0) {
          return cb(new Error("Expected text parameter."));
        }

        if (typeof(fieldValue.format) !== "string" || fieldValue.format.length === 0) {
          return cb(new Error("Expected format parameter."));
        }

        return cb();
      }

      function checkFileSize(fieldDefinition, fieldValue, sizeKey, cb) {
        fieldDefinition = fieldDefinition || {};
        var fieldOptions = fieldDefinition.fieldOptions || {};
        var fieldOptionsDef = fieldOptions.definition || {};
        var fileSizeMax = fieldOptionsDef.file_size || null; //FileSizeMax will be in KB. File size is in bytes

        if (fileSizeMax !== null) {
          var fieldValueSize = fieldValue[sizeKey];
          var fieldValueSizeKB = 1;
          if (fieldValueSize > 1000) {
            fieldValueSizeKB = fieldValueSize / 1000;
          }
          if (fieldValueSize > (fileSizeMax * 1000)) {
            return cb(new Error("File size is too large. File can be a maximum of " + fileSizeMax + "KB. Size of file selected: " + fieldValueSizeKB + "KB"));
          } else {
            return cb();
          }
        } else {
          return cb();
        }
      }

      function validatorFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof fieldValue !== "object") {
          return cb(new Error("Expected object but got " + typeof(fieldValue)));
        }

        var keyTypes = [
          {
            keyName: "fileName",
            valueType: "string"
          },
          {
            keyName: "fileSize",
            valueType: "number"
          },
          {
            keyName: "fileType",
            valueType: "string"
          },
          {
            keyName: "fileUpdateTime",
            valueType: "number"
          },
          {
            keyName: "hashName",
            valueType: "string"
          }
        ];

        async.each(keyTypes, function(keyType, cb) {
          var actualType = typeof fieldValue[keyType.keyName];
          if (actualType !== keyType.valueType) {
            return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
          }
          if (keyType.keyName === "fileName" && fieldValue[keyType.keyName].length <= 0) {
            return cb(new Error("Expected value for " + keyType.keyName));
          }

          return cb();
        }, function(err) {
          if (err) {
            return cb(err);
          }

          checkFileSize(fieldDefinition, fieldValue, "fileSize", function(err) {
            if (err) {
              return cb(err);
            }

            if (fieldValue.hashName.indexOf("filePlaceHolder") > -1) { //TODO abstract out to config
              return cb();
            } else if (previousFieldValues && previousFieldValues.hashName && previousFieldValues.hashName.indexOf(fieldValue.hashName) > -1) {
              return cb();
            } else {
              return cb(new Error("Invalid file placeholder text" + fieldValue.hashName));
            }
          });
        });
      }

      function validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if ((typeof File !== "function")) {
          return cb(new Error("Expected File object but got " + typeof(fieldValue)));
        }

        var keyTypes = [
          {
            keyName: "name",
            valueType: "string"
          },
          {
            keyName: "size",
            valueType: "number"
          }
        ];

        async.each(keyTypes, function(keyType, cb) {
          var actualType = typeof fieldValue[keyType.keyName];
          if (actualType !== keyType.valueType) {
            return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
          }
          if (actualType === "string" && fieldValue[keyType.keyName].length <= 0) {
            return cb(new Error("Expected value for " + keyType.keyName));
          }
          if (actualType === "number" && fieldValue[keyType.keyName] <= 0) {
            return cb(new Error("Expected > 0 value for " + keyType.keyName));
          }

          return cb();
        }, function(err) {
          if (err) {
            return cb(err);
          }


          checkFileSize(fieldDefinition, fieldValue, "size", function(err) {
            if (err) {
              return cb(err);
            }
            return cb();
          });
        });
      }

      function validatorBase64(fieldValue, fieldDefinition, previousFieldValues, cb) {
        if (typeof fieldValue !== "string") {
          return cb(new Error("Expected base64 string but got " + typeof(fieldValue)));
        }

        if (fieldValue.length <= 0) {
          return cb(new Error("Expected base64 string but was empty"));
        }

        return cb();
      }

      function validatorDateTime(fieldValue, fieldDefinition, previousFieldValues, cb) {
        var valid = false;

        if (typeof(fieldValue) !== "string") {
          return cb(new Error("Expected string but got " + typeof(fieldValue)));
        }

        switch (fieldDefinition.fieldOptions.definition.datetimeUnit) {
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:

            var validDateFormats = ["YYYY/MM/DD", "YYYY/MM/DD", "YYYY-MM-DD", "YYYY-MM-DD"];

            valid = _.find(validDateFormats, function(expectedFormat) {
              return moment(fieldValue, expectedFormat, true).isValid();
            });

            if (valid) {
              return cb();
            } else {
              return cb(new Error("Invalid date value " + fieldValue + ". Date format is YYYY/MM/DD"));
            }
            break; // eslint-disable-line no-unreachable
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
            valid = moment(fieldValue, "HH:mm:ss", true).isValid() || moment(fieldValue, "HH:mm", true).isValid();
            if (valid) {
              return cb();
            } else {
              return cb(new Error("Invalid time value " + fieldValue + ". Time format is HH:mm:ss or HH:mm"));
            }
            break; // eslint-disable-line no-unreachable
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
            var validDateTimeFormats = fieldDefinition.fieldOptions.definition.dateTimeFormat ? [fieldDefinition.fieldOptions.definition.dateTimeFormat] : ["YYYY/MM/DD HH:mm:ss", "YYYY/MM/DD HH:mm", "YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"];

            valid = _.find(validDateTimeFormats, function(expectedFormat) {
              return moment(fieldValue, expectedFormat, true).isValid();
            });

            if (valid) {
              return cb();
            } else {
              return cb(new Error("Invalid dateTime string " + fieldValue + ". dateTime format is " + validDateTimeFormats.join(" or ")));
            }
            break; // eslint-disable-line no-unreachable
          default:
            return cb(new Error("Invalid dateTime fieldtype " + fieldDefinition.fieldOptions.definition.datetimeUnit));
        }
      }

      function validatorSection(value, fieldDefinition, previousFieldValues, cb) {
        return cb(new Error("Should not submit section field: " + fieldDefinition.name));
      }

      /**
       *
       * Checking a single rule conditional statement to determine of the rule is active.
       *
       * @param {string} fieldId
       * @param {number} sectionIndex
       * @param {Array} predicateMapQueries
       * @param {Array} predicateMapPassed
       * @param {object} ruleConditionalStatement
       * @param {function} cbPredicates
       * @returns {*}
       */
      function checkSingleRuleConditionalStatement(fieldId, sectionIndex, predicateMapQueries, predicateMapPassed, ruleConditionalStatement, cbPredicates) {
        var field = fieldMap[ruleConditionalStatement.sourceField];
        var passed = false;
        var submissionValues = [];
        var condition;
        var testValue;

        //Getting the section ID for the target field. The field may be in a repeating section
        var sectionIdForTargetField = fieldSectionMapping[fieldId];

        var sectionIdForSourceField = fieldSectionMapping[ruleConditionalStatement.sourceField];

        //The fields are in the same section if and only if the sectionIds are the same OR neither are in a section
        var sameSection = sectionIdForTargetField === sectionIdForSourceField;

        var sourceFieldValues = submissionFieldsMap[ruleConditionalStatement.sourceField];

        var sourceFieldValue;
        //For repeating sections, if a source field for a rule conditional statement is outside the section of the target field, the source value has to come from the first section
        if (!sameSection) {
          sourceFieldValue = sourceFieldValues && sourceFieldValues[0] ? sourceFieldValues[0] : null;
        } else {
          sourceFieldValue = sourceFieldValues && sourceFieldValues[sectionIndex] ? sourceFieldValues[sectionIndex] : null;
        }

        if (sourceFieldValue && sourceFieldValue.fieldValues) {
          submissionValues = sourceFieldValue.fieldValues;
          condition = ruleConditionalStatement.restriction;
          testValue = ruleConditionalStatement.sourceValue;

          // Validate rule predicates on the first entry only.
          passed = isConditionActive(field, submissionValues[0], testValue, condition);
        }

        predicateMapQueries.push({
          "field": field,
          "sectionIndex": sectionIndex,
          "submissionValues": submissionValues,
          "condition": condition,
          "testValue": testValue,
          "passed": passed
        });

        if (passed) {
          predicateMapPassed.push(field);
        }
        return cbPredicates();
      }

      /**
       *
       * Processing all of the rules that target a single field/page to check if the rule is active or not.
       *
       * @param {string|null} fieldId - The ID of the field being checked. If it is null then it is a page rule being checked.
       * @param {Array} rules
       * @param {number} sectionIndex
       * @param {function} cb
       */
      function rulesResult(fieldId, rules, sectionIndex, cb) {
        var visible = true;

        // Iterate over each rule that this field is a predicate of
        async.each(rules, function(rule, cbRule) {
          // For each rule, iterate over the predicate fields and evaluate the rule
          var predicateMapQueries = [];
          var predicateMapPassed = [];
          async.each(rule.ruleConditionalStatements, async.apply(checkSingleRuleConditionalStatement, fieldId, sectionIndex, predicateMapQueries, predicateMapPassed), function(err) {
            if (err) {
              cbRule(err);
            }

            function rulesPassed(condition, passed, queries) {
              return ((condition === "and") && ((passed.length === queries.length))) || // "and" condition - all rules must pass
                ((condition === "or") && ((passed.length > 0))); // "or" condition - only one rule must pass
            }

            /**
             * If any rule condition that targets the field/page hides that field/page, then the page is hidden.
             * Hiding the field/page takes precedence over any show. This will maintain consistency.
             * E.g. if x is y then hide p1,p2 takes precedence over if x is y then show p1, p2
             */
            if (rulesPassed(rule.ruleConditionalOperator, predicateMapPassed, predicateMapQueries)) {
              visible = (rule.type === "show") && visible;
            } else {
              visible = (rule.type !== "show") && visible;
            }

            return cbRule();
          });
        }, function(err) {
          return cb(err, visible);
        });
      }

      function isPageVisible(pageId, cb) {
        init();
        if (isPageRuleSubject(pageId)) { // if the page is the target of a rule
          return rulesResult(null, pageRuleSubjectMap[pageId], 0, cb); // execute page rules
        } else {
          return cb(undefined, true); // if page is not subject of any rule then must be visible
        }
      }

      /**
       *
       * Checking to see if the field is visible for a section
       *
       * @param fieldId
       * @param checkContainingPage
       * @param [sectionIndex]
       * @param cb
       * @returns {*}
       */
      function isFieldVisible(fieldId, checkContainingPage, sectionIndex, cb) {

        //Keeping backwards compatiblity
        if (_.isFunction(sectionIndex)) {
          cb = sectionIndex;
          sectionIndex = 0;
        }

        /*
         * fieldId = Id of field to check for rule predicate references
         * checkContainingPage = if true check page containing field, and return false if the page is hidden
         */
        init();
        // Fields are visible by default
        var field = fieldMap[fieldId];

        /**
         * If the field is an admin field, the rules engine returns an error, as admin fields cannot be the subject of rules engine actions.
         */
        if (adminFieldMap[fieldId]) {
          return cb(new Error("Submission " + fieldId + " is an admin field. Admin fields cannot be passed to the rules engine."));
        } else if (!field) {
          return cb(new Error("Field does not exist in form"));
        }

        async.waterfall([

          function testPage(cb) {
            if (checkContainingPage) {
              isPageVisible(field.pageId, cb);
            } else {
              return cb(undefined, true);
            }
          },
          function testField(pageVisible, cb) {
            if (!pageVisible) { // if page containing field is not visible then don't need to check field
              return cb(undefined, false);
            }

            if (isFieldRuleSubject(fieldId)) { // If the field is the subject of a rule it may have been hidden
              return rulesResult(fieldId, fieldRuleSubjectMap[fieldId], sectionIndex, cb); // execute field rules
            } else {
              return cb(undefined, true); // if not subject of field rules then can't be hidden
            }
          }
        ], cb);
      }

      /*
       * check all rules actions
       *      res:
       *      {
       *          "actions": {
       *              "pages": {
       *                  "targetId": {
       *                      "targetId": "",
       *                      "action": "show|hide"
       *                  }
       *              },
       *              "fields": {
       *              }
       *          }
       *      }
       */
      function checkRules(submissionJSON, cb) {
        init();
        var err = initSubmission(submissionJSON);
        if (err) {
          return cb(err);
        }
        var actions = {};

        async.parallel([

          function(cb) {
            actions.fields = {};
            async.eachSeries(Object.keys(fieldRuleSubjectMap), function(fieldId, cb) {

              var minRepeat = getSectionMinRepeat(fieldId);

              async.each(_.range(minRepeat), function(sectionIndex, sectionCb) {
                isFieldVisible(fieldId, false, sectionIndex, function(err, fieldVisible) {
                  if (err) {
                    return cb(err);
                  }
                  actions.fields[fieldId] = {
                    targetId: fieldId,
                    sectionIndex: sectionIndex,
                    action: (fieldVisible ? "show" : "hide")
                  };
                  return sectionCb();
                });
              }, cb);
            }, cb);
          },
          function(cb) {
            actions.pages = {};
            async.eachSeries(Object.keys(pageRuleSubjectMap), function(pageId, cb) {
              isPageVisible(pageId, function(err, pageVisible) {
                if (err) {
                  return cb(err);
                }
                actions.pages[pageId] = {
                  targetId: pageId,
                  action: (pageVisible ? "show" : "hide")
                };
                return cb();
              });
            }, cb);
          }
        ], function(err) {
          if (err) {
            return cb(err);
          }

          return cb(undefined, {
            actions: actions
          });
        });
      }

      /**
       *
       * Checking to see if a rule condition is active.
       *
       * @param {object} field - JSON definition of the field
       * @param {*} fieldValue - The value obtained for the field from the submission
       * @param {*} testValue - The value to compare against to see if the condition is active.
       * @param {string} condition - The condition to compare the values (E.g. "is equal to")
       * @returns {*}
       */
      function isConditionActive(field, fieldValue, testValue, condition) {

        var fieldType = field.type;
        var fieldOptions = field.fieldOptions ? field.fieldOptions : {};

        if (typeof(fieldValue) === 'undefined' || fieldValue === null) {
          return false;
        }

        if (typeof(fieldValueComparison[fieldType]) === "function") {
          return fieldValueComparison[fieldType](fieldValue, testValue, condition, fieldOptions);
        } else {
          return false;
        }

      }

      function isNumberBetween(num, min, max) {
        var numVal = parseInt(num, 10);
        return (!isNaN(numVal) && (numVal >= min) && (numVal <= max));
      }

      return {
        validateForm: validateForm,
        validateField: validateField,
        validateFieldValue: validateFieldValue,
        checkRules: checkRules,

        // The following are used internally, but exposed for tests
        validateFieldInternal: validateFieldInternal,
        initSubmission: initSubmission,
        isFieldVisible: isFieldVisible,
        isConditionActive: isConditionActive
      };
    };

    if (typeof module !== 'undefined' && module.exports) {
      module.exports = formsRulesEngine;
    }

    /*globals appForm */
    if (typeof appForm !== 'undefined') {
      appForm.RulesEngine = formsRulesEngine;
    }
  }());

},{"async":2,"moment":4,"underscore":5}],2:[function(require,module,exports){
  (function (process){
    /*global setImmediate: false, setTimeout: false, console: false */
    (function () {

      var async = {};

      // global on the server, window in the browser
      var root, previous_async;

      root = this;
      if (root != null) {
        previous_async = root.async;
      }

      async.noConflict = function () {
        root.async = previous_async;
        return async;
      };

      function only_once(fn) {
        var called = false;
        return function() {
          if (called) throw new Error("Callback was already called.");
          called = true;
          fn.apply(root, arguments);
        }
      }

      //// cross-browser compatiblity functions ////

      var _each = function (arr, iterator) {
        if (arr.forEach) {
          return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
          iterator(arr[i], i, arr);
        }
      };

      var _map = function (arr, iterator) {
        if (arr.map) {
          return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
          results.push(iterator(x, i, a));
        });
        return results;
      };

      var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
          return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
          memo = iterator(memo, x, i, a);
        });
        return memo;
      };

      var _keys = function (obj) {
        if (Object.keys) {
          return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
          if (obj.hasOwnProperty(k)) {
            keys.push(k);
          }
        }
        return keys;
      };

      //// exported async module functions ////

      //// nextTick implementation with browser-compatible fallback ////
      if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
          async.nextTick = function (fn) {
            // not a direct alias for IE10 compatibility
            setImmediate(fn);
          };
          async.setImmediate = async.nextTick;
        }
        else {
          async.nextTick = function (fn) {
            setTimeout(fn, 0);
          };
          async.setImmediate = async.nextTick;
        }
      }
      else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
          async.setImmediate = setImmediate;
        }
        else {
          async.setImmediate = async.nextTick;
        }
      }

      async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
          return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
          iterator(x, only_once(function (err) {
            if (err) {
              callback(err);
              callback = function () {};
            }
            else {
              completed += 1;
              if (completed >= arr.length) {
                callback(null);
              }
            }
          }));
        });
      };
      async.forEach = async.each;

      async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
          return callback();
        }
        var completed = 0;
        var iterate = function () {
          iterator(arr[completed], function (err) {
            if (err) {
              callback(err);
              callback = function () {};
            }
            else {
              completed += 1;
              if (completed >= arr.length) {
                callback(null);
              }
              else {
                iterate();
              }
            }
          });
        };
        iterate();
      };
      async.forEachSeries = async.eachSeries;

      async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
      };
      async.forEachLimit = async.eachLimit;

      var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
          callback = callback || function () {};
          if (!arr.length || limit <= 0) {
            return callback();
          }
          var completed = 0;
          var started = 0;
          var running = 0;

          (function replenish () {
            if (completed >= arr.length) {
              return callback();
            }

            while (running < limit && started < arr.length) {
              started += 1;
              running += 1;
              iterator(arr[started - 1], function (err) {
                if (err) {
                  callback(err);
                  callback = function () {};
                }
                else {
                  completed += 1;
                  running -= 1;
                  if (completed >= arr.length) {
                    callback();
                  }
                  else {
                    replenish();
                  }
                }
              });
            }
          })();
        };
      };


      var doParallel = function (fn) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [async.each].concat(args));
        };
      };
      var doParallelLimit = function(limit, fn) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
      };
      var doSeries = function (fn) {
        return function () {
          var args = Array.prototype.slice.call(arguments);
          return fn.apply(null, [async.eachSeries].concat(args));
        };
      };


      var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
          return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
          iterator(x.value, function (err, v) {
            results[x.index] = v;
            callback(err);
          });
        }, function (err) {
          callback(err, results);
        });
      };
      async.map = doParallel(_asyncMap);
      async.mapSeries = doSeries(_asyncMap);
      async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
      };

      var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
      };

      // reduce only has a series version, as doing reduce in parallel won't
      // work in many situations.
      async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
          iterator(memo, x, function (err, v) {
            memo = v;
            callback(err);
          });
        }, function (err) {
          callback(err, memo);
        });
      };
      // inject alias
      async.inject = async.reduce;
      // foldl alias
      async.foldl = async.reduce;

      async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
          return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
      };
      // foldr alias
      async.foldr = async.reduceRight;

      var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
          return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
          iterator(x.value, function (v) {
            if (v) {
              results.push(x);
            }
            callback();
          });
        }, function (err) {
          callback(_map(results.sort(function (a, b) {
            return a.index - b.index;
          }), function (x) {
            return x.value;
          }));
        });
      };
      async.filter = doParallel(_filter);
      async.filterSeries = doSeries(_filter);
      // select alias
      async.select = async.filter;
      async.selectSeries = async.filterSeries;

      var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
          return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
          iterator(x.value, function (v) {
            if (!v) {
              results.push(x);
            }
            callback();
          });
        }, function (err) {
          callback(_map(results.sort(function (a, b) {
            return a.index - b.index;
          }), function (x) {
            return x.value;
          }));
        });
      };
      async.reject = doParallel(_reject);
      async.rejectSeries = doSeries(_reject);

      var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
          iterator(x, function (result) {
            if (result) {
              main_callback(x);
              main_callback = function () {};
            }
            else {
              callback();
            }
          });
        }, function (err) {
          main_callback();
        });
      };
      async.detect = doParallel(_detect);
      async.detectSeries = doSeries(_detect);

      async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
          iterator(x, function (v) {
            if (v) {
              main_callback(true);
              main_callback = function () {};
            }
            callback();
          });
        }, function (err) {
          main_callback(false);
        });
      };
      // any alias
      async.any = async.some;

      async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
          iterator(x, function (v) {
            if (!v) {
              main_callback(false);
              main_callback = function () {};
            }
            callback();
          });
        }, function (err) {
          main_callback(true);
        });
      };
      // all alias
      async.all = async.every;

      async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
          iterator(x, function (err, criteria) {
            if (err) {
              callback(err);
            }
            else {
              callback(null, {value: x, criteria: criteria});
            }
          });
        }, function (err, results) {
          if (err) {
            return callback(err);
          }
          else {
            var fn = function (left, right) {
              var a = left.criteria, b = right.criteria;
              return a < b ? -1 : a > b ? 1 : 0;
            };
            callback(null, _map(results.sort(fn), function (x) {
              return x.value;
            }));
          }
        });
      };

      async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
          return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
          listeners.unshift(fn);
        };
        var removeListener = function (fn) {
          for (var i = 0; i < listeners.length; i += 1) {
            if (listeners[i] === fn) {
              listeners.splice(i, 1);
              return;
            }
          }
        };
        var taskComplete = function () {
          _each(listeners.slice(0), function (fn) {
            fn();
          });
        };

        addListener(function () {
          if (_keys(results).length === keys.length) {
            callback(null, results);
            callback = function () {};
          }
        });

        _each(keys, function (k) {
          var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
          var taskCallback = function (err) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (args.length <= 1) {
              args = args[0];
            }
            if (err) {
              var safeResults = {};
              _each(_keys(results), function(rkey) {
                safeResults[rkey] = results[rkey];
              });
              safeResults[k] = args;
              callback(err, safeResults);
              // stop subsequent errors hitting callback multiple times
              callback = function () {};
            }
            else {
              results[k] = args;
              async.setImmediate(taskComplete);
            }
          };
          var requires = task.slice(0, Math.abs(task.length - 1)) || [];
          var ready = function () {
            return _reduce(requires, function (a, x) {
                return (a && results.hasOwnProperty(x));
              }, true) && !results.hasOwnProperty(k);
          };
          if (ready()) {
            task[task.length - 1](taskCallback, results);
          }
          else {
            var listener = function () {
              if (ready()) {
                removeListener(listener);
                task[task.length - 1](taskCallback, results);
              }
            };
            addListener(listener);
          }
        });
      };

      async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
          return callback();
        }
        var wrapIterator = function (iterator) {
          return function (err) {
            if (err) {
              callback.apply(null, arguments);
              callback = function () {};
            }
            else {
              var args = Array.prototype.slice.call(arguments, 1);
              var next = iterator.next();
              if (next) {
                args.push(wrapIterator(next));
              }
              else {
                args.push(callback);
              }
              async.setImmediate(function () {
                iterator.apply(null, args);
              });
            }
          };
        };
        wrapIterator(async.iterator(tasks))();
      };

      var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
          eachfn.map(tasks, function (fn, callback) {
            if (fn) {
              fn(function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                  args = args[0];
                }
                callback.call(null, err, args);
              });
            }
          }, callback);
        }
        else {
          var results = {};
          eachfn.each(_keys(tasks), function (k, callback) {
            tasks[k](function (err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              results[k] = args;
              callback(err);
            });
          }, function (err) {
            callback(err, results);
          });
        }
      };

      async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
      };

      async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
      };

      async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
          async.mapSeries(tasks, function (fn, callback) {
            if (fn) {
              fn(function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                  args = args[0];
                }
                callback.call(null, err, args);
              });
            }
          }, callback);
        }
        else {
          var results = {};
          async.eachSeries(_keys(tasks), function (k, callback) {
            tasks[k](function (err) {
              var args = Array.prototype.slice.call(arguments, 1);
              if (args.length <= 1) {
                args = args[0];
              }
              results[k] = args;
              callback(err);
            });
          }, function (err) {
            callback(err, results);
          });
        }
      };

      async.iterator = function (tasks) {
        var makeCallback = function (index) {
          var fn = function () {
            if (tasks.length) {
              tasks[index].apply(null, arguments);
            }
            return fn.next();
          };
          fn.next = function () {
            return (index < tasks.length - 1) ? makeCallback(index + 1): null;
          };
          return fn;
        };
        return makeCallback(0);
      };

      async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
          return fn.apply(
            null, args.concat(Array.prototype.slice.call(arguments))
          );
        };
      };

      var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
          fn(x, function (err, y) {
            r = r.concat(y || []);
            cb(err);
          });
        }, function (err) {
          callback(err, r);
        });
      };
      async.concat = doParallel(_concat);
      async.concatSeries = doSeries(_concat);

      async.whilst = function (test, iterator, callback) {
        if (test()) {
          iterator(function (err) {
            if (err) {
              return callback(err);
            }
            async.whilst(test, iterator, callback);
          });
        }
        else {
          callback();
        }
      };

      async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
          if (err) {
            return callback(err);
          }
          if (test()) {
            async.doWhilst(iterator, test, callback);
          }
          else {
            callback();
          }
        });
      };

      async.until = function (test, iterator, callback) {
        if (!test()) {
          iterator(function (err) {
            if (err) {
              return callback(err);
            }
            async.until(test, iterator, callback);
          });
        }
        else {
          callback();
        }
      };

      async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
          if (err) {
            return callback(err);
          }
          if (!test()) {
            async.doUntil(iterator, test, callback);
          }
          else {
            callback();
          }
        });
      };

      async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
          concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
            data = [data];
          }
          _each(data, function(task) {
            var item = {
              data: task,
              callback: typeof callback === 'function' ? callback : null
            };

            if (pos) {
              q.tasks.unshift(item);
            } else {
              q.tasks.push(item);
            }

            if (q.saturated && q.tasks.length === concurrency) {
              q.saturated();
            }
            async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
          tasks: [],
          concurrency: concurrency,
          saturated: null,
          empty: null,
          drain: null,
          push: function (data, callback) {
            _insert(q, data, false, callback);
          },
          unshift: function (data, callback) {
            _insert(q, data, true, callback);
          },
          process: function () {
            if (workers < q.concurrency && q.tasks.length) {
              var task = q.tasks.shift();
              if (q.empty && q.tasks.length === 0) {
                q.empty();
              }
              workers += 1;
              var next = function () {
                workers -= 1;
                if (task.callback) {
                  task.callback.apply(task, arguments);
                }
                if (q.drain && q.tasks.length + workers === 0) {
                  q.drain();
                }
                q.process();
              };
              var cb = only_once(next);
              worker(task.data, cb);
            }
          },
          length: function () {
            return q.tasks.length;
          },
          running: function () {
            return workers;
          }
        };
        return q;
      };

      async.cargo = function (worker, payload) {
        var working     = false,
          tasks       = [];

        var cargo = {
          tasks: tasks,
          payload: payload,
          saturated: null,
          empty: null,
          drain: null,
          push: function (data, callback) {
            if(data.constructor !== Array) {
              data = [data];
            }
            _each(data, function(task) {
              tasks.push({
                data: task,
                callback: typeof callback === 'function' ? callback : null
              });
              if (cargo.saturated && tasks.length === payload) {
                cargo.saturated();
              }
            });
            async.setImmediate(cargo.process);
          },
          process: function process() {
            if (working) return;
            if (tasks.length === 0) {
              if(cargo.drain) cargo.drain();
              return;
            }

            var ts = typeof payload === 'number'
              ? tasks.splice(0, payload)
              : tasks.splice(0);

            var ds = _map(ts, function (task) {
              return task.data;
            });

            if(cargo.empty) cargo.empty();
            working = true;
            worker(ds, function () {
              working = false;

              var args = arguments;
              _each(ts, function (data) {
                if (data.callback) {
                  data.callback.apply(null, args);
                }
              });

              process();
            });
          },
          length: function () {
            return tasks.length;
          },
          running: function () {
            return working;
          }
        };
        return cargo;
      };

      var _console_fn = function (name) {
        return function (fn) {
          var args = Array.prototype.slice.call(arguments, 1);
          fn.apply(null, args.concat([function (err) {
            var args = Array.prototype.slice.call(arguments, 1);
            if (typeof console !== 'undefined') {
              if (err) {
                if (console.error) {
                  console.error(err);
                }
              }
              else if (console[name]) {
                _each(args, function (x) {
                  console[name](x);
                });
              }
            }
          }]));
        };
      };
      async.log = _console_fn('log');
      async.dir = _console_fn('dir');
      /*async.info = _console_fn('info');
       async.warn = _console_fn('warn');
       async.error = _console_fn('error');*/

      async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
          };
        var memoized = function () {
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          var key = hasher.apply(null, args);
          if (key in memo) {
            callback.apply(null, memo[key]);
          }
          else if (key in queues) {
            queues[key].push(callback);
          }
          else {
            queues[key] = [callback];
            fn.apply(null, args.concat([function () {
              memo[key] = arguments;
              var q = queues[key];
              delete queues[key];
              for (var i = 0, l = q.length; i < l; i++) {
                q[i].apply(null, arguments);
              }
            }]));
          }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
      };

      async.unmemoize = function (fn) {
        return function () {
          return (fn.unmemoized || fn).apply(null, arguments);
        };
      };

      async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
          counter.push(i);
        }
        return async.map(counter, iterator, callback);
      };

      async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
          counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
      };

      async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          async.reduce(fns, args, function (newargs, fn, cb) {
              fn.apply(that, newargs.concat([function () {
                var err = arguments[0];
                var nextargs = Array.prototype.slice.call(arguments, 1);
                cb(err, nextargs);
              }]))
            },
            function (err, results) {
              callback.apply(that, [err].concat(results));
            });
        };
      };

      var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var callback = args.pop();
          return eachfn(fns, function (fn, cb) {
              fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
          var args = Array.prototype.slice.call(arguments, 2);
          return go.apply(this, args);
        }
        else {
          return go;
        }
      };
      async.applyEach = doParallel(_applyEach);
      async.applyEachSeries = doSeries(_applyEach);

      async.forever = function (fn, callback) {
        function next(err) {
          if (err) {
            if (callback) {
              return callback(err);
            }
            throw err;
          }
          fn(next);
        }
        next();
      };

      // AMD / RequireJS
      if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
          return async;
        });
      }
      // Node.js
      else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
      }
      // included directly via <script> tag
      else {
        root.async = async;
      }

    }());

  }).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser
  var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

  var cachedSetTimeout;
  var cachedClearTimeout;

  function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
  }
  (function () {
    try {
      if (typeof setTimeout === 'function') {
        cachedSetTimeout = setTimeout;
      } else {
        cachedSetTimeout = defaultSetTimout;
      }
    } catch (e) {
      cachedSetTimeout = defaultSetTimout;
    }
    try {
      if (typeof clearTimeout === 'function') {
        cachedClearTimeout = clearTimeout;
      } else {
        cachedClearTimeout = defaultClearTimeout;
      }
    } catch (e) {
      cachedClearTimeout = defaultClearTimeout;
    }
  } ())
  function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
      //normal enviroments in sane situations
      return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
      cachedSetTimeout = setTimeout;
      return setTimeout(fun, 0);
    }
    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedSetTimeout(fun, 0);
    } catch(e){
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
        return cachedSetTimeout.call(null, fun, 0);
      } catch(e){
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
        return cachedSetTimeout.call(this, fun, 0);
      }
    }


  }
  function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
      //normal enviroments in sane situations
      return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
      cachedClearTimeout = clearTimeout;
      return clearTimeout(marker);
    }
    try {
      // when when somebody has screwed with setTimeout but no I.E. maddness
      return cachedClearTimeout(marker);
    } catch (e){
      try {
        // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
        return cachedClearTimeout.call(null, marker);
      } catch (e){
        // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
        // Some versions of I.E. have different rules for clearTimeout vs setTimeout
        return cachedClearTimeout.call(this, marker);
      }
    }



  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
    if (!draining || !currentQueue) {
      return;
    }
    draining = false;
    if (currentQueue.length) {
      queue = currentQueue.concat(queue);
    } else {
      queueIndex = -1;
    }
    if (queue.length) {
      drainQueue();
    }
  }

  function drainQueue() {
    if (draining) {
      return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
      currentQueue = queue;
      queue = [];
      while (++queueIndex < len) {
        if (currentQueue) {
          currentQueue[queueIndex].run();
        }
      }
      queueIndex = -1;
      len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
  }

  process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
      runTimeout(drainQueue);
    }
  };

// v8 likes predictible objects
  function Item(fun, array) {
    this.fun = fun;
    this.array = array;
  }
  Item.prototype.run = function () {
    this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  process.versions = {};

  function noop() {}

  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;
  process.prependListener = noop;
  process.prependOnceListener = noop;

  process.listeners = function (name) { return [] }

  process.binding = function (name) {
    throw new Error('process.binding is not supported');
  };

  process.cwd = function () { return '/' };
  process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
  };
  process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
//! moment.js
//! version : 2.14.1
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

  ;(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
      typeof define === 'function' && define.amd ? define(factory) :
        global.moment = factory()
  }(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
      return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
      hookCallback = callback;
    }

    function isArray(input) {
      return input instanceof Array || Object.prototype.toString.call(input) === '[object Array]';
    }

    function isObject(input) {
      return Object.prototype.toString.call(input) === '[object Object]';
    }

    function isObjectEmpty(obj) {
      var k;
      for (k in obj) {
        // even if its not own property I'd still call it non-empty
        return false;
      }
      return true;
    }

    function isDate(input) {
      return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
      var res = [], i;
      for (i = 0; i < arr.length; ++i) {
        res.push(fn(arr[i], i));
      }
      return res;
    }

    function hasOwnProp(a, b) {
      return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
      for (var i in b) {
        if (hasOwnProp(b, i)) {
          a[i] = b[i];
        }
      }

      if (hasOwnProp(b, 'toString')) {
        a.toString = b.toString;
      }

      if (hasOwnProp(b, 'valueOf')) {
        a.valueOf = b.valueOf;
      }

      return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
      return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
      // We need to deep clone this object.
      return {
        empty           : false,
        unusedTokens    : [],
        unusedInput     : [],
        overflow        : -2,
        charsLeftOver   : 0,
        nullInput       : false,
        invalidMonth    : null,
        invalidFormat   : false,
        userInvalidated : false,
        iso             : false,
        parsedDateParts : [],
        meridiem        : null
      };
    }

    function getParsingFlags(m) {
      if (m._pf == null) {
        m._pf = defaultParsingFlags();
      }
      return m._pf;
    }

    var some;
    if (Array.prototype.some) {
      some = Array.prototype.some;
    } else {
      some = function (fun) {
        var t = Object(this);
        var len = t.length >>> 0;

        for (var i = 0; i < len; i++) {
          if (i in t && fun.call(this, t[i], i, t)) {
            return true;
          }
        }

        return false;
      };
    }

    function valid__isValid(m) {
      if (m._isValid == null) {
        var flags = getParsingFlags(m);
        var parsedParts = some.call(flags.parsedDateParts, function (i) {
          return i != null;
        });
        m._isValid = !isNaN(m._d.getTime()) &&
          flags.overflow < 0 &&
          !flags.empty &&
          !flags.invalidMonth &&
          !flags.invalidWeekday &&
          !flags.nullInput &&
          !flags.invalidFormat &&
          !flags.userInvalidated &&
          (!flags.meridiem || (flags.meridiem && parsedParts));

        if (m._strict) {
          m._isValid = m._isValid &&
            flags.charsLeftOver === 0 &&
            flags.unusedTokens.length === 0 &&
            flags.bigHour === undefined;
        }
      }
      return m._isValid;
    }

    function valid__createInvalid (flags) {
      var m = create_utc__createUTC(NaN);
      if (flags != null) {
        extend(getParsingFlags(m), flags);
      }
      else {
        getParsingFlags(m).userInvalidated = true;
      }

      return m;
    }

    function isUndefined(input) {
      return input === void 0;
    }

    // Plugins that add properties should also add the key here (null value),
    // so we can properly clone ourselves.
    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
      var i, prop, val;

      if (!isUndefined(from._isAMomentObject)) {
        to._isAMomentObject = from._isAMomentObject;
      }
      if (!isUndefined(from._i)) {
        to._i = from._i;
      }
      if (!isUndefined(from._f)) {
        to._f = from._f;
      }
      if (!isUndefined(from._l)) {
        to._l = from._l;
      }
      if (!isUndefined(from._strict)) {
        to._strict = from._strict;
      }
      if (!isUndefined(from._tzm)) {
        to._tzm = from._tzm;
      }
      if (!isUndefined(from._isUTC)) {
        to._isUTC = from._isUTC;
      }
      if (!isUndefined(from._offset)) {
        to._offset = from._offset;
      }
      if (!isUndefined(from._pf)) {
        to._pf = getParsingFlags(from);
      }
      if (!isUndefined(from._locale)) {
        to._locale = from._locale;
      }

      if (momentProperties.length > 0) {
        for (i in momentProperties) {
          prop = momentProperties[i];
          val = from[prop];
          if (!isUndefined(val)) {
            to[prop] = val;
          }
        }
      }

      return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
      copyConfig(this, config);
      this._d = new Date(config._d != null ? config._d.getTime() : NaN);
      // Prevent infinite loop in case updateOffset creates new moment
      // objects.
      if (updateInProgress === false) {
        updateInProgress = true;
        utils_hooks__hooks.updateOffset(this);
        updateInProgress = false;
      }
    }

    function isMoment (obj) {
      return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
      if (number < 0) {
        // -0 -> 0
        return Math.ceil(number) || 0;
      } else {
        return Math.floor(number);
      }
    }

    function toInt(argumentForCoercion) {
      var coercedNumber = +argumentForCoercion,
        value = 0;

      if (coercedNumber !== 0 && isFinite(coercedNumber)) {
        value = absFloor(coercedNumber);
      }

      return value;
    }

    // compare two arrays, return the number of differences
    function compareArrays(array1, array2, dontConvert) {
      var len = Math.min(array1.length, array2.length),
        lengthDiff = Math.abs(array1.length - array2.length),
        diffs = 0,
        i;
      for (i = 0; i < len; i++) {
        if ((dontConvert && array1[i] !== array2[i]) ||
          (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
          diffs++;
        }
      }
      return diffs + lengthDiff;
    }

    function warn(msg) {
      if (utils_hooks__hooks.suppressDeprecationWarnings === false &&
        (typeof console !==  'undefined') && console.warn) {
        console.warn('Deprecation warning: ' + msg);
      }
    }

    function deprecate(msg, fn) {
      var firstTime = true;

      return extend(function () {
        if (utils_hooks__hooks.deprecationHandler != null) {
          utils_hooks__hooks.deprecationHandler(null, msg);
        }
        if (firstTime) {
          warn(msg + '\nArguments: ' + Array.prototype.slice.call(arguments).join(', ') + '\n' + (new Error()).stack);
          firstTime = false;
        }
        return fn.apply(this, arguments);
      }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
      if (utils_hooks__hooks.deprecationHandler != null) {
        utils_hooks__hooks.deprecationHandler(name, msg);
      }
      if (!deprecations[name]) {
        warn(msg);
        deprecations[name] = true;
      }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;
    utils_hooks__hooks.deprecationHandler = null;

    function isFunction(input) {
      return input instanceof Function || Object.prototype.toString.call(input) === '[object Function]';
    }

    function locale_set__set (config) {
      var prop, i;
      for (i in config) {
        prop = config[i];
        if (isFunction(prop)) {
          this[i] = prop;
        } else {
          this['_' + i] = prop;
        }
      }
      this._config = config;
      // Lenient ordinal parsing accepts just a number in addition to
      // number + (possibly) stuff coming from _ordinalParseLenient.
      this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    function mergeConfigs(parentConfig, childConfig) {
      var res = extend({}, parentConfig), prop;
      for (prop in childConfig) {
        if (hasOwnProp(childConfig, prop)) {
          if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
            res[prop] = {};
            extend(res[prop], parentConfig[prop]);
            extend(res[prop], childConfig[prop]);
          } else if (childConfig[prop] != null) {
            res[prop] = childConfig[prop];
          } else {
            delete res[prop];
          }
        }
      }
      for (prop in parentConfig) {
        if (hasOwnProp(parentConfig, prop) &&
          !hasOwnProp(childConfig, prop) &&
          isObject(parentConfig[prop])) {
          // make sure changes to properties don't modify parent config
          res[prop] = extend({}, res[prop]);
        }
      }
      return res;
    }

    function Locale(config) {
      if (config != null) {
        this.set(config);
      }
    }

    var keys;

    if (Object.keys) {
      keys = Object.keys;
    } else {
      keys = function (obj) {
        var i, res = [];
        for (i in obj) {
          if (hasOwnProp(obj, i)) {
            res.push(i);
          }
        }
        return res;
      };
    }

    var defaultCalendar = {
      sameDay : '[Today at] LT',
      nextDay : '[Tomorrow at] LT',
      nextWeek : 'dddd [at] LT',
      lastDay : '[Yesterday at] LT',
      lastWeek : '[Last] dddd [at] LT',
      sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
      var output = this._calendar[key] || this._calendar['sameElse'];
      return isFunction(output) ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
      LTS  : 'h:mm:ss A',
      LT   : 'h:mm A',
      L    : 'MM/DD/YYYY',
      LL   : 'MMMM D, YYYY',
      LLL  : 'MMMM D, YYYY h:mm A',
      LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
      var format = this._longDateFormat[key],
        formatUpper = this._longDateFormat[key.toUpperCase()];

      if (format || !formatUpper) {
        return format;
      }

      this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
        return val.slice(1);
      });

      return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
      return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
      return this._ordinal.replace('%d', number);
    }

    var defaultRelativeTime = {
      future : 'in %s',
      past   : '%s ago',
      s  : 'a few seconds',
      m  : 'a minute',
      mm : '%d minutes',
      h  : 'an hour',
      hh : '%d hours',
      d  : 'a day',
      dd : '%d days',
      M  : 'a month',
      MM : '%d months',
      y  : 'a year',
      yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
      var output = this._relativeTime[string];
      return (isFunction(output)) ?
        output(number, withoutSuffix, string, isFuture) :
        output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
      var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
      return isFunction(format) ? format(output) : format.replace(/%s/i, output);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
      var lowerCase = unit.toLowerCase();
      aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
      return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
      var normalizedInput = {},
        normalizedProp,
        prop;

      for (prop in inputObject) {
        if (hasOwnProp(inputObject, prop)) {
          normalizedProp = normalizeUnits(prop);
          if (normalizedProp) {
            normalizedInput[normalizedProp] = inputObject[prop];
          }
        }
      }

      return normalizedInput;
    }

    var priorities = {};

    function addUnitPriority(unit, priority) {
      priorities[unit] = priority;
    }

    function getPrioritizedUnits(unitsObj) {
      var units = [];
      for (var u in unitsObj) {
        units.push({unit: u, priority: priorities[u]});
      }
      units.sort(function (a, b) {
        return a.priority - b.priority;
      });
      return units;
    }

    function makeGetSet (unit, keepTime) {
      return function (value) {
        if (value != null) {
          get_set__set(this, unit, value);
          utils_hooks__hooks.updateOffset(this, keepTime);
          return this;
        } else {
          return get_set__get(this, unit);
        }
      };
    }

    function get_set__get (mom, unit) {
      return mom.isValid() ?
        mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]() : NaN;
    }

    function get_set__set (mom, unit, value) {
      if (mom.isValid()) {
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
      }
    }

    // MOMENTS

    function stringGet (units) {
      units = normalizeUnits(units);
      if (isFunction(this[units])) {
        return this[units]();
      }
      return this;
    }


    function stringSet (units, value) {
      if (typeof units === 'object') {
        units = normalizeObjectUnits(units);
        var prioritized = getPrioritizedUnits(units);
        for (var i = 0; i < prioritized.length; i++) {
          this[prioritized[i].unit](units[prioritized[i].unit]);
        }
      } else {
        units = normalizeUnits(units);
        if (isFunction(this[units])) {
          return this[units](value);
        }
      }
      return this;
    }

    function zeroFill(number, targetLength, forceSign) {
      var absNumber = '' + Math.abs(number),
        zerosToFill = targetLength - absNumber.length,
        sign = number >= 0;
      return (sign ? (forceSign ? '+' : '') : '-') +
        Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
      var func = callback;
      if (typeof callback === 'string') {
        func = function () {
          return this[callback]();
        };
      }
      if (token) {
        formatTokenFunctions[token] = func;
      }
      if (padded) {
        formatTokenFunctions[padded[0]] = function () {
          return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
        };
      }
      if (ordinal) {
        formatTokenFunctions[ordinal] = function () {
          return this.localeData().ordinal(func.apply(this, arguments), token);
        };
      }
    }

    function removeFormattingTokens(input) {
      if (input.match(/\[[\s\S]/)) {
        return input.replace(/^\[|\]$/g, '');
      }
      return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
      var array = format.match(formattingTokens), i, length;

      for (i = 0, length = array.length; i < length; i++) {
        if (formatTokenFunctions[array[i]]) {
          array[i] = formatTokenFunctions[array[i]];
        } else {
          array[i] = removeFormattingTokens(array[i]);
        }
      }

      return function (mom) {
        var output = '', i;
        for (i = 0; i < length; i++) {
          output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
        }
        return output;
      };
    }

    // format date using native date object
    function formatMoment(m, format) {
      if (!m.isValid()) {
        return m.localeData().invalidDate();
      }

      format = expandFormat(format, m.localeData());
      formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

      return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
      var i = 5;

      function replaceLongDateFormatTokens(input) {
        return locale.longDateFormat(input) || input;
      }

      localFormattingTokens.lastIndex = 0;
      while (i >= 0 && localFormattingTokens.test(format)) {
        format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
        localFormattingTokens.lastIndex = 0;
        i -= 1;
      }

      return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match3to4      = /\d\d\d\d?/;     //     999 - 9999
    var match5to6      = /\d\d\d\d\d\d?/; //   99999 - 999999
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z
    var matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi; // +00 -00 +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    // includes scottish gaelic two word and hyphenated months
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;


    var regexes = {};

    function addRegexToken (token, regex, strictRegex) {
      regexes[token] = isFunction(regex) ? regex : function (isStrict, localeData) {
        return (isStrict && strictRegex) ? strictRegex : regex;
      };
    }

    function getParseRegexForToken (token, config) {
      if (!hasOwnProp(regexes, token)) {
        return new RegExp(unescapeFormat(token));
      }

      return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
      return regexEscape(s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
        return p1 || p2 || p3 || p4;
      }));
    }

    function regexEscape(s) {
      return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
      var i, func = callback;
      if (typeof token === 'string') {
        token = [token];
      }
      if (typeof callback === 'number') {
        func = function (input, array) {
          array[callback] = toInt(input);
        };
      }
      for (i = 0; i < token.length; i++) {
        tokens[token[i]] = func;
      }
    }

    function addWeekParseToken (token, callback) {
      addParseToken(token, function (input, array, config, token) {
        config._w = config._w || {};
        callback(input, config._w, config, token);
      });
    }

    function addTimeToArrayFromToken(token, input, config) {
      if (input != null && hasOwnProp(tokens, token)) {
        tokens[token](input, config._a, config, token);
      }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;
    var WEEK = 7;
    var WEEKDAY = 8;

    var indexOf;

    if (Array.prototype.indexOf) {
      indexOf = Array.prototype.indexOf;
    } else {
      indexOf = function (o) {
        // I know
        var i;
        for (i = 0; i < this.length; ++i) {
          if (this[i] === o) {
            return i;
          }
        }
        return -1;
      };
    }

    function daysInMonth(year, month) {
      return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
      return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
      return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
      return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PRIORITY

    addUnitPriority('month', 8);

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  function (isStrict, locale) {
      return locale.monthsShortRegex(isStrict);
    });
    addRegexToken('MMMM', function (isStrict, locale) {
      return locale.monthsRegex(isStrict);
    });

    addParseToken(['M', 'MM'], function (input, array) {
      array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
      var month = config._locale.monthsParse(input, token, config._strict);
      // if we didn't find a month name, mark the date as invalid.
      if (month != null) {
        array[MONTH] = month;
      } else {
        getParsingFlags(config).invalidMonth = input;
      }
    });

    // LOCALES

    var MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s+)+MMMM?/;
    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m, format) {
      return isArray(this._months) ? this._months[m.month()] :
        this._months[(this._months.isFormat || MONTHS_IN_FORMAT).test(format) ? 'format' : 'standalone'][m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m, format) {
      return isArray(this._monthsShort) ? this._monthsShort[m.month()] :
        this._monthsShort[MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'][m.month()];
    }

    function units_month__handleStrictParse(monthName, format, strict) {
      var i, ii, mom, llc = monthName.toLocaleLowerCase();
      if (!this._monthsParse) {
        // this is not used
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
        for (i = 0; i < 12; ++i) {
          mom = create_utc__createUTC([2000, i]);
          this._shortMonthsParse[i] = this.monthsShort(mom, '').toLocaleLowerCase();
          this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
        }
      }

      if (strict) {
        if (format === 'MMM') {
          ii = indexOf.call(this._shortMonthsParse, llc);
          return ii !== -1 ? ii : null;
        } else {
          ii = indexOf.call(this._longMonthsParse, llc);
          return ii !== -1 ? ii : null;
        }
      } else {
        if (format === 'MMM') {
          ii = indexOf.call(this._shortMonthsParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._longMonthsParse, llc);
          return ii !== -1 ? ii : null;
        } else {
          ii = indexOf.call(this._longMonthsParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._shortMonthsParse, llc);
          return ii !== -1 ? ii : null;
        }
      }
    }

    function localeMonthsParse (monthName, format, strict) {
      var i, mom, regex;

      if (this._monthsParseExact) {
        return units_month__handleStrictParse.call(this, monthName, format, strict);
      }

      if (!this._monthsParse) {
        this._monthsParse = [];
        this._longMonthsParse = [];
        this._shortMonthsParse = [];
      }

      // TODO: add sorting
      // Sorting makes sure if one month (or abbr) is a prefix of another
      // see sorting in computeMonthsParse
      for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = create_utc__createUTC([2000, i]);
        if (strict && !this._longMonthsParse[i]) {
          this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
          this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
        }
        if (!strict && !this._monthsParse[i]) {
          regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
          this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
          return i;
        } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
          return i;
        } else if (!strict && this._monthsParse[i].test(monthName)) {
          return i;
        }
      }
    }

    // MOMENTS

    function setMonth (mom, value) {
      var dayOfMonth;

      if (!mom.isValid()) {
        // No op
        return mom;
      }

      if (typeof value === 'string') {
        if (/^\d+$/.test(value)) {
          value = toInt(value);
        } else {
          value = mom.localeData().monthsParse(value);
          // TODO: Another silent failure?
          if (typeof value !== 'number') {
            return mom;
          }
        }
      }

      dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
      mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
      return mom;
    }

    function getSetMonth (value) {
      if (value != null) {
        setMonth(this, value);
        utils_hooks__hooks.updateOffset(this, true);
        return this;
      } else {
        return get_set__get(this, 'Month');
      }
    }

    function getDaysInMonth () {
      return daysInMonth(this.year(), this.month());
    }

    var defaultMonthsShortRegex = matchWord;
    function monthsShortRegex (isStrict) {
      if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
          computeMonthsParse.call(this);
        }
        if (isStrict) {
          return this._monthsShortStrictRegex;
        } else {
          return this._monthsShortRegex;
        }
      } else {
        if (!hasOwnProp(this, '_monthsShortRegex')) {
          this._monthsShortRegex = defaultMonthsShortRegex;
        }
        return this._monthsShortStrictRegex && isStrict ?
          this._monthsShortStrictRegex : this._monthsShortRegex;
      }
    }

    var defaultMonthsRegex = matchWord;
    function monthsRegex (isStrict) {
      if (this._monthsParseExact) {
        if (!hasOwnProp(this, '_monthsRegex')) {
          computeMonthsParse.call(this);
        }
        if (isStrict) {
          return this._monthsStrictRegex;
        } else {
          return this._monthsRegex;
        }
      } else {
        if (!hasOwnProp(this, '_monthsRegex')) {
          this._monthsRegex = defaultMonthsRegex;
        }
        return this._monthsStrictRegex && isStrict ?
          this._monthsStrictRegex : this._monthsRegex;
      }
    }

    function computeMonthsParse () {
      function cmpLenRev(a, b) {
        return b.length - a.length;
      }

      var shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom;
      for (i = 0; i < 12; i++) {
        // make the regex if we don't have it already
        mom = create_utc__createUTC([2000, i]);
        shortPieces.push(this.monthsShort(mom, ''));
        longPieces.push(this.months(mom, ''));
        mixedPieces.push(this.months(mom, ''));
        mixedPieces.push(this.monthsShort(mom, ''));
      }
      // Sorting makes sure if one month (or abbr) is a prefix of another it
      // will match the longer piece.
      shortPieces.sort(cmpLenRev);
      longPieces.sort(cmpLenRev);
      mixedPieces.sort(cmpLenRev);
      for (i = 0; i < 12; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
      }
      for (i = 0; i < 24; i++) {
        mixedPieces[i] = regexEscape(mixedPieces[i]);
      }

      this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
      this._monthsShortRegex = this._monthsRegex;
      this._monthsStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
      this._monthsShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    addFormatToken('Y', 0, 0, function () {
      var y = this.year();
      return y <= 9999 ? '' + y : '+' + y;
    });

    addFormatToken(0, ['YY', 2], 0, function () {
      return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PRIORITIES

    addUnitPriority('year', 1);

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
      array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
      array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });
    addParseToken('Y', function (input, array) {
      array[YEAR] = parseInt(input, 10);
    });

    // HELPERS

    function daysInYear(year) {
      return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
      return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
      return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', true);

    function getIsLeapYear () {
      return isLeapYear(this.year());
    }

    function createDate (y, m, d, h, M, s, ms) {
      //can't just apply() to create a date:
      //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
      var date = new Date(y, m, d, h, M, s, ms);

      //the date constructor remaps years 0-99 to 1900-1999
      if (y < 100 && y >= 0 && isFinite(date.getFullYear())) {
        date.setFullYear(y);
      }
      return date;
    }

    function createUTCDate (y) {
      var date = new Date(Date.UTC.apply(null, arguments));

      //the Date.UTC function remaps years 0-99 to 1900-1999
      if (y < 100 && y >= 0 && isFinite(date.getUTCFullYear())) {
        date.setUTCFullYear(y);
      }
      return date;
    }

    // start-of-first-week - start-of-year
    function firstWeekOffset(year, dow, doy) {
      var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
        fwd = 7 + dow - doy,
      // first-week day local weekday -- which local weekday is fwd
        fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

      return -fwdlw + fwd - 1;
    }

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
      var localWeekday = (7 + weekday - dow) % 7,
        weekOffset = firstWeekOffset(year, dow, doy),
        dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
        resYear, resDayOfYear;

      if (dayOfYear <= 0) {
        resYear = year - 1;
        resDayOfYear = daysInYear(resYear) + dayOfYear;
      } else if (dayOfYear > daysInYear(year)) {
        resYear = year + 1;
        resDayOfYear = dayOfYear - daysInYear(year);
      } else {
        resYear = year;
        resDayOfYear = dayOfYear;
      }

      return {
        year: resYear,
        dayOfYear: resDayOfYear
      };
    }

    function weekOfYear(mom, dow, doy) {
      var weekOffset = firstWeekOffset(mom.year(), dow, doy),
        week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
        resWeek, resYear;

      if (week < 1) {
        resYear = mom.year() - 1;
        resWeek = week + weeksInYear(resYear, dow, doy);
      } else if (week > weeksInYear(mom.year(), dow, doy)) {
        resWeek = week - weeksInYear(mom.year(), dow, doy);
        resYear = mom.year() + 1;
      } else {
        resYear = mom.year();
        resWeek = week;
      }

      return {
        week: resWeek,
        year: resYear
      };
    }

    function weeksInYear(year, dow, doy) {
      var weekOffset = firstWeekOffset(year, dow, doy),
        weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
      return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
    }

    // FORMATTING

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PRIORITIES

    addUnitPriority('week', 5);
    addUnitPriority('isoWeek', 5);

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
      week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // LOCALES

    function localeWeek (mom) {
      return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
      dow : 0, // Sunday is the first day of the week.
      doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
      return this._week.dow;
    }

    function localeFirstDayOfYear () {
      return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
      var week = this.localeData().week(this);
      return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
      var week = weekOfYear(this, 1, 4).week;
      return input == null ? week : this.add((input - week) * 7, 'd');
    }

    // FORMATTING

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
      return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
      return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
      return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PRIORITY
    addUnitPriority('day', 11);
    addUnitPriority('weekday', 11);
    addUnitPriority('isoWeekday', 11);

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   function (isStrict, locale) {
      return locale.weekdaysMinRegex(isStrict);
    });
    addRegexToken('ddd',   function (isStrict, locale) {
      return locale.weekdaysShortRegex(isStrict);
    });
    addRegexToken('dddd',   function (isStrict, locale) {
      return locale.weekdaysRegex(isStrict);
    });

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
      var weekday = config._locale.weekdaysParse(input, token, config._strict);
      // if we didn't get a weekday name, mark the date as invalid
      if (weekday != null) {
        week.d = weekday;
      } else {
        getParsingFlags(config).invalidWeekday = input;
      }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
      week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
      if (typeof input !== 'string') {
        return input;
      }

      if (!isNaN(input)) {
        return parseInt(input, 10);
      }

      input = locale.weekdaysParse(input);
      if (typeof input === 'number') {
        return input;
      }

      return null;
    }

    function parseIsoWeekday(input, locale) {
      if (typeof input === 'string') {
        return locale.weekdaysParse(input) % 7 || 7;
      }
      return isNaN(input) ? null : input;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m, format) {
      return isArray(this._weekdays) ? this._weekdays[m.day()] :
        this._weekdays[this._weekdays.isFormat.test(format) ? 'format' : 'standalone'][m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
      return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
      return this._weekdaysMin[m.day()];
    }

    function day_of_week__handleStrictParse(weekdayName, format, strict) {
      var i, ii, mom, llc = weekdayName.toLocaleLowerCase();
      if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._minWeekdaysParse = [];

        for (i = 0; i < 7; ++i) {
          mom = create_utc__createUTC([2000, 1]).day(i);
          this._minWeekdaysParse[i] = this.weekdaysMin(mom, '').toLocaleLowerCase();
          this._shortWeekdaysParse[i] = this.weekdaysShort(mom, '').toLocaleLowerCase();
          this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
        }
      }

      if (strict) {
        if (format === 'dddd') {
          ii = indexOf.call(this._weekdaysParse, llc);
          return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
          ii = indexOf.call(this._shortWeekdaysParse, llc);
          return ii !== -1 ? ii : null;
        } else {
          ii = indexOf.call(this._minWeekdaysParse, llc);
          return ii !== -1 ? ii : null;
        }
      } else {
        if (format === 'dddd') {
          ii = indexOf.call(this._weekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._shortWeekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._minWeekdaysParse, llc);
          return ii !== -1 ? ii : null;
        } else if (format === 'ddd') {
          ii = indexOf.call(this._shortWeekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._weekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._minWeekdaysParse, llc);
          return ii !== -1 ? ii : null;
        } else {
          ii = indexOf.call(this._minWeekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._weekdaysParse, llc);
          if (ii !== -1) {
            return ii;
          }
          ii = indexOf.call(this._shortWeekdaysParse, llc);
          return ii !== -1 ? ii : null;
        }
      }
    }

    function localeWeekdaysParse (weekdayName, format, strict) {
      var i, mom, regex;

      if (this._weekdaysParseExact) {
        return day_of_week__handleStrictParse.call(this, weekdayName, format, strict);
      }

      if (!this._weekdaysParse) {
        this._weekdaysParse = [];
        this._minWeekdaysParse = [];
        this._shortWeekdaysParse = [];
        this._fullWeekdaysParse = [];
      }

      for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already

        mom = create_utc__createUTC([2000, 1]).day(i);
        if (strict && !this._fullWeekdaysParse[i]) {
          this._fullWeekdaysParse[i] = new RegExp('^' + this.weekdays(mom, '').replace('.', '\.?') + '$', 'i');
          this._shortWeekdaysParse[i] = new RegExp('^' + this.weekdaysShort(mom, '').replace('.', '\.?') + '$', 'i');
          this._minWeekdaysParse[i] = new RegExp('^' + this.weekdaysMin(mom, '').replace('.', '\.?') + '$', 'i');
        }
        if (!this._weekdaysParse[i]) {
          regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
          this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
        }
        // test the regex
        if (strict && format === 'dddd' && this._fullWeekdaysParse[i].test(weekdayName)) {
          return i;
        } else if (strict && format === 'ddd' && this._shortWeekdaysParse[i].test(weekdayName)) {
          return i;
        } else if (strict && format === 'dd' && this._minWeekdaysParse[i].test(weekdayName)) {
          return i;
        } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
          return i;
        }
      }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
      if (!this.isValid()) {
        return input != null ? this : NaN;
      }
      var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
      if (input != null) {
        input = parseWeekday(input, this.localeData());
        return this.add(input - day, 'd');
      } else {
        return day;
      }
    }

    function getSetLocaleDayOfWeek (input) {
      if (!this.isValid()) {
        return input != null ? this : NaN;
      }
      var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
      return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
      if (!this.isValid()) {
        return input != null ? this : NaN;
      }

      // behaves the same as moment#day except
      // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
      // as a setter, sunday should belong to the previous week.

      if (input != null) {
        var weekday = parseIsoWeekday(input, this.localeData());
        return this.day(this.day() % 7 ? weekday : weekday - 7);
      } else {
        return this.day() || 7;
      }
    }

    var defaultWeekdaysRegex = matchWord;
    function weekdaysRegex (isStrict) {
      if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
          computeWeekdaysParse.call(this);
        }
        if (isStrict) {
          return this._weekdaysStrictRegex;
        } else {
          return this._weekdaysRegex;
        }
      } else {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
          this._weekdaysRegex = defaultWeekdaysRegex;
        }
        return this._weekdaysStrictRegex && isStrict ?
          this._weekdaysStrictRegex : this._weekdaysRegex;
      }
    }

    var defaultWeekdaysShortRegex = matchWord;
    function weekdaysShortRegex (isStrict) {
      if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
          computeWeekdaysParse.call(this);
        }
        if (isStrict) {
          return this._weekdaysShortStrictRegex;
        } else {
          return this._weekdaysShortRegex;
        }
      } else {
        if (!hasOwnProp(this, '_weekdaysShortRegex')) {
          this._weekdaysShortRegex = defaultWeekdaysShortRegex;
        }
        return this._weekdaysShortStrictRegex && isStrict ?
          this._weekdaysShortStrictRegex : this._weekdaysShortRegex;
      }
    }

    var defaultWeekdaysMinRegex = matchWord;
    function weekdaysMinRegex (isStrict) {
      if (this._weekdaysParseExact) {
        if (!hasOwnProp(this, '_weekdaysRegex')) {
          computeWeekdaysParse.call(this);
        }
        if (isStrict) {
          return this._weekdaysMinStrictRegex;
        } else {
          return this._weekdaysMinRegex;
        }
      } else {
        if (!hasOwnProp(this, '_weekdaysMinRegex')) {
          this._weekdaysMinRegex = defaultWeekdaysMinRegex;
        }
        return this._weekdaysMinStrictRegex && isStrict ?
          this._weekdaysMinStrictRegex : this._weekdaysMinRegex;
      }
    }


    function computeWeekdaysParse () {
      function cmpLenRev(a, b) {
        return b.length - a.length;
      }

      var minPieces = [], shortPieces = [], longPieces = [], mixedPieces = [],
        i, mom, minp, shortp, longp;
      for (i = 0; i < 7; i++) {
        // make the regex if we don't have it already
        mom = create_utc__createUTC([2000, 1]).day(i);
        minp = this.weekdaysMin(mom, '');
        shortp = this.weekdaysShort(mom, '');
        longp = this.weekdays(mom, '');
        minPieces.push(minp);
        shortPieces.push(shortp);
        longPieces.push(longp);
        mixedPieces.push(minp);
        mixedPieces.push(shortp);
        mixedPieces.push(longp);
      }
      // Sorting makes sure if one weekday (or abbr) is a prefix of another it
      // will match the longer piece.
      minPieces.sort(cmpLenRev);
      shortPieces.sort(cmpLenRev);
      longPieces.sort(cmpLenRev);
      mixedPieces.sort(cmpLenRev);
      for (i = 0; i < 7; i++) {
        shortPieces[i] = regexEscape(shortPieces[i]);
        longPieces[i] = regexEscape(longPieces[i]);
        mixedPieces[i] = regexEscape(mixedPieces[i]);
      }

      this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
      this._weekdaysShortRegex = this._weekdaysRegex;
      this._weekdaysMinRegex = this._weekdaysRegex;

      this._weekdaysStrictRegex = new RegExp('^(' + longPieces.join('|') + ')', 'i');
      this._weekdaysShortStrictRegex = new RegExp('^(' + shortPieces.join('|') + ')', 'i');
      this._weekdaysMinStrictRegex = new RegExp('^(' + minPieces.join('|') + ')', 'i');
    }

    // FORMATTING

    function hFormat() {
      return this.hours() % 12 || 12;
    }

    function kFormat() {
      return this.hours() || 24;
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, hFormat);
    addFormatToken('k', ['kk', 2], 0, kFormat);

    addFormatToken('hmm', 0, 0, function () {
      return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
    });

    addFormatToken('hmmss', 0, 0, function () {
      return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
    });

    addFormatToken('Hmm', 0, 0, function () {
      return '' + this.hours() + zeroFill(this.minutes(), 2);
    });

    addFormatToken('Hmmss', 0, 0, function () {
      return '' + this.hours() + zeroFill(this.minutes(), 2) +
        zeroFill(this.seconds(), 2);
    });

    function meridiem (token, lowercase) {
      addFormatToken(token, 0, 0, function () {
        return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
      });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PRIORITY
    addUnitPriority('hour', 13);

    // PARSING

    function matchMeridiem (isStrict, locale) {
      return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addRegexToken('hmm', match3to4);
    addRegexToken('hmmss', match5to6);
    addRegexToken('Hmm', match3to4);
    addRegexToken('Hmmss', match5to6);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
      config._isPm = config._locale.isPM(input);
      config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
      array[HOUR] = toInt(input);
      getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmm', function (input, array, config) {
      var pos = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos));
      array[MINUTE] = toInt(input.substr(pos));
      getParsingFlags(config).bigHour = true;
    });
    addParseToken('hmmss', function (input, array, config) {
      var pos1 = input.length - 4;
      var pos2 = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos1));
      array[MINUTE] = toInt(input.substr(pos1, 2));
      array[SECOND] = toInt(input.substr(pos2));
      getParsingFlags(config).bigHour = true;
    });
    addParseToken('Hmm', function (input, array, config) {
      var pos = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos));
      array[MINUTE] = toInt(input.substr(pos));
    });
    addParseToken('Hmmss', function (input, array, config) {
      var pos1 = input.length - 4;
      var pos2 = input.length - 2;
      array[HOUR] = toInt(input.substr(0, pos1));
      array[MINUTE] = toInt(input.substr(pos1, 2));
      array[SECOND] = toInt(input.substr(pos2));
    });

    // LOCALES

    function localeIsPM (input) {
      // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
      // Using charAt should be more compatible.
      return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
      if (hours > 11) {
        return isLower ? 'pm' : 'PM';
      } else {
        return isLower ? 'am' : 'AM';
      }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    var baseConfig = {
      calendar: defaultCalendar,
      longDateFormat: defaultLongDateFormat,
      invalidDate: defaultInvalidDate,
      ordinal: defaultOrdinal,
      ordinalParse: defaultOrdinalParse,
      relativeTime: defaultRelativeTime,

      months: defaultLocaleMonths,
      monthsShort: defaultLocaleMonthsShort,

      week: defaultLocaleWeek,

      weekdays: defaultLocaleWeekdays,
      weekdaysMin: defaultLocaleWeekdaysMin,
      weekdaysShort: defaultLocaleWeekdaysShort,

      meridiemParse: defaultLocaleMeridiemParse
    };

    // internal storage for locale config files
    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
      return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
      var i = 0, j, next, locale, split;

      while (i < names.length) {
        split = normalizeLocale(names[i]).split('-');
        j = split.length;
        next = normalizeLocale(names[i + 1]);
        next = next ? next.split('-') : null;
        while (j > 0) {
          locale = loadLocale(split.slice(0, j).join('-'));
          if (locale) {
            return locale;
          }
          if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
            //the next array item is better than a shallower substring of this one
            break;
          }
          j--;
        }
        i++;
      }
      return null;
    }

    function loadLocale(name) {
      var oldLocale = null;
      // TODO: Find a better way to register and load all the locales in Node
      if (!locales[name] && (typeof module !== 'undefined') &&
        module && module.exports) {
        try {
          oldLocale = globalLocale._abbr;
          require('./locale/' + name);
          // because defineLocale currently also sets the global locale, we
          // want to undo that for lazy loaded locales
          locale_locales__getSetGlobalLocale(oldLocale);
        } catch (e) { }
      }
      return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
      var data;
      if (key) {
        if (isUndefined(values)) {
          data = locale_locales__getLocale(key);
        }
        else {
          data = defineLocale(key, values);
        }

        if (data) {
          // moment.duration._locale = moment._locale = data;
          globalLocale = data;
        }
      }

      return globalLocale._abbr;
    }

    function defineLocale (name, config) {
      if (config !== null) {
        var parentConfig = baseConfig;
        config.abbr = name;
        if (locales[name] != null) {
          deprecateSimple('defineLocaleOverride',
            'use moment.updateLocale(localeName, config) to change ' +
            'an existing locale. moment.defineLocale(localeName, ' +
            'config) should only be used for creating a new locale ' +
            'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.');
          parentConfig = locales[name]._config;
        } else if (config.parentLocale != null) {
          if (locales[config.parentLocale] != null) {
            parentConfig = locales[config.parentLocale]._config;
          } else {
            // treat as if there is no base config
            deprecateSimple('parentLocaleUndefined',
              'specified parentLocale is not defined yet. See http://momentjs.com/guides/#/warnings/parent-locale/');
          }
        }
        locales[name] = new Locale(mergeConfigs(parentConfig, config));

        // backwards compat for now: also set the locale
        locale_locales__getSetGlobalLocale(name);

        return locales[name];
      } else {
        // useful for testing
        delete locales[name];
        return null;
      }
    }

    function updateLocale(name, config) {
      if (config != null) {
        var locale, parentConfig = baseConfig;
        // MERGE
        if (locales[name] != null) {
          parentConfig = locales[name]._config;
        }
        config = mergeConfigs(parentConfig, config);
        locale = new Locale(config);
        locale.parentLocale = locales[name];
        locales[name] = locale;

        // backwards compat for now: also set the locale
        locale_locales__getSetGlobalLocale(name);
      } else {
        // pass null for config to unupdate, useful for tests
        if (locales[name] != null) {
          if (locales[name].parentLocale != null) {
            locales[name] = locales[name].parentLocale;
          } else if (locales[name] != null) {
            delete locales[name];
          }
        }
      }
      return locales[name];
    }

    // returns locale data
    function locale_locales__getLocale (key) {
      var locale;

      if (key && key._locale && key._locale._abbr) {
        key = key._locale._abbr;
      }

      if (!key) {
        return globalLocale;
      }

      if (!isArray(key)) {
        //short-circuit everything else
        locale = loadLocale(key);
        if (locale) {
          return locale;
        }
        key = [key];
      }

      return chooseLocale(key);
    }

    function locale_locales__listLocales() {
      return keys(locales);
    }

    function checkOverflow (m) {
      var overflow;
      var a = m._a;

      if (a && getParsingFlags(m).overflow === -2) {
        overflow =
          a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
            a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
              a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                  a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                    a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                      -1;

        if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
          overflow = DATE;
        }
        if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
          overflow = WEEK;
        }
        if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
          overflow = WEEKDAY;
        }

        getParsingFlags(m).overflow = overflow;
      }

      return m;
    }

    // iso 8601 regex
    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
    var extendedIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;
    var basicIsoRegex = /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?/;

    var tzRegex = /Z|[+-]\d\d(?::?\d\d)?/;

    var isoDates = [
      ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
      ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
      ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
      ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
      ['YYYY-DDD', /\d{4}-\d{3}/],
      ['YYYY-MM', /\d{4}-\d\d/, false],
      ['YYYYYYMMDD', /[+-]\d{10}/],
      ['YYYYMMDD', /\d{8}/],
      // YYYYMM is NOT allowed by the standard
      ['GGGG[W]WWE', /\d{4}W\d{3}/],
      ['GGGG[W]WW', /\d{4}W\d{2}/, false],
      ['YYYYDDD', /\d{7}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
      ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
      ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
      ['HH:mm:ss', /\d\d:\d\d:\d\d/],
      ['HH:mm', /\d\d:\d\d/],
      ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
      ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
      ['HHmmss', /\d\d\d\d\d\d/],
      ['HHmm', /\d\d\d\d/],
      ['HH', /\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
      var i, l,
        string = config._i,
        match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
        allowTime, dateFormat, timeFormat, tzFormat;

      if (match) {
        getParsingFlags(config).iso = true;

        for (i = 0, l = isoDates.length; i < l; i++) {
          if (isoDates[i][1].exec(match[1])) {
            dateFormat = isoDates[i][0];
            allowTime = isoDates[i][2] !== false;
            break;
          }
        }
        if (dateFormat == null) {
          config._isValid = false;
          return;
        }
        if (match[3]) {
          for (i = 0, l = isoTimes.length; i < l; i++) {
            if (isoTimes[i][1].exec(match[3])) {
              // match[2] should be 'T' or space
              timeFormat = (match[2] || ' ') + isoTimes[i][0];
              break;
            }
          }
          if (timeFormat == null) {
            config._isValid = false;
            return;
          }
        }
        if (!allowTime && timeFormat != null) {
          config._isValid = false;
          return;
        }
        if (match[4]) {
          if (tzRegex.exec(match[4])) {
            tzFormat = 'Z';
          } else {
            config._isValid = false;
            return;
          }
        }
        config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
        configFromStringAndFormat(config);
      } else {
        config._isValid = false;
      }
    }

    // date from iso format or fallback
    function configFromString(config) {
      var matched = aspNetJsonRegex.exec(config._i);

      if (matched !== null) {
        config._d = new Date(+matched[1]);
        return;
      }

      configFromISO(config);
      if (config._isValid === false) {
        delete config._isValid;
        utils_hooks__hooks.createFromInputFallback(config);
      }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
      'moment construction falls back to js Date. This is ' +
      'discouraged and will be removed in upcoming major ' +
      'release. Please refer to ' +
      'http://momentjs.com/guides/#/warnings/js-date/ for more info.',
      function (config) {
        config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
      }
    );

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
      if (a != null) {
        return a;
      }
      if (b != null) {
        return b;
      }
      return c;
    }

    function currentDateArray(config) {
      // hooks is actually the exported moment object
      var nowValue = new Date(utils_hooks__hooks.now());
      if (config._useUTC) {
        return [nowValue.getUTCFullYear(), nowValue.getUTCMonth(), nowValue.getUTCDate()];
      }
      return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
      var i, date, input = [], currentDate, yearToUse;

      if (config._d) {
        return;
      }

      currentDate = currentDateArray(config);

      //compute day of the year from weeks and weekdays
      if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
        dayOfYearFromWeekInfo(config);
      }

      //if the day of the year is set, figure out what it is
      if (config._dayOfYear) {
        yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

        if (config._dayOfYear > daysInYear(yearToUse)) {
          getParsingFlags(config)._overflowDayOfYear = true;
        }

        date = createUTCDate(yearToUse, 0, config._dayOfYear);
        config._a[MONTH] = date.getUTCMonth();
        config._a[DATE] = date.getUTCDate();
      }

      // Default to current date.
      // * if no year, month, day of month are given, default to today
      // * if day of month is given, default month and year
      // * if month is given, default only year
      // * if year is given, don't default anything
      for (i = 0; i < 3 && config._a[i] == null; ++i) {
        config._a[i] = input[i] = currentDate[i];
      }

      // Zero out whatever was not defaulted, including time
      for (; i < 7; i++) {
        config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
      }

      // Check for 24:00:00.000
      if (config._a[HOUR] === 24 &&
        config._a[MINUTE] === 0 &&
        config._a[SECOND] === 0 &&
        config._a[MILLISECOND] === 0) {
        config._nextDay = true;
        config._a[HOUR] = 0;
      }

      config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
      // Apply timezone offset from input. The actual utcOffset can be changed
      // with parseZone.
      if (config._tzm != null) {
        config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
      }

      if (config._nextDay) {
        config._a[HOUR] = 24;
      }
    }

    function dayOfYearFromWeekInfo(config) {
      var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow;

      w = config._w;
      if (w.GG != null || w.W != null || w.E != null) {
        dow = 1;
        doy = 4;

        // TODO: We need to take the current isoWeekYear, but that depends on
        // how we interpret now (local, utc, fixed offset). So create
        // a now version of current config (take local/utc/offset flags, and
        // create now).
        weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
        week = defaults(w.W, 1);
        weekday = defaults(w.E, 1);
        if (weekday < 1 || weekday > 7) {
          weekdayOverflow = true;
        }
      } else {
        dow = config._locale._week.dow;
        doy = config._locale._week.doy;

        weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
        week = defaults(w.w, 1);

        if (w.d != null) {
          // weekday -- low day numbers are considered next week
          weekday = w.d;
          if (weekday < 0 || weekday > 6) {
            weekdayOverflow = true;
          }
        } else if (w.e != null) {
          // local weekday -- counting starts from begining of week
          weekday = w.e + dow;
          if (w.e < 0 || w.e > 6) {
            weekdayOverflow = true;
          }
        } else {
          // default to begining of week
          weekday = dow;
        }
      }
      if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
        getParsingFlags(config)._overflowWeeks = true;
      } else if (weekdayOverflow != null) {
        getParsingFlags(config)._overflowWeekday = true;
      } else {
        temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
      }
    }

    // constant that refers to the ISO standard
    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
      // TODO: Move this to another part of the creation flow to prevent circular deps
      if (config._f === utils_hooks__hooks.ISO_8601) {
        configFromISO(config);
        return;
      }

      config._a = [];
      getParsingFlags(config).empty = true;

      // This array is used to make a Date, either with `new Date` or `Date.UTC`
      var string = '' + config._i,
        i, parsedInput, tokens, token, skipped,
        stringLength = string.length,
        totalParsedInputLength = 0;

      tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

      for (i = 0; i < tokens.length; i++) {
        token = tokens[i];
        parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
        // console.log('token', token, 'parsedInput', parsedInput,
        //         'regex', getParseRegexForToken(token, config));
        if (parsedInput) {
          skipped = string.substr(0, string.indexOf(parsedInput));
          if (skipped.length > 0) {
            getParsingFlags(config).unusedInput.push(skipped);
          }
          string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
          totalParsedInputLength += parsedInput.length;
        }
        // don't parse if it's not a known token
        if (formatTokenFunctions[token]) {
          if (parsedInput) {
            getParsingFlags(config).empty = false;
          }
          else {
            getParsingFlags(config).unusedTokens.push(token);
          }
          addTimeToArrayFromToken(token, parsedInput, config);
        }
        else if (config._strict && !parsedInput) {
          getParsingFlags(config).unusedTokens.push(token);
        }
      }

      // add remaining unparsed input length to the string
      getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
      if (string.length > 0) {
        getParsingFlags(config).unusedInput.push(string);
      }

      // clear _12h flag if hour is <= 12
      if (config._a[HOUR] <= 12 &&
        getParsingFlags(config).bigHour === true &&
        config._a[HOUR] > 0) {
        getParsingFlags(config).bigHour = undefined;
      }

      getParsingFlags(config).parsedDateParts = config._a.slice(0);
      getParsingFlags(config).meridiem = config._meridiem;
      // handle meridiem
      config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

      configFromArray(config);
      checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
      var isPm;

      if (meridiem == null) {
        // nothing to do
        return hour;
      }
      if (locale.meridiemHour != null) {
        return locale.meridiemHour(hour, meridiem);
      } else if (locale.isPM != null) {
        // Fallback
        isPm = locale.isPM(meridiem);
        if (isPm && hour < 12) {
          hour += 12;
        }
        if (!isPm && hour === 12) {
          hour = 0;
        }
        return hour;
      } else {
        // this is not supposed to happen
        return hour;
      }
    }

    // date from string and array of format strings
    function configFromStringAndArray(config) {
      var tempConfig,
        bestMoment,

        scoreToBeat,
        i,
        currentScore;

      if (config._f.length === 0) {
        getParsingFlags(config).invalidFormat = true;
        config._d = new Date(NaN);
        return;
      }

      for (i = 0; i < config._f.length; i++) {
        currentScore = 0;
        tempConfig = copyConfig({}, config);
        if (config._useUTC != null) {
          tempConfig._useUTC = config._useUTC;
        }
        tempConfig._f = config._f[i];
        configFromStringAndFormat(tempConfig);

        if (!valid__isValid(tempConfig)) {
          continue;
        }

        // if there is any input that was not parsed add a penalty for that format
        currentScore += getParsingFlags(tempConfig).charsLeftOver;

        //or tokens
        currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

        getParsingFlags(tempConfig).score = currentScore;

        if (scoreToBeat == null || currentScore < scoreToBeat) {
          scoreToBeat = currentScore;
          bestMoment = tempConfig;
        }
      }

      extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
      if (config._d) {
        return;
      }

      var i = normalizeObjectUnits(config._i);
      config._a = map([i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond], function (obj) {
        return obj && parseInt(obj, 10);
      });

      configFromArray(config);
    }

    function createFromConfig (config) {
      var res = new Moment(checkOverflow(prepareConfig(config)));
      if (res._nextDay) {
        // Adding is smart enough around DST
        res.add(1, 'd');
        res._nextDay = undefined;
      }

      return res;
    }

    function prepareConfig (config) {
      var input = config._i,
        format = config._f;

      config._locale = config._locale || locale_locales__getLocale(config._l);

      if (input === null || (format === undefined && input === '')) {
        return valid__createInvalid({nullInput: true});
      }

      if (typeof input === 'string') {
        config._i = input = config._locale.preparse(input);
      }

      if (isMoment(input)) {
        return new Moment(checkOverflow(input));
      } else if (isArray(format)) {
        configFromStringAndArray(config);
      } else if (isDate(input)) {
        config._d = input;
      } else if (format) {
        configFromStringAndFormat(config);
      }  else {
        configFromInput(config);
      }

      if (!valid__isValid(config)) {
        config._d = null;
      }

      return config;
    }

    function configFromInput(config) {
      var input = config._i;
      if (input === undefined) {
        config._d = new Date(utils_hooks__hooks.now());
      } else if (isDate(input)) {
        config._d = new Date(input.valueOf());
      } else if (typeof input === 'string') {
        configFromString(config);
      } else if (isArray(input)) {
        config._a = map(input.slice(0), function (obj) {
          return parseInt(obj, 10);
        });
        configFromArray(config);
      } else if (typeof(input) === 'object') {
        configFromObject(config);
      } else if (typeof(input) === 'number') {
        // from milliseconds
        config._d = new Date(input);
      } else {
        utils_hooks__hooks.createFromInputFallback(config);
      }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
      var c = {};

      if (typeof(locale) === 'boolean') {
        strict = locale;
        locale = undefined;
      }

      if ((isObject(input) && isObjectEmpty(input)) ||
        (isArray(input) && input.length === 0)) {
        input = undefined;
      }
      // object construction must be done this way.
      // https://github.com/moment/moment/issues/1423
      c._isAMomentObject = true;
      c._useUTC = c._isUTC = isUTC;
      c._l = locale;
      c._i = input;
      c._f = format;
      c._strict = strict;

      return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
      return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
      'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
      function () {
        var other = local__createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
          return other < this ? this : other;
        } else {
          return valid__createInvalid();
        }
      }
    );

    var prototypeMax = deprecate(
      'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
      function () {
        var other = local__createLocal.apply(null, arguments);
        if (this.isValid() && other.isValid()) {
          return other > this ? this : other;
        } else {
          return valid__createInvalid();
        }
      }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
      var res, i;
      if (moments.length === 1 && isArray(moments[0])) {
        moments = moments[0];
      }
      if (!moments.length) {
        return local__createLocal();
      }
      res = moments[0];
      for (i = 1; i < moments.length; ++i) {
        if (!moments[i].isValid() || moments[i][fn](res)) {
          res = moments[i];
        }
      }
      return res;
    }

    // TODO: Use [].sort instead?
    function min () {
      var args = [].slice.call(arguments, 0);

      return pickBy('isBefore', args);
    }

    function max () {
      var args = [].slice.call(arguments, 0);

      return pickBy('isAfter', args);
    }

    var now = function () {
      return Date.now ? Date.now() : +(new Date());
    };

    function Duration (duration) {
      var normalizedInput = normalizeObjectUnits(duration),
        years = normalizedInput.year || 0,
        quarters = normalizedInput.quarter || 0,
        months = normalizedInput.month || 0,
        weeks = normalizedInput.week || 0,
        days = normalizedInput.day || 0,
        hours = normalizedInput.hour || 0,
        minutes = normalizedInput.minute || 0,
        seconds = normalizedInput.second || 0,
        milliseconds = normalizedInput.millisecond || 0;

      // representation for dateAddRemove
      this._milliseconds = +milliseconds +
        seconds * 1e3 + // 1000
        minutes * 6e4 + // 1000 * 60
        hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
      // Because of dateAddRemove treats 24 hours as different from a
      // day when working around DST, we need to store them separately
      this._days = +days +
        weeks * 7;
      // It is impossible translate months into days without knowing
      // which months you are are talking about, so we have to store
      // it separately.
      this._months = +months +
        quarters * 3 +
        years * 12;

      this._data = {};

      this._locale = locale_locales__getLocale();

      this._bubble();
    }

    function isDuration (obj) {
      return obj instanceof Duration;
    }

    // FORMATTING

    function offset (token, separator) {
      addFormatToken(token, 0, 0, function () {
        var offset = this.utcOffset();
        var sign = '+';
        if (offset < 0) {
          offset = -offset;
          sign = '-';
        }
        return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
      });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchShortOffset);
    addRegexToken('ZZ', matchShortOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
      config._useUTC = true;
      config._tzm = offsetFromString(matchShortOffset, input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(matcher, string) {
      var matches = ((string || '').match(matcher) || []);
      var chunk   = matches[matches.length - 1] || [];
      var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
      var minutes = +(parts[1] * 60) + toInt(parts[2]);

      return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
      var res, diff;
      if (model._isUTC) {
        res = model.clone();
        diff = (isMoment(input) || isDate(input) ? input.valueOf() : local__createLocal(input).valueOf()) - res.valueOf();
        // Use low-level api, because this fn is low-level api.
        res._d.setTime(res._d.valueOf() + diff);
        utils_hooks__hooks.updateOffset(res, false);
        return res;
      } else {
        return local__createLocal(input).local();
      }
    }

    function getDateOffset (m) {
      // On Firefox.24 Date#getTimezoneOffset returns a floating point.
      // https://github.com/moment/moment/pull/1871
      return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
      var offset = this._offset || 0,
        localAdjust;
      if (!this.isValid()) {
        return input != null ? this : NaN;
      }
      if (input != null) {
        if (typeof input === 'string') {
          input = offsetFromString(matchShortOffset, input);
        } else if (Math.abs(input) < 16) {
          input = input * 60;
        }
        if (!this._isUTC && keepLocalTime) {
          localAdjust = getDateOffset(this);
        }
        this._offset = input;
        this._isUTC = true;
        if (localAdjust != null) {
          this.add(localAdjust, 'm');
        }
        if (offset !== input) {
          if (!keepLocalTime || this._changeInProgress) {
            add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
          } else if (!this._changeInProgress) {
            this._changeInProgress = true;
            utils_hooks__hooks.updateOffset(this, true);
            this._changeInProgress = null;
          }
        }
        return this;
      } else {
        return this._isUTC ? offset : getDateOffset(this);
      }
    }

    function getSetZone (input, keepLocalTime) {
      if (input != null) {
        if (typeof input !== 'string') {
          input = -input;
        }

        this.utcOffset(input, keepLocalTime);

        return this;
      } else {
        return -this.utcOffset();
      }
    }

    function setOffsetToUTC (keepLocalTime) {
      return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
      if (this._isUTC) {
        this.utcOffset(0, keepLocalTime);
        this._isUTC = false;

        if (keepLocalTime) {
          this.subtract(getDateOffset(this), 'm');
        }
      }
      return this;
    }

    function setOffsetToParsedOffset () {
      if (this._tzm) {
        this.utcOffset(this._tzm);
      } else if (typeof this._i === 'string') {
        this.utcOffset(offsetFromString(matchOffset, this._i));
      }
      return this;
    }

    function hasAlignedHourOffset (input) {
      if (!this.isValid()) {
        return false;
      }
      input = input ? local__createLocal(input).utcOffset() : 0;

      return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
      return (
        this.utcOffset() > this.clone().month(0).utcOffset() ||
        this.utcOffset() > this.clone().month(5).utcOffset()
      );
    }

    function isDaylightSavingTimeShifted () {
      if (!isUndefined(this._isDSTShifted)) {
        return this._isDSTShifted;
      }

      var c = {};

      copyConfig(c, this);
      c = prepareConfig(c);

      if (c._a) {
        var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
        this._isDSTShifted = this.isValid() &&
          compareArrays(c._a, other.toArray()) > 0;
      } else {
        this._isDSTShifted = false;
      }

      return this._isDSTShifted;
    }

    function isLocal () {
      return this.isValid() ? !this._isUTC : false;
    }

    function isUtcOffset () {
      return this.isValid() ? this._isUTC : false;
    }

    function isUtc () {
      return this.isValid() ? this._isUTC && this._offset === 0 : false;
    }

    // ASP.NET json date format regex
    var aspNetRegex = /^(\-)?(?:(\d*)[. ])?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?\d*)?$/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    // and further modified to allow for strings containing both week and day
    var isoRegex = /^(-)?P(?:(-?[0-9,.]*)Y)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)W)?(?:(-?[0-9,.]*)D)?(?:T(?:(-?[0-9,.]*)H)?(?:(-?[0-9,.]*)M)?(?:(-?[0-9,.]*)S)?)?$/;

    function create__createDuration (input, key) {
      var duration = input,
      // matching against regexp is expensive, do it on demand
        match = null,
        sign,
        ret,
        diffRes;

      if (isDuration(input)) {
        duration = {
          ms : input._milliseconds,
          d  : input._days,
          M  : input._months
        };
      } else if (typeof input === 'number') {
        duration = {};
        if (key) {
          duration[key] = input;
        } else {
          duration.milliseconds = input;
        }
      } else if (!!(match = aspNetRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
          y  : 0,
          d  : toInt(match[DATE])        * sign,
          h  : toInt(match[HOUR])        * sign,
          m  : toInt(match[MINUTE])      * sign,
          s  : toInt(match[SECOND])      * sign,
          ms : toInt(match[MILLISECOND]) * sign
        };
      } else if (!!(match = isoRegex.exec(input))) {
        sign = (match[1] === '-') ? -1 : 1;
        duration = {
          y : parseIso(match[2], sign),
          M : parseIso(match[3], sign),
          w : parseIso(match[4], sign),
          d : parseIso(match[5], sign),
          h : parseIso(match[6], sign),
          m : parseIso(match[7], sign),
          s : parseIso(match[8], sign)
        };
      } else if (duration == null) {// checks for null or undefined
        duration = {};
      } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
        diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

        duration = {};
        duration.ms = diffRes.milliseconds;
        duration.M = diffRes.months;
      }

      ret = new Duration(duration);

      if (isDuration(input) && hasOwnProp(input, '_locale')) {
        ret._locale = input._locale;
      }

      return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
      // We'd normally use ~~inp for this, but unfortunately it also
      // converts floats to ints.
      // inp may be undefined, so careful calling replace on it.
      var res = inp && parseFloat(inp.replace(',', '.'));
      // apply sign while we're at it
      return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
      var res = {milliseconds: 0, months: 0};

      res.months = other.month() - base.month() +
        (other.year() - base.year()) * 12;
      if (base.clone().add(res.months, 'M').isAfter(other)) {
        --res.months;
      }

      res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

      return res;
    }

    function momentsDifference(base, other) {
      var res;
      if (!(base.isValid() && other.isValid())) {
        return {milliseconds: 0, months: 0};
      }

      other = cloneWithOffset(other, base);
      if (base.isBefore(other)) {
        res = positiveMomentsDifference(base, other);
      } else {
        res = positiveMomentsDifference(other, base);
        res.milliseconds = -res.milliseconds;
        res.months = -res.months;
      }

      return res;
    }

    function absRound (number) {
      if (number < 0) {
        return Math.round(-1 * number) * -1;
      } else {
        return Math.round(number);
      }
    }

    // TODO: remove 'name' arg after deprecation is removed
    function createAdder(direction, name) {
      return function (val, period) {
        var dur, tmp;
        //invert the arguments, but complain about it
        if (period !== null && !isNaN(+period)) {
          deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period). ' +
            'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.');
          tmp = val; val = period; period = tmp;
        }

        val = typeof val === 'string' ? +val : val;
        dur = create__createDuration(val, period);
        add_subtract__addSubtract(this, dur, direction);
        return this;
      };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
      var milliseconds = duration._milliseconds,
        days = absRound(duration._days),
        months = absRound(duration._months);

      if (!mom.isValid()) {
        // No op
        return;
      }

      updateOffset = updateOffset == null ? true : updateOffset;

      if (milliseconds) {
        mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
      }
      if (days) {
        get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
      }
      if (months) {
        setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
      }
      if (updateOffset) {
        utils_hooks__hooks.updateOffset(mom, days || months);
      }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function getCalendarFormat(myMoment, now) {
      var diff = myMoment.diff(now, 'days', true);
      return diff < -6 ? 'sameElse' :
        diff < -1 ? 'lastWeek' :
          diff < 0 ? 'lastDay' :
            diff < 1 ? 'sameDay' :
              diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
    }

    function moment_calendar__calendar (time, formats) {
      // We want to compare the start of today, vs this.
      // Getting start-of-today depends on whether we're local/utc/offset or not.
      var now = time || local__createLocal(),
        sod = cloneWithOffset(now, this).startOf('day'),
        format = utils_hooks__hooks.calendarFormat(this, sod) || 'sameElse';

      var output = formats && (isFunction(formats[format]) ? formats[format].call(this, now) : formats[format]);

      return this.format(output || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
      return new Moment(this);
    }

    function isAfter (input, units) {
      var localInput = isMoment(input) ? input : local__createLocal(input);
      if (!(this.isValid() && localInput.isValid())) {
        return false;
      }
      units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
      if (units === 'millisecond') {
        return this.valueOf() > localInput.valueOf();
      } else {
        return localInput.valueOf() < this.clone().startOf(units).valueOf();
      }
    }

    function isBefore (input, units) {
      var localInput = isMoment(input) ? input : local__createLocal(input);
      if (!(this.isValid() && localInput.isValid())) {
        return false;
      }
      units = normalizeUnits(!isUndefined(units) ? units : 'millisecond');
      if (units === 'millisecond') {
        return this.valueOf() < localInput.valueOf();
      } else {
        return this.clone().endOf(units).valueOf() < localInput.valueOf();
      }
    }

    function isBetween (from, to, units, inclusivity) {
      inclusivity = inclusivity || '()';
      return (inclusivity[0] === '(' ? this.isAfter(from, units) : !this.isBefore(from, units)) &&
        (inclusivity[1] === ')' ? this.isBefore(to, units) : !this.isAfter(to, units));
    }

    function isSame (input, units) {
      var localInput = isMoment(input) ? input : local__createLocal(input),
        inputMs;
      if (!(this.isValid() && localInput.isValid())) {
        return false;
      }
      units = normalizeUnits(units || 'millisecond');
      if (units === 'millisecond') {
        return this.valueOf() === localInput.valueOf();
      } else {
        inputMs = localInput.valueOf();
        return this.clone().startOf(units).valueOf() <= inputMs && inputMs <= this.clone().endOf(units).valueOf();
      }
    }

    function isSameOrAfter (input, units) {
      return this.isSame(input, units) || this.isAfter(input,units);
    }

    function isSameOrBefore (input, units) {
      return this.isSame(input, units) || this.isBefore(input,units);
    }

    function diff (input, units, asFloat) {
      var that,
        zoneDelta,
        delta, output;

      if (!this.isValid()) {
        return NaN;
      }

      that = cloneWithOffset(input, this);

      if (!that.isValid()) {
        return NaN;
      }

      zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

      units = normalizeUnits(units);

      if (units === 'year' || units === 'month' || units === 'quarter') {
        output = monthDiff(this, that);
        if (units === 'quarter') {
          output = output / 3;
        } else if (units === 'year') {
          output = output / 12;
        }
      } else {
        delta = this - that;
        output = units === 'second' ? delta / 1e3 : // 1000
          units === 'minute' ? delta / 6e4 : // 1000 * 60
            units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
              units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                  delta;
      }
      return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
      // difference in months
      var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
      // b is in (anchor - 1 month, anchor + 1 month)
        anchor = a.clone().add(wholeMonthDiff, 'months'),
        anchor2, adjust;

      if (b - anchor < 0) {
        anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor - anchor2);
      } else {
        anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
        // linear across the month
        adjust = (b - anchor) / (anchor2 - anchor);
      }

      //check for negative zero, return zero if negative zero
      return -(wholeMonthDiff + adjust) || 0;
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
    utils_hooks__hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

    function toString () {
      return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
      var m = this.clone().utc();
      if (0 < m.year() && m.year() <= 9999) {
        if (isFunction(Date.prototype.toISOString)) {
          // native implementation is ~50x faster, use it when we can
          return this.toDate().toISOString();
        } else {
          return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
      } else {
        return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
      }
    }

    function format (inputString) {
      if (!inputString) {
        inputString = this.isUtc() ? utils_hooks__hooks.defaultFormatUtc : utils_hooks__hooks.defaultFormat;
      }
      var output = formatMoment(this, inputString);
      return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
      if (this.isValid() &&
        ((isMoment(time) && time.isValid()) ||
        local__createLocal(time).isValid())) {
        return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
      } else {
        return this.localeData().invalidDate();
      }
    }

    function fromNow (withoutSuffix) {
      return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
      if (this.isValid() &&
        ((isMoment(time) && time.isValid()) ||
        local__createLocal(time).isValid())) {
        return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
      } else {
        return this.localeData().invalidDate();
      }
    }

    function toNow (withoutSuffix) {
      return this.to(local__createLocal(), withoutSuffix);
    }

    // If passed a locale key, it will set the locale for this
    // instance.  Otherwise, it will return the locale configuration
    // variables for this instance.
    function locale (key) {
      var newLocaleData;

      if (key === undefined) {
        return this._locale._abbr;
      } else {
        newLocaleData = locale_locales__getLocale(key);
        if (newLocaleData != null) {
          this._locale = newLocaleData;
        }
        return this;
      }
    }

    var lang = deprecate(
      'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
      function (key) {
        if (key === undefined) {
          return this.localeData();
        } else {
          return this.locale(key);
        }
      }
    );

    function localeData () {
      return this._locale;
    }

    function startOf (units) {
      units = normalizeUnits(units);
      // the following switch intentionally omits break keywords
      // to utilize falling through the cases.
      switch (units) {
        case 'year':
          this.month(0);
        /* falls through */
        case 'quarter':
        case 'month':
          this.date(1);
        /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
        case 'date':
          this.hours(0);
        /* falls through */
        case 'hour':
          this.minutes(0);
        /* falls through */
        case 'minute':
          this.seconds(0);
        /* falls through */
        case 'second':
          this.milliseconds(0);
      }

      // weeks are a special case
      if (units === 'week') {
        this.weekday(0);
      }
      if (units === 'isoWeek') {
        this.isoWeekday(1);
      }

      // quarters are also special
      if (units === 'quarter') {
        this.month(Math.floor(this.month() / 3) * 3);
      }

      return this;
    }

    function endOf (units) {
      units = normalizeUnits(units);
      if (units === undefined || units === 'millisecond') {
        return this;
      }

      // 'date' is an alias for 'day', so it should be considered as such.
      if (units === 'date') {
        units = 'day';
      }

      return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
      return this._d.valueOf() - ((this._offset || 0) * 60000);
    }

    function unix () {
      return Math.floor(this.valueOf() / 1000);
    }

    function toDate () {
      return new Date(this.valueOf());
    }

    function toArray () {
      var m = this;
      return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
      var m = this;
      return {
        years: m.year(),
        months: m.month(),
        date: m.date(),
        hours: m.hours(),
        minutes: m.minutes(),
        seconds: m.seconds(),
        milliseconds: m.milliseconds()
      };
    }

    function toJSON () {
      // new Date(NaN).toJSON() === null
      return this.isValid() ? this.toISOString() : null;
    }

    function moment_valid__isValid () {
      return valid__isValid(this);
    }

    function parsingFlags () {
      return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
      return getParsingFlags(this).overflow;
    }

    function creationData() {
      return {
        input: this._i,
        format: this._f,
        locale: this._locale,
        isUTC: this._isUTC,
        strict: this._strict
      };
    }

    // FORMATTING

    addFormatToken(0, ['gg', 2], 0, function () {
      return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
      return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
      addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PRIORITY

    addUnitPriority('weekYear', 1);
    addUnitPriority('isoWeekYear', 1);


    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
      week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
      week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // MOMENTS

    function getSetWeekYear (input) {
      return getSetWeekYearHelper.call(this,
        input,
        this.week(),
        this.weekday(),
        this.localeData()._week.dow,
        this.localeData()._week.doy);
    }

    function getSetISOWeekYear (input) {
      return getSetWeekYearHelper.call(this,
        input, this.isoWeek(), this.isoWeekday(), 1, 4);
    }

    function getISOWeeksInYear () {
      return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
      var weekInfo = this.localeData()._week;
      return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
      var weeksTarget;
      if (input == null) {
        return weekOfYear(this, dow, doy).year;
      } else {
        weeksTarget = weeksInYear(input, dow, doy);
        if (week > weeksTarget) {
          week = weeksTarget;
        }
        return setWeekAll.call(this, input, week, weekday, dow, doy);
      }
    }

    function setWeekAll(weekYear, week, weekday, dow, doy) {
      var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
        date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

      this.year(date.getUTCFullYear());
      this.month(date.getUTCMonth());
      this.date(date.getUTCDate());
      return this;
    }

    // FORMATTING

    addFormatToken('Q', 0, 'Qo', 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PRIORITY

    addUnitPriority('quarter', 7);

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
      array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
      return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    // FORMATTING

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PRIOROITY
    addUnitPriority('date', 9);

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
      return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
      array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    // FORMATTING

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PRIORITY
    addUnitPriority('dayOfYear', 4);

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
      config._dayOfYear = toInt(input);
    });

    // HELPERS

    // MOMENTS

    function getSetDayOfYear (input) {
      var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
      return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // FORMATTING

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PRIORITY

    addUnitPriority('minute', 14);

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    // FORMATTING

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PRIORITY

    addUnitPriority('second', 15);

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    // FORMATTING

    addFormatToken('S', 0, 0, function () {
      return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
      return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
      return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
      return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
      return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
      return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
      return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
      return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PRIORITY

    addUnitPriority('millisecond', 16);

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
      addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
      array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
      addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    // FORMATTING

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
      return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
      return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add               = add_subtract__add;
    momentPrototype__proto.calendar          = moment_calendar__calendar;
    momentPrototype__proto.clone             = clone;
    momentPrototype__proto.diff              = diff;
    momentPrototype__proto.endOf             = endOf;
    momentPrototype__proto.format            = format;
    momentPrototype__proto.from              = from;
    momentPrototype__proto.fromNow           = fromNow;
    momentPrototype__proto.to                = to;
    momentPrototype__proto.toNow             = toNow;
    momentPrototype__proto.get               = stringGet;
    momentPrototype__proto.invalidAt         = invalidAt;
    momentPrototype__proto.isAfter           = isAfter;
    momentPrototype__proto.isBefore          = isBefore;
    momentPrototype__proto.isBetween         = isBetween;
    momentPrototype__proto.isSame            = isSame;
    momentPrototype__proto.isSameOrAfter     = isSameOrAfter;
    momentPrototype__proto.isSameOrBefore    = isSameOrBefore;
    momentPrototype__proto.isValid           = moment_valid__isValid;
    momentPrototype__proto.lang              = lang;
    momentPrototype__proto.locale            = locale;
    momentPrototype__proto.localeData        = localeData;
    momentPrototype__proto.max               = prototypeMax;
    momentPrototype__proto.min               = prototypeMin;
    momentPrototype__proto.parsingFlags      = parsingFlags;
    momentPrototype__proto.set               = stringSet;
    momentPrototype__proto.startOf           = startOf;
    momentPrototype__proto.subtract          = add_subtract__subtract;
    momentPrototype__proto.toArray           = toArray;
    momentPrototype__proto.toObject          = toObject;
    momentPrototype__proto.toDate            = toDate;
    momentPrototype__proto.toISOString       = moment_format__toISOString;
    momentPrototype__proto.toJSON            = toJSON;
    momentPrototype__proto.toString          = toString;
    momentPrototype__proto.unix              = unix;
    momentPrototype__proto.valueOf           = to_type__valueOf;
    momentPrototype__proto.creationData      = creationData;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/', getSetZone);
    momentPrototype__proto.isDSTShifted = deprecate('isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information', isDaylightSavingTimeShifted);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
      return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
      return local__createLocal.apply(null, arguments).parseZone();
    }

    function preParsePostFormat (string) {
      return string;
    }

    var prototype__proto = Locale.prototype;

    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto.ordinal         = ordinal;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months            =        localeMonths;
    prototype__proto.monthsShort       =        localeMonthsShort;
    prototype__proto.monthsParse       =        localeMonthsParse;
    prototype__proto.monthsRegex       = monthsRegex;
    prototype__proto.monthsShortRegex  = monthsShortRegex;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    prototype__proto.weekdaysRegex       =        weekdaysRegex;
    prototype__proto.weekdaysShortRegex  =        weekdaysShortRegex;
    prototype__proto.weekdaysMinRegex    =        weekdaysMinRegex;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
      var locale = locale_locales__getLocale();
      var utc = create_utc__createUTC().set(setter, index);
      return locale[field](utc, format);
    }

    function listMonthsImpl (format, index, field) {
      if (typeof format === 'number') {
        index = format;
        format = undefined;
      }

      format = format || '';

      if (index != null) {
        return lists__get(format, index, field, 'month');
      }

      var i;
      var out = [];
      for (i = 0; i < 12; i++) {
        out[i] = lists__get(format, i, field, 'month');
      }
      return out;
    }

    // ()
    // (5)
    // (fmt, 5)
    // (fmt)
    // (true)
    // (true, 5)
    // (true, fmt, 5)
    // (true, fmt)
    function listWeekdaysImpl (localeSorted, format, index, field) {
      if (typeof localeSorted === 'boolean') {
        if (typeof format === 'number') {
          index = format;
          format = undefined;
        }

        format = format || '';
      } else {
        format = localeSorted;
        index = format;
        localeSorted = false;

        if (typeof format === 'number') {
          index = format;
          format = undefined;
        }

        format = format || '';
      }

      var locale = locale_locales__getLocale(),
        shift = localeSorted ? locale._week.dow : 0;

      if (index != null) {
        return lists__get(format, (index + shift) % 7, field, 'day');
      }

      var i;
      var out = [];
      for (i = 0; i < 7; i++) {
        out[i] = lists__get(format, (i + shift) % 7, field, 'day');
      }
      return out;
    }

    function lists__listMonths (format, index) {
      return listMonthsImpl(format, index, 'months');
    }

    function lists__listMonthsShort (format, index) {
      return listMonthsImpl(format, index, 'monthsShort');
    }

    function lists__listWeekdays (localeSorted, format, index) {
      return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
    }

    function lists__listWeekdaysShort (localeSorted, format, index) {
      return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
    }

    function lists__listWeekdaysMin (localeSorted, format, index) {
      return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
    }

    locale_locales__getSetGlobalLocale('en', {
      ordinalParse: /\d{1,2}(th|st|nd|rd)/,
      ordinal : function (number) {
        var b = number % 10,
          output = (toInt(number % 100 / 10) === 1) ? 'th' :
            (b === 1) ? 'st' :
              (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
        return number + output;
      }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
      var data           = this._data;

      this._milliseconds = mathAbs(this._milliseconds);
      this._days         = mathAbs(this._days);
      this._months       = mathAbs(this._months);

      data.milliseconds  = mathAbs(data.milliseconds);
      data.seconds       = mathAbs(data.seconds);
      data.minutes       = mathAbs(data.minutes);
      data.hours         = mathAbs(data.hours);
      data.months        = mathAbs(data.months);
      data.years         = mathAbs(data.years);

      return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
      var other = create__createDuration(input, value);

      duration._milliseconds += direction * other._milliseconds;
      duration._days         += direction * other._days;
      duration._months       += direction * other._months;

      return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
      return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
      return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
      if (number < 0) {
        return Math.floor(number);
      } else {
        return Math.ceil(number);
      }
    }

    function bubble () {
      var milliseconds = this._milliseconds;
      var days         = this._days;
      var months       = this._months;
      var data         = this._data;
      var seconds, minutes, hours, years, monthsFromDays;

      // if we have a mix of positive and negative values, bubble down first
      // check: https://github.com/moment/moment/issues/2166
      if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
        (milliseconds <= 0 && days <= 0 && months <= 0))) {
        milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
        days = 0;
        months = 0;
      }

      // The following code bubbles up values, see the tests for
      // examples of what that means.
      data.milliseconds = milliseconds % 1000;

      seconds           = absFloor(milliseconds / 1000);
      data.seconds      = seconds % 60;

      minutes           = absFloor(seconds / 60);
      data.minutes      = minutes % 60;

      hours             = absFloor(minutes / 60);
      data.hours        = hours % 24;

      days += absFloor(hours / 24);

      // convert days to months
      monthsFromDays = absFloor(daysToMonths(days));
      months += monthsFromDays;
      days -= absCeil(monthsToDays(monthsFromDays));

      // 12 months -> 1 year
      years = absFloor(months / 12);
      months %= 12;

      data.days   = days;
      data.months = months;
      data.years  = years;

      return this;
    }

    function daysToMonths (days) {
      // 400 years have 146097 days (taking into account leap year rules)
      // 400 years have 12 months === 4800
      return days * 4800 / 146097;
    }

    function monthsToDays (months) {
      // the reverse of daysToMonths
      return months * 146097 / 4800;
    }

    function as (units) {
      var days;
      var months;
      var milliseconds = this._milliseconds;

      units = normalizeUnits(units);

      if (units === 'month' || units === 'year') {
        days   = this._days   + milliseconds / 864e5;
        months = this._months + daysToMonths(days);
        return units === 'month' ? months : months / 12;
      } else {
        // handle milliseconds separately because of floating point math errors (issue #1867)
        days = this._days + Math.round(monthsToDays(this._months));
        switch (units) {
          case 'week'   : return days / 7     + milliseconds / 6048e5;
          case 'day'    : return days         + milliseconds / 864e5;
          case 'hour'   : return days * 24    + milliseconds / 36e5;
          case 'minute' : return days * 1440  + milliseconds / 6e4;
          case 'second' : return days * 86400 + milliseconds / 1000;
          // Math.floor prevents floating point math errors here
          case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
          default: throw new Error('Unknown unit ' + units);
        }
      }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
      return (
        this._milliseconds +
        this._days * 864e5 +
        (this._months % 12) * 2592e6 +
        toInt(this._months / 12) * 31536e6
      );
    }

    function makeAs (alias) {
      return function () {
        return this.as(alias);
      };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
      units = normalizeUnits(units);
      return this[units + 's']();
    }

    function makeGetter(name) {
      return function () {
        return this._data[name];
      };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
      return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
      s: 45,  // seconds to minute
      m: 45,  // minutes to hour
      h: 22,  // hours to day
      d: 26,  // days to month
      M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
      return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
      var duration = create__createDuration(posNegDuration).abs();
      var seconds  = round(duration.as('s'));
      var minutes  = round(duration.as('m'));
      var hours    = round(duration.as('h'));
      var days     = round(duration.as('d'));
      var months   = round(duration.as('M'));
      var years    = round(duration.as('y'));

      var a = seconds < thresholds.s && ['s', seconds]  ||
        minutes <= 1           && ['m']           ||
        minutes < thresholds.m && ['mm', minutes] ||
        hours   <= 1           && ['h']           ||
        hours   < thresholds.h && ['hh', hours]   ||
        days    <= 1           && ['d']           ||
        days    < thresholds.d && ['dd', days]    ||
        months  <= 1           && ['M']           ||
        months  < thresholds.M && ['MM', months]  ||
        years   <= 1           && ['y']           || ['yy', years];

      a[2] = withoutSuffix;
      a[3] = +posNegDuration > 0;
      a[4] = locale;
      return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set the rounding function for relative time strings
    function duration_humanize__getSetRelativeTimeRounding (roundingFunction) {
      if (roundingFunction === undefined) {
        return round;
      }
      if (typeof(roundingFunction) === 'function') {
        round = roundingFunction;
        return true;
      }
      return false;
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
      if (thresholds[threshold] === undefined) {
        return false;
      }
      if (limit === undefined) {
        return thresholds[threshold];
      }
      thresholds[threshold] = limit;
      return true;
    }

    function humanize (withSuffix) {
      var locale = this.localeData();
      var output = duration_humanize__relativeTime(this, !withSuffix, locale);

      if (withSuffix) {
        output = locale.pastFuture(+this, output);
      }

      return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
      // for ISO strings we do not use the normal bubbling rules:
      //  * milliseconds bubble up until they become hours
      //  * days do not bubble at all
      //  * months bubble up until they become years
      // This is because there is no context-free conversion between hours and days
      // (think of clock changes)
      // and also not between days and months (28-31 days per month)
      var seconds = iso_string__abs(this._milliseconds) / 1000;
      var days         = iso_string__abs(this._days);
      var months       = iso_string__abs(this._months);
      var minutes, hours, years;

      // 3600 seconds -> 60 minutes -> 1 hour
      minutes           = absFloor(seconds / 60);
      hours             = absFloor(minutes / 60);
      seconds %= 60;
      minutes %= 60;

      // 12 months -> 1 year
      years  = absFloor(months / 12);
      months %= 12;


      // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
      var Y = years;
      var M = months;
      var D = days;
      var h = hours;
      var m = minutes;
      var s = seconds;
      var total = this.asSeconds();

      if (!total) {
        // this is the same as C#'s (Noda) and python (isodate)...
        // but not other JS (goog.date)
        return 'P0D';
      }

      return (total < 0 ? '-' : '') +
        'P' +
        (Y ? Y + 'Y' : '') +
        (M ? M + 'M' : '') +
        (D ? D + 'D' : '') +
        ((h || m || s) ? 'T' : '') +
        (h ? h + 'H' : '') +
        (m ? m + 'M' : '') +
        (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    // FORMATTING

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
      config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
      config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.14.1';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.now                   = now;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.updateLocale          = updateLocale;
    utils_hooks__hooks.locales               = locale_locales__listLocales;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeRounding = duration_humanize__getSetRelativeTimeRounding;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;
    utils_hooks__hooks.calendarFormat        = getCalendarFormat;
    utils_hooks__hooks.prototype             = momentPrototype;

    var _moment = utils_hooks__hooks;

    return _moment;

  }));
},{}],5:[function(require,module,exports){
//     Underscore.js 1.8.0
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

  (function() {

    // Baseline setup
    // --------------

    // Establish the root object, `window` in the browser, or `exports` on the server.
    var root = this;

    // Save the previous value of the `_` variable.
    var previousUnderscore = root._;

    // Save bytes in the minified (but not gzipped) version:
    var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

    // Create quick reference variables for speed access to core prototypes.
    var
      push             = ArrayProto.push,
      slice            = ArrayProto.slice,
      toString         = ObjProto.toString,
      hasOwnProperty   = ObjProto.hasOwnProperty;

    // All **ECMAScript 5** native function implementations that we hope to use
    // are declared here.
    var
      nativeIsArray      = Array.isArray,
      nativeKeys         = Object.keys,
      nativeBind         = FuncProto.bind,
      nativeCreate       = Object.create;

    // Reusable constructor function for prototype setting.
    var Ctor = function(){};

    // Create a safe reference to the Underscore object for use below.
    var _ = function(obj) {
      if (obj instanceof _) return obj;
      if (!(this instanceof _)) return new _(obj);
      this._wrapped = obj;
    };

    // Export the Underscore object for **Node.js**, with
    // backwards-compatibility for the old `require()` API. If we're in
    // the browser, add `_` as a global object.
    if (typeof exports !== 'undefined') {
      if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = _;
      }
      exports._ = _;
    } else {
      root._ = _;
    }

    // Current version.
    _.VERSION = '1.8.0';

    // Internal function that returns an efficient (for current engines) version
    // of the passed-in callback, to be repeatedly applied in other Underscore
    // functions.
    var optimizeCb = function(func, context, argCount) {
      if (context === void 0) return func;
      switch (argCount == null ? 3 : argCount) {
        case 1: return function(value) {
          return func.call(context, value);
        };
        case 2: return function(value, other) {
          return func.call(context, value, other);
        };
        case 3: return function(value, index, collection) {
          return func.call(context, value, index, collection);
        };
        case 4: return function(accumulator, value, index, collection) {
          return func.call(context, accumulator, value, index, collection);
        };
      }
      return function() {
        return func.apply(context, arguments);
      };
    };

    // A mostly-internal function to generate callbacks that can be applied
    // to each element in a collection, returning the desired result — either
    // identity, an arbitrary callback, a property matcher, or a property accessor.
    var cb = function(value, context, argCount) {
      if (value == null) return _.identity;
      if (_.isFunction(value)) return optimizeCb(value, context, argCount);
      if (_.isObject(value)) return _.matcher(value);
      return _.property(value);
    };
    _.iteratee = function(value, context) {
      return cb(value, context, Infinity);
    };

    // An internal function for creating assigner functions.
    var createAssigner = function(keysFunc, undefinedOnly) {
      return function(obj) {
        var length = arguments.length;
        if (length < 2 || obj == null) return obj;
        for (var index = 1; index < length; index++) {
          var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
          for (var i = 0; i < l; i++) {
            var key = keys[i];
            if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
          }
        }
        return obj;
      };
    };

    // An internal function for creating a new object that inherits from another.
    var baseCreate = function(prototype) {
      if (!_.isObject(prototype)) return {};
      if (nativeCreate) return nativeCreate(prototype);
      Ctor.prototype = prototype;
      var result = new Ctor;
      Ctor.prototype = null;
      return result;
    };

    // Helper for collection methods to determine whether a collection
    // should be iterated as an array or as an object
    // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
    var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
    var isArrayLike = function(collection) {
      var length = collection && collection.length;
      return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
    };

    // Collection Functions
    // --------------------

    // The cornerstone, an `each` implementation, aka `forEach`.
    // Handles raw objects in addition to array-likes. Treats all
    // sparse array-likes as if they were dense.
    _.each = _.forEach = function(obj, iteratee, context) {
      iteratee = optimizeCb(iteratee, context);
      var i, length;
      if (isArrayLike(obj)) {
        for (i = 0, length = obj.length; i < length; i++) {
          iteratee(obj[i], i, obj);
        }
      } else {
        var keys = _.keys(obj);
        for (i = 0, length = keys.length; i < length; i++) {
          iteratee(obj[keys[i]], keys[i], obj);
        }
      }
      return obj;
    };

    // Return the results of applying the iteratee to each element.
    _.map = _.collect = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        results[index] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };

    // Create a reducing function iterating left or right.
    function createReduce(dir) {
      // Optimized iterator function as using arguments.length
      // in the main function will deoptimize the, see #1991.
      function iterator(obj, iteratee, memo, keys, index, length) {
        for (; index >= 0 && index < length; index += dir) {
          var currentKey = keys ? keys[index] : index;
          memo = iteratee(memo, obj[currentKey], currentKey, obj);
        }
        return memo;
      }

      return function(obj, iteratee, memo, context) {
        iteratee = optimizeCb(iteratee, context, 4);
        var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
        // Determine the initial value if none is provided.
        if (arguments.length < 3) {
          memo = obj[keys ? keys[index] : index];
          index += dir;
        }
        return iterator(obj, iteratee, memo, keys, index, length);
      };
    }

    // **Reduce** builds up a single result from a list of values, aka `inject`,
    // or `foldl`.
    _.reduce = _.foldl = _.inject = createReduce(1);

    // The right-associative version of reduce, also known as `foldr`.
    _.reduceRight = _.foldr = createReduce(-1);

    // Return the first value which passes a truth test. Aliased as `detect`.
    _.find = _.detect = function(obj, predicate, context) {
      var key;
      if (isArrayLike(obj)) {
        key = _.findIndex(obj, predicate, context);
      } else {
        key = _.findKey(obj, predicate, context);
      }
      if (key !== void 0 && key !== -1) return obj[key];
    };

    // Return all the elements that pass a truth test.
    // Aliased as `select`.
    _.filter = _.select = function(obj, predicate, context) {
      var results = [];
      predicate = cb(predicate, context);
      _.each(obj, function(value, index, list) {
        if (predicate(value, index, list)) results.push(value);
      });
      return results;
    };

    // Return all the elements for which a truth test fails.
    _.reject = function(obj, predicate, context) {
      return _.filter(obj, _.negate(cb(predicate)), context);
    };

    // Determine whether all of the elements match a truth test.
    // Aliased as `all`.
    _.every = _.all = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (!predicate(obj[currentKey], currentKey, obj)) return false;
      }
      return true;
    };

    // Determine if at least one element in the object matches a truth test.
    // Aliased as `any`.
    _.some = _.any = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
      for (var index = 0; index < length; index++) {
        var currentKey = keys ? keys[index] : index;
        if (predicate(obj[currentKey], currentKey, obj)) return true;
      }
      return false;
    };

    // Determine if the array or object contains a given value (using `===`).
    // Aliased as `includes` and `include`.
    _.contains = _.includes = _.include = function(obj, target) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return _.indexOf(obj, target) >= 0;
    };

    // Invoke a method (with arguments) on every item in a collection.
    _.invoke = function(obj, method) {
      var args = slice.call(arguments, 2);
      var isFunc = _.isFunction(method);
      return _.map(obj, function(value) {
        var func = isFunc ? method : value[method];
        return func == null ? func : func.apply(value, args);
      });
    };

    // Convenience version of a common use case of `map`: fetching a property.
    _.pluck = function(obj, key) {
      return _.map(obj, _.property(key));
    };

    // Convenience version of a common use case of `filter`: selecting only objects
    // containing specific `key:value` pairs.
    _.where = function(obj, attrs) {
      return _.filter(obj, _.matcher(attrs));
    };

    // Convenience version of a common use case of `find`: getting the first object
    // containing specific `key:value` pairs.
    _.findWhere = function(obj, attrs) {
      return _.find(obj, _.matcher(attrs));
    };

    // Return the maximum element (or element-based computation).
    _.max = function(obj, iteratee, context) {
      var result = -Infinity, lastComputed = -Infinity,
        value, computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
          value = obj[i];
          if (value > result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };

    // Return the minimum element (or element-based computation).
    _.min = function(obj, iteratee, context) {
      var result = Infinity, lastComputed = Infinity,
        value, computed;
      if (iteratee == null && obj != null) {
        obj = isArrayLike(obj) ? obj : _.values(obj);
        for (var i = 0, length = obj.length; i < length; i++) {
          value = obj[i];
          if (value < result) {
            result = value;
          }
        }
      } else {
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index, list) {
          computed = iteratee(value, index, list);
          if (computed < lastComputed || computed === Infinity && result === Infinity) {
            result = value;
            lastComputed = computed;
          }
        });
      }
      return result;
    };

    // Shuffle a collection, using the modern version of the
    // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
    _.shuffle = function(obj) {
      var set = isArrayLike(obj) ? obj : _.values(obj);
      var length = set.length;
      var shuffled = Array(length);
      for (var index = 0, rand; index < length; index++) {
        rand = _.random(0, index);
        if (rand !== index) shuffled[index] = shuffled[rand];
        shuffled[rand] = set[index];
      }
      return shuffled;
    };

    // Sample **n** random values from a collection.
    // If **n** is not specified, returns a single random element.
    // The internal `guard` argument allows it to work with `map`.
    _.sample = function(obj, n, guard) {
      if (n == null || guard) {
        if (!isArrayLike(obj)) obj = _.values(obj);
        return obj[_.random(obj.length - 1)];
      }
      return _.shuffle(obj).slice(0, Math.max(0, n));
    };

    // Sort the object's values by a criterion produced by an iteratee.
    _.sortBy = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      return _.pluck(_.map(obj, function(value, index, list) {
        return {
          value: value,
          index: index,
          criteria: iteratee(value, index, list)
        };
      }).sort(function(left, right) {
        var a = left.criteria;
        var b = right.criteria;
        if (a !== b) {
          if (a > b || a === void 0) return 1;
          if (a < b || b === void 0) return -1;
        }
        return left.index - right.index;
      }), 'value');
    };

    // An internal function used for aggregate "group by" operations.
    var group = function(behavior) {
      return function(obj, iteratee, context) {
        var result = {};
        iteratee = cb(iteratee, context);
        _.each(obj, function(value, index) {
          var key = iteratee(value, index, obj);
          behavior(result, value, key);
        });
        return result;
      };
    };

    // Groups the object's values by a criterion. Pass either a string attribute
    // to group by, or a function that returns the criterion.
    _.groupBy = group(function(result, value, key) {
      if (_.has(result, key)) result[key].push(value); else result[key] = [value];
    });

    // Indexes the object's values by a criterion, similar to `groupBy`, but for
    // when you know that your index values will be unique.
    _.indexBy = group(function(result, value, key) {
      result[key] = value;
    });

    // Counts instances of an object that group by a certain criterion. Pass
    // either a string attribute to count by, or a function that returns the
    // criterion.
    _.countBy = group(function(result, value, key) {
      if (_.has(result, key)) result[key]++; else result[key] = 1;
    });

    // Safely create a real, live array from anything iterable.
    _.toArray = function(obj) {
      if (!obj) return [];
      if (_.isArray(obj)) return slice.call(obj);
      if (isArrayLike(obj)) return _.map(obj, _.identity);
      return _.values(obj);
    };

    // Return the number of elements in an object.
    _.size = function(obj) {
      if (obj == null) return 0;
      return isArrayLike(obj) ? obj.length : _.keys(obj).length;
    };

    // Split a collection into two arrays: one whose elements all satisfy the given
    // predicate, and one whose elements all do not satisfy the predicate.
    _.partition = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var pass = [], fail = [];
      _.each(obj, function(value, key, obj) {
        (predicate(value, key, obj) ? pass : fail).push(value);
      });
      return [pass, fail];
    };

    // Array Functions
    // ---------------

    // Get the first element of an array. Passing **n** will return the first N
    // values in the array. Aliased as `head` and `take`. The **guard** check
    // allows it to work with `_.map`.
    _.first = _.head = _.take = function(array, n, guard) {
      if (array == null) return void 0;
      if (n == null || guard) return array[0];
      return _.initial(array, array.length - n);
    };

    // Returns everything but the last entry of the array. Especially useful on
    // the arguments object. Passing **n** will return all the values in
    // the array, excluding the last N.
    _.initial = function(array, n, guard) {
      return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
    };

    // Get the last element of an array. Passing **n** will return the last N
    // values in the array.
    _.last = function(array, n, guard) {
      if (array == null) return void 0;
      if (n == null || guard) return array[array.length - 1];
      return _.rest(array, Math.max(0, array.length - n));
    };

    // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
    // Especially useful on the arguments object. Passing an **n** will return
    // the rest N values in the array.
    _.rest = _.tail = _.drop = function(array, n, guard) {
      return slice.call(array, n == null || guard ? 1 : n);
    };

    // Trim out all falsy values from an array.
    _.compact = function(array) {
      return _.filter(array, _.identity);
    };

    // Internal implementation of a recursive `flatten` function.
    var flatten = function(input, shallow, strict, startIndex) {
      var output = [], idx = 0;
      for (var i = startIndex || 0, length = input && input.length; i < length; i++) {
        var value = input[i];
        if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
          //flatten current level of array or arguments object
          if (!shallow) value = flatten(value, shallow, strict);
          var j = 0, len = value.length;
          output.length += len;
          while (j < len) {
            output[idx++] = value[j++];
          }
        } else if (!strict) {
          output[idx++] = value;
        }
      }
      return output;
    };

    // Flatten out an array, either recursively (by default), or just one level.
    _.flatten = function(array, shallow) {
      return flatten(array, shallow, false);
    };

    // Return a version of the array that does not contain the specified value(s).
    _.without = function(array) {
      return _.difference(array, slice.call(arguments, 1));
    };

    // Produce a duplicate-free version of the array. If the array has already
    // been sorted, you have the option of using a faster algorithm.
    // Aliased as `unique`.
    _.uniq = _.unique = function(array, isSorted, iteratee, context) {
      if (array == null) return [];
      if (!_.isBoolean(isSorted)) {
        context = iteratee;
        iteratee = isSorted;
        isSorted = false;
      }
      if (iteratee != null) iteratee = cb(iteratee, context);
      var result = [];
      var seen = [];
      for (var i = 0, length = array.length; i < length; i++) {
        var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
        if (isSorted) {
          if (!i || seen !== computed) result.push(value);
          seen = computed;
        } else if (iteratee) {
          if (!_.contains(seen, computed)) {
            seen.push(computed);
            result.push(value);
          }
        } else if (!_.contains(result, value)) {
          result.push(value);
        }
      }
      return result;
    };

    // Produce an array that contains the union: each distinct element from all of
    // the passed-in arrays.
    _.union = function() {
      return _.uniq(flatten(arguments, true, true));
    };

    // Produce an array that contains every item shared between all the
    // passed-in arrays.
    _.intersection = function(array) {
      if (array == null) return [];
      var result = [];
      var argsLength = arguments.length;
      for (var i = 0, length = array.length; i < length; i++) {
        var item = array[i];
        if (_.contains(result, item)) continue;
        for (var j = 1; j < argsLength; j++) {
          if (!_.contains(arguments[j], item)) break;
        }
        if (j === argsLength) result.push(item);
      }
      return result;
    };

    // Take the difference between one array and a number of other arrays.
    // Only the elements present in just the first array will remain.
    _.difference = function(array) {
      var rest = flatten(arguments, true, true, 1);
      return _.filter(array, function(value){
        return !_.contains(rest, value);
      });
    };

    // Zip together multiple lists into a single array -- elements that share
    // an index go together.
    _.zip = function() {
      return _.unzip(arguments);
    };

    // Complement of _.zip. Unzip accepts an array of arrays and groups
    // each array's elements on shared indices
    _.unzip = function(array) {
      var length = array && _.max(array, 'length').length || 0;
      var result = Array(length);

      for (var index = 0; index < length; index++) {
        result[index] = _.pluck(array, index);
      }
      return result;
    };

    // Converts lists into objects. Pass either a single array of `[key, value]`
    // pairs, or two parallel arrays of the same length -- one of keys, and one of
    // the corresponding values.
    _.object = function(list, values) {
      var result = {};
      for (var i = 0, length = list && list.length; i < length; i++) {
        if (values) {
          result[list[i]] = values[i];
        } else {
          result[list[i][0]] = list[i][1];
        }
      }
      return result;
    };

    // Return the position of the first occurrence of an item in an array,
    // or -1 if the item is not included in the array.
    // If the array is large and already in sort order, pass `true`
    // for **isSorted** to use binary search.
    _.indexOf = function(array, item, isSorted) {
      var i = 0, length = array && array.length;
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else if (isSorted && length) {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
      if (item !== item) {
        return _.findIndex(slice.call(array, i), _.isNaN);
      }
      for (; i < length; i++) if (array[i] === item) return i;
      return -1;
    };

    _.lastIndexOf = function(array, item, from) {
      var idx = array ? array.length : 0;
      if (typeof from == 'number') {
        idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
      }
      if (item !== item) {
        return _.findLastIndex(slice.call(array, 0, idx), _.isNaN);
      }
      while (--idx >= 0) if (array[idx] === item) return idx;
      return -1;
    };

    // Generator function to create the findIndex and findLastIndex functions
    function createIndexFinder(dir) {
      return function(array, predicate, context) {
        predicate = cb(predicate, context);
        var length = array != null && array.length;
        var index = dir > 0 ? 0 : length - 1;
        for (; index >= 0 && index < length; index += dir) {
          if (predicate(array[index], index, array)) return index;
        }
        return -1;
      };
    }

    // Returns the first index on an array-like that passes a predicate test
    _.findIndex = createIndexFinder(1);

    _.findLastIndex = createIndexFinder(-1);

    // Use a comparator function to figure out the smallest index at which
    // an object should be inserted so as to maintain order. Uses binary search.
    _.sortedIndex = function(array, obj, iteratee, context) {
      iteratee = cb(iteratee, context, 1);
      var value = iteratee(obj);
      var low = 0, high = array.length;
      while (low < high) {
        var mid = Math.floor((low + high) / 2);
        if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
      }
      return low;
    };

    // Generate an integer Array containing an arithmetic progression. A port of
    // the native Python `range()` function. See
    // [the Python documentation](http://docs.python.org/library/functions.html#range).
    _.range = function(start, stop, step) {
      if (arguments.length <= 1) {
        stop = start || 0;
        start = 0;
      }
      step = step || 1;

      var length = Math.max(Math.ceil((stop - start) / step), 0);
      var range = Array(length);

      for (var idx = 0; idx < length; idx++, start += step) {
        range[idx] = start;
      }

      return range;
    };

    // Function (ahem) Functions
    // ------------------

    // Determines whether to execute a function as a constructor
    // or a normal function with the provided arguments
    var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
      if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
      var self = baseCreate(sourceFunc.prototype);
      var result = sourceFunc.apply(self, args);
      if (_.isObject(result)) return result;
      return self;
    };

    // Create a function bound to a given object (assigning `this`, and arguments,
    // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
    // available.
    _.bind = function(func, context) {
      if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
      if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
      var args = slice.call(arguments, 2);
      return function bound() {
        return executeBound(func, bound, context, this, args.concat(slice.call(arguments)));
      };
    };

    // Partially apply a function by creating a version that has had some of its
    // arguments pre-filled, without changing its dynamic `this` context. _ acts
    // as a placeholder, allowing any combination of arguments to be pre-filled.
    _.partial = function(func) {
      var boundArgs = slice.call(arguments, 1);
      return function bound() {
        var position = 0, length = boundArgs.length;
        var args = Array(length);
        for (var i = 0; i < length; i++) {
          args[i] = boundArgs[i] === _ ? arguments[position++] : boundArgs[i];
        }
        while (position < arguments.length) args.push(arguments[position++]);
        return executeBound(func, bound, this, this, args);
      };
    };

    // Bind a number of an object's methods to that object. Remaining arguments
    // are the method names to be bound. Useful for ensuring that all callbacks
    // defined on an object belong to it.
    _.bindAll = function(obj) {
      var i, length = arguments.length, key;
      if (length <= 1) throw new Error('bindAll must be passed function names');
      for (i = 1; i < length; i++) {
        key = arguments[i];
        obj[key] = _.bind(obj[key], obj);
      }
      return obj;
    };

    // Memoize an expensive function by storing its results.
    _.memoize = function(func, hasher) {
      var memoize = function(key) {
        var cache = memoize.cache;
        var address = '' + (hasher ? hasher.apply(this, arguments) : key);
        if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
        return cache[address];
      };
      memoize.cache = {};
      return memoize;
    };

    // Delays a function for the given number of milliseconds, and then calls
    // it with the arguments supplied.
    _.delay = function(func, wait) {
      var args = slice.call(arguments, 2);
      return setTimeout(function(){
        return func.apply(null, args);
      }, wait);
    };

    // Defers a function, scheduling it to run after the current call stack has
    // cleared.
    _.defer = _.partial(_.delay, _, 1);

    // Returns a function, that, when invoked, will only be triggered at most once
    // during a given window of time. Normally, the throttled function will run
    // as much as it can, without ever going more than once per `wait` duration;
    // but if you'd like to disable the execution on the leading edge, pass
    // `{leading: false}`. To disable execution on the trailing edge, ditto.
    _.throttle = function(func, wait, options) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      if (!options) options = {};
      var later = function() {
        previous = options.leading === false ? 0 : _.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      };
      return function() {
        var now = _.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
          if (timeout) {
            clearTimeout(timeout);
            timeout = null;
          }
          previous = now;
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    };

    // Returns a function, that, as long as it continues to be invoked, will not
    // be triggered. The function will be called after it stops being called for
    // N milliseconds. If `immediate` is passed, trigger the function on the
    // leading edge, instead of the trailing.
    _.debounce = function(func, wait, immediate) {
      var timeout, args, context, timestamp, result;

      var later = function() {
        var last = _.now() - timestamp;

        if (last < wait && last >= 0) {
          timeout = setTimeout(later, wait - last);
        } else {
          timeout = null;
          if (!immediate) {
            result = func.apply(context, args);
            if (!timeout) context = args = null;
          }
        }
      };

      return function() {
        context = this;
        args = arguments;
        timestamp = _.now();
        var callNow = immediate && !timeout;
        if (!timeout) timeout = setTimeout(later, wait);
        if (callNow) {
          result = func.apply(context, args);
          context = args = null;
        }

        return result;
      };
    };

    // Returns the first function passed as an argument to the second,
    // allowing you to adjust arguments, run code before and after, and
    // conditionally execute the original function.
    _.wrap = function(func, wrapper) {
      return _.partial(wrapper, func);
    };

    // Returns a negated version of the passed-in predicate.
    _.negate = function(predicate) {
      return function() {
        return !predicate.apply(this, arguments);
      };
    };

    // Returns a function that is the composition of a list of functions, each
    // consuming the return value of the function that follows.
    _.compose = function() {
      var args = arguments;
      var start = args.length - 1;
      return function() {
        var i = start;
        var result = args[start].apply(this, arguments);
        while (i--) result = args[i].call(this, result);
        return result;
      };
    };

    // Returns a function that will only be executed on and after the Nth call.
    _.after = function(times, func) {
      return function() {
        if (--times < 1) {
          return func.apply(this, arguments);
        }
      };
    };

    // Returns a function that will only be executed up to (but not including) the Nth call.
    _.before = function(times, func) {
      var memo;
      return function() {
        if (--times > 0) {
          memo = func.apply(this, arguments);
        }
        if (times <= 1) func = null;
        return memo;
      };
    };

    // Returns a function that will be executed at most one time, no matter how
    // often you call it. Useful for lazy initialization.
    _.once = _.partial(_.before, 2);

    // Object Functions
    // ----------------

    // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
    var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
    var nonEnumerableProps = ['constructor', 'valueOf', 'isPrototypeOf', 'toString',
      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

    function collectNonEnumProps(obj, keys) {
      var nonEnumIdx = nonEnumerableProps.length;
      var proto = typeof obj.constructor === 'function' ? FuncProto : ObjProto;

      while (nonEnumIdx--) {
        var prop = nonEnumerableProps[nonEnumIdx];
        if (prop === 'constructor' ? _.has(obj, prop) : prop in obj &&
          obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
          keys.push(prop);
        }
      }
    }

    // Retrieve the names of an object's own properties.
    // Delegates to **ECMAScript 5**'s native `Object.keys`
    _.keys = function(obj) {
      if (!_.isObject(obj)) return [];
      if (nativeKeys) return nativeKeys(obj);
      var keys = [];
      for (var key in obj) if (_.has(obj, key)) keys.push(key);
      // Ahem, IE < 9.
      if (hasEnumBug) collectNonEnumProps(obj, keys);
      return keys;
    };

    // Retrieve all the property names of an object.
    _.allKeys = function(obj) {
      if (!_.isObject(obj)) return [];
      var keys = [];
      for (var key in obj) keys.push(key);
      // Ahem, IE < 9.
      if (hasEnumBug) collectNonEnumProps(obj, keys);
      return keys;
    };

    // Retrieve the values of an object's properties.
    _.values = function(obj) {
      var keys = _.keys(obj);
      var length = keys.length;
      var values = Array(length);
      for (var i = 0; i < length; i++) {
        values[i] = obj[keys[i]];
      }
      return values;
    };

    // Returns the results of applying the iteratee to each element of the object
    // In contrast to _.map it returns an object
    _.mapObject = function(obj, iteratee, context) {
      iteratee = cb(iteratee, context);
      var keys =  _.keys(obj),
        length = keys.length,
        results = {},
        currentKey;
      for (var index = 0; index < length; index++) {
        currentKey = keys[index];
        results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
      }
      return results;
    };

    // Convert an object into a list of `[key, value]` pairs.
    _.pairs = function(obj) {
      var keys = _.keys(obj);
      var length = keys.length;
      var pairs = Array(length);
      for (var i = 0; i < length; i++) {
        pairs[i] = [keys[i], obj[keys[i]]];
      }
      return pairs;
    };

    // Invert the keys and values of an object. The values must be serializable.
    _.invert = function(obj) {
      var result = {};
      var keys = _.keys(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        result[obj[keys[i]]] = keys[i];
      }
      return result;
    };

    // Return a sorted list of the function names available on the object.
    // Aliased as `methods`
    _.functions = _.methods = function(obj) {
      var names = [];
      for (var key in obj) {
        if (_.isFunction(obj[key])) names.push(key);
      }
      return names.sort();
    };

    // Extend a given object with all the properties in passed-in object(s).
    _.extend = createAssigner(_.allKeys);

    // Assigns a given object with all the own properties in the passed-in object(s)
    // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
    _.extendOwn = createAssigner(_.keys);

    // Returns the first key on an object that passes a predicate test
    _.findKey = function(obj, predicate, context) {
      predicate = cb(predicate, context);
      var keys = _.keys(obj), key;
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (predicate(obj[key], key, obj)) return key;
      }
    };

    // Return a copy of the object only containing the whitelisted properties.
    _.pick = function(obj, iteratee, context) {
      var result = {}, key;
      if (obj == null) return result;
      if (_.isFunction(iteratee)) {
        iteratee = optimizeCb(iteratee, context);
        for (key in obj) {
          var value = obj[key];
          if (iteratee(value, key, obj)) result[key] = value;
        }
      } else {
        var keys = flatten(arguments, false, false, 1);
        obj = new Object(obj);
        for (var i = 0, length = keys.length; i < length; i++) {
          key = keys[i];
          if (key in obj) result[key] = obj[key];
        }
      }
      return result;
    };

    // Return a copy of the object without the blacklisted properties.
    _.omit = function(obj, iteratee, context) {
      if (_.isFunction(iteratee)) {
        iteratee = _.negate(iteratee);
      } else {
        var keys = _.map(flatten(arguments, false, false, 1), String);
        iteratee = function(value, key) {
          return !_.contains(keys, key);
        };
      }
      return _.pick(obj, iteratee, context);
    };

    // Fill in a given object with default properties.
    _.defaults = createAssigner(_.allKeys, true);

    // Create a (shallow-cloned) duplicate of an object.
    _.clone = function(obj) {
      if (!_.isObject(obj)) return obj;
      return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
    };

    // Invokes interceptor with the obj, and then returns obj.
    // The primary purpose of this method is to "tap into" a method chain, in
    // order to perform operations on intermediate results within the chain.
    _.tap = function(obj, interceptor) {
      interceptor(obj);
      return obj;
    };

    // Returns whether an object has a given set of `key:value` pairs.
    _.isMatch = function(object, attrs) {
      var keys = _.keys(attrs), length = keys.length;
      if (object == null) return !length;
      var obj = Object(object);
      for (var i = 0; i < length; i++) {
        var key = keys[i];
        if (attrs[key] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };


    // Internal recursive comparison function for `isEqual`.
    var eq = function(a, b, aStack, bStack) {
      // Identical objects are equal. `0 === -0`, but they aren't identical.
      // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
      if (a === b) return a !== 0 || 1 / a === 1 / b;
      // A strict comparison is necessary because `null == undefined`.
      if (a == null || b == null) return a === b;
      // Unwrap any wrapped objects.
      if (a instanceof _) a = a._wrapped;
      if (b instanceof _) b = b._wrapped;
      // Compare `[[Class]]` names.
      var className = toString.call(a);
      if (className !== toString.call(b)) return false;
      switch (className) {
        // Strings, numbers, regular expressions, dates, and booleans are compared by value.
        case '[object RegExp]':
        // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
        case '[object String]':
          // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
          // equivalent to `new String("5")`.
          return '' + a === '' + b;
        case '[object Number]':
          // `NaN`s are equivalent, but non-reflexive.
          // Object(NaN) is equivalent to NaN
          if (+a !== +a) return +b !== +b;
          // An `egal` comparison is performed for other numeric values.
          return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case '[object Date]':
        case '[object Boolean]':
          // Coerce dates and booleans to numeric primitive values. Dates are compared by their
          // millisecond representations. Note that invalid dates with millisecond representations
          // of `NaN` are not equivalent.
          return +a === +b;
      }

      var areArrays = className === '[object Array]';
      if (!areArrays) {
        if (typeof a != 'object' || typeof b != 'object') return false;

        // Objects with different constructors are not equivalent, but `Object`s or `Array`s
        // from different frames are.
        var aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
          _.isFunction(bCtor) && bCtor instanceof bCtor)
          && ('constructor' in a && 'constructor' in b)) {
          return false;
        }
      }
      // Assume equality for cyclic structures. The algorithm for detecting cyclic
      // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

      // Initializing stack of traversed objects.
      // It's done here since we only need them for objects and arrays comparison.
      aStack = aStack || [];
      bStack = bStack || [];
      var length = aStack.length;
      while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b;
      }

      // Add the first object to the stack of traversed objects.
      aStack.push(a);
      bStack.push(b);

      // Recursively compare objects and arrays.
      if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) return false;
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
          if (!eq(a[length], b[length], aStack, bStack)) return false;
        }
      } else {
        // Deep compare objects.
        var keys = _.keys(a), key;
        length = keys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (_.keys(b).length !== length) return false;
        while (length--) {
          // Deep compare each member
          key = keys[length];
          if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
        }
      }
      // Remove the first object from the stack of traversed objects.
      aStack.pop();
      bStack.pop();
      return true;
    };

    // Perform a deep comparison to check if two objects are equal.
    _.isEqual = function(a, b) {
      return eq(a, b);
    };

    // Is a given array, string, or object empty?
    // An "empty" object has no enumerable own-properties.
    _.isEmpty = function(obj) {
      if (obj == null) return true;
      if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
      return _.keys(obj).length === 0;
    };

    // Is a given value a DOM element?
    _.isElement = function(obj) {
      return !!(obj && obj.nodeType === 1);
    };

    // Is a given value an array?
    // Delegates to ECMA5's native Array.isArray
    _.isArray = nativeIsArray || function(obj) {
        return toString.call(obj) === '[object Array]';
      };

    // Is a given variable an object?
    _.isObject = function(obj) {
      var type = typeof obj;
      return type === 'function' || type === 'object' && !!obj;
    };

    // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
    _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
      _['is' + name] = function(obj) {
        return toString.call(obj) === '[object ' + name + ']';
      };
    });

    // Define a fallback version of the method in browsers (ahem, IE < 9), where
    // there isn't any inspectable "Arguments" type.
    if (!_.isArguments(arguments)) {
      _.isArguments = function(obj) {
        return _.has(obj, 'callee');
      };
    }

    // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
    // IE 11 (#1621), and in Safari 8 (#1929).
    if (typeof /./ != 'function' && typeof Int8Array != 'object') {
      _.isFunction = function(obj) {
        return typeof obj == 'function' || false;
      };
    }

    // Is a given object a finite number?
    _.isFinite = function(obj) {
      return isFinite(obj) && !isNaN(parseFloat(obj));
    };

    // Is the given value `NaN`? (NaN is the only number which does not equal itself).
    _.isNaN = function(obj) {
      return _.isNumber(obj) && obj !== +obj;
    };

    // Is a given value a boolean?
    _.isBoolean = function(obj) {
      return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
    };

    // Is a given value equal to null?
    _.isNull = function(obj) {
      return obj === null;
    };

    // Is a given variable undefined?
    _.isUndefined = function(obj) {
      return obj === void 0;
    };

    // Shortcut function for checking if an object has a given property directly
    // on itself (in other words, not on a prototype).
    _.has = function(obj, key) {
      return obj != null && hasOwnProperty.call(obj, key);
    };

    // Utility Functions
    // -----------------

    // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
    // previous owner. Returns a reference to the Underscore object.
    _.noConflict = function() {
      root._ = previousUnderscore;
      return this;
    };

    // Keep the identity function around for default iteratees.
    _.identity = function(value) {
      return value;
    };

    // Predicate-generating functions. Often useful outside of Underscore.
    _.constant = function(value) {
      return function() {
        return value;
      };
    };

    _.noop = function(){};

    _.property = function(key) {
      return function(obj) {
        return obj == null ? void 0 : obj[key];
      };
    };

    // Generates a function for a given object that returns a given property.
    _.propertyOf = function(obj) {
      return obj == null ? function(){} : function(key) {
        return obj[key];
      };
    };

    // Returns a predicate for checking whether an object has a given set of
    // `key:value` pairs.
    _.matcher = _.matches = function(attrs) {
      attrs = _.extendOwn({}, attrs);
      return function(obj) {
        return _.isMatch(obj, attrs);
      };
    };

    // Run a function **n** times.
    _.times = function(n, iteratee, context) {
      var accum = Array(Math.max(0, n));
      iteratee = optimizeCb(iteratee, context, 1);
      for (var i = 0; i < n; i++) accum[i] = iteratee(i);
      return accum;
    };

    // Return a random integer between min and max (inclusive).
    _.random = function(min, max) {
      if (max == null) {
        max = min;
        min = 0;
      }
      return min + Math.floor(Math.random() * (max - min + 1));
    };

    // A (possibly faster) way to get the current timestamp as an integer.
    _.now = Date.now || function() {
        return new Date().getTime();
      };

    // List of HTML entities for escaping.
    var escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '`': '&#x60;'
    };
    var unescapeMap = _.invert(escapeMap);

    // Functions for escaping and unescaping strings to/from HTML interpolation.
    var createEscaper = function(map) {
      var escaper = function(match) {
        return map[match];
      };
      // Regexes for identifying a key that needs to be escaped
      var source = '(?:' + _.keys(map).join('|') + ')';
      var testRegexp = RegExp(source);
      var replaceRegexp = RegExp(source, 'g');
      return function(string) {
        string = string == null ? '' : '' + string;
        return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
      };
    };
    _.escape = createEscaper(escapeMap);
    _.unescape = createEscaper(unescapeMap);

    // If the value of the named `property` is a function then invoke it with the
    // `object` as context; otherwise, return it.
    _.result = function(object, property, fallback) {
      var value = object == null ? void 0 : object[property];
      if (value === void 0) {
        value = fallback;
      }
      return _.isFunction(value) ? value.call(object) : value;
    };

    // Generate a unique integer id (unique within the entire client session).
    // Useful for temporary DOM ids.
    var idCounter = 0;
    _.uniqueId = function(prefix) {
      var id = ++idCounter + '';
      return prefix ? prefix + id : id;
    };

    // By default, Underscore uses ERB-style template delimiters, change the
    // following template settings to use alternative delimiters.
    _.templateSettings = {
      evaluate    : /<%([\s\S]+?)%>/g,
      interpolate : /<%=([\s\S]+?)%>/g,
      escape      : /<%-([\s\S]+?)%>/g
    };

    // When customizing `templateSettings`, if you don't want to define an
    // interpolation, evaluation or escaping regex, we need one that is
    // guaranteed not to match.
    var noMatch = /(.)^/;

    // Certain characters need to be escaped so that they can be put into a
    // string literal.
    var escapes = {
      "'":      "'",
      '\\':     '\\',
      '\r':     'r',
      '\n':     'n',
      '\u2028': 'u2028',
      '\u2029': 'u2029'
    };

    var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

    var escapeChar = function(match) {
      return '\\' + escapes[match];
    };

    // JavaScript micro-templating, similar to John Resig's implementation.
    // Underscore templating handles arbitrary delimiters, preserves whitespace,
    // and correctly escapes quotes within interpolated code.
    // NB: `oldSettings` only exists for backwards compatibility.
    _.template = function(text, settings, oldSettings) {
      if (!settings && oldSettings) settings = oldSettings;
      settings = _.defaults({}, settings, _.templateSettings);

      // Combine delimiters into one regular expression via alternation.
      var matcher = RegExp([
          (settings.escape || noMatch).source,
          (settings.interpolate || noMatch).source,
          (settings.evaluate || noMatch).source
        ].join('|') + '|$', 'g');

      // Compile the template source, escaping string literals appropriately.
      var index = 0;
      var source = "__p+='";
      text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
        source += text.slice(index, offset).replace(escaper, escapeChar);
        index = offset + match.length;

        if (escape) {
          source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
        } else if (interpolate) {
          source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
        } else if (evaluate) {
          source += "';\n" + evaluate + "\n__p+='";
        }

        // Adobe VMs need the match returned to produce the correct offest.
        return match;
      });
      source += "';\n";

      // If a variable is not specified, place data values in local scope.
      if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

      source = "var __t,__p='',__j=Array.prototype.join," +
        "print=function(){__p+=__j.call(arguments,'');};\n" +
        source + 'return __p;\n';

      try {
        var render = new Function(settings.variable || 'obj', '_', source);
      } catch (e) {
        e.source = source;
        throw e;
      }

      var template = function(data) {
        return render.call(this, data, _);
      };

      // Provide the compiled source as a convenience for precompilation.
      var argument = settings.variable || 'obj';
      template.source = 'function(' + argument + '){\n' + source + '}';

      return template;
    };

    // Add a "chain" function. Start chaining a wrapped Underscore object.
    _.chain = function(obj) {
      var instance = _(obj);
      instance._chain = true;
      return instance;
    };

    // OOP
    // ---------------
    // If Underscore is called as a function, it returns a wrapped object that
    // can be used OO-style. This wrapper holds altered versions of all the
    // underscore functions. Wrapped objects may be chained.

    // Helper function to continue chaining intermediate results.
    var result = function(instance, obj) {
      return instance._chain ? _(obj).chain() : obj;
    };

    // Add your own custom functions to the Underscore object.
    _.mixin = function(obj) {
      _.each(_.functions(obj), function(name) {
        var func = _[name] = obj[name];
        _.prototype[name] = function() {
          var args = [this._wrapped];
          push.apply(args, arguments);
          return result(this, func.apply(_, args));
        };
      });
    };

    // Add all of the Underscore functions to the wrapper object.
    _.mixin(_);

    // Add all mutator Array functions to the wrapper.
    _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        var obj = this._wrapped;
        method.apply(obj, arguments);
        if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
        return result(this, obj);
      };
    });

    // Add all accessor Array functions to the wrapper.
    _.each(['concat', 'join', 'slice'], function(name) {
      var method = ArrayProto[name];
      _.prototype[name] = function() {
        return result(this, method.apply(this._wrapped, arguments));
      };
    });

    // Extracts the result from a wrapped and chained object.
    _.prototype.value = function() {
      return this._wrapped;
    };

    // Provide unwrapping proxy for some methods used in engine operations
    // such as arithmetic and JSON stringification.
    _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

    _.prototype.toString = function() {
      return '' + this._wrapped;
    };

    // AMD registration happens at the end for compatibility with AMD loaders
    // that may not enforce next-turn semantics on modules. Even though general
    // practice for AMD registration is to be anonymous, underscore registers
    // as a named module because, like jQuery, it is a base library that is
    // popular enough to be bundled in a third party lib, but not be part of
    // an AMD load request. Those cases could generate an error when an
    // anonymous define() is called outside of a loader request.
    if (typeof define === 'function' && define.amd) {
      define('underscore', [], function() {
        return _;
      });
    }
  }.call(this));

},{}]},{},[1]);
