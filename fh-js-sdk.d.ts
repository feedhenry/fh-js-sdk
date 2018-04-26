// Type definitions for fh-js-sdk 2.18.0
// Project: https://github.com/feedhenry/fh-js-sdk
// Definitions by: Aiden Keating <akeating@redhat.com>

/** @module FeedHenry */
declare module FeedHenry {

    /**
     * Interface for the object with the metadata added by the FH SDK for each cloud request.
     *
     * @type FHParams
     */
    export interface FHParams {
        appid?: string;
        appkey?: string;
        projectid?: string;
        cuid?: string;
        destination?: string;
        sdk_version?: string;
        connectiontag?: string;
    }

    /**
     * Interface for the data provided within a PushNotificationCallback argument.
     *
     * @type PushNotificationData
     */
    export interface PushNotificationData {
        alert: string;
        sound: string;
        badge: string;
        coldstart: boolean;
        payload: {};
    }

    /**
     * Interface for the configuration object provided to the push command.
     *
     * @type PushOptions
     */
    export interface PushOptions {
        alias: string;
        categories: string[];
    }

    /**
     * Interface for the default error object used with the error callback in the SDK.
     *
     * @type DefaultCallbackError
     */
    export interface DefaultCallbackError {
        status: number;
        message: string;
        error: any;
    }

    /**
     * Interface for the options provided to the auth function.
     *
     * @type AuthOptions
     */
    export interface AuthOptions {
        policyId: string;
        clientToken: string;
        endRedirectUrl?: string;
        params?: any;
    }

    /**
     * Interface for the options provided to the cloud function.
     *
     * @type CloudOptions
     */
    export interface CloudOptions {
        path: string;
        method?: string;
        contentType?: string;
        data?: any;
        headers?: any;
        timeout?: number;
    }

    /**
     * Interface for the options provided to the sec function.
     *
     * @type SecOptions
     */
    export interface SecOptions {
        act: "encrypt" | "decrypt" | "keygen";
        params: {algorithm: "AES"|"RSA";
            keysize?: 128 | 256 | 1024 | 2048;
            plaintext?: string;
            ciphertext?: string;
            key?: string;
            iv?: string
        }
    }

    export interface HashOptions {
        text: string;
        algorithm?: "MD5" | "SHA1" | "SHA256" | "SHA512";
    }

    export interface MbaasOptions {
        service: string;
        params: any;
        timeout: number;
    }

    /**
     * Initializes the client SDKs.
     *
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     *
     * @returns {Function}
     */
    export function init(options: any, success: (host: string) => void, failure: (error: any) => void);

    /**
     * Deprecated - Use $fh.cloud instead
     *
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     *
     * @returns {String} - The Cloud Host URL
     */
    export function act(options: {}, success: (data: any, status: any, xhr: XMLHttpRequest) => void, failure: (message: string, error: DefaultCallbackError) => void);

    /**
     * Authenticate and optionally authorise a user via access rights management.
     *
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function auth(options: AuthOptions, success: (data:any, status:any, xhr:XMLHttpRequest) => void, failure: (message:string, error: DefaultCallbackError) => void);

    /**
     * Authenticate an existing session that is stored on device or verify one exists
     */
    export namespace auth {
      /**
       * Determines if a locally stored session token exists
       * @param {Function} callback A callback that is invoked once the token existence is determined, or if an error occurs
       */
      export function hasSession(callback: (err: any, hasSession: boolean) => void)

      /**
       * Verifies if the locally stored session token will be accepted by RHMAP servers
       * @param {Function} callback A callback that is invoked once the token validity is determined, or if an error occurs
       */
      export function verify(callback: (err: any, isValid: boolean) => void)

      /**
       * Delete the locally stored session token. Will also request that the RHMAP server revoke it
       * @param callback 
       */
      export function clearSession(callback: (err: any) => void)
    }

    /**
     * Call any cloud URLs which have been defined in the Cloud App using AJAX.
     *
     * @param {Object} options
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function cloud(options: CloudOptions, success: (data: any, status: any, xhr: XMLHttpRequest) => void, failure: (message: string, error: DefaultCallbackError) => void);

    /**
     * Key pair generation and data encryption and decryption.
     *
     * @param {Object} options
     * @param {String} options.act - One of 'hash'|'encrypt'|'decrypt'|'keygen'.
     * @param {Object} options.params - Options for the chosen act.
     * @param {String} options.params.algorithm - One of 'AES'|'RSA' (RSA only supports encrypt act).
     * @param {String} [options.params.keysize] - Required for keygen act.
     * @param {String} [options.params.plaintext] - Required for encrypt act.
     * @param {String} [options.params.key] - Required for AES encrypt and decrypt.
     * @param {String} [options.params.iv] - Initialization vector. Required for AES encrypt and decrypt acts.
     * @param {String} [options.params.ciphertext] - Required for AES decrypt act.
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function sec(options: SecOptions, success: Function, failure: (message: string, error: any, params: any) => void);

    /**
     * Generate hash value of a string.
     *
     * @param {Object} options
     * @param {String} options.text - String to hash.
     * @param {String} [options.algorithm=MD5] - Hashing algorithm.
     * @param {Function} success - A callback function to be run on success.
     * @param {Function} failure - A callback function to be run on failure.
     */
    export function hash(options: HashOptions, success: (hash: {hashvalue: string}) => void, failure: (err: string, options?: any, params?: any) => void);

    /**
     * Register with the server to start receiving push notifications.
     *
     * @param {Function} onNotification - A handler for incoming notifications.
     * @param {Function} regSuccessHandler - A callback invoked upon successful registration.
     * @param {Function} regErrorHandler - A callback invoked if the registration fails due to an error, which is then passed as a String argument.
     * @param {Object} pushConfig
     * @param {String} [pushConfig.alias] - A user-specific identifier
     * @param {Array} [pushConfig.categories] - A list of categories.
     */
    export function push(onNotification: (e: PushNotificationData) => void, regSuccessHandler: () => void, regErrorHandler: (err: string) => void, pushConfig?: PushOptions);

    /**
     * Call MBaaS service endpoints.
     *
     * @param {Object} options
     * @param {String} options.service - The mbaas service name.
     * @param {Object} options.params - JSON object to send to the mbaas service.
     * @param {Number} [options.timeout=60000] - Timeout value specified in milliseconds.
     */
    export function mbaas(options: MbaasOptions, success: (data: any, status: any, xhr: XMLHttpRequest) => void, failure: (message: string, error: DefaultCallbackError) => void);

    /**
     * Get the URL of the cloud app that the current client app is communicating with.
     *
     * @returns {String}
     */
    export function getCloudURL(): string;

    /**
     * Return the metadata added by the FH SDK for each cloud request.
     *
     * @returns {Object}
     */
    export function getFHParams(): FHParams;

    /**
     * @returns {Object}
     */
    export function getFHHeaders();

    /**
     * @param {String} type
     * @param {Function} listener
     */
    export function addListener(type: string, listener: Function);

    /**
     * @param {String} type
     * @param {Function} listener
     */
    export function on(type: string, listener: Function);

    /**
     * @param {String} type
     * @param {Function} listener
     */
    export function once(type: string, listener: Function);

    /**
     * Sync namespace
     *
     * @namespace sync
     */
    export namespace sync {

        /**
         * Interface for the data provided in the NotifyCallback in the notify function.
         *
         * @interface NotificationData
         */
        interface NotificationData {
            dataset_id: string;
            uid: string;
            message?: string;
            code: string;
        }

        /**
         * Interface for the options object provided to the init function.
         *
         * @interface SyncOptions
         */
        interface SyncOptions {
            sync_frequency?: number;
            auto_sync_local_updates?: boolean;
            notify_client_storage_failed?: boolean;
            notify_sync_started?: boolean;
            notify_sync_complete?: boolean;
            notify_offline_update?: boolean;
            notify_collision_detected?: boolean;
            notify_local_update_applied?: boolean;
            notify_remote_update_failed?: boolean;
            notify_remote_update_applied?: boolean;
            notify_delta_received?: boolean;
            notify_record_delta_received?: boolean;
            notify_sync_failed?: boolean;
            do_console_log?: boolean;
            crashed_count_wait?: number;
            resend_crashed_updates?: boolean;
            sync_active?: boolean;
            storage_strategy?: "html5-filesystem" | "dom" | "webkit-sqlite" | "indexed-db";
            file_system_quota?: number;
            has_custom_sync?: boolean;
            icloud_backup?: boolean;
        }

        /**
         * Interface for the callback used in the notify function.
         *
         * @interface NotifyCallback
         */
        interface NotifyCallback {
            (data: NotificationData)
        }

        /**
         * Initialize the client data sync service.
         *
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
         * @param {String} [options.storage_strategy=html5_filesystem] - Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'. Multiple values can be specified as an array and the first valid storage option will be used.
         * @param {Number} [options.file_system_quota=52428800] - Amount of space to request from the HTML5 filesystem API when running in browser
         * @param {Boolean} [options.has_custom_sync=null] - If the app has legacy custom cloud sync function (the app implemented the data CRUDL operations in main.js file in FH V2 apps), it should be set to true. If set to false, the default mbaas sync implementation will be used. When set to null or undefined, a check will be performed to determine which implementation to use.
         * @param {Boolean} [options.icloud_backup=false] - iOS only. If set to true, the file will be backed by iCloud.
         */
        function init(options: SyncOptions);

        /**
         * Register a callback function to be invoked when the sync service has notifications to communicate to the client.
         *
         * @param {Function} callback
         */
        function notify(callback: NotifyCallback);

        /**
         * Put a dataset under the management of the sync service.
         *
         * @param {String} datasetId
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
         * @param {String} [options.storage_strategy=html5_filesystem] - Storage strategy to use for the underlying client storage framework Lawnchair. Valid values include 'dom', 'html5-filesystem', 'webkit-sqlite', 'indexed-db'. Multiple values can be specified as an array and the first valid storage option will be used.
         * @param {Number} [options.file_system_quota=52428800] - Amount of space to request from the HTML5 filesystem API when running in browser
         * @param {Boolean} [options.has_custom_sync=null] - If the app has legacy custom cloud sync function (the app implemented the data CRUDL operations in main.js file in FH V2 apps), it should be set to true. If set to false, the default mbaas sync implementation will be used. When set to null or undefined, a check will be performed to determine which implementation to use.
         * @param {Boolean} [options.icloud_backup=false] - iOS only. If set to true, the file will be backed by iCloud.
         * @param {Object} query_params
         * @param {Object} meta_data
         * @param {Function} callback
         */
        function manage(datasetId: string, options: SyncOptions, query_params: {}, meta_data: {}, callback: () => void);

        /**
         * Get a list of the records for the dataset.
         *
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function doList(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * Update the data associated with the unique id.
         *
         * @param {String} datasetId
         * @param {Object} data
         * @param {Function} success
         * @param {Function} [failure]
         */
        function doCreate(datasetId: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Read a single data record.
         *
         * @param {String} datasetId
         * @param {String} uid
         * @param {Function} success
         * @param {Function} failure
         */
        function doRead(datasetId: string, uid: string, success: (record: any) => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Update the data associated with the unique id.
         *
         * @param {String} datasetId
         * @param {String} uid
         * @param {Object} data
         * @param {Function} success
         * @param {Function} failure
         */
        function doUpdate(datasetId: string, uid: string, data: any, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Delete the data associated with the unique id.
         *
         * @param {String} datasetId
         * @param {String} uid
         * @param {Function} success
         * @param {Function} failure
         */
        function doDelete(datasetId: string, uid: string, success: (obj: any) => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Start the sync loop if `sync_active` option is set to false.
         *
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function startSync(datasetId: string, success: () => void, failure: Function);

        /**
         * Stop the sync loop for a dataset.
         *
         * @param {String} datasetId
         * @param {Function} [success]
         * @param {Function} [failure]
         */
        function stopSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Run the sync loop almost immediately (within next 500 ms) if `sync_active` is true.
         *
         * @param {String} datasetId
         * @param {Function} [success]
         * @param {Function} [failure]
         */
        function doSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void);

        /**
         * Run the sync loop almost immediately (within next 500 ms) even if `sync_active` is false.
         *
         * @param {String} datasetId
         * @param {Function} [success]
         * @param {Function} [failure]
         */
        function forceSync(datasetId: string, success?: () => void, failure?: (err: string, datasetId: string) => void);

        /**
         * List collisions in sync
         *
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function listCollisions(datasetId: string, success: (res: any) => void, failure: (msg: string, err: any) => void);

        /**
         * Remove a collision in sync
         *
         * @param {String} datasetId
         * @param {String} collisionHash
         * @param {Function} success
         * @param {Function} failure
         */
        function removeCollision(datasetId: string, collisionHash: string, success: (res: any) => void, failure: (msg: string, err: any) => void);

        /**
         * @param {String} datasetId
         * @param {Function} callback
         */
        function getPending(datasetId: string, callback: (pending: any) => void);

        /**
         * @param {String} datasetId
         * @param {Function} callback
         */
        function clearPending(datasetId: string, callback: () => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function getDataSet(datasetId: string, success: (dataset: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function getQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function setQueryParams(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function getMetaData(datasetId: string, success: (queryParams: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function setMetaData(datasetId: string, metaData: any, success: (metaData: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function getConfig(datasetId: string, success: (config: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function setConfig(datasetId: string, config: any, success: (config: any) => void, failure: (err: string, datasetId: string) => void);

        /**
         * Produces a SHA1 hash of the provided object (sorted before hash) or string.
         *
         * @param {Object|String} toHash - Object to hash
         * @returns {String} - SHA1 hash of the provided string or object.
         */
        function generateHash(toHash: {} | string): string;

        /**
         * @param {String} datasetId
         * @param {Function} success
         * @param {Function} failure
         */
        function loadDataSet(datasetId: string, success: (dataset: any) => void, failure: () => void);

        /**
         * @param {String} datasetId
         * @param {Function} callback
         */
        function checkHasCustomSync(datasetId: string, callback: () => void);

        /**
         * @param {String} datasetId
         * @param {Function} callback
         */
        function clearCache(datasetId: string, callback?: () => void);
    }
}

export = FeedHenry;
