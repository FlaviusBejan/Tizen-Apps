
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
    	
    	setCurrentGoogleUser();
    });
    
};
