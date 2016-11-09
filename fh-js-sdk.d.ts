declare module 'fh-js-sdk' {

    export interface PushNotificationData {
        alert: String;
        sound: String;
        badge: String;
        coldstart: Boolean;
        payload: {};
    }

    export interface PushConfig {
        alias: String;
        categories: Array<String>;
    }

    export interface MBaasOptions {
        service: String;
        params: {};
        timeout: Number;
    }
    
    export interface PushNotificationCallback {
        (e: PushNotificationData):void;
    }

    export interface SuccessCallback {
        (res: {}):void
    }

    export interface FailureCallback {
        (msg: String, error: {}):void;
    }

    /**
     * Sync namespace
     * @namespace sync
     */
    export namespace sync {

       interface NotificationData {
            dataset_id: String;
            uid: String;
            message?: String;
            code: String;
        }

        interface InitOptions {
            sync_frequency?: Number;
            auto_sync_local_updates?: Boolean;
            notify_client_storage_failed?: Boolean;
            notify_sync_started?: Boolean;
            notify_sync_complete?: Boolean;
            notify_offline_update?: Boolean;
            notify_collision_detected?: Boolean;
            notify_local_update_applied?: Boolean;
            notify_remote_update_failed?: Boolean;
            notify_remote_update_applied?: Boolean;
            notify_delta_received?: Boolean;
            notify_record_delta_received?: Boolean;
            notify_sync_failed?: Boolean;
            do_console_log?: Boolean;
            crashed_count_wait?: Number;
            resend_crashed_updates?: Boolean;
            sync_active?: Boolean;
            storage_strategy?: String;
            file_system_quota?: Number;
            has_custom_sync?: Boolean;
            icloud_backup?: Boolean;
        }

        type NotifyCallback = (data: NotificationData) => void

        /**
         * @param {Object} options
         * @param {Number} [options.sync_frequency=10] - How often to synchronize data with the cloud, in seconds. 
         * @param {Boolean} [options.auto_sync_local_updates=true] - Should local changes be synchronized to the cloud immediately, or should they wait for the next synchronization interval.
         * @param {Boolean} [options.notify_client_storage_failed=true] - Should a notification event be triggered when loading or saving to client storage fails.
         * @param {Boolean} [options.notify_sync_started=true] - Should a notification event be triggered when a synchronization cycle with the server has been started.
         * @param {Boolean} [options.notify_sync_complete=true] - Should a notification event be triggered when a synchronization cycle with the server has been completed.
         * @param {Boolean} [options.notify_offline_update=true] - Should a notification event be triggered when an attempt was made to update a record while offline.
         * @param {Boolean} [options.notify_collision_detected=true] - Should a notification event be triggered when an update failed due to data collision.
         * @param {Boolean} [options.notify_local_update_applied=true] - Should a notification event be triggered when an update was applied to the local data store.
         * @param {Boolean} [options.notify_remote_update_failed=true] - Should a notification event be triggered when an update failed for a reason other than data collision.
         * @param {Boolean} [options.notify_remote_update_applied=true] - Should a notification event be triggered when an update was applied to the remote data store.
         * @param {Boolean} [options.notify_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store.
         * @param {Boolean} [options.notify_record_delta_received=true] - Should a notification event be triggered when a delta was received from the remote data store for a record.
         * @param {Boolean} [options.notify_sync_failed=true] - Should a notification event be triggered when the synchronization loop failed to complete.
         * @param {Boolean} [options.do_console_log=false] - Should log statements be written to console.log. Will be useful for debugging.
         * @param {Number} [options.crashed_count_wait=10] - How many synchronization cycles to check for updates on crashed in-flight updates.
         * @param {Boolean} [options.resend_crashed_updates=true] - If crashed_count_wait limit is reached, should the client retry sending the crashed in flight pending records.
         * @param {Boolean} [options.sync_active=true] - Is the background synchronization with the cloud currently active. If this is set to false, the synchronization loop will not start automatically. You need to call startSync to start the synchronization loop.
         * @param {String} [options.storage_strategy=html5_filesystem] - Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'. Multiple values can be specified as an array and the first valid storage option will be used. If the app is running on Titanium, the only support value is 'titanium'.
         * @param {Number} [options.file_system_quota=52428800] - Amount of space to request from the HTML5 filesystem API when running in browser
         * @param {Boolean} [options.has_custom_sync=null] - If the app has legacy custom cloud sync function (the app implemented the data CRUDL operations in main.js file in FH V2 apps), it should be set to true. If set to false, the default mbaas sync implementation will be used. When set to null or undefined, a check will be performed to determine which implementation to use.
         * @param {Boolean} [options.icloud_backup=false] - iOS only. If set to true, the file will be backed by iCloud.
         */
        function init(options: InitOptions);

        /**
         * @param {Function} callback
         */
        function notify(callback: NotifyCallback);

        /**
         * @param {String} dataset_id
         * @param {Object} options
         * @param {Object} query_params
         * @param {Object} meta_data
         * @param {Function} callback
         */
        function manage(dataset_id: String, options: {}, query_params: {}, meta_data: {}, callback: () => void);

        /**
         * @param {String} dataset_id
         * @param {Function} success
         * @param {Function} failure
         */
        function doList(dataset_id: String, success: SuccessCallback, failure: FailureCallback);

        /**
         * @param {String} dataset_id
         * @param {Object} data
         * @param {Function} success
         * @param {Function} failure
         */
        function doCreate(dataset_id: String, data: {}, success: SuccessCallback, failure: FailureCallback);

        /**
         * @param {String} dataset_id
         * @param {String} uid
         * @param {Function} success
         * @param {Function} failure
         */
        function doRead(dataset_id: String, uid: String, success: SuccessCallback, failure: FailureCallback);

        /**
         * @param {String} dataset_id
         * @param {String} uid
         * @param {Object} data
         * @param {Function} success
         * @param {Function} failure
         */
        function doUpdate(dataset_id: String, uid: String, data: {}, success: SuccessCallback, failure: FailureCallback);

        /**
         * @param {String} dataset_id
         * @param {String} uid
         * @param {Function} success
         * @param {Function} failure
         */
        function doDelete(dataset_id: String, uid: String, success: SuccessCallback, failure: FailureCallback);

        /**
         * @param {String} dataset_id
         * @param {Function} success
         * @param {Function} failure
         */
        function startSync(dataset_id: String, success: SuccessCallback, failure: Function):void;

        /**
         * @param {String} dataset_id
         * @param {Function} success
         * @param {Function} failure
         */
        function stopSync(dataset_id: String, success: SuccessCallback, failure: Function):void;

        /**
         * @param {String} dataset_id
         * @param {Function} success
         * @param {Function} failure
         */
        function doSync(dataset_id: String, success: SuccessCallback, failure: Function):void;

        /**
         * @param {String} dataset_id
         * @param {Function} success
         * @param {Function} failure
         */
        function forceSync(dataset_id: String, success: SuccessCallback, failure: Function):void;
    }

    export interface FHParams {
        appid: String;
        appkey: String;
        projectid: String;
        cuid: String;
        destination: String;
        sdk_version: String;
        connectiontag: String;
    }

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     * 
     * @return {Function}
     */
    export function init(options: {}, success: SuccessCallback, failure: FailureCallback):any;

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     * 
     * @return {String} - The Cloud Host URL
     */
    export function act(options: {}, success: SuccessCallback, failure: Function):String;

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function auth(options: {}, success: SuccessCallback, failure: FailureCallback);

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function cloud(options: {}, success: SuccessCallback, failure: FailureCallback);

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function sec(options: {}, success: SuccessCallback, failure: Function);

    /**
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function hash(options: {}, success: SuccessCallback, failure: Function);

    /**
     * @param {Function} onNotification - A handler for incoming notifications.
     * @param {Function} regSuccessHandler - A callback invoked upon successful registration.
     * @param {Function} regErrorHandler - A callback invoked if the registration fails due to an error, which is then passed as a String argument.
     * @param {Object} pushConfig
     * @param {String} [pushConfig.alias] - A user-specific identifier
     * @param {Array} [pushConfig.categories] - A list of categories.
     */
    export function push(onNotification: PushNotificationCallback, regSuccessHandler: () => void, regErrorHandler: Function, pushConfig: PushConfig);

    /**
     * @param {Object} options
     * @param {String} options.service - The mbaas service name.
     * @param {Object} options.params - JSON object to send to the mbaas service.
     * @param {Number} [options.timeout=60000] - Timeout value specified in milliseconds. 
     */
    export function mbaas(options: MBaasOptions, success: SuccessCallback, failure: FailureCallback);

    /**
     * 
     */
    export function getCloudURL():String;

    /**
     * 
     */
    export function getFHParams():FHParams;

    /**
     * 
     */
    export function getFHHeaders();

    /**
     * @param {String|Symbol} type
     * @param {Function} listener
     */
    export function addListener(type: String, listener: Function);

    /**
     * @param {String|Symbol} type
     * @param {Function} listener
     */
    export function on(type: String, listener: Function);

    /**
     * @param {String|Symbol} type
     * @param {Function} listener
     */
    export function once(type: String, listener: Function);
}

