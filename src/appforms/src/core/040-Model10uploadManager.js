/**
 * Manages submission uploading tasks
 */
appForm.models = function (module) {
  var Model = appForm.models.Model;
  function UploadManager() {
    var self = this;
    Model.call(self, {
      '_type': 'uploadManager',
      '_ludid': 'uploadManager_queue'
    });

    self.set('taskQueue', []);
    self.sending = false;
    self.timerInterval = 200;
    self.sendingStart = appForm.utils.getTime();
  }
  appForm.utils.extend(UploadManager, Model);

  /**
     * Queue a submission to uploading tasks queue
     * @param  {[type]} submissionModel [description]
     * @param {Function} cb callback once finished
     * @return {[type]}                 [description]
     */
  UploadManager.prototype.queueSubmission = function (submissionModel, cb) {
    $fh.forms.log.d("Queueing Submission for uploadManager");
    var utId;
    var uploadTask = null;
    var self = this;

    self.checkOnlineStatus(function(){
      if($fh.forms.config.isOnline()){
        if (submissionModel.getUploadTaskId()) {
          utId = submissionModel.getUploadTaskId();
        } else {
          uploadTask = appForm.models.uploadTask.newInstance(submissionModel);
          utId = uploadTask.getLocalId();
        }
        self.push(utId);
        if (!self.timer) {
          $fh.forms.log.d("Starting timer for uploadManager");
          self.start();
        }
        if (uploadTask) {
          uploadTask.saveLocal(function (err) {
            if (err) {
              $fh.forms.log.e(err);
            }
            self.saveLocal(function (err) {
              if (err) {
                $fh.forms.log.e("Error saving upload manager: " + err);
              }
              cb(null, uploadTask);
            });
          });
        } else {
          self.saveLocal(function (err) {
            if (err) {
              $fh.forms.log.e("Error saving upload manager: " + err);
            }
            self.getTaskById(utId, cb);
          });
        }
      } else {
        return cb("Working offline cannot submit form.");
      }
    });
  };

  /**
     * cancel a submission uploading
     * @param  {[type]}   submissionsModel [description]
     * @param  {Function} cb               [description]
     * @return {[type]}                    [description]
     */
  UploadManager.prototype.cancelSubmission = function (submissionsModel, cb) {
    var uploadTId = submissionsModel.getUploadTaskId();
    var queue = this.get('taskQueue');
    if (uploadTId) {
      var index = queue.indexOf(uploadTId);
      if (index > -1) {
        queue.splice(index, 1);
      }
      this.getTaskById(uploadTId, function (err, task) {
        if (err) {
          $fh.forms.log.e(err);
          cb(err, task);
        } else {
          if (task) {
            task.clearLocal(cb);
          } else {
            cb(null, null);
          }
        }
      });
      this.saveLocal(function (err) {
        if (err){
          $fh.forms.log.e(err);
        }
      });
    } else {
      cb(null, null);
    }
  };

  UploadManager.prototype.getTaskQueue = function () {
    return this.get('taskQueue', []);
  };
  /**
     * start a timer
     * @param  {} interval ms
     * @return {[type]}      [description]
     */
  UploadManager.prototype.start = function () {
    var that = this;
    that.stop();
    that.timer = setInterval(function () {
      that.tick();
    }, this.timerInterval);
  };
  /**
     * stop uploading
     * @return {[type]} [description]
     */
  UploadManager.prototype.stop = function () {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  };
  UploadManager.prototype.push = function (uploadTaskId) {
    this.get('taskQueue').push(uploadTaskId);
    this.saveLocal(function (err) {
      if (err){
        $fh.forms.log.e("Error saving local Upload manager", err);
      }
    });
  };
  UploadManager.prototype.shift = function () {
    var shiftedTask = this.get('taskQueue').shift();
    this.saveLocal(function (err) {
      if (err) {
        $fh.forms.log.e(err);
      }
    });
    return shiftedTask;
  };
  UploadManager.prototype.rollTask = function () {
    this.push(this.shift());
  };
  UploadManager.prototype.tick = function () {
    var self = this;
    if (self.sending) {
      var now = appForm.utils.getTime();
      var timePassed = now.getTime() - self.sendingStart.getTime();
      if (timePassed > $fh.forms.config.get("timeout") * 1000) {
        //time expired. roll current task to the end of queue
        $fh.forms.log.e('Uploading content timeout. it will try to reupload.');
        self.sending = false;
        self.rollTask();
      }
    } else {
      if (self.hasTask()) {
        self.sending = true;
        self.sendingStart = appForm.utils.getTime();

        self.getCurrentTask(function (err, task) {
          if (err || !task) {
            $fh.forms.log.e(err);
            self.sending = false;
          } else {
            if (task.isCompleted() || task.isError()) {
              //current task uploaded or aborted by error. shift it from queue
              self.shift();
              self.sending = false;
              self.saveLocal(function (err) {
                if(err){
                  $fh.forms.log.e("Error saving upload manager: ", err);
                }
              });
            } else {
              self.checkOnlineStatus(function(){
                if($fh.forms.config.isOnline()){
                  task.uploadTick(function (err) {
                    if(err){
                      $fh.forms.log.e("Error on upload tick: ", err, task);
                    }

                    //callback when finished. ready for next upload command
                    self.sending = false;
                  });
                } else {
                  $fh.forms.log.d("Upload Manager: Tick: Not online.");
                }
              });
            }
          }
        });
      } else {
        //no task . stop timer.
        self.stop();
      }
    }
  };
  UploadManager.prototype.hasTask = function () {
    return this.get('taskQueue').length > 0;
  };
  UploadManager.prototype.getCurrentTask = function (cb) {
    var taskId = this.getTaskQueue()[0];
    if (taskId) {
      this.getTaskById(taskId, cb);
    } else {
      cb(null, null);
    }
  };
  UploadManager.prototype.checkOnlineStatus = function (cb) {
    appForm.stores.dataAgent.checkOnlineStatus(cb);
  };
  UploadManager.prototype.getTaskById = function (taskId, cb) {
    appForm.models.uploadTask.fromLocal(taskId, cb);
  };
  module.uploadManager = new UploadManager();
  return module;
}(appForm.models || {});