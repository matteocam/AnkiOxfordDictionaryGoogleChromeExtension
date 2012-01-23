
var r;

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    if (request.action == "getSelectedText") {
        var text = document.getSelection().toString();
        sendResponse({ 'selectedText': text });
    } else if (request.action == "showWindow") {
        var body = document.body;
        var newDiv = document.createElement('div');
        newDiv.setAttribute('id', 'ooppqqwwee');
        newDiv.innerHTML = request.html;
        body.appendChild(newDiv);
        r = sendResponse;
    } else {
        sendResponse({});
    }
});

function sendValues() {
    r({'123' : '123'});
}
