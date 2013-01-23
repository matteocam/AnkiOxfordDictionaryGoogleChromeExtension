var encodedPhrase = location.search.substring(6).toLowerCase();
var decodedPhrase = decodeURI(encodedPhrase);
var dataobject = {};

chrome.extension.sendMessage({ 'action': 'getdataobject', 'text' : decodedPhrase }, getDefinition);

function searchTermError(text) {
	alert("Definition for '" + text + "' couldn't be found");
    closeiframe();       
}

function getDefinition(externaldataobject) {
	dataobject = externaldataobject;
	var text = decodedPhrase;
	
	if (dataobject.addtoanki == "true") {
    	$("button#go").show();
	}
	$("#close").click(closeiframe);
	
    $.ajax({
        //url: "http://oxforddictionaries.com/definition/" + text + "?q=" + text,
        url: "http://oxforddictionaries.com/search/?region=uk&direct=1&q=" + encodeURI(text),
        success: function (data) {
            var html = $(data);
            var block = $("#entryPageContent", html);
            if ($("#noresults", block).length > 0) {
            	searchTermError(text);
            	return;
            }                    	
            var senseGroups = $(".senseGroup", block);
            var correctedWord = $(".pageTitle", html).text();
            var json = '{"text" : "' + correctedWord + '", "parts" : [';
            for (var i = 0; i < senseGroups.length; i++) {
                var senseGroup = senseGroups.get(i);
                var partOfSpeech = $("span.partOfSpeech", senseGroup).text();
                var definitions = $("span.definition", senseGroup);

                json += '{"part" : "' + partOfSpeech + '"';
                json += ', "definitions" : [';
                for (var j = 0; j < definitions.length; j++) {
                    var definition = definitions.get(j);
                    json += '"' + $(definition).text() + '"';
                    if (j < definitions.length - 1) {
                        json += ',';
                    }
                }
                json += ']}';
                if (i < senseGroups.length - 1) {
                    json += ',';
                }
            }
            json += ']}';
            obj = JSON.parse(json);
            showWindow(obj);
        },
        error: function (a, b, c) {
            if ((a.readyState == 4) && (c == "Not Found")) {
            	searchTermError(text);
            }
        }
    });
}

function showWindow(obj) {
    var newLine = "\n";
    var definition = "";
    for (var i = 0; i < obj.parts.length; i++) {
        if ((obj.parts[i].part != null) && (obj.parts[i].part.length > 0)) {
            definition += obj.parts[i].part + ':' + newLine;
        }
        for (var j = 0; j < obj.parts[i].definitions.length; j++) {
            var item = obj.parts[i].definitions[j];
            if (obj.parts[i].definitions.length > 1) {
                definition += (j + 1) + '. ';
            }
            definition += $.trim(item.substring(0, item.length - 1)) + newLine;
        }
        definition += newLine;
    }

    $("#word").text($.trim(obj.text));
    $("#definition").val($.trim(definition));

    
    $("#go").click(function () {
        $.ajax({
            type: 'POST',
            url: 'https://ankiweb.net/account/login',
            data: "submitted=1&username=" + dataobject.username + "&password=" + dataobject.password,
            success: function (data) {
            	var html = $(data);
            	if (($(".mitem", html).length) == 0) {
            		alert('Authorization failed. Check your username and password on options page');
            		closeiframe();
            		return;
            	}
                console.log('authorized, deck mid' + dataobject.deckmid);
                if ((typeof dataobject.deckmid == "undefined") || (dataobject.deckmid == 0)) {
                	$.ajax( {
                		type: "GET",
                		url: "https://ankiweb.net/edit/",
                		success: function(data) {
                			var id = 0; 
                			var modid = 0; 
                			var o = jQuery.parseJSON(/editor\.decks = (.*}});/i.exec(data)[1]);
                			var deckname = dataobject.deckname;
                			for (var prop in o) { 
                				if (o[prop].name == deckname) { 
                					id = prop == "1" ? "1" : prop.substr(0, prop.length - 3); 
                					break; 
                				}
                			}; 
                			if (id == 0) {
                				alert("The deck with name " + dataobject.deckname + " couldn't be found. Please check deck name and register");
                				return;
                			}
                			var mods = jQuery.parseJSON(/editor\.models = (.*}]);/i.exec(data)[1]);
                			jQuery.each(mods, function(i, n) {if (n.mod == id) modid = n.id;});
                			if (id == "1" && modid == 0) {
                				modid = mods[0].id;
                			}
                			if (modid == 0) {
                				alert("Couldn't find default note type model for the deck " + dataobject.deckname + ". Please contact with extension developer and describe the error situation");
                				return;
                			}
                			chrome.extension.sendMessage({ 'action': 'updatemid', 'mid' : modid }, function() {}); 
                			dataobject.deckmid = modid;
                			addWord();
                		}
                	});
                } else {
                	addWord();
                }
                
            },
            error: function (a, b, c) {
                alert('Authorization failed. Check your username and password on options page');
            }
        });
    });
}

function addWord() {
	var front = $("#word").text();
	var back = $("#definition").val().replace(/\n/g, '<br />').replace(/\r/g, '');
	var fields;
	fields = [];
	fields.push(front);
	fields.push(back);
	var data = [fields, ''];
	
	var dict = {
		 data: JSON.stringify(data),
		 mid: dataobject.deckmid,
		 deck: dataobject.deckname
	};
	
	var addurl ='https://ankiweb.net/edit/save';
	
	$.get(
        addurl,
        dict,
        function (data) {
            console.log('card added');
            closeiframe();
        }
    );
}

function closeiframe() {
    chrome.extension.sendMessage({ 'action': 'closeiframe' }, function (response) {});
}