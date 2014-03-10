var createEvent = function(type, data) {
  var event = document.createEvent('Events');
  event.initEvent(type, false, false);
  if (data) {
      for (var i in data) {
          if (data.hasOwnProperty(i)) {
              event[i] = data[i];
          }
      }
  }
  return event;
};

var fireEvent = function(type, data){
  var event = createEvent(type, data);
  document.dispatchEvent(event);
};

module.exports = {
  "createEvent": createEvent,
  "fireEvent": fireEvent
}