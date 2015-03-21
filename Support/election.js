/// <reference path="jquery-1.4.4.js" />
/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada


function PrepPage() {
    if (top.g_domElection == null || top.g_domElection.documentElement == null) {
        alert(Phrase('NeedElection'))
        return
    }

    ShowEditElection()

    SetBallotCounts(top.g_domElection.documentElement.selectSingleNode('Info').getAttribute('ElectionType'));
}


function ShowEditElection() {
    // see if an Election is loaded
    if (top.g_domElection == null) {
        divElectionDetails.innerHTML = Phrase('NeedElection2')
        return
    }

    // all okay, display edit area
    var oElection = top.g_domElection.documentElement

    var oInfo = oElection.selectSingleNode('Info')
    if (oInfo == null) {
        // need to create an Info node
        oInfo = top.g_domElection.createElement('Info')
        oInfo.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection))

        oElection.appendChild(oInfo)
    }
    var oManual = oElection.selectSingleNode('ManualResults')
    if (oManual == null) {
        // need to create an Info node
        oManual = top.g_domElection.createElement('ManualResults')
        oManual.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection))
        oElection.appendChild(oManual)
    }

    var sHTML = ''

    sHTML += '<table class=EditElection>'

    sHTML += '<tr><td colspan=2 class=Spacer></td></tr>';

    sHTML += '<tr><td colspan=2 class=Title style="background-color: #CCFF99">' + Phrase('ComputerCode') + '</td></tr>'
    sHTML += GetNodeAttributeEdits(oInfo, ['CodeForThisComputer', 'TellersAtThisComputer'], ['UseManualCounts'])

    // show edits: Main element
    sHTML += '<tr><td colspan=2 class=Spacer></td></tr>';
    sHTML += '<tr><td colspan=2 class=Title style="background-color: #CCFF99">' + Phrase('SetupInformation') + '</td></tr>'
    //sHTML += GetNodeAttributeEdits(oElection, null, ['FileTimeAtLastRead', 'FilePath'])
    sHTML += GetNodeAttributeEdits(oInfo, ['NumberToElect', 'ElectionType', 'NumberOfAlternatesToReport', 'AllowAddNewInBallot'], ['UseManualCounts'])

    // show edits: Info
    sHTML += '<tr><td colspan=2 class=Spacer></td></tr>';
    sHTML += '<tr><td colspan=2 class=Title style="background-color: #CCFF99">' + Phrase('ReportSetup') + '</td></tr>'
    //sHTML += GetNodeAttributeEdits(oElection, ['Name'])
    sHTML += GetNodeAttributeEdits(oElection, null, ['FileTimeAtLastRead', 'FilePath'])
    sHTML += GetNodeAttributeEdits(oInfo, null, ['UseManualCounts', 'NumberOfAlternatesToReport', 'CodeForThisComputer', 'NumberToElect', 'ElectionType', 'AllowAddNewInBallot', 'ApprovedForReporting', 'CommunityFileName', 'CommunityFileTime', 'TellersAtThisComputer'])

    // show edits: Results
//    sHTML += '<tr><td colspan=2 class=Title style="background-color: #CCFF99">' + Phrase('AfterElection') + '</td></tr>'

//    //sHTML += GetNodeAttributeEdits(oInfo, ['UseManualCounts'], null)

//    sHTML += '<tr><td></td><td><button class=SmallBtn onclick="CountAdultsInCommunity()" accessKey="' + Phrase('CountAdultsAccessKey') + '">' + Phrase('CountAdults') + '</button> <span style="font-size: 11pt;" id=ShowCount></span>'
//    sHTML += '</td></tr>'

//    sHTML += GetNodeAttributeEdits(oManual, null, ['OtherTellers']);

    sHTML += '</table>'


    divElectionDetails.innerHTML = sHTML
}


function GetNodeAttributeEdits(oNode, onlyIncludeThese, excludeThese) {
    var sHTML = ''

    // ensure XSD is loaded
    top.LoadElectionXSD()

    // Get definition to Info
    var oNodeAttrList = top.g_domElectionXSD.selectNodes('//xsd:element[@name="' + oNode.nodeName + '"]/xsd:complexType/xsd:attribute')
    if (oNodeAttrList == null) {
        // error!!
        alert(Phrase('NoElement'))
    }

    // list the attributes
    for (var i = 0; i < oNodeAttrList.length; i++) {
        var sThisAttrName = oNodeAttrList[i].getAttribute('name');

        if (excludeThese && $.inArray(sThisAttrName, excludeThese) !== -1) {
            continue;
        }
        if (onlyIncludeThese && $.inArray(sThisAttrName, onlyIncludeThese) === -1) {
            continue;
        }

        // show name of attribute - or get better description?
        // TODO: embed nicer title into the XSD
        sHTML += '<tr>'
        sHTML += '<td class=Name nowrap>'
        sHTML += Phrase(sThisAttrName) //Expand(sThisAttrName)
        sHTML += '</td>'

        sHTML += '<td class=Value>'
        sHTML += AttributeEdit(oNode, sThisAttrName, oNode.getAttributeNode(sThisAttrName))

        var comment = Phrase(sThisAttrName + 'Comment');
        if (comment.substring(0, 2) !== '??') {
            sHTML += ' <span class=comment>' + comment + '</comment>';
        }

        sHTML += '</td>'
        sHTML += '</tr>'
    }

    // list other attributes, not in XSD
    var oNodeList = oNode.selectNodes('@*')
    for (i = 0; i < oNodeList.length; i++) {
        sThisAttrName = oNodeList[i].nodeName

        // check to see if this node is in the list we just did...
        for (var j = 0; j < oNodeAttrList.length; j++) {
            if (sThisAttrName == oNodeAttrList[j].getAttribute('name')) { // match
                break
            }
        }

        // skip some others
        if (sThisAttrName == 'UniqCode'
            || sThisAttrName.search(/\:/) > -1
            || sThisAttrName == 'NextUniqCode'
            || excludeThese && $.inArray(sThisAttrName, excludeThese) !== -1) {
            j = oNodeAttrList.length + 1
        }

        if (j == oNodeAttrList.length) { // got to the end without finding the match... this is new

            // show name of attribute - or get better description?
            sHTML += '<tr>'
            sHTML += '<td class=Name nowrap>'
            sHTML += Phrase(sThisAttrName) //Expand(sThisAttrName)
            sHTML += '</td>'

            sHTML += '<td class=Value>'
            sHTML += oNodeList[i].value
            sHTML += '</td>'
            sHTML += '</tr>'
        }
    }

    return (sHTML)
}

function AfterSaveAttribute(eInput, sAttr, vValue, sCheckType) {
    // override default func
    if (sAttr == 'ElectionType') {
        SetBallotCounts(vValue);
    }
}

function SetBallotCounts(electionType) {
    if (!electionType) electionType = 'Assembly';

    var numOnBallot = $('#NumberToElect');
    var numExtras = $('#NumberOfAlternatesToReport');
    var oInfo = top.g_domElection.documentElement.selectSingleNode('Info');

    var ballotCount, extraCount;

    switch (electionType) {
        case 'Assembly':
            ballotCount = '9';
            extraCount = '0';

            numOnBallot.attr('disabled', true);
            numExtras.attr('disabled', true);
            break;

        case 'AssemblyBiElection':
        case 'AssemblyTieBreak':
            ballotCount = '2';
            extraCount = '0';

            numOnBallot.removeAttr('disabled');
            numExtras.attr('disabled', true);
            break;

        case 'UnitConvention':
            ballotCount = numOnBallot.val();
            extraCount = numExtras.val();

            if (extraCount == '0') {
                extraCount = '3';
            }

            numOnBallot.removeAttr('disabled');
            numExtras.removeAttr('disabled');
            break;

        case 'UnitConventionTieBreak':
            ballotCount = numOnBallot.val();
            extraCount = numExtras.val();

            numOnBallot.removeAttr('disabled');
            numExtras.removeAttr('disabled');
            break;

        default:
            alert('Unexpected: ' + electionType);
            return;
    }

    var saveNeeded = ballotCount != numOnBallot.val() || extraCount != numExtras.val();

    numOnBallot.val(ballotCount);
    numExtras.val(extraCount);

    oInfo.setAttribute('NumberToElect', ballotCount);
    oInfo.setAttribute('NumberOfAlternatesToReport', extraCount);

    if (saveNeeded) {
        CheckSave();
    }
}

function CountAdultsInCommunity() {

    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'))
        return
    }


    // count adults in community list
    var sSearch = "Person[(@AgeGroup='Adult' or not(@AgeGroup)) and (not(@IneligibleToReceiveVotes) or @IneligibleToReceiveVotes='false')]";
    var adults = top.g_domCommunity.documentElement.selectNodes(sSearch);
    var numAdults = adults.length;

    // get ManualResults from Election
    var oElection = top.g_domElection.documentElement;
    var oResults = oElection.selectSingleNode('ManualResults')
    var iCurrentNum = oResults.getAttribute('AdultsInCommunity')

    ShowCount.innerHTML = numAdults + ' ' + Phrase('AdultsInCommunity')

    if (+numAdults !== +iCurrentNum) {
        // update election
        oResults.setAttribute('AdultsInCommunity', numAdults)

        CheckSave()

        // update change on screen
        var sUniqCode = oResults.getAttribute('UniqCode')
        var e
        var eList = document.all
        for (var i = 0; i < eList.length; i++) {
            e = eList[i]
            if (e.UniqCode == sUniqCode && e.AttrName == 'AdultsInCommunity') { // have the Input box
                e.value = numAdults
                return
            }
        }
    }
}

