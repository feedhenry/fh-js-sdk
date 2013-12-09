FieldTextView = FieldView.extend({
  template: ['<label class="desc" for="<%= id %>"><%= title %></label>', '<input class="field text medium" maxlength="255" id="<%= id %>" name="<%= id %>" type="text" value="<%= defaultVal %>">']
});