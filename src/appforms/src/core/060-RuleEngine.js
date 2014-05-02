/*! fh-forms - v0.5.10 -  */
/*! async - v0.2.9 -  */
/*! 2014-05-02 */
/* This is the prefix file */
if(appForm){
  appForm.RulesEngine=rulesEngine;
}

function rulesEngine (formDef) {
  var define = {};
  var module = {exports:{}}; // create a module.exports - async will load into it
/* jshint ignore:start */
/* End of prefix file */

/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = setImmediate;
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

/* This is the infix file */
/* jshint ignore:end */
  var asyncLoader = module.exports;  // async has updated this, now save in our var, to that it can be returned from our dummy require
  function require() {
    return asyncLoader;
  }

/* End of infix file */

(function () {

  var async = require('async');

  /*
   * Sample Usage
   *
   * var engine = formsRulesEngine(form-definition);
   *
   * engine.validateForms(form-submission, function(err, res) {});
   *      res:
   *      {
   *          "validation": {
   *              "fieldId": {
   *                  "fieldId": "",
   *                  "valid": true,
   *                  "errorMessages": [
   *                      "length should be 3 to 5",
   *                      "should not contain dammit",
   *                      "should repeat at least 2 times"
   *                  ]
   *              },
   *              "fieldId1": {
   *
   *              }
   *          }
   *      }
   *
   *
   * engine.validateField(fieldId, submissionJSON, function(err,res) {});
   *      // validate only field values on validation (no rules, no repeat checking)
   *      res:
   *      "validation":{
   *              "fieldId":{
   *                  "fieldId":"",
   *                  "valid":true,
   *                  "errorMessages":[
   *                      "length should be 3 to 5",
   *                      "should not contain dammit"
   *                  ]
   *              }
   *          }
   *
   * engine.checkRules(submissionJSON, unction(err, res) {})
   *      // check all rules actions
   *      res:
   *      {
   *          "actions": {
   *              "pages": {
   *                  "targetId": {
   *                      "targetId": "",
   *                      "action": "show|hide"
   *                  }
   *              },
   *              "fields": {
   *
   *              }
   *          }
   *      }
   *
   */

  var FIELD_TYPE_CHECKBOX = "checkboxes";
  var FIELD_TYPE_DATETIME = "dateTime";
  var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY = "date";
  var FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY = "time";
  var FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME = "datetime";

  var formsRulesEngine = function (formDef) {
    var initialised;

    var definition = formDef;
    var submission;

    var fieldMap = {};
    var requiredFieldMap = {};
    var submissionRequiredFieldsMap = {}; // map to hold the status of the required fields per submission
    var fieldRulePredicateMap = {};
    var fieldRuleSubjectMap = {};
    var pageRulePredicateMap = {};
    var pageRuleSubjectMap = {};
    var submissionFieldsMap = {};
    var validatorsMap = {
      "text": validatorString,
      "textarea": validatorString,
      "number": validatorNumericString,
      "emailAddress": validatorEmail,
      "dropdown": validatorDropDown,
      "radio": validatorDropDown,
      "checkboxes": validatorCheckboxes,
      "location": validatorLocation,
      "locationMap": validatorLocationMap,
      "photo": validatorFile,
      "signature": validatorFile,
      "file": validatorFile,
      "dateTime": validatorDateTime,
      "url": validatorString,
      "sectionBreak": validatorSection
    };

    var validatorsClientMap = {
      "text": validatorString,
      "textarea": validatorString,
      "number": validatorNumericString,
      "emailAddress": validatorEmail,
      "dropdown": validatorDropDown,
      "radio": validatorDropDown,
      "checkboxes": validatorCheckboxes,
      "location": validatorLocation,
      "locationMap": validatorLocationMap,
      "photo": validatorAnyFile,
      "signature": validatorAnyFile,
      "file": validatorAnyFile,
      "dateTime": validatorDateTime,
      "url": validatorString,
      "sectionBreak": validatorSection
    };

    var isFieldRuleSubject = function (fieldId) {
      return !!fieldRuleSubjectMap[fieldId];
    };

    var isPageRuleSubject = function (pageId) {
      return !!pageRuleSubjectMap[pageId];
    };

    function buildFieldMap(cb) {
      // Iterate over all fields in form definition & build fieldMap
      async.each(definition.pages, function (page, cbPages) {
        async.each(page.fields, function (field, cbFields) {
          field.pageId = page._id;

          field.fieldOptions = field.fieldOptions ? field.fieldOptions : {};
          field.fieldOptions.definition = field.fieldOptions.definition ? field.fieldOptions.definition : {};
          field.fieldOptions.validation = field.fieldOptions.validation ? field.fieldOptions.validation : {};

          fieldMap[field._id] = field;
          if (field.required) {
            requiredFieldMap[field._id] = {
              field: field,
              submitted: false,
              validated: false
            };
          }
          return cbFields();
        }, function (err) {
          return cbPages();
        });
      }, cb);
    }

    function buildFieldRuleMaps(cb) {
      // Iterate over all rules in form definition & build ruleSubjectMap
      async.each(definition.fieldRules, function (rule, cbRules) {
        async.each(rule.ruleConditionalStatements, function (ruleConditionalStatement, cbRuleConditionalStatements) {
          var fieldId = ruleConditionalStatement.sourceField;
          fieldRulePredicateMap[fieldId] = fieldRulePredicateMap[fieldId] || [];
          fieldRulePredicateMap[fieldId].push(rule);
          return cbRuleConditionalStatements();
        }, function (err) {
          fieldRuleSubjectMap[rule.targetField] = fieldRuleSubjectMap[rule.targetField] || [];
          fieldRuleSubjectMap[rule.targetField].push(rule);
          return cbRules();
        });
      }, cb);
    }

    function buildPageRuleMap(cb) {
      // Iterate over all rules in form definition & build ruleSubjectMap
      async.each(definition.pageRules, function (rule, cbRules) {
        var rulesId = rule._id;
        async.each(rule.ruleConditionalStatements, function (ruleConditionalStatement, cbRulePredicates) {
          var fieldId = ruleConditionalStatement.sourceField;
          pageRulePredicateMap[fieldId] = pageRulePredicateMap[fieldId] || [];
          pageRulePredicateMap[fieldId].push(rule);
          return cbRulePredicates();
        }, function (err) {
          pageRuleSubjectMap[rule.targetPage] = pageRuleSubjectMap[rule.targetPage] || [];
          pageRuleSubjectMap[rule.targetPage].push(rule);
          return cbRules();
        });
      }, cb);
    }

    function buildSubmissionFieldsMap(cb) {
      submissionRequiredFieldsMap = JSON.parse(JSON.stringify(requiredFieldMap)); // clone the map for use with this submission
      submissionFieldsMap = {}; // start with empty map, rulesEngine can be called with multiple submissions

      // iterate over all the fields in the submissions and build a map for easier lookup
      async.each(submission.formFields, function (formField, cb) {
        if (!formField.fieldId) return cb(new Error("No fieldId in this submission entry: " + util.inspect(formField)));

        submissionFieldsMap[formField.fieldId] = formField;
        return cb();
      }, cb);
    }

    function init(cb) {
      if (initialised) return cb();
      async.parallel([
        buildFieldMap,
        buildFieldRuleMaps,
        buildPageRuleMap
      ], function (err) {
        if (err) return cb(err);
        initialised = true;
        return cb();
      });
    }

    function initSubmission(formSubmission, cb) {
      init(function (err) {
        if (err) return cb(err);

        submission = formSubmission;
        buildSubmissionFieldsMap(cb);
      });
    }

    function getPreviousFieldValues(submittedField, previousSubmission, cb) {
      if (previousSubmission && previousSubmission.formFields) {
        async.filter(previousSubmission.formFields, function (formField, cb) {
          return cb(formField.fieldId.toString() == submittedField.fieldId.toString());
        }, function (results) {
          var previousFieldValues = null;
          if (results && results[0] && results[0].fieldValues) {
            previousFieldValues = results[0].fieldValues;
          }
          return cb(undefined, previousFieldValues);
        });
      } else {
        return cb();
      }
    }

    function validateForm(submission, previousSubmission, cb) {
      if ("function" === typeof previousSubmission) {
        cb = previousSubmission;
        previousSubmission = null;
      }
      init(function (err) {
        if (err) return cb(err);

        initSubmission(submission, function (err) {
          if (err) return cb(err);

          async.waterfall([

            function (cb) {
              return cb(undefined, {
                validation: {
                  valid: true
                }
              }); // any invalid fields will set this to false
            },
            function (res, cb) {
              validateSubmittedFields(res, previousSubmission, cb);
            },
            checkIfRequiredFieldsNotSubmitted
          ], function (err, results) {
            if (err) return cb(err);

            return cb(undefined, results);
          });
        });
      });
    }

    function validateSubmittedFields(res, previousSubmission, cb) {
      // for each field, call validateField
      async.each(submission.formFields, function (submittedField, callback) {
        var fieldID = submittedField.fieldId;
        var fieldDef = fieldMap[fieldID];

        getPreviousFieldValues(submittedField, previousSubmission, function (err, previousFieldValues) {
          if (err) return callback(err);
          getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, function (err, fieldRes) {
            if (err) return callback(err);

            if (!fieldRes.valid) {
              res.validation.valid = false; // indicate invalid form if any fields invalid
              res.validation[fieldID] = fieldRes; // add invalid field info to validate form result
            }

            return callback();
          });

        });
      }, function (err) {
        if (err) {
          return cb(err);
        }
        return cb(undefined, res);
      });
    }

    function checkIfRequiredFieldsNotSubmitted(res, cb) {
      async.each(Object.keys(submissionRequiredFieldsMap), function (requiredFieldId, cb) {
        var resField = {};
        if (!submissionRequiredFieldsMap[requiredFieldId].submitted) {
          isFieldVisible(requiredFieldId, true, function (err, visible) {
            if (err) return cb(err);
            if (visible) { // we only care about required fields if they are visible
              resField.fieldId = requiredFieldId;
              resField.valid = false;
              resField.fieldErrorMessage = ["Required Field Not Submitted"];
              res.validation[requiredFieldId] = resField;
              res.validation.valid = false;
            }
            return cb();
          });
        } else { // was included in submission
          return cb();
        }
      }, function (err) {
        if (err) return cb(err);
        return cb(undefined, res);
      });
    }

    /*
     * validate only field values on validation (no rules, no repeat checking)
     *     res:
     *     "validation":{
     *             "fieldId":{
     *                 "fieldId":"",
     *                 "valid":true,
     *                 "errorMessages":[
     *                     "length should be 3 to 5",
     *                     "should not contain dammit"
     *                 ]
     *             }
     *         }
     */
    function validateField(fieldId, submission, cb) {
      init(function (err) {
        if (err) return cb(err);

        initSubmission(submission, function (err) {
          if (err) return cb(err);

          var submissionField = submissionFieldsMap[fieldId];
          var fieldDef = fieldMap[fieldId];
          getFieldValidationStatus(submissionField, fieldDef, null, function (err, res) {
            if (err) return cb(err);
            var ret = {
              validation: {}
            };
            ret.validation[fieldId] = res;
            return cb(undefined, ret);
          });
        });
      });
    }

    /*
     * validate only single field value (no rules, no repeat checking)
     * cb(err, result)
     * example of result:
     * "validation":{
     *         "fieldId":{
     *             "fieldId":"",
     *             "valid":true,
     *             "errorMessages":[
     *                 "length should be 3 to 5",
     *                 "should not contain dammit"
     *             ]
     *         }
     *     }
     */
    function validateFieldValue(fieldId, inputValue, valueIndex, cb) {
      if ("function" === typeof valueIndex) {
        cb = valueIndex;
        valueIndex = 0;
      }

      init(function (err) {
        if (err) return cb(err);
        var fieldDefinition = fieldMap[fieldId];

        var required = false;
        if (fieldDefinition.repeating &&
          fieldDefinition.fieldOptions &&
          fieldDefinition.fieldOptions.definition &&
          fieldDefinition.fieldOptions.definition.minRepeat) {
          required = (valueIndex < fieldDefinition.fieldOptions.definition.minRepeat);
        } else {
          required = fieldDefinition.required;
        }

        var validation = (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) ? fieldDefinition.fieldOptions.validation : undefined;

        if (validation && false === validation.validateImmediately) {
          var ret = {
            validation: {}
          };
          ret.validation[fieldId] = {
            "valid": true
          };
          return cb(undefined, ret);
        }

        if (fieldEmpty(inputValue)) {
          if (required) {
            return formatResponse("No value specified for required input", cb);
          } else {
            return formatResponse(undefined, cb); // optional field not supplied is valid
          }
        }

        // not empty need to validate
        getClientValidatorFunction(fieldDefinition.type, function (err, validator) {
          if (err) return cb(err);

          validator(inputValue, fieldDefinition, undefined, function (err) {
            var message;
            if (err) {
              if (err.message) {
                message = err.message;
              } else {
                message = "Unknown error message";
              }
            }
            formatResponse(message, cb);
          });
        });
      });

      function formatResponse(msg, cb) {
        var messages = {
          errorMessages: []
        };
        if (msg) {
          messages.errorMessages.push(msg);
        }
        return createValidatorResponse(fieldId, messages, function (err, res) {
          if (err) return cb(err);
          var ret = {
            validation: {}
          };
          ret.validation[fieldId] = res;
          return cb(undefined, ret);
        });
      }
    }

    function createValidatorResponse(fieldId, messages, cb) {
      // intentionally not checking err here, used further down to get validation errors
      var res = {};
      res.fieldId = fieldId;
      res.errorMessages = messages.errorMessages || [];
      res.fieldErrorMessage = messages.fieldErrorMessage || [];
      async.some(res.errorMessages, function (item, cb) {
        return cb(item !== null);
      }, function (someErrors) {
        res.valid = !someErrors && (res.fieldErrorMessage.length < 1);

        return cb(undefined, res);
      });
    }

    function getFieldValidationStatus(submittedField, fieldDef, previousFieldValues, cb) {
      validateFieldInternal(submittedField, fieldDef, previousFieldValues, function (err, messages) {
        if (err) return cb(err);
        createValidatorResponse(submittedField.fieldId, messages, cb);
      });
    }

    function getMapFunction(key, map, cb) {
      var validator = map[key];
      if (!validator) {
        return cb(new Error("Invalid Field Type " + key));
      }

      return cb(undefined, validator);
    }

    function getValidatorFunction(fieldType, cb) {
      return getMapFunction(fieldType, validatorsMap, cb);
    }

    function getClientValidatorFunction(fieldType, cb) {
      return getMapFunction(fieldType, validatorsClientMap, cb);
    }

    function fieldEmpty(fieldValue) {
      return ('undefined' === typeof fieldValue || null === fieldValue || "" === fieldValue); // empty string also regarded as not specified
    }

    function validateFieldInternal(submittedField, fieldDef, previousFieldValues, cb) {
      if ("function" === typeof previousFieldValues) {
        cb = previousFieldValues;
        previousFieldValues = null;
      }

      countSubmittedValues(submittedField, function (err, numSubmittedValues) {
        if (err) return cb(err);
        async.series({
          valuesSubmitted: async.apply(checkValueSubmitted, submittedField, fieldDef),
          repeats: async.apply(checkRepeat, numSubmittedValues, fieldDef),
          values: async.apply(checkValues, submittedField, fieldDef, previousFieldValues)
        }, function (err, results) {
          if (err) return cb(err);

          var fieldErrorMessages = [];
          if (results.valuesSubmitted) {
            fieldErrorMessages.push(results.valuesSubmitted);
          }
          if (results.repeats) {
            fieldErrorMessages.push(results.repeats);
          }
          return cb(undefined, {
            fieldErrorMessage: fieldErrorMessages,
            errorMessages: results.values
          });
        });
      });

      return; // just functions below this

      function checkValueSubmitted(submittedField, fieldDefinition, cb) {
        if (!fieldDefinition.required) return cb(undefined, null);
        var valueSubmitted = submittedField && submittedField.fieldValues && (submittedField.fieldValues.length > 0);
        if (!valueSubmitted) {
          return cb(undefined, "No value submitted for field " + fieldDefinition.name);
        }
        return cb(undefined, null);
      }

      function countSubmittedValues(submittedField, cb) {
        var numSubmittedValues = 0;
        if (submittedField && submittedField.fieldValues && submittedField.fieldValues.length > 0) {
          for (var i = 0; i < submittedField.fieldValues.length; i += 1) {
            if (submittedField.fieldValues[i]) {
              numSubmittedValues += 1;
            }
          }
        }
        return cb(undefined, numSubmittedValues);
      }

      function checkRepeat(numSubmittedValues, fieldDefinition, cb) {

        if (fieldDefinition.repeating && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.definition) {
          if (fieldDefinition.fieldOptions.definition.minRepeat) {
            if (numSubmittedValues < fieldDefinition.fieldOptions.definition.minRepeat) {
              return cb(undefined, "Expected min of " + fieldDefinition.fieldOptions.definition.minRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
            }
          }

          if (fieldDefinition.fieldOptions.definition.maxRepeat) {
            if (numSubmittedValues > fieldDefinition.fieldOptions.definition.maxRepeat) {
              return cb(undefined, "Expected max of " + fieldDefinition.fieldOptions.definition.maxRepeat + " values for field " + fieldDefinition.name + " but got " + numSubmittedValues);
            }
          }
        } else {
          if (numSubmittedValues > 1) {
            return cb(undefined, "Should not have multiple values for non-repeating field");
          }
        }

        return cb(undefined, null);
      }

      function checkValues(submittedField, fieldDefinition, previousFieldValues, cb) {
        getValidatorFunction(fieldDefinition.type, function (err, validator) {
          if (err) return cb(err);
          async.map(submittedField.fieldValues, function (fieldValue, cb) {
            if (fieldEmpty(fieldValue)) {
              return cb(undefined, null);
            } else {
              validator(fieldValue, fieldDefinition, previousFieldValues, function (validationError) {
                var errorMessage;
                if (validationError) {
                  errorMessage = validationError.message || "Error during validation of field";
                } else {
                  errorMessage = null;
                }

                if (submissionRequiredFieldsMap[fieldDefinition._id]) { // set to true if at least one value
                  submissionRequiredFieldsMap[fieldDefinition._id].submitted = true;
                }

                return cb(undefined, errorMessage);
              });
            }
          }, function (err, results) {
            if (err) return cb(err);

            return cb(undefined, results);
          });
        });
      }

    }

    function convertSimpleFormatToRegex(field_format_string) {
      var regex = "^";
      var C = "c".charCodeAt(0);
      var N = "n".charCodeAt(0);

      var i;
      var ch;
      var match;
      var len = field_format_string.length;
      for (i = 0; i < len; i += 1) {
        ch = field_format_string.charCodeAt(i);
        switch (ch) {
          case C:
            match = "[a-zA-Z0-9]";
            break;
          case N:
            match = "[0-9]";
            break;
          default:
            var num = ch.toString(16).toUpperCase();
            match = "\\u" + ("0000" + num).substr(-4);
            break;
        }
        regex += match;
      }
      return regex + "$";
    }

    function validFormatRegex(fieldValue, field_format_string) {
      var pattern = new RegExp(field_format_string);
      return pattern.test(fieldValue);
    }

    function validFormat(fieldValue, field_format_mode, field_format_string) {
      var regex;
      if ("simple" === field_format_mode) {
        regex = convertSimpleFormatToRegex(field_format_string);
      } else if ("regex" === field_format_mode) {
        regex = field_format_string;
      } else { // should never be anything else, but if it is then default to simple format
        regex = convertSimpleFormatToRegex(field_format_string);
      }

      return validFormatRegex(fieldValue, regex);
    }

    function validatorString(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof fieldValue !== "string") {
        return cb(new Error("Expected string but got " + typeof(fieldValue)));
      }

      var validation = {};
      if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
        validation = fieldDefinition.fieldOptions.validation;
      }

      var field_format_mode = validation.field_format_mode || "";
      field_format_mode = field_format_mode.trim();
      var field_format_string = validation.field_format_string || "";
      field_format_string = field_format_string.trim();

      if (field_format_string && (field_format_string.length > 0) && field_format_mode && (field_format_mode.length > 0)) {
        if (!validFormat(fieldValue, field_format_mode, field_format_string)) {
          return cb(new Error("field value in incorrect format, expected format: " + field_format_string + " but submission value is: " + fieldValue));
        }
      }

      if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
        if (fieldValue.length < fieldDefinition.fieldOptions.validation.min) {
          return cb(new Error("Expected minimum string length of " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
        }
      }

      if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.max) {
        if (fieldValue.length > fieldDefinition.fieldOptions.validation.max) {
          return cb(new Error("Expected maximum string length of " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue.length + ". Submitted val: " + fieldValue));
        }
      }

      return cb();
    }

    function validatorNumericString(fieldValue, fieldDefinition, previousFieldValues, cb) {
      var testVal = (fieldValue - 0); // coerce to number (or NaN)
      var numeric = (testVal == fieldValue); // testVal co-erced to numeric above, so numeric comparison and NaN != NaN
      if (!numeric) {
        return cb(new Error("Expected numeric but got: " + fieldValue));
      }

      return validatorNumber(testVal, fieldDefinition, previousFieldValues, cb);
    }

    function validatorNumber(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof fieldValue !== "number") {
        return cb(new Error("Expected number but got " + typeof(fieldValue)));
      }

      if (fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation && fieldDefinition.fieldOptions.validation.min) {
        if (fieldValue < fieldDefinition.fieldOptions.validation.min) {
          return cb(new Error("Expected minimum Number " + fieldDefinition.fieldOptions.validation.min + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
        }
      }

      if (fieldDefinition.fieldOptions.validation.max) {
        if (fieldValue > fieldDefinition.fieldOptions.validation.max) {
          return cb(new Error("Expected maximum Number " + fieldDefinition.fieldOptions.validation.max + " but submission is " + fieldValue + ". Submitted number: " + fieldValue));
        }
      }

      return cb();
    }

    function validatorEmail(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof(fieldValue) !== "string") {
        return cb(new Error("Expected string but got " + typeof(fieldValue)));
      }

      if (fieldValue.match(/[-0-9a-zA-Z.+_]+@[-0-9a-zA-Z.+_]+\.[a-zA-Z]{2,4}/g) === null) {
        return cb(new Error("Invalid email address format: " + fieldValue));
      } else {
        return cb();
      }
    }

    function validatorDropDown(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof(fieldValue) !== "string") {
        return cb(new Error("Expected submission to be string but got " + typeof(fieldValue)));
      }

      //Check value exists in the field definition
      if (!fieldDefinition.fieldOptions.definition.options) {
        return cb(new Error("No options exist for field " + fieldDefinition.name));
      }

      async.some(fieldDefinition.fieldOptions.definition.options, function (dropdownOption, cb) {
        return cb(dropdownOption.label === fieldValue);
      }, function (found) {
        if (!found) {
          return cb(new Error("Invalid option specified: " + fieldValue));
        } else {
          return cb();
        }
      });
    }

    function validatorCheckboxes(fieldValue, fieldDefinition, previousFieldValues, cb) {
      var minVal;
      if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
        minVal = fieldDefinition.fieldOptions.validation.min;
      }
      var maxVal;
      if (fieldDefinition && fieldDefinition.fieldOptions && fieldDefinition.fieldOptions.validation) {
        maxVal = fieldDefinition.fieldOptions.validation.max;
      }

      if (minVal) {
        if (fieldValue.selections === null || fieldValue.selections === undefined || fieldValue.selections.length < minVal) {
          var len;
          if (fieldValue.selections) {
            len = fieldValue.selections.length;
          }
          return cb(new Error("Expected a minimum number of selections " + minVal + " but got " + len));
        }
      }

      if (maxVal) {
        if (fieldValue.selections) {
          if (fieldValue.selections.length > maxVal) {
            return cb(new Error("Expected a maximum number of selections " + maxVal + " but got " + fieldValue.selections.length));
          }
        }
      }

      var optionsInCheckbox = [];

      async.eachSeries(fieldDefinition.fieldOptions.definition.options, function (choice, cb) {
        for (var choiceName in choice) {
          optionsInCheckbox.push(choice[choiceName]);
        }
        return cb();
      }, function (err) {
        async.eachSeries(fieldValue.selections, function (selection, cb) {
          if (typeof(selection) !== "string") {
            return cb(new Error("Expected checkbox submission to be string but got " + typeof(selection)));
          }

          if (optionsInCheckbox.indexOf(selection) === -1) {
            return cb(new Error("Checkbox Option " + selection + " does not exist in the field."));
          }

          return cb();
        }, cb);
      });
    }

    function validatorLocationMap(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (fieldValue.lat && fieldValue["long"]) {
        if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
          return cb(new Error("Invalid latitude and longitude values"));
        } else {
          return cb();
        }
      } else {
        return cb(new Error("Invalid object for locationMap submission"));
      }
    }


    function validatorLocation(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (fieldDefinition.fieldOptions.definition.locationUnit === "latlong") {
        if (fieldValue.lat && fieldValue["long"]) {
          if (isNaN(parseFloat(fieldValue.lat)) || isNaN(parseFloat(fieldValue["long"]))) {
            return cb(new Error("Invalid latitude and longitude values"));
          } else {
            return cb();
          }
        } else {
          return cb(new Error("Invalid object for latitude longitude submission"));
        }
      } else {
        if (fieldValue.zone && fieldValue.eastings && fieldValue.northings) {
          //Zone must be 3 characters, eastings 6 and northings 9
          return validateNorthingsEastings(fieldValue, cb);
        } else {
          return cb(new Error("Invalid object for northings easting submission. Zone, Eastings and Northings elemets are required"));
        }
      }

      function validateNorthingsEastings(fieldValue, cb) {
        if (typeof(fieldValue.zone) !== "string" || fieldValue.zone.length === 0) {
          return cb(new Error("Invalid zone definition for northings and eastings location. " + fieldValue.zone));
        }

        var east = parseInt(fieldValue.eastings, 10);
        if (isNaN(east)) {
          return cb(new Error("Invalid eastings definition for northings and eastings location. " + fieldValue.eastings));
        }

        var north = parseInt(fieldValue.northings, 10);
        if (isNaN(north)) {
          return cb(new Error("Invalid northings definition for northings and eastings location. " + fieldValue.northings));
        }

        return cb();
      }
    }

    function validatorAnyFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
      // if any of the following validators return ok, then return ok.
      validatorBase64(fieldValue, fieldDefinition, previousFieldValues, function (err) {
        if (!err) {
          return cb();
        }
        validatorFile(fieldValue, fieldDefinition, previousFieldValues, function (err) {
          if (!err) {
            return cb();
          }
          validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, function (err) {
            if (!err) {
              return cb();
            }
            return cb(err);
          });
        });
      });
    }

    function checkFileSize(fieldDefinition, fieldValue, sizeKey, cb) {
      fieldDefinition = fieldDefinition || {};
      var fieldOptions = fieldDefinition.fieldOptions || {};
      var fieldOptionsDef = fieldOptions.definition || {};
      var fileSizeMax = fieldOptionsDef.file_size || null; //FileSizeMax will be in KB. File size is in bytes

      if (fileSizeMax !== null) {
        var fieldValueSize = fieldValue[sizeKey];
        var fieldValueSizeKB = 1;
        if (fieldValueSize > 1000) {
          fieldValueSizeKB = fieldValueSize / 1000;
        }
        console.log("Comparing File Size: ", fileSizeMax, fieldValueSize);
        if (fieldValueSize > (fileSizeMax * 1000)) {
          return cb(new Error("File size is too large. File can be a maximum of " + fileSizeMax + "KB. Size of file selected: " + fieldValueSizeKB + "KB"));
        } else {
          return cb();
        }
      } else {
        return cb();
      }
    }

    function validatorFile(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof fieldValue !== "object") {
        return cb(new Error("Expected object but got " + typeof(fieldValue)));
      }

      var keyTypes = [
        {
          keyName: "fileName",
          valueType: "string"
        },
        {
          keyName: "fileSize",
          valueType: "number"
        },
        {
          keyName: "fileType",
          valueType: "string"
        },
        {
          keyName: "fileUpdateTime",
          valueType: "number"
        },
        {
          keyName: "hashName",
          valueType: "string"
        }
      ];

      async.each(keyTypes, function (keyType, cb) {
        var actualType = typeof fieldValue[keyType.keyName];
        if (actualType !== keyType.valueType) {
          return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
        }
        if (keyType.keyName === "fileName" && fieldValue[keyType.keyName].length <= 0) {
          return cb(new Error("Expected value for " + keyType.keyName));
        }

        return cb();
      }, function (err) {
        if (err) return cb(err);

        checkFileSize(fieldDefinition, fieldValue, "fileSize", function (err) {
          if (err) {
            return cb(err);
          }

          if (fieldValue.hashName.indexOf("filePlaceHolder") > -1) { //TODO abstract out to config
            return cb();
          } else if (previousFieldValues && previousFieldValues.hashName && previousFieldValues.hashName.indexOf(fieldValue.hashName) > -1) {
            return cb();
          } else {
            return cb(new Error("Invalid file placeholder text" + fieldValue.hashName));
          }
        });
      });
    }

    function validatorFileObj(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if ((typeof File !== "function")) {
        return cb(new Error("Expected File object but got " + typeof(fieldValue)));
      }

      var keyTypes = [
        {
          keyName: "name",
          valueType: "string"
        },
        {
          keyName: "size",
          valueType: "number"
        }
      ];

      async.each(keyTypes, function (keyType, cb) {
        var actualType = typeof fieldValue[keyType.keyName];
        if (actualType !== keyType.valueType) {
          return cb(new Error("Expected " + keyType.valueType + " but got " + actualType));
        }
        if (actualType === "string" && fieldValue[keyType.keyName].length <= 0) {
          return cb(new Error("Expected value for " + keyType.keyName));
        }
        if (actualType === "number" && fieldValue[keyType.keyName] <= 0) {
          return cb(new Error("Expected > 0 value for " + keyType.keyName));
        }

        return cb();
      }, function (err) {
        if (err) return cb(err);


        checkFileSize(fieldDefinition, fieldValue, "size", function (err) {
          if (err) {
            return cb(err);
          }
          return cb();
        });
      });
    }

    function validatorBase64(fieldValue, fieldDefinition, previousFieldValues, cb) {
      if (typeof fieldValue !== "string") {
        return cb(new Error("Expected base64 string but got " + typeof(fieldValue)));
      }

      if (fieldValue.length <= 0) {
        return cb(new Error("Expected base64 string but was empty"));
      }

      return cb();
    }

    function validatorDateTime(fieldValue, fieldDefinition, previousFieldValues, cb) {
      var testDate;
      var valid = false;
      var parts = [];

      if (typeof(fieldValue) !== "string") {
        return cb(new Error("Expected string but got " + typeof(fieldValue)));
      }

      switch (fieldDefinition.fieldOptions.definition.datetimeUnit) {
        case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:

          parts = fieldValue.split("/");
          valid = parts.length === 3;

          if(valid){
            valid = isNumberBetween(parts[2], 1, 31);
          }

          if(valid){
            valid = isNumberBetween(parts[1], 1, 12);
          }

          if(valid){
            valid = isNumberBetween(parts[0], 1000, 9999);
          }

          try {
            if(valid){
              testDate = new Date(parts[3], parts[1], parts[0]);
            } else {
              testDate = new Date(fieldValue);
            }
            valid = (testDate.toString() !== "Invalid Date");
          } catch (e) {
            valid = false;
          }

          if (valid) {
            return cb();
          } else {
            return cb(new Error("Invalid date value " + fieldValue + ". Date format is YYYY/MM/DD"));
          }
          break;
        case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
          parts = fieldValue.split(':');
          valid = (parts.length === 2) || (parts.length === 3);
          if (valid) {
            valid = isNumberBetween(parts[0], 0, 23);
          }
          if (valid) {
            valid = isNumberBetween(parts[1], 0, 59);
          }
          if (valid && (parts.length === 3)) {
            valid = isNumberBetween(parts[2], 0, 59);
          }
          if (valid) {
            return cb();
          } else {
            return cb(new Error("Invalid time value " + fieldValue + ". Time format is HH:MM:SS"));
          }
          break;
        case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
          parts = fieldValue.split(/[- :]/);

          valid = (parts.length === 6) || (parts.length === 5);

          if(valid){
            valid = isNumberBetween(parts[2], 1, 31);
          }

          if(valid){
            valid = isNumberBetween(parts[1], 1, 12);
          }

          if(valid){
            valid = isNumberBetween(parts[0], 1000, 9999);
          }

          if (valid) {
            valid = isNumberBetween(parts[3], 0, 23);
          }
          if (valid) {
            valid = isNumberBetween(parts[4], 0, 59);
          }
          if (valid && parts.length === 6) {
            valid = isNumberBetween(parts[5], 0, 59);
          } else {
            parts[5] = 0;
          }

          try {
            if(valid){
              testDate = new Date(parts[0], parts[1], parts[2], parts[3], parts[4], parts[5]);
            } else {
              testDate = new Date(fieldValue);
            }

            valid = (testDate.toString() !== "Invalid Date")
          } catch (e) {
            valid = false;
          }

          if(valid){
            return cb();
          } else {
            return cb(new Error("Invalid dateTime string " + fieldValue + ". dateTime format is YYYY/MM/DD HH:MM:SS"));
          }
          break;
        default:
          return cb(new Error("Invalid dateTime fieldtype " + fieldDefinition.fieldOptions.definition.datetimeUnit));
      }
    }

    function validatorSection(value, fieldDefinition, previousFieldValues, cb) {
      return cb(new Error("Should not submit section field: " + fieldDefinition.name));
    }

    function rulesResult(rules, cb) {
      var visible = true;

      // Itterate over each rule that this field is a predicate of
      async.each(rules, function (rule, cbRule) {
        // For each rule, itterate over the predicate fields and evaluate the rule
        var predicateMapQueries = [];
        var predicateMapPassed = [];
        async.each(rule.ruleConditionalStatements, function (ruleConditionalStatement, cbPredicates) {
          var field = fieldMap[ruleConditionalStatement.sourceField];
          var passed = false;
          var submissionValues = [];
          var condition;
          var testValue;
          if (submissionFieldsMap[ruleConditionalStatement.sourceField] && submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues) {
            submissionValues = submissionFieldsMap[ruleConditionalStatement.sourceField].fieldValues;
            condition = ruleConditionalStatement.restriction;
            testValue = ruleConditionalStatement.sourceValue;

            // Validate rule predictes on the first entry only.
            passed = isConditionActive(field, submissionValues[0], testValue, condition);
          }
          predicateMapQueries.push({
            "field": field,
            "submissionValues": submissionValues,
            "condition": condition,
            "testValue": testValue,
            "passed": passed
          });

          if (passed) {
            predicateMapPassed.push(field);
          }
          return cbPredicates();
        }, function (err) {
          if (err) cbRule(err);

          function rulesPassed(condition, passed, queries) {
            return ((condition === "and") && ((passed.length == queries.length))) || // "and" condition - all rules must pass
              ((condition === "or") && ((passed.length > 0))); // "or" condition - only one rule must pass
          }

          if (rulesPassed(rule.ruleConditionalOperator, predicateMapPassed, predicateMapQueries)) {
            visible = (rule.type === "show");
          } else {
            visible = (rule.type !== "show");
          }
          return cbRule();
        });
      }, function (err) {
        if (err) return cb(err);

        return cb(undefined, visible);
      });
    }

    function isPageVisible(pageId, cb) {
      init(function (err) {
        if (err) return cb(err);

        if (isPageRuleSubject(pageId)) { // if the page is the target of a rule
          return rulesResult(pageRuleSubjectMap[pageId], cb); // execute page rules
        } else {
          return cb(undefined, true); // if page is not subject of any rule then must be visible
        }
      });
    }

    function isFieldVisible(fieldId, checkContainingPage, cb) {
      /*
       * fieldId = Id of field to check for reule predeciate references
       * checkContainingPage = if true check page containing field, and return false if the page is hidden
       */
      init(function (err) {
        if (err) return cb(err);

        // Fields are visable by default
        var visible = true;

        var field = fieldMap[fieldId];
        if (!fieldId) return cb(new Error("Field does not exist in form"));

        async.waterfall([

          function testPage(cb) {
            if (checkContainingPage) {
              isPageVisible(field.pageId, cb);
            } else {
              return cb(undefined, true);
            }
          },
          function testField(pageVisible, cb) {
            if (!pageVisible) { // if page containing field is not visible then don't need to check field
              return cb(undefined, false);
            }

            if (isFieldRuleSubject(fieldId)) { // If the field is the subject of a rule it may have been hidden
              return rulesResult(fieldRuleSubjectMap[fieldId], cb); // execute field rules
            } else {
              return cb(undefined, true); // if not subject of field rules then can't be hidden
            }
          }
        ], cb);
      });
    }

    /*
     * check all rules actions
     *      res:
     *      {
     *          "actions": {
     *              "pages": {
     *                  "targetId": {
     *                      "targetId": "",
     *                      "action": "show|hide"
     *                  }
     *              },
     *              "fields": {
     *              }
     *          }
     *      }
     */
    function checkRules(submissionJSON, cb) {
      init(function (err) {
        if (err) return cb(err);

        initSubmission(submissionJSON, function (err) {
          if (err) return cb(err);
          var actions = {};

          async.parallel([

            function (cb) {
              actions.fields = {};
              async.eachSeries(Object.keys(fieldRuleSubjectMap), function (fieldId, cb) {
                isFieldVisible(fieldId, false, function (err, fieldVisible) {
                  if (err) return cb(err);
                  actions.fields[fieldId] = {
                    targetId: fieldId,
                    action: (fieldVisible ? "show" : "hide")
                  };
                  return cb();
                });
              }, cb);
            },
            function (cb) {
              actions.pages = {};
              async.eachSeries(Object.keys(pageRuleSubjectMap), function (pageId, cb) {
                isPageVisible(pageId, function (err, pageVisible) {
                  if (err) return cb(err);
                  actions.pages[pageId] = {
                    targetId: pageId,
                    action: (pageVisible ? "show" : "hide")
                  };
                  return cb();
                });
              }, cb);
            }
          ], function (err) {
            if (err) return cb(err);

            return cb(undefined, {
              actions: actions
            });
          });
        });
      });
    }

    return {
      validateForm: validateForm,
      validateField: validateField,
      validateFieldValue: validateFieldValue,
      checkRules: checkRules,

      // The following are used internally, but exposed for tests
      validateFieldInternal: validateFieldInternal,
      initSubmission: initSubmission,
      isFieldVisible: isFieldVisible,
      isConditionActive: isConditionActive
    };
  };

  function isNumberBetween(num, min, max) {
    var numVal = parseInt(num, 10);
    return (!isNaN(numVal) && (numVal >= min) && (numVal <= max));
  }

  function cvtTimeToSeconds(fieldValue) {
    var seconds = 0;
    if (typeof fieldValue === "string") {
      var parts = fieldValue.split(':');
      valid = (parts.length === 2) || (parts.length === 3);
      if (valid) {
        valid = isNumberBetween(parts[0], 0, 23);
        seconds += (parseInt(parts[0], 10) * 60 * 60);
      }
      if (valid) {
        valid = isNumberBetween(parts[1], 0, 59);
        seconds += (parseInt(parts[1], 10) * 60);
      }
      if (valid && (parts.length === 3)) {
        valid = isNumberBetween(parts[2], 0, 59);
        seconds += parseInt(parts[2], 10);
      }
    }
    return seconds;
  }

  function isConditionActive(field, fieldValue, testValue, condition) {

    var fieldType = field.type;
    var fieldOptions = field.fieldOptions ? field.fieldOptions : {};

    function numericalComparison(condition, fieldValue, testValue){
      var fieldValNum = parseInt(fieldValue, 10);
      var testValNum = parseInt(testValue, 10);  

      if(isNaN(fieldValNum) || isNaN(testValNum)){
        return false;
      }

      if ("is equal to" === condition) {
        return fieldValNum === testValNum;
      } else if ("is less than" === condition) {
        return fieldValNum < testValNum;
      } else if ("is greater than" === condition) {
        return fieldValNum > testValNum; 
      } else {
        return false;
      }
    }

    var valid = true;
    if ("is equal to" === condition) {
      valid = numericalComparison("is equal to", fieldValue, testValue);
    } else if ("is greater than" === condition) {
      valid = numericalComparison("is greater than", fieldValue, testValue);
    } else if ("is less than" === condition) {
      valid = numericalComparison("is less than", fieldValue, testValue);
    } else if ("is at" === condition) {
      valid = false;
      if (fieldType === FIELD_TYPE_DATETIME) {
        switch (fieldOptions.definition.datetimeUnit) {
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
            try {
              valid = (new Date(new Date(fieldValue).toDateString()).getTime() == new Date(new Date(testValue).toDateString()).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
            valid = cvtTimeToSeconds(fieldValue) === cvtTimeToSeconds(testValue);
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
            try {
              valid = (new Date(fieldValue).getTime() == new Date(testValue).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          default:
            valid = false; // TODO should raise error here?
            break;
        }
      }
    } else if ("is before" === condition) {
      valid = false;
      if (fieldType === FIELD_TYPE_DATETIME) {
        switch (fieldOptions.definition.datetimeUnit) {
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
            try {
              valid = (new Date(new Date(fieldValue).toDateString()).getTime() < new Date(new Date(testValue).toDateString()).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
            valid = cvtTimeToSeconds(fieldValue) < cvtTimeToSeconds(testValue);
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
            try {
              valid = (new Date(fieldValue).getTime() < new Date(testValue).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          default:
            valid = false; // TODO should raise error here?
            break;
        }
      }
    } else if ("is after" === condition) {
      valid = false;
      if (fieldType === FIELD_TYPE_DATETIME) {
        switch (fieldOptions.definition.datetimeUnit) {
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATEONLY:
            try {
              valid = (new Date(new Date(fieldValue).toDateString()).getTime() > new Date(new Date(testValue).toDateString()).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_TIMEONLY:
            valid = cvtTimeToSeconds(fieldValue) > cvtTimeToSeconds(testValue);
            break;
          case FIELD_TYPE_DATETIME_DATETIMEUNIT_DATETIME:
            try {
              valid = (new Date(fieldValue).getTime() > new Date(testValue).getTime());
            } catch (e) {
              valid = false;
            }
            break;
          default:
            valid = false; // TODO should raise error here?
            break;
        }
      }
    } else if ("is" === condition) {
      if (fieldType === FIELD_TYPE_CHECKBOX) {
        valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) !== -1;
      } else {
        valid = fieldValue === testValue;
      }
    } else if ("is not" === condition) {
      if (fieldType === FIELD_TYPE_CHECKBOX) {
        valid = fieldValue && fieldValue.selections && fieldValue.selections.indexOf(testValue) === -1;
      } else {
        valid = fieldValue !== testValue;
      }
    } else if ("contains" === condition) {
      valid = fieldValue.indexOf(testValue) !== -1;
    } else if ("does not contain" === condition) {
      valid = fieldValue.indexOf(testValue) === -1;
    } else if ("begins with" === condition) {
      valid = fieldValue.substring(0, testValue.length) === testValue;
    } else if ("ends with" === condition) {
      valid = fieldValue.substring(Math.max(0, (fieldValue.length - testValue.length)), fieldValue.length) === testValue;
    } else {
      valid = false;
    }

    return valid;
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = formsRulesEngine;
  }

}());
/* This is the suffix file */
  return module.exports(formDef);
}

/* End of suffix file */