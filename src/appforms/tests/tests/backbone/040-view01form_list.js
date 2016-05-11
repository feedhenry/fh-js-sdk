var assert = chai.assert;

var formListView;
var App = {
    collections: {
        forms: new Backbone.Collection()
    }
};
describe("Backbone - Form List View", function() {
    it("rendering formView", function(done) {
        $fh.forms.getForms({fromRemote:true},function(err,forms){
            assert (!err);

            var parentEl = new Backbone.View();
            formListView=new FormListView({
                "model":forms,
                "parentEl": parentEl.$el
            });
            formListView.render();
            assert(parentEl.$el.find('ul li').length>0, "No Forms rendered");
            done();
        });
        
    });
});