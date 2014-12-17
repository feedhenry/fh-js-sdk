// /**
//  * extension of Field class to support checkbox field
//  */

// function getCheckBoxOptions() {
//     var def = this.getFieldDefinition();
//     if (def.options) {
//         return def.options;
//     } else {
//         throw 'checkbox choice definition is not found in field definition';
//     }
// }

// function process_checkboxes(params, cb) {
//     var inputValue = params.value;
//     if (!inputValue || !inputValue.selections || !(inputValue.selections instanceof Array)) {
//         cb('the input value for processing checkbox field should be like {selections: [val1,val2]}');
//     } else {
//         cb(null, inputValue);
//     }
// }

// function convert_checkboxes(value, cb) {
//     var rtn = [];
//     for (var i = 0; i < value.length; i++) {
//         rtn.push(value[i].selections);
//     }
//     cb(null, rtn);
// }

// module.exports = {
//     getCheckBoxOptions: getCheckBoxOptions,
//     process_checkboxes: process_checkboxes,
//     convert_checkboxes: convert_checkboxes
// };