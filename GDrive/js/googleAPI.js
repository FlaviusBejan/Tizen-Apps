//////////////////////////////////////////////////
// GOOGLE
// Documentation: https://developers.google.com/identity/protocols/OAuth2ForDevices

var M_CLIENT_ID = "148664051818-80agnt8gkid8c6a2kti7bkujmvh0mjjp.apps.googleusercontent.com";
var M_CLIENT_SECRET = "3wSEXzN2AtZ7IOyMXXcuaplZ";
var M_SCOPE = "https://www.googleapis.com/auth/drive.file";

var m_CheckAuthorization;
var m_Authorization;

// PRIVATE

var _getAuthorization = function(data) {
	// TODO: Ckeck if the device and user code has expired (use data info)
	
	apiPOST("https://www.googleapis.com/oauth2/v4/token?client_id=" + M_CLIENT_ID + "&client_secret=" + M_CLIENT_SECRET + "&code=" + data.device_code + "&grant_type=http://oauth.net/grant_type/device/1.0", 
		function(data) {
			console.dir(data);
	    	
	    	// Don't add the email field to m_Authorization since it will be used to check if the DB needs to be updated
	    	m_Authorization = data;
	    	// The email field it's needed for the DB. It will be left empty and updated later
	    	data.email = "";
	    	
	    	addAuthToDB(data);
	    	_addEmailToAuthorization();
	    	
	    	window.clearTimeout(m_CheckAuthorization);
		}, 
		function(error) {
			if(error.status === 428) {
	    		console.warn("Waiting for user authorization.");
	    		
	    		// authorization_pending
	    		m_CheckAuthorization = window.setTimeout(_getAuthorization, data.interval * 1000, data);
	    		return;
	    	}
		});
};

var _refreshAccessToken = function() {
	// TODO: Verify if refresh is required
	// TODO: Determine if the refresh should be done
	
	if (m_Authorization) {
		apiPOST("https://www.googleapis.com/oauth2/v4/token?client_id=" + M_CLIENT_ID + "&client_secret=" + M_CLIENT_SECRET + "&refresh_token=" + m_Authorization.refresh_token + "&grant_type=refresh_token", 
			function(data) {
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
		    		
		    		updateAuthFromDB(m_Authorization);
		    	}
		    	else {
		    		console.log("New authorization");
		    		
		    		// This is a clean authorization  refresh which doesn't exist in the DB
		    		m_Authorization = data;
	    	    	
	    	    	_addEmailToAuthorization();
		    	}
			}, 
			function(error) {
				console.error(error);
			});
	}
};

var _addEmailToAuthorization = function() {
	if (m_Authorization) {
		apiGET("https://www.googleapis.com/drive/v2/about", m_Authorization.token_type + " " + m_Authorization.access_token, 
			function(data) {
				console.dir(data);
		    	
		    	if (!("email" in m_Authorization) || m_Authorization.email === "") {
		    		console.log("No email in auth => New authorization");
		    		
		    		m_Authorization.email = data.user.emailAddress;
		    		updateAuthFromDB(m_Authorization);
	    		}
			},
			function(error) {
				console.error(error);
			});
	}
};


//PUBLIC

var setCurrentGoogleUser = function() {
	// TODO: Add the option to add a new account
	
	// Checking if there is an user that is already authorized
	if (m_Authorization !== undefined) {
		_refreshAccessToken();
		return;
	}
	
	// Retreiving all the authorizations available
	getAllAuthFromDB(function(authorizations) {
		// If there are no authorizations it means that this is the first user
		if (authorizations.length !== 0) {
			for (var i = 0; i < authorizations.length; i++) {
				// TODO: Make user select the profile he wants to use and set the coresponding authorization
				console.log(authorizations[0].email);
			}
			
			m_Authorization = authorizations[0];
			
			_refreshAccessToken();
			return;
		}
		else {
			console.warn("There are no authorization tickets");
	    	
			apiPOST("https://accounts.google.com/o/oauth2/device/code?client_id=" + M_CLIENT_ID + "&scope=" + M_SCOPE, 
				function(data) {
					console.dir(data);
	    	    	
	    	    	alert("Open a browser and go to:\n" + data.verification_url + "\nOnce there type the following code:\n" + data.user_code + "\nSign In with the account that you want to use");
	    	    	
	    	    	m_CheckAuthorization = window.setTimeout(__getAuthorization, data.interval * 1000, data);
				}, 
				function(error) {
					console.error(error);
				});
		}
	});
};
