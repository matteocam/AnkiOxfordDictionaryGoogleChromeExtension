var usernametextbox;
var passwordtextbox;
var decknametextbox;
var allowcorrectioncheckbox;
var addtoankicheckbox;
var saveButton;

$(function() {
	init();
	$("#save-button").click(function() { save(); });
	$("#cancel-button").click(function() { init(); });
});

function init() {
    usernametextbox = $("#username");
    passwordtextbox = $("#password");
    decknametextbox = $("#deckname");
    deckmidtextbox = $("#deckmid");
    allowcorrectioncheckbox = $("#allowcorrection");
    addtoankicheckbox = $("#addtoanki");
    saveButton = $("#save-button");

    usernametextbox.val(localStorage.username || "");
    passwordtextbox.val(localStorage.password || "");
    decknametextbox.val(localStorage.deckname || "");
    deckmidtextbox.val(localStorage.deckmid || "");
    if (localStorage.allowcorrection == "true") { 
    	allowcorrectioncheckbox.attr("checked", true); 
   	}
    if (localStorage.addtoanki == "true") {
    	addtoankicheckbox.attr("checked", true); 
    }
}

function save() {
    localStorage.username = usernametextbox.val();
    localStorage.password = passwordtextbox.val();
    //if (localStorage.deckname != decknametextbox.val()) {
    	localStorage.deckmid = 0;
    //}
    localStorage.deckname = decknametextbox.val();
    localStorage.allowcorrection = allowcorrectioncheckbox.attr("checked") == "checked" ? true : false;
    localStorage.addtoanki = addtoankicheckbox.attr("checked") == "checked" ? true : false;    

    chrome.extension.getBackgroundPage().init();
}