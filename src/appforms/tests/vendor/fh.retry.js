$fh.ready({},function() {
  $fh.retry= $fh.retry || {};
  if(!$fh.retry.disable) {
    $fh.retry.toggle = function (enable){
      if (enable) {
        $fh.retry.enable()
      } else {
        $fh.retry.disable()
      }
    };
    $fh.retry.disable = function (){
      if ($fh.retry.act) {
        $fh.act = $fh.retry.act;
      }
    };
    $fh.retry.enable = function (){
      if (!$fh.retry.act) {
        $fh.retry.act = $fh.act;
        $fh.act = _.wrap($fh.act, function (func){
          $fh.logger.debug(" Act retry starting");
          var args= Array.prototype.slice.call(arguments,1);
          $fh.logger.debug("Act retry args", args[0].act , ",req=" , (args[0].req ? args[0].req.key : "null"));
          var retries = args[0].retries;
          if(retries < 0) {
            retries = 0;
          }
          $fh.logger.debug("Act retry :: max retries", retries);
          var doIt = function (o,success, failure){
            try {
              return func.call($fh, o,success, failure);
            } catch(e) {
              $fh.logger.debug("Retry error",e);
              throw e;
            }
          };

          var o = args[0];
          var success = args[1];
          var failure   = args[2];
          if(!retries ) {
            $fh.logger.debug("Retry :: not requested , only invoke once");
            return doIt(o,success,failure);
          } else {
            var complete = false;
            var count = 0;
            var response= null;
            var errors = [];

            var isCompleted = function (){return complete || count >= retries;};

            var loop = function (callback) {
              count++;
              return doIt(o,
                function handleSuccess(res){
                  $fh.logger.debug("Act :: handleSuccess res=", res);
                  complete = true;
                  response= res;
                  if(_.isObject(response)){
                    response.max_retries = retries;
                    response.count = count;
                    response.errors = errors;
                  }
                  callback();
                },
                function handleFailure(msg,err){
                  $fh.logger.debug("Act :: handleFailure err=", err,"msg=" , msg);
                  errors.push({"msg" : msg,"err" : err});
                  response = msg;
                  complete = false;
                  callback(isCompleted() ? err : null );
                });
            };
            var onComplete = function (err) {
              $fh.logger.debug("Act :: oncomplete err=", err, "response=", response);
              if(err) {
                failure(response, err);
              } else {
                success(response);
              }
            };

            async.until(isCompleted,loop,onComplete);
          }
        });
      }
    };

  }
});

