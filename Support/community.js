/// <reference path="jquery-1.4.4.js" />
/// <reference path="general.js" />
/// <reference path="namelist.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var oPerson;

// function AttributeEdit(oNode, sAttrName, oAttrNode, sClass, sId, sExtraHTML, domXSD, sPhrasePrefix, iSelectSize, sTitle) { }

function PrepPage() {
    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'))
        return
    }

    // ensure XSD is loaded 
    top.LoadCommunityXSD()

    //BuildMaxNameList()
    //MaxNamesChanged()
    //  BuildTextNameLookup()

    var oCommunity = top.g_domCommunity.documentElement
    divCommName.innerHTML = AttributeEdit(oCommunity, 'Name', oCommunity.getAttributeNode('Name'), null, 'CommunityNameInput', null, top.g_domCommunityXSD)

    try {
        ClearSearch();
        FName_0.focus();
    }
    catch (e) { }

}


function AfterSave() {
    try {
        //FName_0.value='' // clear selection -- leave showing, for other family members
        MoveLookup(0);
        //FName_0.select()
        //FName_0.focus()
    }
    catch (e) { }
}

function NewPerson() {
    if (SaveNeeded())
        if (!confirm(Phrase('SaveNeeded')))
            return

    CancelSaveNeeded()
    BuildPerson()
}


function EditPerson() {
    if (SaveNeeded())
        if (!confirm(Phrase('SaveNeeded')))
            return

    CancelSaveNeeded()
    if (g_divNameCurrent != null) { // take the currently selected name
        CopyFromList(g_divNameCurrent.id)
    }
}

function BuildPerson(sUniqCode) {
    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'))
        return
    }

    var oCommunity = top.g_domCommunity.documentElement

    // find the person
    if (sUniqCode != null) {
        oPerson = oCommunity.selectSingleNode('Person[@UniqCode="' + sUniqCode + '"]')
        if (oPerson == null) {
            alert(Phrase('PersonNotFound'))
            return
        }
    }
    else { // new person
        oPerson = top.g_domCommunity.createElement('Person')
        oPerson.setAttribute('UniqCode', GetNextUniqCode(top.g_domCommunity))

        // add to end of file (HARDCODED: assume Person elements are at the end of the document)
        oCommunity.appendChild(oPerson)

        // Don't flag save needed until the new person is editted...
        //CheckCommunitySave()
    }

    sUniqCode = oPerson.getAttribute('UniqCode')

    // display the person
    var sHTML = '<table width="100%">'
    sHTML += '<tr><td width="15%" nowrap>' + Phrase('CommLastName') + '</td><td>' + AttributeEdit(oPerson, 'LName', oPerson.getAttributeNode('LName'), 'voteNames', 'LName', 'onkeydown="KeyDown(\'LName\')" onkeyup="KeyUp(\'LName\')" onfocus=NameFocus() AccessKey="' + Phrase('CommLastNameAccessKey') + '"', top.g_domCommunityXSD) + '</td></tr>'
    sHTML += '<tr><td nowrap>' + Phrase('CommFirstName') + '</td><td>' + AttributeEdit(oPerson, 'FName', oPerson.getAttributeNode('FName'), 'voteNames', 'FName', 'onkeydown="KeyDown(\'FName\')" onkeyup="KeyUp(\'FName\')" onfocus=NameFocus() AccessKey="' + Phrase('CommFirstNameAccessKey') + '"', top.g_domCommunityXSD) + '</td></tr>'
    sHTML += '<tr><td nowrap>' + Phrase('CommAKAName') + '</td><td>' + AttributeEdit(oPerson, 'AKAName', oPerson.getAttributeNode('AKAName'), 'voteNames', 'AKAName', 'onfocus="NameFocus()" onkeyup="EditFieldKeyUp()" AccessKey="' + Phrase('CommAKANameAccessKey') + '"', top.g_domCommunityXSD) + '<span class=InputComment>' + Phrase('CommNote3') + '</span></td></tr>'
    sHTML += '<tr id=trAge><td nowrap>' + Phrase('CommAgeGroup') + '</td><td>' + AttributeEdit(oPerson, 'AgeGroup', oPerson.getAttributeNode('AgeGroup'), null, 'AgeGroup', 'AccessKey="' + Phrase('CommAgeGroupAccessKey') + '"', top.g_domCommunityXSD, 'AgeGroup') + '</td></tr>'

//    sHTML += '<tr id=trEligVote><td nowrap>'
//            + Phrase('CommEligVote')
//            + '</td><td>'
//            + AttributeEdit(oPerson, 'IneligibleToVote', oPerson.getAttributeNode('IneligibleToVote'), null, 'IneligibleToVote', null, top.g_domCommunityXSD) 
//            + ' <span class=Reasons><span class=CurrentReason>'
//            + (oPerson.getAttributeNode('ReasonToNotVote') ? oPerson.getAttributeNode('ReasonToNotVote').value : '')
//            + '</span> '
//            + MakeReasonSelect('ReasonToNotVote', 'ReasonToNotVote')
//            + '</span></td></tr>'

    sHTML += '<tr id=trEligReceive><td nowrap>'
            + Phrase('CommElig')
            + '</td><td>'
            + AttributeEdit(oPerson, 'IneligibleToReceiveVotes', oPerson.getAttributeNode('IneligibleToReceiveVotes'), null, 'IneligibleToReceiveVotes', null, top.g_domCommunityXSD) 
            + ' <span class=Reasons><span class=CurrentReason>'
            + (oPerson.getAttributeNode('ReasonToNotReceive') ? oPerson.getAttributeNode('ReasonToNotReceive').value : '')
            + '</span> '
            + MakeReasonSelect('ReasonToNotReceive', 'SpoiledTypeIneligible')
            + '</span></td></tr>'

    sHTML += '<tr><td nowrap>' + Phrase('CommBahaiId') + '</td><td>' + AttributeEdit(oPerson, 'BahaiId', oPerson.getAttributeNode('BahaiId'), 'voteNames', 'BahaiId', 'onfocus="NameFocus()" onkeyup="EditFieldKeyUp()" AccessKey="' + Phrase('CommBahaiIdAccessKey') + '"', top.g_domCommunityXSD) + '</td></tr>'
    //sHTML += '<tr><td nowrap>' + Phrase('CommMinorityPriority') + '<td>' + AttributeEdit(oPerson, 'MinorityPriority', oPerson.getAttributeNode('MinorityPriority'), null, 'MinorityPriority', 'AccessKey="' + Phrase('MinorityPriorityAccessKey') + '"', top.g_domCommunityXSD, 'MinorityPriority') + '<span class=InputComment>' + Phrase('CommNote1') + '</span></td></tr>'
    //sHTML += '<tr><td/><td style="font-size: x-small">' + Phrase('CommNote1') + '</td></tr>'
    //sHTML += '<tr><td nowrap>' + Phrase('CommVoted') + '</td><td>' + AttributeEdit(oPerson, 'Voted', oPerson.getAttributeNode('Voted'), null, 'Voted', 'AccessKey="' + Phrase('CommVotedAccessKey') + '"', top.g_domCommunityXSD, 'Voted', 0) + '<span class=InputComment>' + Phrase('CommNote2') + '</span></td></tr>'
    //sHTML += '<tr><td/><td style="font-size: x-small">' + Phrase('CommNote2') + '</td></tr>'

    sHTML += '</table><br>'

    sHTML += '<table width=100%><tr><td>'
    sHTML += '<button id=btnComplete accesskey="' + Phrase('SaveCommAccessKey') + '" onclick="top.SaveCommunity(true)">' + Phrase('SaveComm') + '</button>'
    sHTML += '</td><td align=right><button id=btnDeletePerson onclick="btnDeletePersonClick(\'' + sUniqCode + '\')">' + Phrase('RemovePerson') + '</button>'

    divPerson.innerHTML = sHTML


    // focus on first element
    setTimeout('var e = document.getElementById(\'LName\');if(e) e.focus()', 25)

    $('#trAge select').change(UpdateEligLines);
    //$('#trEligVote input').change(UpdateEligLines);
    $('#trEligReceive input').change(UpdateEligLines);

    UpdateEligLines();
}

function UpdateEligLines() {
    var isAdult = $('#trAge select').val() == 'Adult';
    //var trEligVote = $('#trEligVote');
    var trEligReceive = $('#trEligReceive');

    if (!isAdult) {
        //trEligVote.hide();
        trEligReceive.hide();
        return;
    }

    //UpdateEligLine(trEligVote);
    UpdateEligLine(trEligReceive);
}

function UpdateEligLine(tr) {
    tr.show();
    if (!tr.find('input').is(':checked')) {
        tr.find('span.Reasons').hide();
    } else {
        tr.find('span.Reasons').show();
    }
}

function UpdateReason(oSelect, attributeName) {
    var select = $(oSelect);
    var reason = select.val();
    select.parent().find('.CurrentReason').text(reason);

    oPerson.setAttribute(attributeName, reason);
    CheckCommunitySave();
}

function MakeReasonSelect(attributeName, phraseCode) {
    var html = ['<select onchange="UpdateReason(this, \'{0}\')">'.filledWith(attributeName)];

    html.push('<option value="x">{0}</option>'.filledWith(Phrase('ChangeReason')));

    var maxPossible = 15;

    for (var i = 1; i < maxPossible; i++) {
        var phrase = Phrase(phraseCode + i);
        if (phrase.substr(0, 2) === '??') continue;
        html.push('<option>{0}</option>'.filledWith(phrase));
    }
    html.push('</select>');
    return html.join('');
}

function btnDeletePersonClick(sUniqCode) {
    if (!confirm(Phrase('RemoveThisPerson?'))) {
        return;
    }

    // delete it
    var oCommunity = top.g_domCommunity.selectSingleNode('/Community');
    var oPerson = oCommunity.selectSingleNode('Person[@UniqCode="' + sUniqCode + '"]');

    oPerson.parentNode.removeChild(oPerson);
    CheckCommunitySave();

    top.SaveCommunity(); // will save if any new people were found

    ClearPersonArea();
    BuildTextNameLookup('', '', '', '');
}

function ClearPersonArea() {
    divPerson.innerHTML = ''

    setTimeout('try {btnNewPerson.focus()} catch(e){}', 0) // cause this to happen after the current event is done!

}


function AddPersonToCommunity(oPerson) {
    //alert(111)  
    var sLName = BlankForNull(oPerson.getAttribute('LName'))
    var sFName = BlankForNull(oPerson.getAttribute('FName'))
    var sAKAName = BlankForNull(oPerson.getAttribute('AKAName'))
    var sBahaiId = BlankForNull(oPerson.getAttribute('BahaiId'))

    if (sLName + sFName + sAKAName + sBahaiId == '') return

    // try to find this person
    var sSearch = 'Person[@LName="' + sLName + '" and @FName="' + sFName + '" and (not(@AKAName) or @AKAName="' + sAKAName + '") and (not(@BahaiId) or @BahaiId="' + sBahaiId + '")]'

    var oExistingPerson = top.g_domCommunity.documentElement.selectSingleNode(sSearch)

    if (oExistingPerson == null) { // need to add

        var oNewPerson = top.g_domCommunity.createElement('Person')
        oNewPerson.setAttribute('UniqCode', GetNextUniqCode(top.g_domCommunity))
        oNewPerson.setAttribute('LName', sLName)
        oNewPerson.setAttribute('FName', sFName)

        if (sAKAName != '') oNewPerson.setAttribute('AKAName', sAKAName)
        if (sBahaiId != '') oNewPerson.setAttribute('BahaiId', sBahaiId)

//        var sVE = BlankForNull(oPerson.getAttribute('VotingEligibility'))
//        if (sVE != '') oNewPerson.setAttribute('VotingEligibility', sVE)

        top.g_domCommunity.documentElement.appendChild(oNewPerson)

        CheckCommunitySave()

    }
    else {
        // person already exists...
    }

}

function NullIfNull(s) {
    return s == 'null' ? null : s
}

function NameFocus() {
    //  var e = event.srcElement
    //  e.select()
}

function NameChange() {
    //TODO???
    //alert(1)  
}


// redefine this function for the Community page
function SaveAttribute(eInput, sAttr, sCheckType) { // assume g_domCommunity
    //alert('SaveAttr ' + sAttr)

    var oNode = top.g_domCommunity.selectSingleNode('//*[@UniqCode="' + eInput.UniqCode + '"]')

    if (oNode != null) {
        var vValue = eInput.value

        if (vValue == 'DoCheckBox') {
            vValue = eInput.checked ? 'true' : 'false'
        }

        // verify if value is okay!
        switch (sCheckType) {
            case 'xsd:positiveInteger':
            case 'xsd:integer':
            case 'xsd:byte':
                if (isNaN(vValue)) {
                    alert(Phrase('NumberRequired', vValue))
                    setTimeout('try{var e=document.getElementById("' + eInput.uniqueID + '");e.focus();e.select()}catch(e){}', 0)

                    return
                }
                break

            case 'xsd:string':
            case 'xsd:boolean':

        }

        //        if (sAttr == 'Voted' && vValue == 'No') {
        //            vValue = '';
        //        }

        oNode.setAttribute(sAttr, vValue)

        if (eInput.id == 'CommunityNameInput') {
            top.g_sCommunityName = vValue
            top.TopRight()
        }

        CheckCommunitySave()
    }
}

function KeyDown(sField) { // in VoteName - track cursor and tab etc.
    var e = event.srcElement
    var iKey = event.keyCode

    if (FilterKeys(iKey)) {
        return;
    }

    if (event.shiftKey || event.altKey || event.ctrlKey) return

    switch (iKey) {
        case 40: // down
            MoveLookup(1)
            break

        case 38: // up
            MoveLookup(-1)
            break

        case 34: // pg down
            MoveLookup(10)
            break

        case 33: // pg up
            MoveLookup(-10)
            break

        case 13: // enter
            // if Lookup is selected, choose listed name
            // go to next vote. If at end, go to button
            //alert(e.id)

            // learn what field and row# we are in
            if (g_divNameCurrent != null) { // take the currently selected name
                CopyFromList(g_divNameCurrent.id)
                return
            }

            break

        default:
            // divTest.innerText = iKey
    }
}

function FilterKeys(iKey) {
    if (iKey == 220 || iKey == 222) // the \ and " keys
    {
        event.cancelBubble = true;
        event.returnValue = false;
        return true;
    }
}

function KeyUp(sField) { // in VoteName inputs
    var e = event.srcElement
    var iKey = event.keyCode

    if (FilterKeys(iKey)) {
        return;
    }

    // a key was pressed, so try to look up a match!
    //divTest.innerText = sField + ' ' + iKey + ' ' + String.fromCharCode(iKey)

    var bTyping = (iKey == 46  //delete 
                 || iKey == 8  //backspace
                 || iKey >= 48  //everything else
                )
    // don't bother to update list if not typing a valid character
    if (!bTyping) return
    /*      
    if(g_sValidChars.indexOf(String.fromCharCode(iKey))==-1 && iKey!=8 && iKey!=46)
    {
    // not a letter, probably a cursor key or such...
    // also don't want a single quote accepted!
    //divTest.innerText = iKey    
    return
    }
    */

    // for now, only do lookup on LName field
    var sLName = ''
    var sFName = ''
    var bRebuild = false

    //    if (sField == 'LName') {
    //        sLName = e.value
    //        sFName = GetNameValue('FName', e)
    //        bRebuild = true
    //        g_bCurrentOnLName = true
    //    }

    if (sField == 'Search') {
        sFName = e.value
        //sLName = GetNameValue('LName', e)
        var sa = sFName.split(' ')
        if (sa.length > 1) {
            sFName = sa[0]
            sLName = sa[1]
        }
        bRebuild = true
    }

    if (bRebuild) {
        setTimeout('BuildTextNameLookup("' + sLName + '","' + sFName + '","","",false)', 0)
        // don't do sound here - plays when refocusing on input after editing this person
        return
    }
}

function GetNameValue(sWantedField, eCurrent) { // given one of the input fields in a row, return the value in another input field
    var sId = eCurrent.id
    var iNum = sId.split('_')[1]

    var eWanted = document.getElementById(sWantedField + '_' + iNum)
    if (eWanted != null) {
        return eWanted.value
    }
    else
        return ''

}

function CopyFromList(sUCId) {
    if (sUCId.substr(0, 3) == 'UC_') {
        sUCId = sUCId.substr(3)
    }
    BuildPerson(sUCId)
}

function EditFieldKeyUp() {

}

function ClearSearch() {
    divPerson.innerHTML = ''
    FName_0.value = ''
    BuildTextNameLookup('', '', '', '')
}

function ClearRegistrationInfo() {
    if (confirm(Phrase('CommClearConfirm'))) {
        var oCommunity = top.g_domCommunity.documentElement;
        oCommunity.setAttribute('LastEnvNum', 0);

        var list = oCommunity.selectNodes('Person');
        for (var i = 0; i < list.length; i++) {
            var person = list[i];
            person.removeAttribute('EnvNum');
            person.removeAttribute('Voted');
        }

        top.g_bNeedSaveCommunity = true;
        top.SaveCommunity();

        ClearSearch();
        FName_0.focus();
    }
}