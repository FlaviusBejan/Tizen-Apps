//////////////////////////////////////////////////
// INDEXED DATABASE
// Documentation: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB

// This should be changes if from the final version of the code we add new objects or indexes to it
var M_DB_NAME = "Users";
var M_DB_VERSION = 1;
var M_DB_STORE_NAME = "authorizations";
var M_DB;

// PRIVATE

var _createDB = function() {
	if (!window.indexedDB) {
		console.error("Does not support IndexedDB");
		alert("Does not support IndexedDB");
    } else {
    	// Opening DB
        var request = window.indexedDB.open(M_DB_NAME, M_DB_VERSION);

        request.onerror = function(event) {
        	console.error(event.target.error);
        };
        
        request.onsuccess = function(event) {
        	// Save the IDBDatabase interface
        	M_DB = event.target.result;
        };
        
        request.onupgradeneeded = function (event) {
        	// Save the IDBDatabase interface
        	M_DB = event.target.result;
            
            try {
            	// Create the Object Store that will hold information about the authorizations.
            	// Refresh tokens are valid until the user revokes access. (Google Documentation)
            	var objectStore = M_DB.createObjectStore(M_DB_STORE_NAME, { keyPath: "refresh_token" });
            }
            catch(ex) {
            	console.error(ex);
            }
        };
    }
};

// This is only for development usage !!!
var _deleteDB = function() {
	window.indexedDB.deleteDatabase(M_DB_NAME);
	console.log(M_DB_NAME + " was deleted");
};

var _getObjectStore = function(store_name, mode) {
    var transaction = M_DB.transaction(store_name, mode);
    return transaction.objectStore(store_name);
};


// PUBLIC

var addAuthToDB = function(data) {
	// The data must have the "refresh_token" key so that we can identify it in the table

	var request = _getObjectStore(M_DB_STORE_NAME, "readwrite").add(data);
	
	request.onerror = function(event) {
		console.error(event.target.error);
	};
};

var updateAuthFromDB = function(newData) {
	console.dir(newData);
	
	// The data must have the "email" key so that we can display the user
	
	var objectStore = _getObjectStore(M_DB_STORE_NAME, "readwrite");
	var request = objectStore.get(newData.email);
	
	request.onerror = function(event) {
		console.error(event.target.error);
	};
	
	request.onsuccess = function(event) {
		// Put this updated object back into the database.
		var requestUpdate = objectStore.put(newData);
		
		requestUpdate.onerror = function(event) {
			console.error(event.target.error);
		};
	};
};

var getAuthFromDB = function(refresh_token, callback) {
	var request = _getObjectStore(M_DB_STORE_NAME, "readonly").get(refresh_token);
	
	request.onerror = function(event) {
		console.error(event.target.error);
		callback({});
	};
	
	request.onsuccess = function(event) {
		console.dir();
		callback(event.target.result);
	};
};

var getAllAuthFromDB = function(callback) {
	var request = _getObjectStore(M_DB_STORE_NAME, "readonly").getAll();
	
	request.onerror = function(event) {
		console.error(event.target.error);
		callback([]);
	};
	
	request.onsuccess = function(event) {
		console.dir(event.target.result);
		callback(event.target.result);
	};
	
};

var deleteAuthFromDB = function(email) {
	var request = _getObjectStore(M_DB_STORE_NAME, "readwrite").delete(email);
	
	request.onerror = function(event) {
		console.error(event.target.error);
	};
};


// INITIALIZATION

//_deleteDB();
_createDB();