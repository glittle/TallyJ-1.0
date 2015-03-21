// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var g_sClickSound = '../../images/click2.wav';
var g_sOopsSound = '../../images/oops.wav';
var g_sBuzzSound = '../../images/buzz.wav';

window.onload = Prepare;


var ValidationStatus = {
    NotReady: 0,
    ReadyForReview: 1,
    ReadyToReport: 2
};

function Prepare() {
    if (ScriptEngineMajorVersion() < 5) {
        alert('You must use IE version 5 or greater to use TallyJ.'); // can't translate this -- phrases not loaded yet
        return;
    }
    if (sThisPage == 'Top') {
        PrepTop();
    }
    else {
        if (top.sThisPage != 'Top') {
            alert(Phrase('BadFrame'));
            window.close();
            return;
        }
        Titles();
        top.TopRight();
        top.TopCenter();
        //TopLeft()

        InsertPhrases();

        PrepPage();  // call content window preparations
    }

}

function PrepPage() { /* dummy */ }
function PageAfterSave() { /* dummy - called after Save button pressed */ }
function ShowElectionDetails() {  /* dummy */
    /* replace on each page with a way of showing details of the current election */
}

function Titles() {
    document.title = Phrase('TallyJ') + '  ' + Phrase(sThisPage);
    top.document.title = document.title;
    top.TopCenter2.innerHTML = Phrase(sThisPage);
}


function ClearWait() {
    //top.imgWait.style.visibility='hidden'
    //window.document.body.style.cursor = 'auto'
    //window.status=''
}

function ShowWait() { // not working
    //top.imgWait.style.visibility='visible'
    //window.document.body.style.cursor = 'wait'
    //window.status='Busy...'
}

function AppendOption(oSelect, s, v, bSelected) {
    var oOptions = oSelect.options;
    var iNew = oOptions.length++;
    oOptions[iNew].text = s;
    oOptions[iNew].value = ((v == null || v == '') ? s : v);
    if (bSelected != null) oOptions[iNew].selected = bSelected;
}

function DoubleSlash(s) {
    return s.replace(/\\/g, '\\\\');
}


function MakeEmptyDOM(freeThreaded) {
    // 
    var dom = null;
    //1.6 use msxml6 if possible
    var progIDs;
    if (freeThreaded) {
        progIDs = ['Msxml2.FreeThreadedDOMDocument.6.0']; //, 'Msxml2.FreeThreadedDOMDocument.4.0'
    }
    else {
        progIDs = ['Msxml2.DOMDocument.6.0']; // , 'Msxml2.DOMDocument.4.0'
    }

    for (var i = 0; i < progIDs.length; i++) {
        try {
            dom = new ActiveXObject(progIDs[i]);
        }
        catch (ex) {
        }
    }

    if (dom == null) {
        alert(Phrase('NoXML'));
        return null;
    }
    else {
        dom.async = false;

        // If parse on load, get error message...
        //    The element 'Election' is used but not declared in the DTD/Schema
        // Even though it is fine.

        dom.validateOnParse = false;
        dom.resolveExternals = true;
        dom.setProperty("SelectionLanguage", "XPath");
        dom.setProperty("SelectionNamespaces", "xmlns:ms='urn:schemas-microsoft-com:xslt'");

        return dom;
    }
}

function LoadDOM(dom, sPath, bLoadAsFile) {
    if (bLoadAsFile)  // Load all files this way...??
    {
        var sShowPath = sPath;
        var lastWriteTime;
        if (top.oFSO.FileExists(sPath)) {
            var fileInfo = top.oFSO.GetFile(sPath);
            lastWriteTime = fileInfo.DateLastModified;

            var f = top.oFSO.OpenTextFile(sPath, 1, false, -1); // read, no create, ASCII
        }
        else {
            alert(Phrase('ErrorOpeningFile', sPath));
            return false;
        }

        var sXMLText = f.ReadAll();
        f.close();

        if (sXMLText.charCodeAt(0) === 16188) {
            // assume we have an older ASCII file...
            f = top.oFSO.OpenTextFile(sPath, 1, false, 0);
            sXMLText = f.ReadAll()
            f.close()
        }

        dom.loadXML(sXMLText);

        if (dom.documentElement != null) {
            SetPI(dom);
            dom.documentElement.setAttribute('FileTimeAtLastRead', '' + lastWriteTime);
        }
    }
    else {
        sShowPath = sPath;
        dom.load(sPath);
    }

    // make sure we got one
    if (dom.documentElement == null) {
        if (dom.parseError.errorCode != 0) {
            var strErrMsg = Phrase("Problem loading document") + ": " + sShowPath + "<br>"
        + "  Error #: " + dom.parseError.errorCode + "<br>"
        + "  Description: " + dom.parseError.reason + "<br>"
        + "  In file: <b>" + dom.parseError.url + "</b><br>";
            //+ "  Line #: "              + dom.parseError.line + "<br />"
            //+ "  Character # in line: " + dom.parseError.linepos + "<br />"
            //+ "  Character # in file: " + dom.parseError.filepos + "<br />"
            //+ "  Source line: "         + dom.parseError.srcText;
            //divDebug.innerHTML = strErrMsg;
            alert(strErrMsg.replace(/<br>/g, '\n'));
            return false;
        }

        //var myErr = dom.parseError;
        //if(myErr.errorCode != 0)
        // {      
        //  alert(myErr.reason + '\n' + sPath);
        // }    
        //alert('XML did not have a root element.')
        
        return false;
    }

    // set encoding to UTF-16
    //dom.insertBefore(dom.createProcessingInstruction('xml','version="1.0" encoding="ISO-8859-1"'),dom.childNodes.item(0))
    
    return true;
}

function GetAttribute(dom, sAttr) {
    var v = '';

    if (typeof (dom) == 'object' && dom != null) {
        v = dom.getAttribute(sAttr);
    }
    else {
        v = '';
    }

    if (v == null || v == 'null') {
        return '';
    }
    else {
        return v;
    }
}


function GetValue(sName) {
    var allCookies = document.cookie;
    var pos = allCookies.indexOf(sName + '=');
    if (pos != -1)
        return unescape(allCookies.substring(pos).split(';')[0].split('=')[1]);
    else
        return '';
}

function SaveValue(sName, sValue, iDays) {
    if (iDays == null) iDays = 90;
    var expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + iDays);
    if (sValue == '') sValue = ' ';
    document.cookie = sName + "=" + escape(sValue) + '; expires=' + expireDate.toGMTString(); // + '; path=\/'
    //alert(document.cookie)
}

function GetNodeValue(oNode, sAttrName, pre, post) {
    var o = oNode.getAttributeNode(sAttrName);

    if (o != null && o.value != '') {
        if (typeof (pre) == 'undefined') pre = '';
        if (typeof (post) == 'undefined') post = '';

        return pre + o.value + post;
    }
    else
        return '&nbsp;';
}

function AttributeEdit(oNode, sAttrName, oAttrNode, sClass, sId, sExtraHTML, domXSD, sPhrasePrefix, iSelectSize, sTitle) { // display the HTML to edit this attribute

    var sHTML = '';
    var sAttrValue = '';

    // default to Election
    if (domXSD == null) domXSD = top.g_domElectionXSD;

    if (sClass == null) {
        sClass = '';
    }
    else {
        sClass = ' class="' + sClass + '"';
    }

    if (sExtraHTML == null) sExtraHTML = '';
    if (sId != null) {
        sExtraHTML += ' id="' + sId + '"';
    }
    sExtraHTML += ' AttrName="' + sAttrName + '"';

    if (sTitle) {
        sExtraHTML += ' title="' + sTitle + '"';
    }

    // variations: string entry box, select list, check box?

    // find the XSD definition
    var oXSDNode = domXSD.selectSingleNode('//xsd:element[@name="' + oNode.nodeName + '"]/xsd:complexType/xsd:attribute[@name="' + sAttrName + '"]');
    if (oXSDNode == null) {
        oXSDNode = domXSD.selectSingleNode('//xsd:complexType[@name="' + oNode.nodeName + 'Type"]/xsd:attribute[@name="' + sAttrName + '"]');
    }
    if (oXSDNode == null) {
        // didn't find reference, just display the current attribute, can't edit it
        //alert(oNode.nodeName + '\n' + sAttrName + '\n No XSD found')  
        return '';
    }

    //alert(oNode.nodeName + '\n' + sAttrName + '\n' + oXSDNode.xml)  
    var bRequired = oXSDNode.getAttribute('use') == 'required';

    // have a node in the XSD
    var sRefAttr = oXSDNode.getAttribute('ref');
    if (sRefAttr != null) { // this attr refers to another one, switch over to the real one
        oXSDNode = domXSD.selectSingleNode('//xsd:attribute[@name="' + sRefAttr + '"]');
        if (oXSDNode == null) {
            // didn't find reference, just display the current attribute, can't edit it
            return '';
        }
    }


    if (oAttrNode != null) {
        sAttrValue = oAttrNode.value;
    }
    else if (bRequired) {  // we don't have this attribute in the element
        sAttrValue = oXSDNode.getAttribute('default');

        if (sAttrValue == null) sAttrValue = '';

        oNode.setAttribute(sAttrName, sAttrValue);
        CheckSave();
    }

    var sNodeUniqCode = oNode.getAttribute('UniqCode');

    // now have the attribute's definition
    switch (oXSDNode.getAttribute('type')) {  // list of posibilities based on current use in the COMMON.XSD file. Will have to be enhanced as needed
        case 'xsd:boolean':
            //sHTML += '<label for="' + oNode.getAttribute('UniqCode') + 'CB">' + sAttrName + '</label>
            sHTML += '<input type=checkbox value=DoCheckBox onclick="SaveAttribute(this, \'' + sAttrName + '\', \'xsd:boolean\')" UniqCode="' + sNodeUniqCode + '" ';
            switch (sAttrValue) {
                case 'true':
                    sHTML += ' checked';
                    break;
                case 'false':
                    break;
                default:
            }
            sHTML += ' id="' + oNode.getAttribute('UniqCode') + 'CB" ' + sExtraHTML + '>';
            break;

        case 'xsd:positiveInteger':
        case 'xsd:integer':
        case 'xsd:byte':
            var iSize = 10;
            sHTML += '<input type=text ' + sClass + ' ' + sExtraHTML + ' size=' + iSize + ' onchange="SaveAttribute(this, \'' + sAttrName + '\',\'' + oXSDNode.getAttribute('type') + '\')" UniqCode="' + sNodeUniqCode + '" value="' + quoteAttrib(sAttrValue) + '">';
            break;

        case 'xsd:string':
            iSize = 35;
            sHTML += '<input type=text ' + sClass + ' ' + sExtraHTML + ' size=' + iSize + ' onchange="SaveAttribute(this, \'' + sAttrName + '\',\'xsd:string\')" UniqCode="' + sNodeUniqCode + '" value="' + quoteAttrib(sAttrValue) + '">';
            //alert(sHTML)      
            break;

        default:
            // not known inline, must be a SimpleType or something

            var oRestriction = oXSDNode.selectSingleNode('xsd:simpleType/xsd:restriction');
            var sType = oRestriction.getAttribute('base');
            switch (sType) {
                case 'xsd:NMTOKEN':
                    // for now, just handle SimpleType with NMToken list for select
                    var oNodeOptionList = oXSDNode.selectNodes('.//xsd:enumeration/@value');
                    if (oNodeOptionList == null) return '';
                    if (iSelectSize == null) iSelectSize = 1;
                    if (iSelectSize == 0) iSelectSize = oNodeOptionList.length;

                    sHTML += '<select onchange="SaveAttribute(this, \'' + sAttrName + '\')" UniqCode="' + sNodeUniqCode + '" ' + sExtraHTML + sClass + ' id=\'' + sAttrName + '\' size=' + iSelectSize + '>';
                    var bFoundMatch = false;
                    for (var i = 0; i < oNodeOptionList.length; i++) {
                        sHTML += '<option value="' + quoteAttrib(oNodeOptionList[i].text) + '"';
                        if (oNodeOptionList[i].text == sAttrValue) {
                            sHTML += ' selected';
                            bFoundMatch = true;
                        }

                        if (sPhrasePrefix == null) {
                            var testPhrase = Phrase(oNodeOptionList[i].text);
                            sHTML += '>' + (testPhrase.substring(0, 2) === '??' ? oNodeOptionList[i].text : testPhrase);
                        }
                        else {
                            sHTML += '>' + Phrase(sPhrasePrefix + oNodeOptionList[i].text);
                        }
                    }
                    sHTML += '</select>';
                    if (!bFoundMatch) { // we are showing a list, but none are selected; default saved value to the one showing
                        //sAttrValue = oNodeOptionList[0].text
                        //CheckSave()
                        //alert(sAttrName)
                    }

                    break
                case 'xsd:string':
                    // a string with some sort of restriction
                    iSize = 40;
                    var oNodeRestrictionList = oRestriction.selectNodes('*');
                    for (i = 0; i < oNodeRestrictionList.length; i++) {
                        var oRItem = oNodeRestrictionList[i];
                        switch (oRItem.nodeName) {
                            case 'xsd:maxLength':
                                iSize = oRItem.getAttribute('value');
                                break;
                        }
                    }

                    sHTML += '<input type=text ' + sClass + ' ' + sExtraHTML + ' size=' + iSize + ' maxLength=' + iSize + ' onchange="SaveAttribute(this, \'' + sAttrName + '\')" UniqCode="' + sNodeUniqCode + '" value="' + quoteAttrib(sAttrValue) + '">';

                    break;

            }
    }

    return sHTML;
}

function ExtractLists() {
    ExtractValueList(lists.VoteStatus, 'Vote', 'VoteStatus', 'VoteStatus', top.g_domElectionXSD);
    ExtractValueList(lists.BallotStatus, 'Ballot', 'BallotStatus', 'BStatus', top.g_domElectionXSD);
}

function ExtractValueList(objToExtend, nodeName, sAttrName, sPhrasePrefix, domXSD) {
    // display the selected item from the list

    // find the XSD definition
    var oXSDNode = domXSD.selectSingleNode('//xsd:element[@name="' + nodeName + '"]/xsd:complexType/xsd:attribute[@name="' + sAttrName + '"]');

    if (oXSDNode == null) {
        return false;
    }

    // have a node in the XSD
    var sRefAttr = oXSDNode.getAttribute('ref');
    if (sRefAttr != null) { // this attr refers to another one, switch over to the real one
        oXSDNode = domXSD.selectSingleNode('//xsd:attribute[@name="' + sRefAttr + '"]');
        if (oXSDNode == null) {
            // didn't find reference, just display the current attribute, can't edit it
            return false;
        }
    }

    var oRestriction = oXSDNode.selectSingleNode('xsd:simpleType/xsd:restriction');
    if (oRestriction.getAttribute('base') !== 'xsd:NMTOKEN') {
        return false;
    }

    var oNodeOptionList = oXSDNode.selectNodes('.//xsd:enumeration/@value');
    if (oNodeOptionList == null) return false;

    for (var i = 0; i < oNodeOptionList.length; i++) {
        var key = oNodeOptionList[i].text;
        objToExtend[key] = sPhrasePrefix ? Phrase(sPhrasePrefix + oNodeOptionList[i].text) : oNodeOptionList[i].text;
    }
}

//function SaveRawAttribute(uniqCode, attr, value) {
//    var oNode = top.g_domElection.selectSingleNode('//*[@UniqCode="' + uniqCode + '"]');

//    if (oNode == null) {
//        alert('Invalid node 1');
//        return;
//    }

//    oNode.setAttribute(attr, value);

//    CheckSave(sThisPage == 'Ballots');
//}

function SaveAttribute(eInput, sAttr, sCheckType) { // assume g_domElection
    //alert(sAttr)
    top.ValidationNeeded();

    var oNode = top.g_domElection.selectSingleNode('//*[@UniqCode="' + eInput.UniqCode + '"]');

    if (oNode != null) {
        var vValue = eInput.value;

        if (vValue == 'DoCheckBox') {
            vValue = eInput.checked ? 'true' : 'false';
        }

        // verify if value is okay!
        switch (sCheckType) {
            case 'xsd:positiveInteger':
            case 'xsd:integer':
            case 'xsd:byte':
                if (isNaN(vValue)) {
                    //alert('Number required.\n\n"' + vValue + '" is invalid')
                    alert(Phrase('BadNumber', vValue));
                    setTimeout('try{var e=document.getElementById("' + eInput.uniqueID + '");e.focus();e.select()}catch(e){}', 0);

                    return;
                }
                break;

            case 'xsd:string':
            case 'xsd:boolean':

        }


        oNode.setAttribute(sAttr, vValue);

        // run the ExtraOnChange if needed
        //alert(1)    
        if (sThisPage == 'Ballots') {
            if (sAttr == 'VoteStatus') {
                // UpdateNameInputVisibility(eInput); 
                // ??
            }
            if (sAttr == 'OverrideStatus') {
                var oBallot = top.g_domElection.selectSingleNode('//Ballot[@UniqCode="' + g_sCurrentBallotUniqCode + '"]');
                var sBallotId = oBallot.getAttribute('Id');
                //alert(sAttr + '\n' + vValue + '\n' + oBallot.getAttribute('BallotStatus') + '\n' + g_sCurrentBallotUniqCode)
                if (vValue == 'true') { // turned on
                    // set TooMany

                    oBallot.setAttribute('BallotStatus', 'TooMany');
                    CheckSave(true);
                    //alert(oBallot.getAttribute('BallotStatus'))          
                    BuildBallot(sBallotId);
                }
                else { // turned off - recheck all
                    oBallot.setAttribute('BallotStatus', 'New');
                    CheckBallotStatus(sBallotId, true);
                    BuildBallot(sBallotId);
                }
            }
        }

        CheckSave(sThisPage == 'Ballots');

        AfterSaveAttribute(eInput, sAttr, vValue, sCheckType);
    }
}

function AfterSaveAttribute(eInput, sAttr, vValue, sCheckType) {
    // override in other files
}


function quoteAttrib(s) { // will be embedded into HTML page surrounded by quotes
    return s.replace(/\"/g, '&#034;');
}

function CancelSaveNeeded() {
    top.btnSave.style.display = 'none';
    top.g_bNeedSaveElection = false;
    //$('#SaveWarning').hide();
    //var warning = document.getElementById('SaveWarning');
    //if(warning) warning.style.diplay = 'none';
    //debugger;
    if (sThisPage == 'Community') top.g_bNeedSaveCommunity = false;
}

function CheckSave(bOnBallot) { // called when a save is now needed
    // when entering a ballot, highlight the ballot Check & Save
    top.ValidationNeeded();

    if (bOnBallot) {
        top.g_bNeedSaveElection = true;
        top.btnSave.innerHTML = Phrase('TopCheck&Save');
        top.btnSave.style.display = '';
    }
    else {
        top.btnSave.innerHTML = Phrase('SaveLink');
        top.btnSave.style.display = '';
    }
}

function CheckCommunitySave() {
    top.ValidationNeeded();

    if (sThisPage == 'Community') CheckSave();
}


function SaveNeeded() {
    if (typeof (top.btnSave) == 'undefined')
        return false;
    else
        return (top.btnSave.style.display == '');
}


function DoSave() {
    //alert(1) 
    switch (top.Content.sThisPage) {
        case 'Ballots':
            top.Content.SaveBallot();
            break;

        case 'Community':
            top.SaveCommunity(true);
            break;

        default:
            top.SaveElection();
    }
}


function SetPI(dom) {
    var pi = dom.createProcessingInstruction('xml', 'version="1.0" encoding="UTF-16"');
    var first = dom.firstChild;
    if (first.nodeType == 7) { // need to replace
        dom.replaceChild(pi, first);
    }
    else { // add to start
        dom.insertBefore(pi, first);
    }
}

function Expand(sText) { // insert a space before any new Cap letter
    var sNew = sText.substr(0, 1);
    var sChar = '';
    var sCharUpper = '';
    var re = /ABCDEFGHIJKLMNOPQRSTUVWXYZ/;

    for (var i = 1; i < sText.length; i++) {
        sChar = sText.substr(i, 1);
        sCharUpper = sChar.toUpperCase();

        if (sChar == sCharUpper) { // cap letter? 
            if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ'.search(sChar) > -1) { // is a letter
                sNew += ' ';
            }
        }

        sNew += sChar;
    }
    return (sNew);
}


function GetNextUniqCode(dom) {
    var iUniqCode = dom.documentElement.getAttribute('NextUniqCode');

    // assume these UniqCodes are numbers
    dom.documentElement.setAttribute('NextUniqCode', iUniqCode * 1 + 1);

    return iUniqCode;
}

function BlankForNull(vValue) {
    if (vValue == null)
        return '';
    else
        return vValue;
}

function TextFindRootElement(sXML) { // given entire document, find name of root element
    var saList = sXML.split('<', 10);  // get first 10 element starts
    for (var i = 0; i < saList.length; i++) {
        switch (saList[i].substr(0, 1)) {
            case '?':  // skip comments, etc
            case '!':
            case '':
                break;
            default:
                // assume the first character after the < to be a letter
                return TextUpTo(saList[i], ' />');
        }
    }
}

function TextUpTo(s, sChars) { // return all text appearing before any of the characters in sChars
    var iLast = s.length; // start at the end
    var iNow = 0;
    for (var i = 0; i < sChars.length; i++) {
        iNow = s.indexOf(sChars.charAt(i).toUpperCase());
        if (iNow != -1 && iNow < iLast) iLast = iNow;

        iNow = s.indexOf(sChars.charAt(i).toLowerCase());
        if (iNow != -1 && iNow < iLast) iLast = iNow;
    }
    return s.substring(0, iLast);
}

function TextCountElements(sXML, sElement) { // does not distinguish by nesting levels
    var saList = sXML.split('<' + sElement);
    return saList.length - 1;
}

function TextGetAttribute(sXML, sElement, iElementNum, sAttribute) { // in XML provided, search for the xth Element, and get the named attribute
    // iElementNum is 1-based
    var saList = sXML.split('<' + sElement, iElementNum + 2);
    if (saList.length - 1 < iElementNum) return ''; // don't have x number of elements
    var sBody = saList[iElementNum];
    // find end of element
    sBody = TextUpTo(sBody, '<'); // drop the start of the next element
    // now find the named attribute
    return TextFindAttribute(sBody, sAttribute);
}

function TextFindAttribute(sBody, sAttribute) { /* given internals of element. eg: 
        - from an element:  <Person Name="Text" Age='5'/>
        - given:  Name="Text" Age='5'/>
    */
    //TODO: do this with regular expressions
    var sQuoteChar = '';
    var sValue = '';
    var sThisAttribute = '';
    var i = 0;
    do  // loop for each attribute until we find one
    {
        while (sBody.charAt(i) == ' ') i++; // skip past spaces

        // i is at beginning of Attribute name
        sBody = sBody.substr(i); // drop everything before it

        // get name
        sThisAttribute = TextUpTo(sBody, '=');
        i = 1 + sBody.indexOf('=');

        // get quote for this attribute
        sQuoteChar = sBody.charAt(i);
        // drop all before the content of the quote
        sBody = sBody.substr(i + 1);

        // get to the end of the value
        sValue = TextUpTo(sBody, sQuoteChar); //what if quote char is escaped? --> Not permitted in XML attribute values
        i = 1 + sBody.indexOf(sQuoteChar);

        if (sThisAttribute == sAttribute) return sValue;

    } while (i < sBody.length);

    return '';
}

function Phrase(sKey, sValue0, sValue1) {
    var sPhrase = top.g_oPhraseList[sKey.toUpperCase()];
    if (sPhrase == null) return '??' + sKey + '??';
    if (typeof (sValue0) != 'undefined') sPhrase = sPhrase.replace(/\{0\}/g, sValue0);
    if (typeof (sValue1) != 'undefined') sPhrase = sPhrase.replace(/\{1\}/g, sValue1);
    sPhrase = sPhrase.replace(/\\n/g, '\n')  // turn \n into a true \n !;
    return sPhrase;
}

function InsertPhrases() { // look through all objects on the page; if any have DefaultPhrase, then set their innerHTML to the phrase
    var eList = document.all;
    for (var i = 0; i < eList.length; i++) {
        if (eList[i].DefaultPhrase) {
            eList[i].innerHTML = Phrase(eList[i].DefaultPhrase);
        }
        else if (eList[i].defaultphrase) {
            eList[i].innerHTML = Phrase(eList[i].defaultphrase);
        }

        if (eList[i].AccessKeyPhrase) {
            eList[i].accessKey = Phrase(eList[i].AccessKeyPhrase);
        }
        else if (eList[i].accesskeyphrase) {
            eList[i].accessKey = Phrase(eList[i].accesskeyphrase);
        }
    }
}

String.prototype.trim = function () {
    // Use a regular expression to replace leading and trailing 
    // spaces with the empty string
    return this.replace(/(^\s*)|(\s*$)/g, "");
}
String.prototype.startsWith = function (s) {
    return this.substring(0, s.length).toUpperCase() == s.toUpperCase();
}
String.prototype.endsWith = function (s) {
    return (this.substr(this.length - s.length).toUpperCase() == s.toUpperCase());
}
String.prototype.CleanUp = function () {
    // escape \ and ' (since text will be used to build JScript code)
    // remove " entirely (would mess up XSL)
    return this.replace(/\\/g, '\\\\').replace(/'/g, "\'").replace(/"/g, '');
}
Function.prototype.addMethod = function (name, func) {
    this.prototype[name] = func;
    return this;
}
String.addMethod('filledWith', function () {
    /// <summary>Similar to C# String.Format...  in two modes:
    /// 1) Replaces {0},{1},{2}... in the string with values from the list of arguments. 
    /// 2) If the first and only parameter is an object, replaces {xyz}... (only names allowed) in the string with the properties of that object. 
    /// Notes: the { } symbols cannot be escaped and should only be used for replacement target tokens;  only a single pass is done. 
    /// Courtesy Sunwapta Solutions Inc.
    /// </summary>
    var values = typeof arguments[0] === 'object' && arguments.length === 1 ? arguments[0] : arguments;
    return this.replace(/\{(\w+)\}/g, function () {
        var value = values[arguments[1]];
        return value === 0 ? value : (value || '');
    });
});
String.addMethod('filledWithEach', function (arr) {
    /// <summary>Silimar to 'filledWith', but repeats the fill for each item in the array. Returns a single string with the results.
    /// Courtesy Sunwapta Solutions Inc.
    /// </summary>
    var result = [];
    for (var i = 0, max = arr.length; i < max; i++) {
        result[result.length] = this.filledWith(arr[i]);
    }
    return result.join('');
});


function alerts(arg1, arg2, arg3, etc) {
    // alert('{0}\n'.filledWithEach(arguments));
    // show the contents of a list of parameters
    var msgList = [];
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        try {
            var msg = arg === null ? 'null' : typeof arg === 'undefined' ? 'undefined' : arguments[i].toString();
            msgList[msgList.length] = (i + 1) + ': ' + msg;
        } catch (e) {
            msgList[msgList.length] = (i + 1) + ': ' + e.name + ' - ' + e.message;
        }
    }
    alert(msgList.join('\n'));
}


function CopyAttributes(to, from, names) {
    var list = names.split(',');
    var value, name;
    for (var i = 0; i < list.length; i++) {
        name = list[i];
        value = from.getAttribute(name);
        if (value) {
            to.setAttribute(name, value);
        }
    }
}
