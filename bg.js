chrome.contextMenus.create({
    "title": (localStorage.addtoanki == true) ? "Get definition and add to Anki" : "Get word definition",
    "type": "normal",
    "contexts": ["selection"],
	"id" : "simple"
});

if (localStorage.allowcorrection == true) {
    chrome.contextMenus.create({
        "title": (localStorage.addtoanki == true) ? "Get definition and add to Anki with correction" : "Get word definition with correction",
        "type": "normal",
        "contexts": ["selection"],
        "id"      : "correction"
    });
}

chrome.contextMenus.onClicked.addListener(function(info, tab) {
	if ((info.menuItemId != 'simple') && (info.menuItemId != 'correction'))
		return;
	var text = $.trim(info.selectionText);
	if (info.menuItemId == 'correction')
		text = prompt(text, text);

	chrome.tabs.sendMessage(tab.id, { "action": "showWindow", "word": text }, function (response) {	});
});

chrome.extension.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action == "closeiframe") {
        chrome.tabs.getSelected(null, function (tab) {
            chrome.tabs.sendMessage(tab.id, { action: "closeiframe" }, function (response) {
                console.log('iframeclosed event triggered');
            });
        });
    } else if (request.action == "getdataobject") {
    	var dataobject = {
        		'username': localStorage.username,
        		'password' : localStorage.password,
        		'deckname' : localStorage.deckname,
        		'addtoanki' : localStorage.addtoanki,
        		'allowcorrection' : localStorage.allowcorrection,
        		'deckmid' : localStorage.deckmid
        		};
    	sendResponse(dataobject);
    } else if (request.action == "updatemid") {
    	localStorage.deckmid = request.mid;
    }
});

    /*function translateAndAdd(askCorrection) {
    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, { action: "getSelectedText" }, function (response) {
            var text = $.trim(response.selectedText);
            if (askCorrection)
                text = prompt(text, text);
            chrome.tabs.sendRequest(tab.id, { "action": "showWindow", "word": text; }, function (response) { });
        });
    });
}

function process() {
    translateAndAdd(false);
}

function correctAndProcess() {
    translateAndAdd(true);
}*/
