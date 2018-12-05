//////////////////////////////////////////////////
// API CALLS
// 

var apiGET = function(urlAddress, authorization, on_success, on_failure) {
	$.ajax({
	    url: urlAddress,
	    beforeSend: function(xhr) { 
	      xhr.setRequestHeader("Content-Type", "application/json");
	      xhr.setRequestHeader("Authorization", authorization);
	    },
	    method: 'GET',
	    success: function (data) {
	    	on_success(data);
	    },
	    error: function(err){
	    	on_failure(err);
	    }
	});
};

var apiPOST = function(urlAddress, on_success, on_failure) {
	$.ajax({
	    url: urlAddress,
	    method: 'POST',
	    success: function (data) {
	    	on_success(data);
	    },
	    error: function(err){
	    	on_failure(err);
	    }
	});
};