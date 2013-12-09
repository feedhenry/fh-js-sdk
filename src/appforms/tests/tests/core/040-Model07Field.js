describe("Field Model",function(){
    var fieldModel;
    var form=null;
    it ("Field model is initialised when a form is initialised",function(done){
        var Form = appForm.models.Form;
       new Form({formId:"527d4539639f521e0a000004",fromRemote: true}, function(err, f) {
            form=f;
            fieldModel=form.getFieldModelById("527d4539639f521e0a000006");
            assert(fieldModel);
            assert(fieldModel.get("_id") == "527d4539639f521e0a000006");
            done(); 
        });
    });
    it ("check if the field is required",function(){
        assert(!fieldModel.isRequired());
    });
    it ("get field definition (max/min repeat)",function(){
        assert(fieldModel.getFieldDefinition());
    });
    it ("get field validation",function(){
        assert(fieldModel.getFieldValidation());
    });
    it ("check if the field repeating",function(){
        assert(fieldModel.isRepeating());
    });
    it ("get general properties (name, helptext,type,field id, etc)",function(){
        assert(fieldModel.getType());
        assert(fieldModel.getFieldId());
        assert(fieldModel.getName());
        assert(fieldModel.getHelpText());
    });
    it ("how to get rules associated to a field",function(){
        var rules=fieldModel.getRules();
        assert(rules);
        assert(rules.length>0);
        var rule=rules[0];
        assert(rule instanceof appForm.models.Rule);
        
    });
    describe ("Checkbox",function(){
        it ("get checkbox options",function(){
            var checkBoxFieldModel=form.getFieldModelById("52974ee55e272dcb3d00009d");
            assert(checkBoxFieldModel.getCheckBoxOptions().length>0);
        });
    });
    describe ("Radio",function(){
        it ("get radio options",function(){
            var radioFieldModel=form.getFieldModelById("52974ee55e272dcb3d00009a");
            assert(radioFieldModel.getRadioOption().length>0);
        });
    });

    describe ("FIle",function(){
        it ("how to process a file input",function(done){
            var fileFieldId="52974ee55e272dcb3d0000a6";
            var fileField=form.getFieldModelById(fileFieldId);
            appForm.utils.fileSystem.save("myTestFile.txt","hello this is a test",function(err,res){
                assert(!err);
                appForm.utils.fileSystem.readAsFile("myTestFile.txt",function(err,file){
                    assert(!err);
                    fileField.processInput(file,function(err,json){
                        assert(!err);
                        assert(json.fileName);
                        assert(json.fileSize);
                        assert(json.fileType);
                        assert(json.fileUpdateTime);
                        assert(json.hashName);

                        done();
                    });
                });
            });
        });
    });
    // describe ("Matrix",function(){
    //     it ("get matrix rows and columns",function(){
    //         var matrixFieldModel=form.getFieldModelById("527d4539639f521e0a00000b");
    //         assert(matrixFieldModel.getMatrixRows().length>0);
    //         assert(matrixFieldModel.getMatrixCols().length>0);
    //     });
    // });
});