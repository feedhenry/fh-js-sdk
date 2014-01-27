appForm.models = function (module) {
  var Model = appForm.models.Model;
  /**
     * Describe rules associated to one field.
     * @param {[type]} param {"type":"page | field", "definition":defJson}
     */
  function Rule(param) {
    Model.call(this, { '_type': 'rule' });
    this.fromJSON(param);
  }
  appForm.utils.extend(Rule, Model);
  /**
     * Return source fields id required from input value for this rule
     * @return [fieldid1, fieldid2...] [description]
     */
  Rule.prototype.getRelatedFieldId = function () {
    var def = this.getDefinition();
    var statements = def.ruleConditionalStatements;
    var rtn = [];
    for (var i = 0; i<statements.length; i++) {
      var statement = statements[i];
      rtn.push(statement.sourceField);
    }
    return rtn;
  };
  /**
     * test if input value meet the condition
     * @param  {[type]} param {fieldId:value, fieldId2:value2}
     * @return {[type]}       true - meet rule  / false -  not meet rule
     */
  Rule.prototype.test = function (param) {
    var fields = this.getRelatedFieldId();
    var logic = this.getLogic();
    var res = logic == 'or' ? false : true;
    for (var i = 0; i< fields.length ; i++) {
      var fieldId = fields[i];
      var val = param[fieldId];
      if (val) {
        var tmpRes = this.testField(fieldId, val);
        if (logic == 'or') {
          res = res || tmpRes;
          if (res === true) {
            //break directly
            return true;
          }
        } else {
          res = res && tmpRes;
          if (res === false) {
            //break directly
            return false;
          }
        }
      } else {
        if (logic == 'or') {
          res = res || false;
        } else {
          return false;
        }
      }
    }
    return res;
  };
  /**
     * test a field if the value meets its conditon
     * @param  {[type]} fieldId [description]
     * @param  {[type]} val     [description]
     * @return {[type]}         [description]
     */
  Rule.prototype.testField = function (fieldId, val) {
    var statement = this.getRuleConditionStatement(fieldId);
    var condition = statement.restriction;
    var expectVal = statement.sourceValue;
    return appForm.models.checkRule(condition, expectVal, val);
  };
  Rule.prototype.getRuleConditionStatement = function (fieldId) {
    var statements = this.getDefinition().ruleConditionalStatements;
    for (var i = 0; i<statements.length; i++) {
      var statement = statements[i];
      if (statement.sourceField == fieldId) {
        return statement;
      }
    }
    return null;
  };
  Rule.prototype.getLogic = function () {
    var def = this.getDefinition();
    return def.ruleConditionalOperator.toLowerCase();
  };
  Rule.prototype.getDefinition = function () {
    return this.get('definition');
  };
  Rule.prototype.getAction = function () {
    var def = this.getDefinition();
    var target = {
        'action': def.type,
        'targetId': this.get('type') == 'page' ? def.targetPage : def.targetField,
        'targetType': this.get('type')
      };
    return target;
  };
  module.Rule = Rule;
  return module;
}(appForm.models || {});