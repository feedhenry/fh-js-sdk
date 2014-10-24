FieldDateTimeView = FieldView.extend({
  extension_type: 'fhdate',
  inputTime: "<input class='fh_appform_field_input col-xs-12 text-center <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='time'>",
  inputDate: "<input class='fh_appform_field_input col-xs-12 text-center   <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='date'>",
  inputDateTime: "<input class='fh_appform_field_input col-xs-12 text-center   <%= repeatingClassName%>' data-field='<%= fieldId %>' data-index='<%= index %>' type='text'>",
  renderInput:function(index){
    var fieldId = this.model.getFieldId();
    var repeatingClassName = this.model.isRepeating() ? this.repeatingClassName : this.nonRepeatingClassName;

    var unit=this.getUnit();
    var template="";
    var buttonLabel="";
    if (unit==="datetime"){
      template=this.inputDateTime;
      buttonLabel="<i class='icon-calendar'></i> <i class='icon-time'></i>&nbspGet Current Date & Time";
    }else if (unit==="date"){
      template=this.inputDate;
      buttonLabel="<i class='icon-calendar'></i>&nbspGet Current Date";
    }else if (unit==="time"){
      template=this.inputTime;
      buttonLabel="<i class='icon-time'></i>&nbspGet Current Time";
    }
    var html=_.template(template)({
      "fieldId":fieldId,
      "index":index,
      "repeatingClassName": repeatingClassName
    });

    if(!this.readonly){
      html+=this.renderButton(index,buttonLabel,"fhdate");   
    }
    

    return $(html);
  },
  getUnit:function(){
    var def=this.model.getFieldDefinition();
    return def.datetimeUnit;
  },
  onRender:function(){
    var that=this;

    if(!this.readonly){
      this.$el.on("click","button",function(){
        that.action(this);
      });  
    }
  },
  action: function(el) {
    var index=$(el).data().index;
    var self = this;
    var now=new Date();
    if (self.getUnit() === "datetime") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getDate(now)+" "+self.getTime(now)).blur();
    } else if (self.getUnit() === "date") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getDate(now)).blur();
    } else if (self.getUnit() === "time") {
      $('input[data-index="'+index+'"]', this.$el).val(self.getTime(now)).blur();
    }
  },
  getDate:function(d){
    return "YYYY-MM-DD".replace("YYYY",d.getFullYear()).replace("MM",this.twoDigi(d.getMonth()+1)).replace("DD",this.twoDigi(d.getDate()));
  },
  getTime:function(d){
    return "HH:mm".replace("HH",this.twoDigi(d.getHours())).replace("mm",this.twoDigi(d.getMinutes()));
  },
  twoDigi:function(num){
    if (num<10){
      return "0"+num.toString();
    }else{
      return num.toString();
    }
  }
});