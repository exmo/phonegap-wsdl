function getObjectClass(obj) {
	if (obj && obj.constructor && obj.constructor.toString) {
		var arr = obj.constructor.toString().match(/function\s*(\w+)/);

		if (arr && arr.length == 2) {
			return arr[1];
		}
	}

	return typeof (obj);
}

function WebService(url) {
	this.url = url;
	this.result = "";
	this.methodName = "";
	this.requestEnvelope = "";
	this.responseEnvelope = "";
}

WebService.prototype.onDone = function() {
}

WebService.prototype.call = function(methodName, async, methodParams) {
	this.methodName = methodName;

	var reqbody = "<?xml version=\"1.0\" encoding=\"utf-8\" standalone=\"yes\" ?>"
			+ "<soap:Envelope xmlns:soap=\"http://schemas.xmlsoap.org/soap/envelope/\" xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" >"
			+ "<soap:Header>"
			+ "</soap:Header>"
			+ "<soap:Body>"
			+ "<webs:"
			+ this.methodName + " xmlns:webs=\"http://webservice/\">";

	for(key in methodParams) {
		reqbody += "<" + key + ">";
		reqbody += this.writeVarValue(methodParams[key]);
		reqbody += "</" + key + ">";
	}
	
	reqbody += "</webs:" + this.methodName + ">" + "</soap:Body>"
			+ "</soap:Envelope>";

	var parentThis = this;

	var client = new XMLHttpRequest();
	client.open("POST", this.url, async);
	client.setRequestHeader("Content-Type", "text/xml; charset=utf-8");
	client.setRequestHeader("SOAPAction", "http://webservice/"
			+ this.methodName);
	client.onreadystatechange = function() {
		if (client.readyState == 4) {
			parentThis.result = client.responseText;
			if (parentThis.onDone && typeof (parentThis.onDone) == "function") {
				parentThis.onDone();
			}
			// NOTE: this in here refers to var client, that's why we need to
			// use parentThis instead
		}
	}
	this.requestEnvelope = reqbody;
	client.send(reqbody);
}

WebService.prototype.writeVarValue = function(clObj) {
	var typ = getObjectClass(clObj);

	if (typ.toLowerCase() == "boolean" || typ.toLowerCase() == "string"
			|| typ.toLowerCase() == "number") {
		var ret = clObj;
	} else if (typ.toLowerCase() == "date") {
		var d = clObj.getDate();
		var m = clObj.getMonth();
		m += 1; // month is zero based
		var y = clObj.getFullYear();

		var h = clObj.getHours();
		var i = clObj.getMinutes();
		var s = clObj.getSeconds();

		var ret = y + "-";
		if (m < 10)
			ret += "0" + m + "-";
		else
			ret += m + "-";
		if (d < 10)
			ret += "0" + d + "T";
		else
			ret += d + "T";
		if (h < 10)
			ret += "0" + h + ":";
		else
			ret += h + ":";
		if (i < 10)
			ret += "0" + i + ":";
		else
			ret += i + ":";
		if (s < 10)
			ret += "0" + s;
		else
			ret += s;
	} else if (typ.toLowerCase() == "array") {
		var ret = "";

		for (i = 0; i < clObj.length; i++) {
			ret += this.writeVarValue(clObj[i]);
		}
	} else {
		var ret = "<" + typ + ">";

		for ( var member in clObj) {
			ret += "<" + member + ">" + this.writeVarValue(clObj[member])
					+ "</" + member + ">";
		}
		ret += "</" + typ + ">";
	}

	return ret;
}

WebService.prototype.getResponseAsString = function() {
	var dumper = new JKL.Dumper();
	var text = dumper.dump(this.getResponse());
	return text;
}

WebService.prototype.getResponse = function() {
	var source = this.result;
	var xotree = new XML.ObjTree();
	var tree = xotree.parseXML(source);
	var dumper = new JKL.Dumper();
	var json = dumper.dump(tree);
	return tree["soap:Envelope"]["soap:Body"]["ns2:" + this.methodName
			+ "Response"];

}

WebService.prototype.getRequestEnvelope = function() {
	return this.requestEnvelope;
}

WebService.prototype.getResponseEnvelope = function() {
	return this.result;
}
