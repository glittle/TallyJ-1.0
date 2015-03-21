/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

//var g_sVersion = hta.version  // main and sub versions. If the XSD files change, main version is incremented.

//var g_sMyTargetLang = 'EN' // use this language from the Phrases file
var g_sMyTargetLang = GetValue('Language');
//var g_sMyTargetLang = 'FR-CA' // use this language from the Phrases file

var g_sFolder = 'Data';   // path to data/XML folder relative to current file
var g_sPath = '';        // full path to XML folder
var sThisPage = '';       // interal ID set on some pages
var oFSO = null;

var g_sElectionName = null;  // for show in top corner
var g_sCommunityName = null;  // for show in top corner
var g_sComputerCode = '';

var g_domElection = null;    // holds XML DOM of entire data
var g_domCommunity = null;

var g_sElection = '';    // name of current election
var g_domElectionXSD = null;      // XSD of election
var g_domCommunityXSD = null;      // XSD of community

var g_bNeedSaveCommunity = false;
var g_bNeedSaveElection = false; // is this needed?
var g_ballotsValidationStatus = ValidationStatus.NotReady;

var g_oPhraseList = [];
var oLangList = [];
var g_sTransLog = '';
var g_sMyLangSub = '';
var g_sMyLangCore = '';
var g_sLangDefault = 'EN';   // last one in file, use this if nothing else found - this must be two char long

var lists = {
    VoteStatus: [],
    BallotStatus: []
};

function PrepTop() {
    try {
        oFSO = new ActiveXObject("Scripting.FileSystemObject");
    }
    catch (e) {
        if (e.number == -2146827859) {
            alert('Browser error - cannot access files.');
            return;
        }
    }

    TopLeft();

    PrepPath();
    LoadPhrases();

    //g_sElection = GetValue('ElectionFile')
    //if(g_sElection!=null && g_sElection!='')
    // {
    //LoadElection()
    //LoadCommunity()

    // let page load before loading these files...
    setTimeout('LoadElection()', 0);
    setTimeout('LoadCommunity()', 100);


    window.resizeTo(screen.availWidth * .9, screen.availHeight * .9);

    //LoadDocuments()
    //setTimeout('LoadDocuments()',0)
    //}

    if (g_domElection == null || g_domElection.documentElement == null) {
        //return
    }

    Goto('Overview', true);

}

function LoadElection() {// to be called only in the top frame
    ShowWait();

    // each time a page is loaded, load current Election and Community
    g_sElectionName = '';
    var sElectionFileName = GetValue('ElectionFile').trim();
    if (sElectionFileName != null && sElectionFileName != '') {
        g_domElection = MakeEmptyDOM();
        if (g_domElection == null) {
            ClearWait();
            return;
        }
        var loaded = LoadDOM(g_domElection, sElectionFileName, true);
        if (g_domElection.documentElement == null) {
            SaveValue('ElectionFile', '');
            ClearWait();
            if (loaded) alert(Phrase('InvalidElectionFile'));
            TopRight();
            return;
        }
        else { // loaded okay
            g_sElectionName = g_domElection.documentElement.getAttribute('Name');
        }
    }
    else {  // no election file set, exit
        ClearWait();
        return;
    }

    // assign unique ID to each node
    var oNodeList = g_domElection.selectNodes('//*');
    for (var i = 0; i < oNodeList.length; i++) {
        var node = oNodeList[i];
        node.setAttribute('UniqCode', i);

        // upgrade to 1.80
        var status = node.getAttribute('VoteStatus');
        if (status === 'UnReadable' || status === 'Ineligible') {
            node.setAttribute('VoteStatus', 'Spoiled');
            if (status === 'UnReadable') {
                node.setAttribute('SpoiledGroup', 'Unreadable');
            }
            if (status === 'Ineligible') {
                node.setAttribute('SpoiledGroup', 'Ineligible');
            }
        }
    }
    // store the value for later
    var oRoot = g_domElection.documentElement;
    oRoot.setAttribute('NextUniqCode', i);
    oRoot.setAttribute('FilePath', sElectionFileName);

    // ensure correct attributes are available
    //oRoot.setAttribute('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance')
    oRoot.setAttribute('xsi:noNamespaceSchemaLocation', 'election.xsd');   // ?? leave if already there?

    SetValidationStatusOnLoad();

    top.g_sComputerCode = oRoot.selectSingleNode('Info').getAttribute('CodeForThisComputer');
    if (top.g_sComputerCode == null) {
        oRoot.selectSingleNode('Info').setAttribute('CodeForThisComputer', 'A')
        top.g_sComputerCode = 'A';
    }
    TopRight();

    ClearWait();
}

function SetValidationStatusOnLoad() {
    g_ballotsValidationStatus = ValidationStatus.NotReady;

    if (!(g_domElection && g_domElection.documentElemnt && g_domCommunity && g_domCommunity.documentElement)) return;

    var oInfo = g_domElection.documentElement.selectSingleNode('Info');
    var commRoot = g_domCommunity.documentElement;

    if (oInfo.getAttribute('CommunityFileName') == commRoot.getAttribute('FilePath')
        && oInfo.getAttribute('CommunityFileTime') == commRoot.getAttribute('FileTimeAtLastRead')
        && oInfo.getAttribute('ApprovedForReporting') == 'true') {
        g_ballotsValidationStatus = ValidationStatus.ReadyToReport;
    } else {
        oInfo.setAttribute('ApprovedForReporting', false);
    }
}

function LoadCommunity(bRefreshContentWindow) {// to be called in the top frame only
    ShowWait();

    g_sCommunityName = '';
    var sCommunityFileName = GetValue('CommunityFile').trim();

    if (sCommunityFileName != null && sCommunityFileName != '') {
        g_domCommunity = MakeEmptyDOM();
        //LoadDOM(g_domCommunity, sCommunityFileName)
        //alert(sCommunityFileName)
        // read in entire file

        // parse into XML DOM
        //LoadDOM(g_domCommunity, sXMLText, true)
        var loaded = LoadDOM(g_domCommunity, sCommunityFileName, true);
        //alert('reloaded')
        if (g_domCommunity.documentElement == null) {
            SaveValue('CommunityFile', '');
            ClearWait();
            if(loaded) alert(Phrase('InvalidCommunityFile'));
            document.body.style.cursor = 'default';
            TopRight();
            return;
        }
        else { // loaded okay
            g_sCommunityName = g_domCommunity.documentElement.getAttribute('Name');
        }

        // assign unique ID to each node
        var oNodeList = g_domCommunity.selectNodes('//*');
        for (var i = 0; i < oNodeList.length; i++) {
            var node = oNodeList[i];
            node.setAttribute('UniqCode', i);

            // upgrade to 1.80
            var eligibility = node.getAttribute('VotingEligibility');
            if (eligibility) {
                if (eligibility != 'Eligible') {
                    node.setAttribute('IneligibleToReceiveVotes', true);
                }
                node.removeAttribute('VotingEligibility');
                g_bNeedSaveCommunity = true;
            }
        }
        // store the value for later
        var oRoot = g_domCommunity.documentElement;
        oRoot.setAttribute('NextUniqCode', i);
        oRoot.setAttribute('FilePath', sCommunityFileName);

        // ensure correct attributes are available
        //oRoot.setAttribute('xmlns:xsi','http://www.w3.org/2001/XMLSchema-instance')
        oRoot.setAttribute('xsi:noNamespaceSchemaLocation', 'community.xsd');   // ?? leave if already there?
    }

    TopRight();

    if (bRefreshContentWindow) {
        if (top.Content.BuildTextNameLookup) {
            top.Content.BuildTextNameLookup();
        }

        if (top.Content.sThisPage == 'Reports') {
            top.Content.PrepPage();
        }
        if (top.Content.sThisPage == 'Registration') {
            top.Content.PrepPage(true);
        }
    }

    SetValidationStatusOnLoad();

    ClearWait();
}


function MenuButton(sText, sAction, bByLang) {
    var sPage = '';
    var sExtra = '';

    if (sAction.substr(0, 3) == '-->') {
        sPage = sAction.substr(3);
        sAction = 'Goto(\'' + sPage + '\'' + (bByLang == null ? '' : ',' + bByLang) + ')';
        var sLink = Phrase(sText + 'Link');  // '<u>' + sPage.substr(0,1) + '</u>' + sPage.substr(1) 
        //alert(sText + ' ==> ' + sLink)    
        if (sPage == top.Content.sThisPage) { // no button
            return ('<button class=menu disabled>' + sLink + '</button>');
        }
        else {
            return ('<button class=menu onclick="' + sAction + '" accessKey=' + Phrase(sText + 'AccessKey') + '>' + sLink + '</button>');
        }
    }
    else {
        // other buttons
        switch (sAction) {
            case 'Save':
                sAction = 'DoSave()';
                sExtra = ' style="display:none; color:red" id=btnSave accessKey=' + Phrase('SaveAccessKey');
                break;

            default:
                alert('Button? ' + sAction);
        }

        return ('<button style=menu onclick="' + sAction + '"' + sExtra + '>' + sText + '</button>');
    }
}

function TopLeft() {
    top.divTopLeft.innerHTML = '<img src="images/tallyj.jpg">';  //<img id=imgWait style="visibility:hidden" src="images/wait.gif">'
}

function TopCenter() {
    var sHTML = '<table><tr><td align=center>';
    sHTML += MenuButton('Overview', '-->Overview', true);
    sHTML += MenuButton('Community', '-->Community');
    sHTML += MenuButton('Election', '-->Election');
    sHTML += MenuButton('Files', '-->Files');
    sHTML += '</td>';
    sHTML += '<td rowspan=2 align=center valign=center>';
    sHTML += MenuButton('Save', 'Save');
    sHTML += '</td></tr><tr><td align=center>';
    sHTML += MenuButton('Registration', '-->Registration');
    sHTML += MenuButton('Ballots', '-->Ballots');
    sHTML += MenuButton('Review', '-->Review');
    sHTML += MenuButton('Reports', '-->Reports');
    sHTML += '</td></tr></table>';

    // + '<br>'
    top.divTopCenter.innerHTML = sHTML;
}

function TopRight() {
    if (window != top) {
        top.TopRight();
        return;
    }
    // do in two parts now

    var sHTML = '';  //= '<table height="100%"><tr><td valign=top align=right>'
    
    var sTemp = top.g_sElectionName;
    if (sTemp == null) sTemp = Phrase('Loading...');
    else if (sTemp == '') sTemp = '<span class=Error>{0}</span>'.filledWith(Phrase('NoElectionLoaded'));
    sHTML += '<div class=TopRight1>' + sTemp + '</div>';

    sTemp = top.g_sCommunityName;
    if (sTemp == null) sTemp = Phrase('Loading...');
    else if (sTemp == '') sTemp = '<span class=Error>{0} &nbsp;</span>'.filledWith(Phrase('NoCommunityLoaded'));
    sHTML += '<div class=TopRight2>' + sTemp + ' <button style="font:xx-small; padding;0; margin;0" title="Reload Community List" onclick="top.LoadCommunity(true)">' + Phrase('ShortReload') + '</button></div>';

    //sHTML += '</td></tr><tr><td valign=bottom align=right>'

    //sHTML += '</td></tr></table>'

    top.divTopRight.innerHTML = sHTML;

    //sHTML = '<table height="100%"><tr><td valign=top align=right>'

    sHTML = '<div class=TopRight3><span onclick="ShowTransResults()" title="' + Phrase('ShowTranslationResults') + '" class=clickable>';

    sHTML += Phrase('Version') + ': ' + top.oHTA.version;

    sHTML += '</span> ' + Phrase('Computer Code') + ': ' + top.g_sComputerCode + '</div>';

    sHTML += '<div class=TopRight3>';

    sHTML += '<span id=ShowLang></span>';

    sHTML += '</div>';

    top.divTopRightLang.innerHTML = sHTML;

    //  sHTML += 
    if (top.oLangList.length > 1) { // have multiple languages
        top.ShowLang.innerHTML = '<select id=selLang title="' + Phrase('SelectLanguage') + '" onchange="ChangeLanguage()" style="font-size:xx-small;"></select>';

        var sLangName;
        for (var i = 0; i < oLangList.length; i++) {
            sLangName = Phrase(oLangList[i]);
            if (sLangName.substr(0, 2) == '??') sLangName = oLangList[i];
            AppendOption(selLang, sLangName, oLangList[i], g_sMyTargetLang == oLangList[i] ? true : false);
        }
    }
    else if (oLangList.length == 1) { // have only one language in file...
        top.ShowLang.innerHTML = oLangList[0];
    }
    else { // haven't loaded list yet?
        top.ShowLang.innerHTML = '';
    }

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

function ChangeLanguage() {
    var e = event.srcElement;
    var sNewLang = e.options[e.selectedIndex].value;
    if (sNewLang != g_sMyTargetLang) {
        SaveValue("Language", sNewLang);
        top.location.reload();
    }
}

function Goto(sURL, bByLang) {
    if (SaveNeeded()) {
        if (!confirm(Phrase('SaveNeeded'))) {
            return;
        }
    }
    if (bByLang) {
        var sPath = top.g_sPath + '/../support/display/';
        if (g_sMyLangSub != '' && oFSO.FileExists(sPath + sURL + '_' + g_sMyLangSub + '.htm')) { // got it
            sURL = sURL + '_' + g_sMyLangSub;
        }
        else if (oFSO.FileExists(sPath + sURL + '_' + g_sMyLangCore + '.htm')) { // got it
            sURL = sURL + '_' + g_sMyLangCore;
        }
        else {
            sURL = sURL + '_' + g_sLangDefault;
        }
    }
    top.Content.location.replace(top.g_sPath + '/../support/display/' + sURL + '.htm');
}


function PrepPath() {
    if (top.g_sPath == '') {
        var p = top.location.href;

        // strip file:///
        p = p.replace('file:///', '');

        // strip current file name
        p = p.substring(0, p.lastIndexOf('/'));

        // add data folder name
        p += '/' + g_sFolder;

        // convert %20 to spaces
        p = unescape(p);

        top.g_sPath = p;
    }
}


function LoadElectionXSD() {
    if (g_domElectionXSD == null && g_domElection != null) {

        g_domElectionXSD = MakeEmptyDOM();
        g_domElectionXSD.setProperty("SelectionNamespaces", 'xmlns:xsd="http://www.w3.org/2001/XMLSchema"');

        LoadDOM(g_domElectionXSD, top.g_sPath + '/' + g_domElection.documentElement.getAttribute('xsi:noNamespaceSchemaLocation'));

        if (g_domElectionXSD == null) { //failed, message already given
            alert(Phrase('BadFormat'));
        }

        ExtractLists();
    }
}

function LoadCommunityXSD() {
    if (g_domCommunityXSD == null && g_domCommunity != null) {
        //PrepPath()

        g_domCommunityXSD = MakeEmptyDOM();
        g_domCommunityXSD.setProperty("SelectionNamespaces", 'xmlns:xsd="http://www.w3.org/2001/XMLSchema"');

        LoadDOM(g_domCommunityXSD, top.g_sPath + '/' + g_domCommunity.documentElement.getAttribute('xsi:noNamespaceSchemaLocation'));

        if (g_domCommunityXSD == null) { //failed, message already given
            alert(Phrase('BadFormat'));
        }
    }
}


function SaveElection() { // something has changed, save the document
    var domClone = MakeEmptyDOM();
    // want the saved document to be cleaned up, without some attributes...


    // copy to a clone
    g_domElection.save(domClone);

    var oRoot = domClone.documentElement;
    oRoot.removeAttribute('FilePath');
    oRoot.removeAttribute('NextUniqCode');

    // upgrade old files to new scheme - remove old attributes
    oRoot.selectSingleNode('Info').removeAttribute('RequireFullBallot');

    // add info re community file
    if (g_domCommunity && g_domCommunity.documentElement) {
        oRoot.selectSingleNode('Info').setAttribute('CommunityFileName', g_domCommunity.documentElement.getAttribute('FilePath'));
        oRoot.selectSingleNode('Info').setAttribute('CommunityFileTime', g_domCommunity.documentElement.getAttribute('FileTimeAtLastRead'));
    }
    else {
        oRoot.selectSingleNode('Info').setAttribute('CommunityFileName', '');
        oRoot.selectSingleNode('Info').setAttribute('CommunityFileTime', '');
    }

    // remove the unique IDs
    var oNodeList = domClone.selectNodes('//*');
    for (var i = 0; i < oNodeList.length; i++) {
        oNodeList[i].removeAttribute('UniqCode');
        oNodeList[i].removeAttribute('MinorityPriority');
    }

    var sFile = g_domElection.documentElement.getAttribute('FilePath');
    try {
        SetPI(domClone);

        domClone.save(sFile);
        top.btnSave.style.display = 'none';

        g_bNeedSaveElection = false;

        // LoadElection();

        g_sElectionName = g_domElection.documentElement.getAttribute('Name');
        g_sComputerCode = g_domElection.documentElement.selectSingleNode('Info').getAttribute('CodeForThisComputer') || 'A';
    
        TopRight();
        PageAfterSave();
    }
    catch (e) {
        alert(e.description + '\n' + sFile);
    }
}


function ValidationNeeded() {
    g_ballotsValidationStatus = ValidationStatus.NotReady;

    if (g_domElection && g_domElection.documentElement) {
        g_domElection.documentElement.selectSingleNode('Info').setAttribute('ApprovedForReporting', false);
    } 
}

function SetApprovalForReporting(bApproved, forceSave) {
    g_domElection.documentElement.selectSingleNode('Info').setAttribute('ApprovedForReporting', bApproved ? 'true' : 'false');

    g_ballotsValidationStatus = bApproved ? ValidationStatus.ReadyToReport : ValidationStatus.ReadyForReview;

    if (forceSave) {
        SaveElection();
    }
}

function SaveCommunityQuick() { // save the document as is

    var sFile = g_domCommunity.documentElement.getAttribute('FilePath');

    g_ballotsValidationStatus = ValidationStatus.NotReady;

    var fileInfo = oFSO.GetFile(sFile); ;
    lastWriteTime = '' + fileInfo.DateLastModified;
    if (lastWriteTime !== g_domCommunity.documentElement.getAttribute('FileTimeAtLastRead')) {
        alert(Phrase('FileSaveConflict'));
        return;
    }

    // copy to a clone
    var domClone = MakeEmptyDOM();
    g_domCommunity.save(domClone);

    var oRoot = domClone.documentElement;
    oRoot.removeAttribute('FilePath');
    oRoot.removeAttribute('NextUniqCode');

    // remove the unique ID
    var oNodeList = domClone.selectNodes('//*');
    for (var i = 0; i < oNodeList.length; i++) {
        oNodeList[i].removeAttribute('UniqCode');
    }

    try {
        // save the file

        SetPI(domClone);

        domClone.save(sFile);

        g_bNeedSaveCommunity = false;
        top.btnSave.style.display = 'none';

        fileInfo = oFSO.GetFile(sFile); ;
        lastWriteTime = fileInfo.DateLastModified;
        g_domCommunity.documentElement.setAttribute('FileTimeAtLastRead', '' + lastWriteTime);
    }
    catch (e) {
        alert(e.description + '\n' + sFile + '\nSC');
    }

}

function SaveCommunity(bForceSave) { // something has changed, save the document
    if (bForceSave == null) bForceSave = false;

    if (!bForceSave && !g_bNeedSaveCommunity) return;   // save if requested...

    g_ballotsValidationStatus = ValidationStatus.NotReady;

    var sFile = g_domCommunity.documentElement.getAttribute('FilePath');

    var fileInfo = oFSO.GetFile(sFile); ;
    lastWriteTime = '' + fileInfo.DateLastModified;
    if (lastWriteTime !== g_domCommunity.documentElement.getAttribute('FileTimeAtLastRead')) {
        alert(Phrase('FileSaveConflict'));
        return;
    }



    var domClone = MakeEmptyDOM();

    // process the file to sort the names
    // get the XSLT
    var domXSL = MakeEmptyDOM();
    LoadDOM(domXSL, top.g_sPath + '/../support/sortCommunity.xsl');

    // reload the sorted document
    g_domCommunity.loadXML(g_domCommunity.transformNode(domXSL));

    // check for duplicates
    var dups = g_domCommunity.documentElement.selectNodes('//Person[@Duplicates]');
    if (dups.length != 0) {
        alert(DupNamesMsg(dups));
    }

    // want the saved document to be cleaned up, without some attributes...

    // copy to a clone
    g_domCommunity.save(domClone);

    //  domClone.insertBefore(domClone.createProcessingInstruction('xml','version="1.0" encoding="ISO-8859-1"'),domClone.firstChild)
    //  SetPI(domClone)

    var oRoot = domClone.documentElement;
    oRoot.removeAttribute('FilePath');
    oRoot.removeAttribute('NextUniqCode');

    // upgrade old files to new scheme - remove old attributes
    //oRoot.selectNodes('//MinorityPriority');

    // assign unique ID to each node
    var oNodeList = domClone.selectNodes('//*');
    for (var i = 0; i < oNodeList.length; i++) {
        oNodeList[i].removeAttribute('UniqCode');
        oNodeList[i].removeAttribute('MinorityPriority');
    }

    try {
        /*
        // process the file to sort the names
        // get the XSLT
        var domXSL = MakeEmptyDOM()
        LoadDOM(domXSL, g_sPath + '/../support/sortCommunity.xsl');

        // load the sorted document
        var domClone2 = MakeEmptyDOM();
        domClone2.loadXML(domClone.transformNode(domXSL));

        //alert(domClone2.xml);
        */
        // save the file


        //        if (err.reason) {
        //            if (err.reason.search('duplicate key') != -1) {
        //                var parts = err.reason.split("'");
        //                alert("Duplicate: " + parts[1]);
        //            }
        //            return;
        //        }

        SetPI(domClone);

        domClone.save(sFile);

        //alert('Commnity Saved')
        g_bNeedSaveCommunity = false;
        top.btnSave.style.display = 'none';

        fileInfo = oFSO.GetFile(sFile); ;
        lastWriteTime = fileInfo.DateLastModified;
        g_domCommunity.documentElement.setAttribute('FileTimeAtLastRead', '' + lastWriteTime);

        // if this page has a BuildLookup() function, call it
        if (top.Content.BuildTextNameLookup) top.Content.BuildTextNameLookup();
        if (top.Content.AfterSave) top.Content.AfterSave();

    }
    catch (e) {
        alert(e.description + '\n' + sFile + '\nSC');
    }
}

function DupNamesMsg(dups) {
    var dupNames = [];
    for (var d = 0; d < dups.length; d++) {
        var dup = dups[d];
        var aka = dup.getAttribute('AKAName');
        if (aka) { aka = ' [{0}]'.filledWith(aka); }
        dupNames.push('{0}, {1}{2}'.filledWith(dup.getAttribute('LName'), dup.getAttribute('FName'), aka));
    }
    var singlePlural = Phrase('DupNameList' + (dupNames.length === 1 ? 'Single' : 'Plural'));
    return Phrase('DupNameList', singlePlural, dupNames.join('\n'));
}

function LoadPhrases() {
    // get current lang from system?
    // No support for this now... has to be done some other way... put at top of this file

    // Only called from TOP
    //var nStartTime = new Date()

    var f, sLine, saLine, sCurrentLang;
    var oPhraseLang = [];
    var oLangListCodes = [];
    var iPhrasesTotal = 0;
    var iPhrasesOther = 0;
    var iPhrasesOtherSub = 0;
    var iPhrasesDup = 0;
    var sDupLog = '';
    var bFoundOther = false;
    var bFoundOtherSub = false;
    var bLoadCurrentSection = false;
    var bWantSub = false;

    g_sMyTargetLang = g_sMyTargetLang.toUpperCase();
    if (g_sMyTargetLang.trim() == '') {
        g_sMyTargetLang = g_sLangDefault;
        SaveValue("Language", g_sMyTargetLang);
    }

    switch (g_sMyTargetLang.length) {
        case 5: // eg. FR-CA
            g_sMyLangSub = g_sMyTargetLang;
            g_sMyLangCore = g_sMyTargetLang.substr(0, 2);
            bWantSub = true;
            break;

        case 2:
            g_sMyLangSub = ''; // wanted language is not a sub code
            g_sMyLangCore = g_sMyTargetLang;
            break;

        default:
            //alert(Phrase('InvalidLangCode', g_sMyTargetLang))
            alert('"' + g_sMyTargetLang + '" is not a valid language code');  // have no phrases loaded!!
            g_sMyLangSub = '';
            g_sMyLangCore = g_sLangDefault;
    }

    var bWantDefault = g_sMyLangCore == g_sLangDefault;

    // load the desired language and the default language
    // read names of all Phrases_XX.txt 
    // For the language(s) we want, load the file and read the language codes inside
    var sFileLang, sFileName;
    var sFolder = 'support/display/';
    var oFilesToLoad = [];
    //var re = new RegExp('Phrases_(\S*).txt','i');
    var oFolder = oFSO.GetFolder(sFolder);
    var eFile = new Enumerator(oFolder.files);
    for (; !eFile.atEnd(); eFile.moveNext()) {
        f = eFile.item();
        sFileName = f.name;
        if (sFileName.startsWith('Phrases_')) { // have a phrases file
            //sFileLang  = sFileName.match(re);
            sFileLang = sFileName.substr(8, 2).toUpperCase();

            if (sFileName.substr(10, 1) != '.') {// problem
                alert('Invalid file name: ' + sFileName);
            }
            else {// okay
                oLangList[oLangList.length] = sFileLang;   // add to list
                oLangListCodes[sFileLang] = sFileLang;   // add to list

                if (sFileLang == g_sLangDefault) { // want to load this file - default is 0
                    oFilesToLoad[0] = sFileName;
                }
                else if (sFileLang == g_sMyLangCore) {
                    oFilesToLoad[1] = sFileName;
                }
            }
        }
    }

    if (oFilesToLoad.length == 0) {
        // error
        alert('Phrases files not found. TallyJ cannot operate correctly.');
        return;
    }
    for (var i = oFilesToLoad.length - 1; i >= 0; i--) { // do the non-default language file first, then the default one
        sFileName = oFilesToLoad[i];

        var iLineCount = 0;
        f = oFSO.OpenTextFile(sFolder + sFileName, 1, false, -1);  // open as UNICODE

        while (!f.AtEndOfStream) {
            //Scan entire file...
            sLine = f.ReadLine();
            sLine = sLine.split('//')[0];   // chop off any comments
            iLineCount++;

            if (sLine.substr(0, 3) == '-->') {
                //Try to match language exactly
                sCurrentLang = sLine.substr(3).trim().toUpperCase().replace(/ /g, '');

                bLoadCurrentSection = false;

                bFoundOther = false;
                bFoundOtherSub = false;

                if (sCurrentLang.length == 2 || sCurrentLang.length == 5) { //valid
                    if (oLangListCodes[sCurrentLang] == null && sCurrentLang.substr(0, 2) == g_sMyLangCore) { // add to list?
                        oLangList[oLangList.length] = sCurrentLang;
                        oLangListCodes[sCurrentLang] = sCurrentLang;
                    }


                    if (bWantSub && g_sMyLangSub == sCurrentLang) {
                        // found the exact sub lang code wanted!
                        bFoundOtherSub = true;
                        bLoadCurrentSection = true;
                    }
                    else if (!bWantDefault && g_sMyLangCore == sCurrentLang) // look for main lang code
                    {
                        // found the core other language
                        bFoundOther = true;
                        bLoadCurrentSection = true;
                    }
                    else if (sCurrentLang == g_sLangDefault)  // default to EN if nothing else found. EN should be last in file!
                    {
                        bLoadCurrentSection = true;
                    }
                }
                else { // invalid code after -->
                    alert('Invalid language code "' + sCurrentLang + '" at line ' + iLineCount + ' in Phrases.txt file.')  // have no phrases loaded!!;
                }

            }
            else if (bLoadCurrentSection) {
                if (sLine != '') {
                    saLine = sLine.split('|', 2);
                    sKey = saLine[0].trim().toUpperCase();

                    // if have a , use what comes after as the phrase. If not, use the key
                    sPhrase = (saLine.length == 2 ? saLine[1] : saLine[0]).trim();

                    // only load if we don't have it already
                    if (g_oPhraseList[sKey] == null) {// load this phrase
                        g_oPhraseList[sKey] = sPhrase;
                        oPhraseLang[sKey] = sCurrentLang;
                        iPhrasesTotal += 1;
                        if (bFoundOtherSub) iPhrasesOtherSub += 1;
                        if (bFoundOther) iPhrasesOther += 1;
                    }
                    else { // already loaded
                        if (sCurrentLang == oPhraseLang[sKey]) {
                            iPhrasesDup += 1;
                            sDupLog += '  (' + sCurrentLang + ') ' + sPhrase + '\n';
                        }
                    }
                }
            }
        }
        f.close();
    }

    g_sTransLog += Phrase('LanguageList') + ': ' + oLangList.join(',') + '\n';
    g_sTransLog += Phrase('Target Language') + ': ' + g_sMyTargetLang + '\n\n';
    if (iPhrasesOtherSub > 0) g_sTransLog += Phrase('TransCount', g_sMyLangSub, iPhrasesOtherSub) + '\n';
    if (iPhrasesOther > 0) g_sTransLog += Phrase('TransCount', g_sMyLangCore, iPhrasesOther) + '\n';
    if (iPhrasesOther + iPhrasesOtherSub > 0) g_sTransLog += Phrase('Untranslated', iPhrasesTotal - (iPhrasesOther + iPhrasesOtherSub)) + '\n';
    g_sTransLog += Phrase('Total Phrases') + ': ' + iPhrasesTotal + '\n';  // g_oPhrases.length -- did not work!?

    if (sDupLog != '') g_sTransLog += '\n' + Phrase('DuplicatePhrases', iPhrasesDup) + '\n' + sDupLog;

    //var nEndTime = new Date();
    //var sSeconds = Math.round((nEndTime.getMilliseconds() - nStartTime.getMilliseconds()) * 100) * 10;
    //g_sTransLog+='\n' + sSeconds;
}

function ShowTransResults() {// report the results
    alert(g_sTransLog);
}
 
