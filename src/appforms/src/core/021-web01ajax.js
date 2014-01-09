appForm.web.ajax = (function(module) {
    module=typeof $fh!="undefined" && $fh.__ajax?$fh.__ajax:_myAjax;
    module.get = get;       
    module.post = post;

    var _ajax=module;
    function _myAjax(){
        //TODO my ajax deifinition.
    }
    function get(url,cb){
        _ajax({
            "url":url,
            "type":"GET",
            "success":function(data,text){
                cb(null,data);
            },
            "error":function(xhr,status,err){
                cb(xhr);
            }
        });
    }
    function post(url,body,cb){
        var file=false;
        var formData;
        if (typeof body == "object"){
            if (body instanceof File ){
                file=true;
                formData=new FormData();
                var name=body.name;
                formData.append(name,body);
                body=formData;
            }else{
                body=JSON.stringify(body);
            }
            
        }
        var param={
            "url":url,
            "type":"POST",
            "data":body,
            "dataType":"json",
            "success":function(data,text){
                cb(null,data);
            },
            "error":function(xhr,status,err){
                cb(xhr);
            }
        };
        if (file==false){
            param.contentType="application/json";
        }
        _ajax(param);
    }
    // function createXMLHttpRequest() {
    //     try {
    //         return new XMLHttpRequest();
    //     } catch (e) {}
    //     try {
    //         return new ActiveXObject("Msxml2.XMLHTTP");
    //     } catch (e) {}
    //     return null;
    // }

    // function get(url, cb) {
    //     var xhReq = createXMLHttpRequest();
    //     if (!xhReq) {
    //         cb({
    //             error: 'XMLHttpRequest is not supported',
    //             status: 'not ok'
    //         }, null);
    //     }

    //     xhReq.open("get", url, true);
    //     xhReq.send(null);

    //     var requestTimer = setTimeout(function() {
    //         xhReq.abort();
    //     }, appForm.config.get("timeoutTime"));

    //     xhReq.onreadystatechange = function() {
    //         if (xhReq.readyState !== 4) {
    //             return;
    //         }
    //         //Clear the timer. Request was succesful.
    //         clearTimeout(requestTimer);
    //         var serverResponse = xhReq.responseText;
    //         if (xhReq.status !== 200) {
    //             return cb({
    //                 error: 'Status not 200!',
    //                 status: 'not ok',
    //                 statusCode: xhReq.status,
    //                 body: serverResponse
    //             }, null);
    //         }
    //         return cb(null, {
    //             status: 'ok',
    //             statusCode: xhReq.status,
    //             response: serverResponse
    //         });
    //     };
    // }

    // function post(url, body, cb) {
    //     var xhReq = createXMLHttpRequest();
    //     if (!xhReq) {
    //         cb({
    //             error: 'XMLHttpRequest is not supported',
    //             status: 'not ok'
    //         }, null);
    //     }

    //     xhReq.open("POST", url, true);
    //     //Send the header information along with the request
    //     xhReq.setRequestHeader("Content-type", "application/json");
    //     xhReq.setRequestHeader("Connection", "close");
    //     xhReq.send(body);

    //     var requestTimer = setTimeout(function() {
    //         xhReq.abort();
    //     }, appForm.config.get("timeoutTime"));

    //     xhReq.onreadystatechange = function() {
    //         if (xhReq.readyState !== 4) {
    //             return;
    //         }
    //         //Clear the timer. Request was succesful.
    //         clearTimeout(requestTimer);
    //         var serverResponse = xhReq.responseText;
    //         if (xhReq.status !== 200) {
    //             return cb({
    //                 error: 'Status not 200!',
    //                 status: 'not ok',
    //                 statusCode: xhReq.status,
    //                 body: serverResponse
    //             }, null);
    //         }
    //         return cb(null, {
    //             status: 'ok',
    //             statusCode: xhReq.status,
    //             response: serverResponse
    //         });
    //     };
    // }

    return module;
})(appForm.web.ajax || {});