function Theme() {
    Model.call(this, {
        '_type': 'theme',
        '_ludid': 'theme_object'
    });
}
Theme.prototype.getCSS = function() {
    return this.get('css', '');
};
appForm.utils.extend(Theme, Model);

module.exports = new Theme();