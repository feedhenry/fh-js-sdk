/*
  jQuery plugin for wufoo rules validation i.e. Page & Field rules
  @author david.martin@feedhenry.com
  @version 0.1
 */

(function( $ ) {
  var events = {
    "text": 'focusin focusout keyup',
    "other": 'click'
  };

  var typeSelector = {
    "text": ":text, [type='password'], [type='file'], select, textarea, " +
      "[type='number'], [type='search'] ,[type='tel'], [type='url'], " +
      "[type='email'], [type='datetime'], [type='date'], [type='month'], " +
      "[type='week'], [type='time'], [type='datetime-local'], " +
      "[type='range'], [type='color']",
    "other": "[type='radio'], [type='checkbox'], select, option"
  };

  function check(value, element, params) {
    var fieldValue = params.condition.Value;
    var filter = params.condition.Filter;
    var type = element.attr('type');

    var retVal = false;

    if (['checkbox', 'radio'].indexOf(type) > -1) {
      switch (filter) {
        // ignore fieldValue as value will either be true/false depending on checked status
        case 'is':
          retVal = value;
          break;
        case 'is not':
          retVal = value;
          break;
      }
    } else if (['money', 'number'].indexOf(type) > -1) {
      switch (filter) {
        case 'is equal to':
          retVal = fieldValue === value;
          break;
        case 'is greater than':
          retVal = fieldValue < value;
          break;
        case 'is less than':
          retVal = fieldValue > value;
          break;
      }
    } else if (['date', 'time'].indexOf(type) > -1) {
      // TODO:
      // parse date/time from value
      var valueDate = new Date(value);
      var fieldValueDate = new Date(fieldValue);
      if ('time' === type) {
        // date doesn't matter
        valueDate = new Date(0, 0, 0, valueDate.getUTCHours(), valueDate.getUTCMinutes(), valueDate.getUTCSeconds(), valueDate.getUTCMilliseconds());
        fieldValueDate = new Date(0, 0, 0, fieldValueDate.getUTCHours(), fieldValueDate.getUTCMinutes(), fieldValueDate.getUTCSeconds(), fieldValueDate.getUTCMilliseconds());
      } else {
        // time doesn't matter
        valueDate = new Date(valueDate.getFullYear(), valueDate.getUTCMonth(), valueDate.getUTCDate());
        fieldValueDate = new Date(fieldValueDate.getFullYear(), fieldValueDate.getUTCMonth(), fieldValueDate.getUTCDate());
      }
      switch (filter) {
        case 'is on': // date only
          // year/month/date match
          retVal = valueDate.getTime() === fieldValueDate.getTime();
          break;
        case 'is before':
          retVal = valueDate.getTime() < fieldValueDate.getTime();
          break;
        case 'is after':
          retVal = valueDate.getTime() > fieldValueDate.getTime();
          break;
        case 'is at': // time only
          // hours/min/sec/ms match
          retVal = valueDate.getTime() === fieldValueDate.getTime();
          break;
      }
    } else { // assume some form of text field
      switch (filter) {
        case 'is':
          retVal = fieldValue === value;
          break;
        case 'is not':
          retVal = fieldValue !== value;
          break;
        case 'contains':
          retVal = value.indexOf(fieldValue) > -1;
          break;
        case 'does not contain':
          retVal = value.indexOf(fieldValue) === -1;
          break;
        case 'begins with':
          retVal = value.indexOf(fieldValue) === 0;
          break;
        case 'ends with':
          retVal = value.indexOf(fieldValue) === (value.length - fieldValue.length);
          break;
      }
    }

    params.fn(retVal, params);
  }

  // remove and bind all configured re
  function bindRules(el) {
    el.unbind();

    var elType = 'other';
    if (el.is(typeSelector.text)) {
      elType = 'text';
    }
    var elEvents = events[elType];

    el.bind(elEvents, function (e) {
      eventHandler.call(this);
    });
  }

  function eventHandler(rules) {
    var jqEl = $(this);
    rules = rules || (jqEl.data('wufoo_rules') || []);

    var value = jqEl.is(typeSelector.text) ? jqEl.val() : jqEl.is(':checked');
    $.each(rules, function (index, rule) {
      check(value, jqEl, rule);
    });
  }

  $.extend($.fn, {

    wufoo_rules : function (command, argument) {
      var element = this[0];
      if(!element) {
        $fh.logger.warn('wufoo_rules : element is null');
      }
      if (command) {
        var rules = element ?  $.data(element, 'wufoo_rules') : [];
        rules = rules || [];
        switch(command) {
        case "add": // add 1 rule
          rules.push(argument);
          $.data(element, 'wufoo_rules', rules);
          bindRules(this);
          break;
        case "remove": // remove all rules
          $.data(element, 'wufoo_rules', null);
          bindRules(this);
          return rules;
        case "exec": // exec rule right now
          rules.push(argument);
          eventHandler.call(this, rules);
          break;
        }
      }
    }
  });
})( jQuery );