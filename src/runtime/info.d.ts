///<reference path='all.d.ts' />

declare var ASSERT_ACTIVE: number;
declare var ASSERT_WARNING: number;
declare var ASSERT_BAIL: number;
declare var ASSERT_QUIET_EVAL: number;
declare var ASSERT_CALLBACK: number;

declare var CREDITS_ALL: number;
declare var CREDITS_DOC: number;
declare var CREDITS_FULLPAGE: number;
declare var CREDITS_GENERAL: number;
declare var CREDITS_GROUP: number;
declare var CREDITS_MODULES: number;
declare var CREDITS_SAPI: number;

declare var INFO_GENERAL: number;
declare var INFO_CREDITS: number;
declare var INFO_CONFIGURATION: number;
declare var INFO_MODULES: number;
declare var INFO_ENVIRONMENT: number;
declare var INFO_VARIABLES: number;
declare var INFO_LICENSE: number;
declare var INFO_ALL: number;

declare function assert_options(what: number, value?: any): any;
declare function assert(assertion: bool, description?: string): bool;
declare function assert(assertion: string, description?: string): bool;
declare function dl(library: string): bool;
declare function extension_loaded(name: string): bool;
declare function gc_collect_cycles(): number;
declare function gc_disable();
declare function gc_enable();
declare function gc_enabled(): bool;
declare function get_cfg_var(option: string): string;
declare function get_current_user(): string;
declare function get_defined_constants(categorize?: bool): Pct.PhpAssocArray;
declare function get_extension_funcs(module_name: string): string[];
declare function get_include_path(): string;
declare function get_included_files(): string[];
declare function get_loaded_extensions(zend_extensions?: bool): string[];
declare function getenv(varname: string): string;
declare function getlastmod(): number;
declare function getmygid(): number;
declare function getmyinode(): number;
declare function getmypid(): number;
declare function getmyuid(): number;
declare function getopt(options: string, longopts?: Array): Pct.PhpAssocArray;
declare function getrusage(who?: number): Pct.PhpAssocArray;
declare function ini_get(varname: string): string;
declare function ini_get_all(extension?: string, details?: bool): Pct.PhpAssocArray;
declare function ini_restore(varname: string);
declare function ini_set(varname: string, newvalue: string): string;
declare function memory_get_peak_usage(real_usage?: bool): number;
declare function memory_get_usage(real_usage?: bool): number;
declare function php_ini_loaded_file(): string;
declare function php_ini_scanned_files(): string;
declare function php_logo_guid(): string;
declare function php_sapi_name(): string;
declare function php_uname(mode?: string): string;
declare function phpcredits(flag?: number): bool;
declare function phpinfo(what?: number): bool;
declare function phpversion(extension?: string): string;
declare function putenv(setting: string): bool;
declare function restore_include_path();
declare function set_include_path(new_include_path: string): string;
declare function set_time_limit(seconds: number);
declare function sys_get_temp_dir(): string;
declare function version_compare(version1: string, version2: string): number;
declare function version_compare(version1: string, version2: string, operator: string): bool;
declare function zend_logo_guid(): string;
declare function zend_thread_id(): number;
declare function zend_version(): string;