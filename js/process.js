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
                // Q: why does it have to be "undefined" here?
                if ((typeof dataobject.deckmid == "undefined") || (dataobject.deckmid == 0)) {
                	$.ajax( {
                		type: "GET",
                		url: "https://ankiweb.net/edit/",
                		success: function(data) {
							var decks = jQuery.parseJSON(/editor\.decks = (.*}});/i.exec(data)[1]);
							var models = jQuery.parseJSON(/editor\.models = (.*}]);/i.exec(data)[1]);
							get_deck_model_ids(decks, models);
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

function get_deck_model_ids(decks, models)
{
	var deck_id = 0; 
	var model_id = 0; 
	
	var deckname = dataobject.deckname;
	
	// search the destination deck among the retrieved ones
	for (var prop in decks) { 
		if (decks[prop].name == deckname) { 
			deck_id = prop == "1" ? "1" : prop.substr(0, prop.length - 3); 
			break; 
		}
	}; 
	if (deck_id == 0) {
		alert("The deck with name " + dataobject.deckname + " couldn't be found. Please check deck name and register");
		return;
	}
	
	// What we want is trying to access the right basic model, I think (how do we know? The user should specify that)
	
	// XXX: I suppose that from here on, what it's trying to do 
	// is getting the right (Basic) note type, aka model
	jQuery.each(models, function(i, n) {
		if (n.mod == deck_id) 
			model_id = n.id;
	});
	if (deck_id == "1" && model_id == 0) {
		model_id = models[0].id;
	}
	if (model_id == 0 && models.length > 0) {
		// Well. The linkages between note type and deck name is not clear, 
		// therefore this is the most reliable solution, but not right enough.
		model_id = models[0].id; 
	}
	if (model_id == 0) {
		alert("Couldn't find default note type model for the deck " + dataobject.deckname + ". Please contact with extension developer and describe the error situation");
		return;
	}
	chrome.extension.sendMessage({ 'action': 'updatemid', 'mid' : model_id }, function() {}); 
	dataobject.deckmid = model_id;
	
}

function addWord() {
	var front = $("#word").text();
	// replace html new line tags 
	var back = $("#definition").val().replace(/\n/g, '<br />').replace(/\r/g, '');
	
	// fields contains two items: the word and its definition.
	// In general, however, can be an array with an ordered numbered of
	// fields, depending on the note type
	var fields; 
	fields = [];
	fields.push(front);
	fields.push(back);
	
	var tags = '' // we assume no tags
	var data = [fields, tags];
	
	// DEBUG
	console.log(dataobject.deckname);
	
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
