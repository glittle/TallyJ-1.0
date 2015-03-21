/// <reference path="jquery-1.4.4.js" />
/// <reference path="general.js" />
/// <reference path="namelist.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

//window.onerror = OnError;
var g_iCurrentRow = -1;   // what is the last row?

var g_iCurrentBallotListRow = -1;
var g_sCurrentBallotUniqCode = '';
var g_sCurrentBallotId = '';
var g_divBallotCurrent = null;

var g_bDefaultAdd = (GetValue('DefaultAdd') == 'Yes');


var g_pendingFocus = null;

var settings = {
    AllowAddNew: false
};

function PrepPage() {
    if (top.g_domElection == null || top.g_domElection.documentElement == null) {
        alert(Phrase('NeedElection'));
        return;
    }

    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'));
        return;
    }

    PrepareHighSlide();

    // ensure XSD is loaded
    top.LoadElectionXSD();

    var info = top.g_domElection.documentElement.selectSingleNode('Info');
    settings.AllowAddNew = info.getAttribute('AllowAddNewInBallot') == 'true';

    //TODO: use AllowAddNew to enable/disable the Add New on the ballot / vote lines

    SetHeights();

    RefreshBallotList();
    //  BuildLookup()
    //  BuildStubLengthSelect()
    //BuildMaxNameList();

    // check to see if particular ballot wanted
    LoadRequested();

    FocusOnBallotList();

    FillSpoiledOptions();

    RefreshValidationStatus();

    window.onresize = SetHeights;
}

function FillSpoiledOptions() {
    var found = 0,
        select = $('.selSpoiled');

    AddGroup('Unidentifiable', select);
    AddGroup('Unreadable', select);
    AddGroup('Ineligible', select);

    select.attr('size', Math.min(14, select.find('*').length));

    var btnChoose = $('#btnChooseSpoiled');
    select.keydown(function (ev) {
        if (ev.which == 27) {
            hs.close();
        }
        if (ev.which == 13) {
            btnChoose.click();
        }
    }).dblclick(function () {
        btnChoose.click();
    }); ;

    btnChoose.click(function () {
        var exp = hs.getExpander();
        if (exp && exp.custom) {
            var option = $('.selSpoiled:visible').find('option:selected');
            SetSpoiledReason(exp.custom, option.val(), option.text());
            MoveToNextInput(++exp.custom.num);
        }
        hs.close();
    });
}

function AddGroup(name, select) {
    var maxPossible = 15;
    var fullname = 'SpoiledType' + name;

    var group = $('<optgroup label="{0}"></optgroup>'.filledWith(Phrase(fullname)));

    for (var i = 1; i < maxPossible; i++) {
        var phrase = Phrase(fullname + i);
        if (phrase.substr(0, 2) === '??') continue;
        group.append('<option value="{1}">{0}</option>'.filledWith(phrase, name)); // same value for multiple options
    }
    select.append(group);
}

function PrepareHighSlide() {
    hs.graphicsDir = '../HighslideGraphics/';
    hs.outlineType = 'rounded-white';
    hs.wrapperClassName = 'draggable-header';
    hs.showCredits = false;

    hs.Expander.prototype.onAfterExpand = function () {
        $('.selSpoiled:visible').focus();
    }
}

function RefreshValidationStatus() {
    $('#divValidationStatus')
            .removeClass('BallotsValidationStatus0Short')
            .removeClass('BallotsValidationStatus1Short')
            .removeClass('BallotsValidationStatus2Short')
            .addClass('BallotsValidationStatus{0}Short'.filledWith(top.g_ballotsValidationStatus))
            .text(Phrase('BallotsValidationStatus{0}Short'.filledWith(top.g_ballotsValidationStatus)));
}

function SetHeights() {
    var div = $('#table1');
    var overall = $(window).height();

    //alert('{0}\n'.filledWithEach([div.height(), overall]));

    div.height(overall - 75);
    //div.clientHeight = td.clientHeight;

    $('#divBallotList').css('max-height', (overall - 65) + 'px');

}

function FocusOnBallotList() {
    $('#btnNewBallot').focus();

    //    if (divBallotList.children.length == 0)
    //    else {
    //        $('#divBallotList').first().focus();
    //    } 
}

function LoadRequested() { // if querystring has  ballot=XX
    var sQuery = location.search;
    var saList = sQuery.substr(1).split('&');

    for (var i = 0; i < saList.length; i++) {
        var saQuery = saList[i].split('=');
        if (saQuery[0].toUpperCase() == 'BALLOT') {
            BuildBallot(saQuery[1]);
        }
    }
}

function RefreshAfterBallotValidation() {
    RefreshBallotList();
}

function RefreshBallotList() {
    var oBallotList = top.g_domElection.documentElement.selectNodes('Ballot');

    // build div list
    var html = [];

    for (var i = oBallotList.length - 1; i >= 0; i--) {
        var oBallot = oBallotList[i];
        var sId = oBallot.getAttribute('Id');
        var status = oBallot.getAttribute('BallotStatus');
        var invalidVoteCount = 0;
        if (status == 'Ok') {
            invalidVoteCount = oBallot.selectNodes("Vote[@VoteStatus!='Ok']").length;
        }

        html.push('<div style="padding-left:10px;text-indent:-10px;" id="B_' + sId + '">'
          + sId
          + ' (' + Phrase('BStatus' + status)
          + (invalidVoteCount > 0 ? ' - ' + Phrase('BallotInvalidVotes', invalidVoteCount) : '')
          + ')</div>');
    }
    if (html.length == 0) {
        html.push(Phrase('(No ballots)'));
    }

    divBallotList.innerHTML = html.join('');

    SelectBallotInList();

    RefreshValidationStatus();
}



function PageAfterSave() {
    RefreshBallotList();
}


function NewBallot() {
    if (SaveNeeded())
        if (!confirm(Phrase('SaveNeeded')))
            return;

    if (g_divBallotCurrent != null) { // unhighlight previous name
        // this sometimes did not clear all
        RemoveHighlight(g_divBallotCurrent);
    }

    CancelSaveNeeded();
    BuildBallot();

    MoveToNextInput(0, 400);
}


function LoadBallot(sBallotId) {
    if (sBallotId == null) { // not supplied... get currently highlighted ballot
        if (g_divBallotCurrent == null) {
            // none highlighted, exit
            return;
        }
        else {// do have one selected in list
            sBallotId = g_divBallotCurrent.id.split('_')[1];
        }
    }

    if (SaveNeeded())
        if (!confirm(Phrase('SaveNeeded')))
            return;

    CancelSaveNeeded();
    //if(selBallotList.selectedIndex!=-1)
    //  BuildBallot(selBallotList.options[selBallotList.selectedIndex].value)
    BuildBallot(sBallotId);
}

function GetNextElectionId() {
    var oElection = top.g_domElection.documentElement;
    var oInfo = oElection.selectSingleNode('Info');
    var sBallotId = '';

    // determine the last number in use
    // get the Id of the last in the document. That should usually be the biggest number
    var oLastId = oElection.selectSingleNode('(Ballot[substring-before(@Id,".")="' + top.g_sComputerCode + '"])[last()]/@Id');
    if (oLastId == null) {
        sLastId = 'A.0';
    }
    else {
        sLastId = oLastId.text;
        if (sLastId.indexOf('.') == -1) { // don't have  x.x
            sLastId = 'A.' + sLastId;
        }
    }

    // now, check that Id and make sure it is not in use
    var iNumber = Number(sLastId.split('.')[1]) + 1;
    var bDone = false;
    while (!bDone) {
        sBallotId = top.g_sComputerCode + '.' + iNumber;
        if (oElection.selectNodes('Ballot[@Id="' + sBallotId + '"]').length != 0) { // that Id is already in use!
            iNumber = iNumber + 1;
        }
        else {
            bDone = true;
        }
    }

    return sBallotId;
}

function BuildBallot(sBallotId) {

    var oElection = top.g_domElection.documentElement;
    var oInfo = oElection.selectSingleNode('Info');

    // find the ballot
    var oBallot;
    if (sBallotId) {
        oBallot = oElection.selectSingleNode('Ballot[@Id="' + sBallotId + '"]');
        if (oBallot == null) {
            alert('"' + sBallotId + '" ' + Phrase('Ballot not found'));
            return;
        }
    }
    else { // new ballot
        oBallot = top.g_domElection.createElement('Ballot');
        oBallot.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection));
        oBallot.setAttribute('BallotStatus', 'New');

        sBallotId = GetNextElectionId();

        oBallot.setAttribute('Id', sBallotId);

        // add to end of file (HARDCODED: assume Ballots are at the end of the document)
        oElection.appendChild(oBallot);
        CheckSave(true);
    }

    CheckBallotStatus(null, null, oBallot);

    var sUniqCode = oBallot.getAttribute('UniqCode');

    g_sCurrentBallotUniqCode = sUniqCode;
    g_sCurrentBallotId = sBallotId;

    // determine how many vote lines to show
    var iNumVotes = +oInfo.getAttribute('NumberToElect');

    // ensure ballot has the required number of ballots
    var oVoteList = oBallot.selectNodes('Vote');

    if (iNumVotes == oVoteList.length) { // have the number of votes we want
    }
    else if (oVoteList.length < iNumVotes) { // have too few - add some
        // oVoteList is not dynamic in XML 4!
        for (var i = oVoteList.length; i < iNumVotes; i++) //while(oVoteList.length < iNumVotes)
        {
            oBallot.setAttribute('BallotStatus', 'TooFew');
            var oVote = top.g_domElection.createElement('Vote');
            oVote.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection));
            oVote.setAttribute('VoteStatus', 'New');
            oBallot.appendChild(oVote);
            CheckSave(true);
        }
    }

    //alert(oBallot.xml) 

    // display the votes
    var sStatusAlert = '';
    switch (oBallot.getAttribute('BallotStatus')) {
        case 'Ok':
        case 'New':
            break;
        default:
            sStatusAlert = '<span class=warning1> ' + Phrase('Ballot Invalid') + '**</span>';
            break;
    }

    // get the updated list
    oVoteList = oBallot.selectNodes('Vote');

    var sHTML = '<table width="100%" cellpadding=2 cellspacing=2><tr>';
    //sHTML += '<td></td><td>' + Phrase('Search') + '</td><td width=100>' + Phrase('First Name') + '</td><td width=100>' + Phrase('Last Name') + '</td><td width=100>' + Phrase('AKA Name') + '</td><td>' + Phrase('Bahai ID') + '</td><td>' + Phrase('Vote Status') + sStatusAlert + '</td></tr>'
    sHTML += '<td></td><td colspan>' + Phrase('Search') + '</td><td>' + Phrase('VoteName') + '</td><td>' + Phrase('Bahai ID') + '</td><td>' + Phrase('Vote Status') + sStatusAlert + '</td></tr>';
    //sHTML += '<td colspan=2>' + Phrase('Search') + '</td><td>' + Phrase('VoteName') + '</td><td>' + Phrase('Vote Status') + sStatusAlert + '</td></tr>'

    for (i = 0; i < oVoteList.length; i++) {
        sHTML += AddVoteLine(i, oVoteList[i], iNumVotes, sBallotId, oVoteList.length > iNumVotes);
    }

    sHTML += '</table><table width="100%"><tr><td width=1%>';

    sHTML += '<button id=btnCloseBallot accesskey="' + Phrase('BallotNotValidAccessKey') + '" onclick="btnCloseBallotClick(\'' + sUniqCode + '\')" style="display:none;">' + Phrase('BallotNotValid') + '</button>';
    sHTML += '<button id=btnComplete class=SaveButton accesskey="' + Phrase('Check&SaveAccessKey') + '" onclick="SaveBallot()">' + Phrase('BallotCheck&Save') + '</button>';

    sHTML += '</td><td valign=top align=right>';

    sHTML += ' &nbsp; &nbsp; <button id=btnDeleteBallot onclick="btnDeleteBallotClick(\'' + sUniqCode + '\')">' + Phrase('Delete Entire Ballot') + '</button>';

    sHTML += '</td><td align=right valign=top>';

    if (settings.AllowAddNew) {
        sHTML += '<input type=checkbox onclick=DefaultAddClicked("' + sBallotId + '") id=cbDefaultAdd' + IfDefaultAdd() + '><label class="comment" for=cbDefaultAdd>' + Phrase('DefaultAdd') + '</label>';
    }

    sHTML += '</td></tr></table>';

    divBallotTitle.innerHTML = '<table width=100%><tr><td>' + Phrase('Ballot')
      + ' ' + Phrase('Id#') + ' &nbsp; <span id=divCurrentBallotId>' + sBallotId + '</span></td>'
      + '<td>' + Phrase('BallotStatus') + ' <span class=BallotStatus>' + top.lists.BallotStatus[oBallot.getAttributeNode('BallotStatus').value] + '</span>'
      + '</td><td>' + AttributeEdit(oBallot, 'OverrideStatus', oBallot.getAttributeNode('OverrideStatus'), 'SmallSelect', null, null, null, 'Override')
      + '</td></tr></table>';

    divBallot.innerHTML = sHTML;

    // update the status of each
    for (i = 0; i < oVoteList.length; i++) {
        UpdateNameInputVisibility(i, oVoteList[i].getAttribute('VoteStatus'));
    }


    // act on the current state of the checkbox
    // Override(document.getElementById(sUniqCode + 'CB'))

    BuildTextNameLookup('', '', '', '', false, false, true);

    SelectBallotInList('B_' + sBallotId);  //1.46 - need to prepend B_ to match usage inside

    // focus on first element
    // MoveToNextInput(0);
}

//function AttributeEdit(oNode, sAttrName, oAttrNode, sClass, sId, sExtraHTML, domXSD, sPhrasePrefix, iSelectSize, sTitle) { // display the HTML to edit this attribute

function IfDefaultAdd() {
    return g_bDefaultAdd ? ' checked' : '';
}

function DefaultAddClicked(sBallotId) {
    var bDefaultAdd = event.srcElement.checked;
    if (bDefaultAdd != g_bDefaultAdd) {
        g_bDefaultAdd = bDefaultAdd;
        SaveValue('DefaultAdd', bDefaultAdd ? 'Yes' : 'No');
        if (!SaveNeeded()) {
            // reload now...
            BuildBallot(sBallotId);
        }
        // if not now, will be ready for next load
    }
}

function AddVoteLine(i, oVote, iMaxWanted, sBallotId, bTooMany) {
    // ensure Vote has a Person element
    var oPerson = oVote.selectSingleNode('Person');
    if (oPerson == null) { // add Person
        oPerson = top.g_domElection.createElement('Person');
        oPerson.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection));

        oVote.appendChild(oPerson);
    }

    var sHTML = '';
    var showColor;
    var color = {
        blue: '#CCCCFF',
        red: '#FF9999',
        orange: '#FAD591'
    };
    var iDisplay = (i + 1);

    var status = oVote.getAttribute('VoteStatus');

    switch (status) {
        case 'New':
        case 'Unknown':
            if (g_bDefaultAdd && settings.AllowAddNew) {
                oVote.setAttribute('VoteStatus', 'AddToList');
            }
            showColor = color.blue;

            break
        case 'AddToList':
            if (!settings.AllowAddNew) {
                oVote.setAttribute('VoteStatus', 'New')
            }
            showColor = color.blue;
            break;


        case 'Ok':
            break;

        case 'Spoiled':
            showColor = color.orange;
            break;

        default:
            showColor = color.red;
            break;
    }

    if (CheckVotes(oVote) == 1) { // this is a duplicate!
        showColor = color.red;
    }
    if (iDisplay > iMaxWanted) {
        showColor = color.red;
    }

    if (showColor) {
        sHTML += '<tr style="background-color: {0}">'.filledWith(showColor);
    }
    else {
        sHTML += '<tr>';
    }

    var sDisplay = '<u>' + iDisplay + '</u>';
    var sAltKey = iDisplay;

    if (iDisplay > 9) {
        // just underline the last number
        var text = '' + iDisplay;
        var first = text.substr(0, text.length - 1);
        var last = text.substr(text.length - 1, 1);
        sDisplay = first + '<u>' + last + '</u>';
        sAltKey = last;
    }

    sHTML += '<td width="1%">' + sDisplay + '</td>';
    sHTML += '<td width="9%">';
    sHTML += '<input name=Input_' + i + ' id=Input_' + i + ' style="width:100%" onkeydown="KeyDown(\'Input\')" onkeyup="KeyUp(\'Input\')" onfocus="NameFocus()" AccessKey="' + sAltKey + '">';

    sHTML += '</td><td width="50%" class="BallotVotesL"><div class=Show>';

    sHTML += '<span id=FName_span_' + i + ' style="font-weight:normal">' + GetNodeValue(oPerson, 'FName') + '</span>';
    sHTML += ' <span id=LName_span_' + i + ' style="font-weight:normal">' + GetNodeValue(oPerson, 'LName') + '</span>';
    sHTML += ' <span id=AKAName_span_' + i + '>' + GetNodeValue(oPerson, 'AKAName', '[', ']') + '</span>';

    sHTML += '</div><div class="Inputs">';

    sHTML += '<span>' + Phrase('FirstShort') + ' ' + AttributeEdit(oPerson, 'FName', oPerson.getAttributeNode('FName'), 'voteNames', 'FName_' + i, 'style="width:100px; z-order:1;" onfocus="NameFocus()" onkeydown="KeyDown(\'FName\')" onkeyup="KeyUp(\'FName\')" AccessKey="' + iDisplay + '"', null, null, null, 'First Name') + '</span>';
    sHTML += '<span>' + Phrase('LastShort') + ' ' + AttributeEdit(oPerson, 'LName', oPerson.getAttributeNode('LName'), 'voteNames', 'LName_' + i, 'style="width:100px;" onfocus="NameFocus()" onkeydown="KeyDown(\'LName\')" onkeyup="KeyUp(\'LName\')"', null, null, null, 'Last Name') + '</span>';
    sHTML += '<span>' + Phrase('AKAShort') + ' ' + AttributeEdit(oPerson, 'AKAName', oPerson.getAttributeNode('AKAName'), 'voteNames', 'AKAName_' + i, 'style="width:80px;" onfocus="NameFocus()" onkeydown="KeyDown(\'AKAName\')" onkeyup="KeyUp(\'AKAName\')"', null, null, null, 'AKA Name') + '</span>';

    sHTML += '</div></td><td width="10%" class="BallotVotesR"><div class=Show>';
    sHTML += '<span id=BahaiId_span_' + i + ' style="">' + GetNodeValue(oPerson, 'BahaiId') + '</span>';
    sHTML += '</div><div class="Inputs">';

    sHTML += AttributeEdit(oPerson, 'BahaiId', oPerson.getAttributeNode('BahaiId'), 'voteNames', 'BahaiId_' + i, 'style="width:50px;" onfocus="NameFocus()" onkeydown="KeyDown(\'BahaiId\')" onkeyup="KeyUp(\'BahaiId\')"', null, null, null, 'Bahai Id');

    sHTML += '</span></td><td width="25%" class=BallotVotesAction>';

    // unknown
    //sHTML += '<button onclick="ChangeStatus(' + i + ',\'Ineligible\',\'' + oVote.getAttribute('UniqCode') + '\',\'' + sBallotId + '\')" title="' + Phrase('SetIneligible') + '">!</button>'
    if (bTooMany)// (i+1) > iMaxWanted)
    {
        sHTML += '<button onclick="DeleteVote(\'' + oVote.getAttribute('UniqCode') + '\',\'' + sBallotId + '\')" title="' + Phrase('DeleteExtra') + '">Del</button>';
    }
    sHTML += '<button onclick="ChangeStatus(' + i + ',\'Spoiled\',\'' + oVote.getAttribute('UniqCode') + '\',\'' + sBallotId + '\', this)" id="SetSpoiled' + i + '" title="' + Phrase('SetUnReadable') + '">' + Phrase('SpoiledButton') + '</button>';

    if (settings.AllowAddNew) {
        sHTML += '<button onclick="ChangeStatus(' + i + ',\'AddToList\',\'' + oVote.getAttribute('UniqCode') + '\',\'' + sBallotId + '\')" title="' + Phrase('SetAddToList') + '">+</button>';
    }

    var detailAttr = oVote.getAttribute('SpoiledDetail');

    sHTML += '<span class=StatusGroup><span class=VoteStatus id=VoteStatus_{num} UniqCode="{code}">{text}{spoiled}</span></span>'.filledWith({
        num: i,
        text: top.lists.VoteStatus[status],
        spoiled: status === 'Spoiled' && detailAttr ? '<br> ' + detailAttr : '',
        code: oVote.getAttribute('UniqCode')
    });

    sHTML += '</td>';
    return sHTML + '</tr>';
}

function ChangeStatus(i, newStatus, sUniqCode, sBallotId, srcButton) {
    var oVote = top.g_domElection.selectSingleNode('//Vote[@UniqCode="' + sUniqCode + '"]');
    if (!oVote) return;

    switch (newStatus) {
        case 'AddToList':
            oVote.setAttribute('VoteStatus', newStatus);
            RedisplayVoteStatus(i, oVote);
            UpdateNameInputVisibility(i, newStatus);
            return;

        case 'Spoiled':
            var buttonOffset = $(srcButton).offset();
            hs.close();
            hs.htmlExpand(null, {
                contentId: 'divSpoiledTypes',
                width: 250,
                height: 300,
                pageOrigin: {
                    x: buttonOffset.left,
                    y: buttonOffset.top
                },
                expandDuration: 0,
                targetX: srcButton.id + ' -150px',
                targetY: srcButton.id + ' 30px'
            }, {
                num: i,
                vote: oVote
            });

            oVote.setAttribute('VoteStatus', newStatus);
            ClearVote(i, oVote);
            //UpdateNameInputVisibility(i, newStatus);
            ClearInputsAndRedisplay(i);
            break;

        default:
            alert('unexpected');
    }
}

function SetSpoiledReason(custom, group, detail) {
    var oVote = custom.vote;

    oVote.setAttribute('VoteStatus', 'Spoiled');
    oVote.setAttribute('SpoiledGroup', group);
    oVote.setAttribute('SpoiledDetail', detail);

    RedisplayVoteStatus(custom.num, oVote);
}

function ClearVote(iNum, oVote) {
    var oPerson = oVote.firstChild;
    BlankInput('FName', iNum, oPerson);
    BlankInput('LName', iNum, oPerson);
    BlankInput('AKAName', iNum, oPerson);
    BlankInput('BahaiId', iNum, oPerson);
}

function BlankInput(sName, iNum, oPerson) {
    var e = document.getElementById(sName + '_' + iNum);
    e.value = '';
    //oPerson.setAttribute(sName, '');

    AdjustNameInput(sName, iNum, '', false, false, false);
    SaveAttribute(e, sName);
}

function DeleteVote(sUniqCode, sBallotId) {
    var oVote = top.g_domElection.selectSingleNode('//Vote[@UniqCode="' + sUniqCode + '"]');
    if (oVote != null) {
        oVote.parentNode.removeChild(oVote);

        CheckBallotStatus(sBallotId, true);
        BuildBallot(sBallotId);
    }

}

function UpdateNameInputVisibility(iNum, sSelection) {
    // show input boxes if status = AddToList
    var showInputs = sSelection == 'AddToList' && settings.AllowAddNew;

    var td = $('#FName_' + iNum).parents('td').first();
    var td2 = $('#BahaiId_' + iNum).parents('td').first();
    if (showInputs) {
        td.find('.Show').hide();
        td.find('.Inputs').show();
        td2.find('.Show').hide();
        td2.find('.Inputs').show();
    }
    else {
        td.find('.Show').show();
        td.find('.Inputs').hide();
        td2.find('.Show').show();
        td2.find('.Inputs').hide();
    }

    AdjustNameInput('FName', iNum, null, showInputs, sSelection != 'Ok', true);
    AdjustNameInput('LName', iNum, null, showInputs, sSelection != 'Ok', true);
    AdjustNameInput('AKAName', iNum, null, showInputs, sSelection != 'Ok', true);
    AdjustNameInput('BahaiId', iNum, null, showInputs, sSelection != 'Ok', true);
}

function SaveBallot(bOverride) {
    // If status is okay, save election and clear the screen
    // If status not okay, show message and extra button to close anyways

    top.ValidationNeeded();

    var sUniqCode = g_sCurrentBallotUniqCode;

    if (bOverride == null) bOverride = false;

    var sStatus = 'Ok';
    var sBallotId = '';

    if (g_sCurrentBallotUniqCode != '') { // still have a current ballot, hasn't been deleted
        var oBallot = top.g_domElection.selectSingleNode('//Ballot[@UniqCode="' + sUniqCode + '"]');
        sBallotId = oBallot.getAttribute('Id');

        if (!bOverride) {
            sStatus = CheckBallotStatus(null, true, oBallot);
        }
    }
    else {

    }

    if (sStatus == 'Ok') {
        // save file if needed
        // clear warning flag now that ballot has been checked
        top.SaveElection();

        ClearBallotArea(true);

        if (sBallotId != '') BuildBallot(sBallotId);

        RefreshBallotList();
        SelectBallotInList('B_' + sBallotId);

        FocusOnNewBallotButton();
    }
    else if (sStatus == 'New') {
        alert(Phrase('SaveUndetermined'));
    }
    else {
        // show override button
        snd.src = g_sOopsSound
        BuildBallot(sBallotId)
        //RefreshBallotList()
        btnCloseBallot.style.display = 'inline-block'
    }

    //btnCloseBallot

}

function btnCloseBallotClick(sUniqCode) {
    // override status
    SaveBallot(true);

}


function ClearBallotArea(focusOnNew) {
    // clear the area
    divBallot.innerHTML = '';
    divBallotTitle.innerHTML = '';

    BuildTextNameLookup('', '', '', '', false, false, true);
    // focus on the new button
    if (focusOnNew) FocusOnNewBallotButton();

}

function btnDeleteBallotClick(sUniqCode) {
    if (!confirm(Phrase('DeleteBallot'))) {
        return;
    }

    // delete it
    var oBallot = top.g_domElection.selectSingleNode('/Election/Ballot[@UniqCode="' + sUniqCode + '"]');

    oBallot.parentNode.removeChild(oBallot);

    g_sCurrentBallotUniqCode = '';
    g_sCurrentBallotId = '';

    ClearBallotArea(true);
    SaveBallot();
}

function CopyFromList(sUCId, iNum) {
    if (sUCId.substr(0, 3) == 'UC_') {
        sUCId = sUCId.substr(3);
    }
    // get this person from the community list
    var sSearch = 'Person[@UniqCode="' + sUCId + '"]';
    var oPerson = top.g_domCommunity.documentElement.selectSingleNode(sSearch);

    if (oPerson == null) {
        //alert(sSearch)
        return;
    }

    // show correct name in input fields
    if (typeof (iNum) == 'undefined') {
        iNum = +g_iCurrentRow;
    }
    if (iNum === -1) return;

    var updated = false;
    updated |= UpdateNamePart('LName', iNum, oPerson);
    updated |= UpdateNamePart('FName', iNum, oPerson);
    updated |= UpdateNamePart('AKAName', iNum, oPerson);
    updated |= UpdateNamePart('BahaiId', iNum, oPerson);

    CopyStatus(iNum, oPerson);

    ClearInputsAndRedisplay(iNum);

    // move to next
    iNum++;
    MoveToNextInput(iNum);
}

function ClearInputsAndRedisplay(iNum) {
    // clear input field
    var sId = 'Input_' + iNum;
    document.all[sId].value = '';

    // check the entire status
    // remember where we are
    CheckBallotStatus(g_sCurrentBallotId, true);
    BuildBallot(g_sCurrentBallotId);

}

function FocusOnInput(iNum) {
    var e = document.getElementById('Input_' + iNum);
    if (e != null) {
        e.focus();
        return true;
    }
    FocusOnSave();
    return false;
}

function MoveToNextInput(iNum, timeout) {
    clearTimeout(g_pendingFocus);
    g_pendingFocus = setTimeout(function () {
        FocusOnInput(iNum);
    }, timeout);
}

function FocusOnSave() {
    var btn = document.getElementById('btnComplete');
    if (btn != null) btn.focus();
}

function FocusOnNewBallotButton(bDoNow) {
    if (bDoNow) {
        var btn = document.getElementById('btnNewBallot');
        if (btn != null) btn.focus();
    }
    else {
        clearTimeout(g_pendingFocus);
        g_pendingFocus = setTimeout('FocusOnNewBallotButton(true)', 1);  // cause this to happen after the current event is done!
    }
}

function KeyUp(sField) { // in VoteName inputs
    var e = event.srcElement;
    var iKey = event.keyCode;

    // TODO: filter on typed keystokes -- is this needed?

    if (FilterKeys(iKey)) {
        return;
    }

    // a key was pressed, so try to look up a match!
    //divTest.innerText = sField + ' ' + iKey + ' ' + String.fromCharCode(iKey)
    /*  if(g_sValidChars.indexOf(String.fromCharCode(iKey))==-1) 
    {
    event.cancelBubble = true
    //divDebug.innerText += ' cancel '
    return
    }
    */
    //divDebug.innerText = iKey  
    // note whether we are typing a name or moving around
    var bTyping = (iKey == 46  //delete 
                 || iKey == 8  //backspace
                 || iKey >= 48  //everything else
                )
    // don't bother to update list if not typing a valid character
    if (!bTyping || event.shiftKey || event.altKey || event.ctrlKey) return;

    // for now, only do lookup on LName field
    var sLName = '';
    var sFName = '';
    var bRebuild = false;

    if (sField == 'Input') {
        sFName = e.value;
        var sa = sFName.split(' ');
        if (sa.length > 1) {
            sFName = sa[0];
            sLName = sa[1];
        }
        else
            sLName = '';
        bRebuild = true;
    }

    if (bRebuild) {
        //sLName = sLName.CleanUp()
        sFName = sFName.CleanUp();

        setTimeout('BuildTextNameLookup("' + sLName + '","' + sFName + '","","",true)', 0);
        return;
    }

}

function FilterKeys(iKey) {
    if (iKey == 220 || iKey == 222) // the \ and " keys
    {
        event.cancelBubble = true;
        event.returnValue = false;
        return true;
    }
    if (iKey == 18) // the ALT key
    {
        return true;
    }
}

function KeyDown(sField) { // in VoteName - track cursor and tab etc.
    var e = event.srcElement;
    var iKey = event.keyCode;
    var iNumNames = divTextNameLookup.children.length;

    if (FilterKeys(iKey)) {
        return;
    }
    switch (iKey) {
        case 40: // down
            if (event.ctrlKey || iNumNames == 1) { // Ctrl-Down - move to next vote
                var sId = e.id;
                var iNum = sId.split('_')[1];
                sId = 'Input_' + (iNum * 1 + 1);
                try { // set focus on next item, if it exists
                    document.all[sId].focus();
                }
                catch (e) {// ignore if we can't move past this one
                }
            }
            else if (!event.shiftKey && !event.altKey)
                MoveLookup(1);
            break;

        case 38: // up
            if (event.ctrlKey || iNumNames == 1) { // Ctrl-Up - move to next vote
                sId = e.id;
                iNum = sId.split('_')[1];
                sId = 'Input_' + (iNum * 1 - 1);
                try { // set focus on next item, if it exists
                    document.all[sId].focus();
                }
                catch (e) {// ignore if we can't move past this one
                }
            }
            else if (!event.shiftKey && !event.altKey)
                MoveLookup(-1);
            break;

        case 34: // pg down
            if (!event.shiftKey && !event.altKey && !event.ctrlKey)
                MoveLookup(10);
            break;

        case 33: // pg up
            if (!event.shiftKey && !event.altKey && !event.ctrlKey)
                MoveLookup(-10)
            break

        case 13: // enter
            // if Lookup is selected, choose listed name
            // go to next vote. If at end, go to button
            //alert(e.id)

            // learn what field and row# we are in
            sId = e.id;
            iNum = sId.split('_')[1];

            if (g_divNameCurrent != null) { // take the currently selected name
                CopyFromList(g_divNameCurrent.id, iNum) // moves to next after
            }
            var input = document.getElementById('Input_' + iNum);
            input.value = ''; //blank the input, no match was found

            // do nothing 
            break

        default:
            //divDebug.innerText = g_sValidChars.indexOf(String.fromCharCode(iKey))
            //divDebug.innerText = iKey
            /*
            if(g_sValidChars.indexOf(String.fromCharCode(iKey))==-1)
            {
            // not a letter, probably a cursor key or such...
            // also don't want a single quote accepted!
            //divTest.innerText = iKey    
            event.cancelBubble = true
            }
            */
    }
}

function GetNameValue(sWantedField, eCurrent) { // given one of the input fields in a row, return the value in another input field
    var sId = eCurrent.id;
    var iNum = sId.split('_')[1];

    var eWanted = document.getElementById(sWantedField + '_' + iNum);
    if (eWanted != null) {
        return eWanted.value;
    }
    else
        return '';

}


// returns true if updated 
function UpdateNamePart(sName, iNum, oPerson) {
    var e = document.getElementById(sName + '_' + iNum);
    var v = oPerson.getAttribute(sName);
    if (v == null) {
        v = '';
    }
    if (e.value != v) {
        e.value = v;

        AdjustNameInput(sName, iNum, v, false, false, false);

        SaveAttribute(e, sName);

        return true;
    }
    else {
        return false;
    }
}

function AdjustNameInput(sName, iNum, sValue, bHidden, bError, bToggleInput) {
    var eSpan = document.getElementById(sName + '_span_' + iNum);

    if (sValue != null) eSpan.innerHTML = sValue;

    eSpan.style.display = bHidden ? 'none' : '';
    // eSpan.style.backgroundColor = bError ? 'red' : '#CCFF99';

    //alert(bHidden + ' ' + bError + ' ' + bToggleInput)

    if (bToggleInput) {
        var eInput = document.getElementById(sName + '_' + iNum);
        eInput.style.display = bHidden ? '' : 'none';  // toggle input fields the other way
    }
}

function CopyStatus(iNum, oCommunityPerson) {
    var span = document.getElementById('VoteStatus_' + iNum);
    var sUniqCode = span.getAttribute('UniqCode');
    var oVote = top.g_domElection.selectSingleNode('//Vote[@UniqCode="' + sUniqCode + '"]');

    var reason, ineligible;
    var age = oCommunityPerson.getAttribute('AgeGroup');
    if (age && age != 'Adult') {
        reason = age;
    }
    else { // have an adult
        ineligible = oCommunityPerson.getAttribute('IneligibleToReceiveVotes') === 'true';
        if (ineligible) {
            reason = oCommunityPerson.getAttribute('ReasonToNotReceive') || '';
        }
    }

    if (ineligible || reason) {
        // not eligible
        $(span).text(top.lists.VoteStatus['Spoiled']);
        oVote.setAttribute('VoteStatus', 'Spoiled');
        oVote.setAttribute('SpoiledGroup', 'Ineligible');
        oVote.setAttribute('SpoiledDetail', reason);
    }
    else {
        $(span).text(top.lists.VoteStatus['Ok']);
        oVote.setAttribute('VoteStatus', 'Ok');
        oVote.removeAttribute('SpoiledGroup');
        oVote.removeAttribute('SpoiledDetail');
    }
}

function NullIfNull(s) {
    return s == 'null' ? null : s;
}


function NameFocus() {
    var e = event.srcElement;
    e.select();

    var sId = e.id;
    var iNum = sId.split('_')[1];

    if (g_iCurrentRow != iNum) { // moved to new row... highlight first and/or last name in list
        var eLName = document.getElementById('LName_' + iNum);
        var eFName = document.getElementById('FName_' + iNum);
        var eAKAName = document.getElementById('AKAName_' + iNum);
        var eBahaiId = document.getElementById('BahaiId_' + iNum);

        var sLName = eLName == null ? '' : eLName.value;
        var sFName = eFName == null ? '' : eFName.value;
        var sAKAName = eAKAName == null ? '' : eAKAName.value;
        var sBahaiId = eBahaiId == null ? '' : eBahaiId.value;

        BuildTextNameLookup(sLName, sFName, sAKAName, '', false, false, sLName == '');
    }

    g_iCurrentRow = iNum;
}

function MoveBallotLookup(iOffset) // version for ballot
{
    // not on a name, abort
    if (g_iCurrentBallotListRow == null) return;

    // record the desired location
    g_iCurrentBallotListRow += iOffset;

    // check lower bound (upperbound will be checked in SelectTextName)
    if (g_iCurrentBallotListRow < 0) g_iCurrentBallotListRow = 0;

    // move to it
    SelectBallotInList(null, g_iCurrentBallotListRow);

    event.cancelBubble = true;
    event.returnValue = false;
}

function KeyDownInBallotList() { // in BallotList
    var e = event.srcElement;
    var iKey = event.keyCode;

    if (FilterKeys(iKey)) {
        return;
    }

    switch (iKey) {
        case 40: // down
            MoveBallotLookup(1);
            break;

        case 38: // up
            MoveBallotLookup(-1);
            break;

        case 34: // pg down
            MoveBallotLookup(10);
            break;

        case 33: // pg up
            MoveBallotLookup(-10);
            break;

        case 13: // enter
            // if Lookup is selected, choose listed name
            // go to next vote. If at end, go to button
            //alert(e.id)

            // learn what field and row# we are in
            var sId = e.id;
            var sBallotId = sId.split('_')[1];

            if (g_divBallotCurrent != null) {
                LoadBallot(sBallotId);
                return;
            }
            break;

        default:
            // divTest.innerText = iKey
    }
}


function ClickBallotList(bDoubleClick, fullId) {
    if (typeof (fullId) == 'undefined') {
        var e = event.srcElement;
        fullId = e.id;
    }

    if (fullId.substr(0, 2) != 'B_')
        return;

    var sBallotId = fullId.substr(2);

    // this sometimes did not clear all
    //RemoveHighlight(g_divBallotCurrent)
    var divChild;
    for (var i = 0; i < divBallotList.children.length; i++) {
        divChild = divBallotList.children[i];
        RemoveHighlight(divChild);
    }

    if (bDoubleClick) {// ???? Change?
        SelectBallotInList(fullId);
        //setTimeout('LoadBallot("' + sBallotId + '")',0)
        LoadBallot(sBallotId);
    }
    else {
        SelectBallotInList(fullId);
    }
}

function SelectBallotInList(sBallotDivId, iChildNumber, bDelayedAlready) {
    /*  if(bDelayedAlready==null) 
    {
    setTimeout('SelectBallotInList(' + (sBallotDivId==null ? 'null' : '"' + sBallotDivId + '"') 
    + ',' + (iChildNumber==null ? 'null' : iChildNumber)
    + ',true)', 0)
    return                              
    }
    */
    var divName = null;
    var iNumNames = divBallotList.children.length;
    if (iNumNames == 0) return;

    if (sBallotDivId == null && iChildNumber == null && g_divBallotCurrent != null) sBallotDivId = g_divBallotCurrent.id;

    if (sBallotDivId != null) { // given ID
        iChildNumber = null;
        if (sBallotDivId.substr(0, 2) == 'B_') {
            //divName = document.getElementById(sUCId)
            divName = divBallotList.children(sBallotDivId);
            if (divName == null) {
                // error??
                return;
            }
        }
    }
    else { // no Id given, look for number
        if (iChildNumber == null) iChildNumber = 0;

        if (iChildNumber >= iNumNames)
            iChildNumber = iNumNames - 1;

        divName = divBallotList.children(iChildNumber);
        if (divName == null) {
            // list is empty
            return;
        }
    }

    if (divName != null) {
        if (g_divBallotCurrent != null) { // unhighlight previous name
            // this sometimes did not clear all
            RemoveHighlight(g_divBallotCurrent);
        }

        // highlight new name
        AddHighlight(divName);
        //debugger;
        // scroll it into view
        var div$ = $(divName);
        var divHolder$ = $(divBallotList);
        var max = divHolder$.innerHeight() - 80;
        var current = div$.position().top;
        var currentScroll = divHolder$.scrollTop();

        if (current >= max) {
            divHolder$.scrollTop(currentScroll + current - max);
        }
        if (current < 60) {
            divHolder$.scrollTop(currentScroll + current - 60);
        }

        //divDebug.innerText = current + ', ' + max;

        //debugger;

        // remember it
        g_divBallotCurrent = divName;
        //alert(divName.id)
        // determine what number are we at?
        if (iChildNumber != null) {
            g_iCurrentBallotListRow = iChildNumber;
        }
        else {
            for (var i = 0; i < iNumNames; ++i) {
                if (divBallotList.children(i) == divName) {
                    g_iCurrentBallotListRow = i;
                    break;
                }
            }
        }
    }
    else { // didn't find a name
        g_divBallotCurrent = null;
        g_iCurrentBallotListRow = null;
    }
    //alert(divName.id + '  ' + g_iNameCurrent)
}


