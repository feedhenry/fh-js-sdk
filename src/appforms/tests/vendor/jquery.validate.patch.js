$(document).ready(function(){
  console.log("starting "+ new Date("2013-02-11"));
  if(/Invalid|NaN/.test(new Date("2013-02-11"))) {
    $.validator.methods.date = _.wrap($.validator.methods.date, function(func,value, element) {
      var v = new moment(value,"YYYY-MM-DD").format("YYYY/MM/DD");
      return func.call(this,v, element);
    });
  }
});