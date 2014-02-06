FieldDateTimeView = FieldView.extend({
  extension_type: 'fhdate',
  inputTime:"<div><input data-field='<%= fieldId %>' data-index='<%= index %>' type='time'></div>",
  inputDate:"<div ><input data-field='<%= fieldId %>' data-index='<%= index %>' type='date'></div>",
  inputDateTime:"<div ><input data-field='<%= fieldId %>' data-index='<%= index %>' type='text'></div>",
  renderInput:function(index){
    var fieldId = this.model.getFieldId();

    var unit=this.getUnit();
    var template="";
    var buttonLabel="";
    if (unit=="dateTime"){
      template=this.inputDateTime;
      buttonLabel="<i class='fa fa-calendar'></i> <i class='fa fa-clock-o'></i>&nbspGet Current Date & Time";
    }else if (unit=="date"){
      template=this.inputDate;
      buttonLabel="<i class='fa fa-calendar'></i>&nbspGet Current Date";
    }else if (unit=="time"){
      template=this.inputTime;
      buttonLabel="<i class='fa fa-clock-o'></i>&nbspGet Current Time";
    }
    var html=_.template(template,{
      "fieldId":fieldId,
      "index":index
    });
    html+=this.renderButton(index,buttonLabel,"fhdate");

    return html;
  },
  getUnit:function(){
    var def=this.model.getFieldDefinition();
    return def.datetimeUnit;
  },
  onRender:function(){
    var that=this;
    this.$el.on("click","button",function(){
      that.action(this);
    });
  },
  action: function(el) {
    var index=$(el).data().index;
    var self = this;
    var now=new Date();
    if (self.getUnit() === "dateTime") {
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
    return "HH:mm:ss".replace("HH",this.twoDigi(d.getHours())).replace("mm",this.twoDigi(d.getMinutes())).replace("ss",this.twoDigi(d.getSeconds()));
  },
  twoDigi:function(num){
    if (num<10){
      return "0"+num.toString();
    }else{
      return num.toString();
    }
  }
});