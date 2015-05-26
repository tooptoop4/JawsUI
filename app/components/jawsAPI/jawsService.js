/**
* Service interacting with the JAWS 1.1 API.
*/
angular.module('JawsUI.jawsService', [
	'JawsUI.constants',
	'JawsUI.config'])
.service("jawsService",[
		'$http',
		'$q',
		'CONFIG',
		function($http, $q, CONFIG) {
			// Return public API.
			return ({
				getDatabases: getDatabases,
				getDBTables: getDBTables,
				getTableColumns: getTableColumns,
				getParquetTables: getParquetTables,
				getParquetTableColumns: getParquetTableColumns,
				executeQuery: executeQuery,
				getQueryLogs: getQueryLogs,
				getQueryResults: getQueryResults,
				getQueryHistory: getQueryHistory,
				getQueryInfo: getQueryInfo,
				registerParquetTable:registerParquetTable,
				cancelQuery: cancelQuery,
				deleteQuery: deleteQuery,
				deleteParquetTable: deleteParquetTable
			});
			
			/**
			* perform an HTTP GET request to the API
			* @param {string} method the method to execute
			* @param {string} [config] custom config for the HTTP request 
			* @return {HttpPromise} a promise object
			*/
			function getRequest(method,config) {
				return $http.get(CONFIG.API_PATH+method+'&_r='+Math.random(),config);
			}
			
			/**
			* perform an HTTP DELETE request to the API
			* @param {string} method the method to execute
			* @param {string} [config] custom config for the HTTP request 
			* @return {HttpPromise} a promise object
			*/
			function deleteRequest(method,config) {
				return $http.delete(CONFIG.API_PATH+method,config);
			}			
			
			/**
			* perform an HTTP POST request to the API
			* @param {string} method the method to execute
			* @param {string} data the data to post
			* @param {string} [config] custom config for the HTTP request 
			* @return {HttpPromise} a promise object
			*/
			function postRequest(method,data,config) {
				return $http.post(CONFIG.API_PATH+method+'&_r='+Math.random(),data,config);
			}		
			
			/**
			* get available databases
			* @return {Promise} a promise object
			*/
			function getDatabases() {
				var promise = $q.defer();
				getRequest('databases?','')
					.then(function(response) {
						promise.resolve(response.data.databases);
					},function (response)  {
						promise.reject(response);
					});
				
				return promise.promise;
			}
						
			/**
			* get tables for a given database
			* @param {string} dbName the database for which to get the tables
			* @return {Promise} a promise object
			*/
			function getDBTables(dbName) {
				var promise = $q.defer();
				getRequest('tables?database='+escape(dbName)+'&describe=false')
					.then(function(response) {
						var tables = [];
						response.data[0].tables.forEach(function(table) {
							tables.push(table.name);
						});
						promise.resolve(tables);
					},function (response)  {
						promise.reject(response);
					});	
				return promise.promise;
			}
						
			/**
			* get tables for a given database
			* @param {string} dbName the database for which to get the tables
			* @return {Promise} a promise object
			*/
			function getTableColumns(dbName,table) {
				var promise = $q.defer();
				getRequest('tables?database='+escape(dbName)+'&describe=true&tables='+escape(table))
					.then(function(response) {
						var columns = [];
						response.data[0].tables[0].columns.forEach(function(column) {
							columns.push(column.name);
						});						
						promise.resolve(columns);
					},function (response)  {
						promise.reject(response);
					});	
				return promise.promise;
			}	

			/**
			* get parquet tables
			* @return {Promise} a promise object
			*/
			function getParquetTables() {
				var promise = $q.defer();
				getRequest('parquet/tables?describe=false')
					.then(function(response) {
						var tables = [];
						response.data[0].tables.forEach(function(table) {
							tables.push(table.name);
						});
						promise.resolve(tables);
					},function (response)  {
						promise.reject(response);
					});	
				return promise.promise;
			}
			
			/**
			* get columns of a parquet table
			* @param {string} table name of parquet table to get columns for
			* @return {Promise} a promise object
			*/
			function getParquetTableColumns(table) {
				var promise = $q.defer();
				getRequest('parquet/tables?describe=true&tables='+escape(table))
					.then(function(response) {
						var columns = [];
						response.data[0].tables[0].columns.forEach(function(column) {
							columns.push(column.name);
						});						
						promise.resolve(columns);
					},function (response)  {
						promise.reject(response);
					});	
				return promise.promise;
			}

			/**
			* run a given query
			* @param {string} queryStr the SQL query to execute
			* @param {boolean} limited if true the number of results returned by the query will be limited
			* @param {number} maxResults the maximum number of results to store if query is limited
			* @param {string} resultsStorage the filesystem where the results will be stored if the query is not limited
			* @return {Promise} a promise object
			*/
			function executeQuery(queryStr,limited,maxResults,resultsStorage) {
				var promise = $q.defer();
				postRequest('run?numberOfResults='+maxResults+'&limited='+(limited?'true':'false&storage='+escape(resultsStorage)),queryStr,{
					headers: {
						'Content-Type': 'text/plain'
					}})
					.then(function(response) {
						promise.resolve(response.data);
					},function (response) {
						promise.reject(response);
					});
					 
				return promise.promise;
			}
						
			/**
			* get the logs of a query
			* @param {string} queryId unique query id 
			* @param {number} startTimestamp return only logs that are newer than the given timestamp
			* @param {number} limit the maximum number of logs to return
			* @return {Promise} a promise object
			*/
			function getQueryLogs(queryId,startTimestamp,limit) {
				var promise = $q.defer();
				if (!startTimestamp)
					startTimestamp = 0;
				getRequest('logs?queryID='+escape(queryId)+'&startTimestamp='+escape(startTimestamp)+'&limit='+limit)
					.then(function(response) {
						promise.resolve(response.data);
					},function (response) {
						promise.reject(response);
					});
					 
				return promise.promise;
			}
			
			/**
			* get info about a query
			* @param {string} queryId unique query id 
			* @return {Promise} a promise object
			*/
			function getQueryInfo(queryId) {
				var promise = $q.defer();
				getRequest('queries?queryID='+escape(queryId))
					.then(function(response) {
						promise.resolve(response.data.queries[0]);
					},function (response) {
						promise.reject(response);
					});
					 
				return promise.promise;
			}
			
			/**
			* delete a stored query
			* @param {string} queryId unique query id 
			* @return {Promise} a promise object
			*/
			function deleteQuery(queryId) {
				return deleteRequest('queries/'+queryId);
			}
			
			/**
			* cancels an active query
			* @param {string} queryId unique query id 
			* @return {Promise} a promise object
			*/
			function cancelQuery(queryId) {
				return postRequest('cancel?queryID='+escape(queryId),'');
			}
			
			/**
			* get a list of queries already executed
			* @param {string} startQueryId return queries from the given queryId forward
			* @param {number} limit the maximum number of queries to return
			* @return {Promise} a promise object
			*/
			function getQueryHistory(startQueryId,limit) {
				var promise = $q.defer();
				getRequest('queries?startQueryID='+escape(startQueryId)+'&limit='+limit)
					.then(function(response) {
						promise.resolve(response.data);
					},function (response) {
						promise.reject(response);
					});
					 
				return promise.promise;			
			}

			/**
			* get results for a given query
			* @param {string} queryId return queries from the given queryId forward (0 to return from begining)
			* @param {number} offset the offset of the first result to return
			* @param {number} limit the maximum number of results to return
			* @return {Promise} a promise object
			*/
			function getQueryResults(queryId,offset,limit) {
				var promise = $q.defer();
				getRequest('results?queryID='+escape(queryId)+'&offset='+escape(offset)+'&limit='+limit)
					.then(function(response) {
						promise.resolve({"schema":response.data.schema, "results":response.data.result});
					},function (response) {
						promise.reject(response);
					});
					 
				return promise.promise;					
			}
			
			/**
			* map a file/directory to a parquet table
			* @param {string} filePath the full path of the file/directory to map
			* @param {string} tableName the name of the new parquet table
			* @return {Promise} a promise object
			*/
			function registerParquetTable(filePath,tableName){
				return postRequest('parquet/tables?path='+escape(filePath)+'&name='+escape(tableName)+'&overwrite=false','');
			}
			
			/**
			* delete a parquet table
			* @param {string} tableName the name of the parquet table
			* @return {Promise} a promise object
			*/
			function deleteParquetTable(tableName){
				return deleteRequest('parquet/tables/'+escape(tableName));
			}
			
		}
]);