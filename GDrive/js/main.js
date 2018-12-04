
window.onload = function () {
	
//////////////////////////////////////////////////
// HTML CALLS
	
    // Add eventListener for tizenhwkey
    document.addEventListener('tizenhwkey', function(e) {
        if(e.keyName === "back") {
			try {
			    tizen.application.getCurrentApplication().exit();
			} catch (ignore) {
			}
        }
    });

    // Sample code
    var textbox = document.querySelector('.contents');
    textbox.addEventListener("click", function(){
    	var box = document.querySelector('#textbox');
    	box.innerHTML = box.innerHTML === "Basic" ? "Sample" : "Basic";
    	
    	getGoogleDeviceAndUserCode();
    });
    
    
    
//////////////////////////////////////////////////
// INDEXED DATABASE
// Documentation: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
    
    // This should be changes if from the final version of the code we add new objects or indexes to it
    var M_DB_NAME = "Users";
    var M_DB_VERSION = 1;
    var M_DB_STORE_NAME = "authorizations";
    var M_DB;
    
    var createDB = function() {
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
    var deleteDB = function() {
    	window.indexedDB.deleteDatabase(M_DB_NAME);
    	console.log(M_DB_NAME + " was deleted");
    };
    
    var getObjectStore = function(store_name, mode) {
        var transaction = M_DB.transaction(store_name, mode);
        return transaction.objectStore(store_name);
    };
    
    var addToDB = function(data) {
    	// The data must have the "email" key so that we can identify it in the table
	
    	var request = getObjectStore(M_DB_STORE_NAME, "readwrite").add(data);
    	
    	request.onerror = function(event) {
			console.error(event.target.error);
		};
    };
    
    var updateDBEntry = function(newData) {
    	console.dir(newData);
    	
    	// The data must have the "email" key so that we can display the user
    	
    	var objectStore = getObjectStore(M_DB_STORE_NAME, "readwrite");
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
    
    var getDBAuthByEmail = function(email, callback) {
    	var request = getObjectStore(M_DB_STORE_NAME, "readonly").get(email);
    	
    	request.onerror = function(event) {
    		console.error(event.target.error);
    		callback({});
    	};
    	
    	request.onsuccess = function(event) {
    		console.dir();
    		callback(event.target.result);
    	};
    };
    
    var getDBAllAuth = function(callback) {
    	var request = getObjectStore(M_DB_STORE_NAME, "readonly").getAll();
    	
    	request.onerror = function(event) {
    		console.error(event.target.error);
    		callback([]);
    	};
    	
    	request.onsuccess = function(event) {
    		console.dir(event.target.result);
    		callback(event.target.result);
    	};
    	
    };
    
    var deleteDBAuth = function(email) {
    	var request = getObjectStore(M_DB_STORE_NAME, "readwrite").delete(email);
    	
    	request.onerror = function(event) {
    		console.error(event.target.error);
    	};
    };
    
    //deleteDB();
    createDB();
    
    
    
//////////////////////////////////////////////////
// GOOGLE
// Documentation: https://developers.google.com/identity/protocols/OAuth2ForDevices
    
    var M_CLIENT_ID = "148664051818-80agnt8gkid8c6a2kti7bkujmvh0mjjp.apps.googleusercontent.com";
    var M_CLIENT_SECRET = "3wSEXzN2AtZ7IOyMXXcuaplZ";
    var M_SCOPE = "https://www.googleapis.com/auth/drive.file";
    
    var m_CheckAuthorization;
    var m_Authorization;
    
    var getGoogleDeviceAndUserCode = function() {
    	if (m_Authorization !== undefined) {
    		// TODO: Verify if refresh is required
    		refreshGoogleAccessToken();
    		return;
    	}
    	
    	// Retreiving all the authorizations available
		getDBAllAuth(function(authorizations) {
			if (authorizations.length !== 0) {
				for (var i = 0; i < authorizations.length; i++) {
					// TODO: Make user select the profile he wants to use and set the coresponding authorization
					console.log(authorizations[0].email);
				}
				
				m_Authorization = authorizations[0];
				
				refreshGoogleAccessToken();
				return;
			}
			else {
				console.warn("There are no authorization tickets");
				
				// TODO: Add the option to add a new account
		    	// If it got to this point it means that there are no users or that a new account is added
		    	
		    	$.ajax({
		    	    url: "https://accounts.google.com/o/oauth2/device/code?client_id=" + M_CLIENT_ID + "&scope=" + M_SCOPE,
		    	    method: 'POST',
		    	    success: function (data) {
		    	    	console.dir(data);
		    	    	
		    	    	alert("Open a browser and go to:\n" + data.verification_url + "\nOnce there type the following code:\n" + data.user_code + "\nSign In with the account that you want to use");
		    	    	
		    	    	m_CheckAuthorization = window.setTimeout(getGoogleAuthorization, data.interval * 1000, data);
		    	    },
		    	    error: function(err){
		    	    	console.error(err);
		    	    }
		    	});
			}
		});
    };
    
    var getGoogleAuthorization = function(data) {
    	// TODO: Ckeck if the device and user code has expired (use data info)
    	
    	$.ajax({
    	    url: "https://www.googleapis.com/oauth2/v4/token?client_id=" + M_CLIENT_ID + "&client_secret=" + M_CLIENT_SECRET + "&code=" + data.device_code + "&grant_type=http://oauth.net/grant_type/device/1.0",
    	    method: 'POST',
    	    success: function (data) {
    	    	console.dir(data);
    	    	
    	    	// Don't add the email field to m_Authorization since it will be used to check if the DB needs to be updated
    	    	m_Authorization = data;
    	    	// The email field it's needed for the DB. It will be left empty and updated later
    	    	data.email = "";
    	    	
    	    	addToDB(data);
    	    	getGoogleDriveAbout();
    	    	
    	    	window.clearTimeout(m_CheckAuthorization);
    	    },
    	    error: function(err){
    	    	if(err.status === 428) {
    	    		console.warn("Waiting for user authorization.");
    	    		
    	    		// authorization_pending
    	    		m_CheckAuthorization = window.setTimeout(getGoogleAuthorization, data.interval * 1000, data);
    	    		return;
    	    	}
    	    }
    	});
    };
    
    var refreshGoogleAccessToken = function() {
    	// TODO: Determine if the refresh should be done
    	if (m_Authorization) {
    		$.ajax({
        	    url: "https://www.googleapis.com/oauth2/v4/token?client_id=" + M_CLIENT_ID + "&client_secret=" + M_CLIENT_SECRET + "&refresh_token=" + m_Authorization.refresh_token + "&grant_type=refresh_token",
        	    method: 'POST',
        	    success: function (data) {
        	    	console.dir(data);
        	    	
        	    	// TODO: Create timer to check ticket creation date
        	    	// TODO: Add new authorization to DB
        	    	
        	    	if ("email" in m_Authorization) {
        	    		console.log("Updating existing authorization");
        	    		
        	    		var email = m_Authorization.email;
        	    		var refresh_token = m_Authorization.refresh_token;
        	    		
        	    		m_Authorization = data;
        	    		m_Authorization.email = email;
        	    		m_Authorization.refresh_token = refresh_token;
        	    		
        	    		updateDBEntry(m_Authorization);
        	    	}
        	    	else {
        	    		console.log("New authorization");
        	    		
        	    		// This is a clean authorization  refresh which doesn't exist in the DB
        	    		m_Authorization = data;
            	    	
            	    	getGoogleDriveAbout();
        	    	}
        	    },
        	    error: function(err){
        	    	console.error(err);
        	    }
        	});
    	}
    };
    
    var getGoogleDriveAbout = function() {
    	if (m_Authorization) {
    		$.ajax({
        	    url: "https://www.googleapis.com/drive/v2/about",
        	    beforeSend: function(xhr) { 
        	      xhr.setRequestHeader("Content-Type", "application/json");
        	      xhr.setRequestHeader("Authorization", m_Authorization.token_type + " " + m_Authorization.access_token);
        	    },
        	    method: 'GET',
        	    success: function (data) {
        	    	console.dir(data);
        	    	
        	    	if (!("email" in m_Authorization) || m_Authorization.email === "") {
        	    		console.log("No email in auth => New authorization");
        	    		
        	    		m_Authorization.email = data.user.emailAddress;
        	    		updateDBEntry(m_Authorization);
        	    	}
        	    },
        	    error: function(err){
        	    	console.error(err);
        	    }
        	});
    	}
    };
    
};
