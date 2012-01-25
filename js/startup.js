chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {
    var divId = 'ooppqqwweediv';
    var frameId = 'ooppqqwweeiframe';

    if (request.action == "getSelectedText") {
        var text = document.getSelection().toString();
        sendResponse({ 'selectedText': text });
    } else if (request.action == "showWindow") {
        var newDiv = document.getElementById(divId);
        if (newDiv == null)
            newDiv = document.createElement('div');
        newDiv.setAttribute('id', divId);

        var iframe = document.getElementById(frameId);
        if (iframe != null)
            newDiv.removeChild(iframe);

        iframe = document.createElement("iframe");
        iframe.src = chrome.extension.getURL("process.html") + "?word=" + encodeURI(request.word);
        iframe.setAttribute('style', 'width: 500px; height: 310px; border: black 1px solid');
        iframe.setAttribute('id', frameId);
        newDiv.appendChild(iframe)

        document.body.appendChild(newDiv);

        var script = document.createElement("script");
        script.innerHTML = "var googlechromeextensioncontentdiv = document.getElementById('" + divId + "');  googlechromeextensioncontentdiv.setAttribute('style', 'position:absolute; left:' + (googlechromeextensionpx - 280) + 'px; top: ' + (googlechromeextensionpy - 50) + 'px;');";
        document.body.appendChild(script);
    } else if (request.action == "closeiframe") {
        var newDiv = document.getElementById(divId);
        if (newDiv == null) {
            return;
        }
        var iframe = document.getElementById(frameId);
        if (iframe != null) {
            newDiv.removeChild(iframe);
        }

        document.body.removeChild(newDiv);

    } else {
        sendResponse({});
    }
});

var script = document.createElement("script");
script.innerHTML = "var googlechromeextensionpx, googlechromeextensionpy; function getMouseXY(ev) {googlechromeextensionpx = ev.pageX; googlechromeextensionpy = ev.pageY;}; document.onmousemove = getMouseXY;";
document.body.appendChild(script);