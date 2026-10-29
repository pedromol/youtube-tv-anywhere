function showSetup() {

		var y = document.getElementById("instructions");
		y.style.display = "none";

		var x = document.getElementById("setup");
		x.style.display = "block";
	
}




window.onload = function () {
	
	document.getElementById('instructions').onclick = showSetup;

}

