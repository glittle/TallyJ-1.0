/// <reference path="jquery-1.4.4.js" />
/// <reference path="general.js" />
/// <reference path="namelist.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var g_bRevalidatingAll = false;
var g_iValidationFailures = 0;
var g_sFailureList = [];

var g_bShowAlertOnNew_default = true;
var g_bShowAlertOnNew;
var g_domXSLFinal = null;

function RevalidateAll() {
    var statusBefore = top.g_ballotsValidationStatus;

    if (SaveNeeded())
        if (!confirm(Phrase('SaveNeeded')))
            return;


    var dups = top.g_domCommunity.documentElement.selectNodes('//Person[@Duplicates]');
    if (dups.length != 0) {
        var msg = top.DupNamesMsg(dups);

        setTimeout(function () {
            alert(msg);
        }, 1);

        top.ValidationNeeded();

        return;
    }


    $('#divValidationStatus').text(Phrase('Validating'));

    CancelSaveNeeded();
    ClearBallotArea(false);

    g_bRevalidatingAll = true;
    g_iValidationFailures = 0;
    g_sFailureList = [];



    var oBallotList = top.g_domElection.documentElement.selectNodes('Ballot');

    for (var i = 0; i < oBallotList.length; i++) {
        var oBallot = oBallotList[i];

        CheckBallotStatus(null, false, oBallot);
    }

    g_bRevalidatingAll = false;

    RemoveOldResults();


    // determine the current ballot
    var sBallotId = typeof (divCurrentBallotId) == 'object' ? divCurrentBallotId.innerText : '';

    if (sBallotId != '') BuildBallot(sBallotId);

    if (g_iValidationFailures) {

        setTimeout(function () {
            alert(Phrase('HaveNew', g_iValidationFailures, g_sFailureList.join(', ')));
        }, 1);

        $('#divBallotList').focus();
        top.ValidationNeeded();

        // do a save if needed
        top.SaveElection();

        RefreshAfterBallotValidation();
    }
    else {
        // all good
        setTimeout(function () {
            CalculateFinalResults(statusBefore);
        }
        , 1);
    }

}

function ClearBallotArea() {
    // overridden by ballots.js
}

function RemoveOldResults() {
    var root = top.g_domElection.documentElement;
    var nodes = root.selectNodes('FinalCounts | AutoCounts');
    for (var i = 0; i < nodes.length; i++) {
        root.removeChild(nodes[i]);
    }
}

function CalculateFinalResults(statusBefore) {
    var oElection = top.g_domElection.documentElement;

    //double check validations
    var bad = oElection.selectNodes('Ballot[@BallotStatus="New"] | Ballot[@BallotStatus="ReviewNeeded"]');
    if (bad.length !== 0) {
        g_iValidationFailures++;
        alert(Phrase('HaveNew', '?'));
        return;
    }

    var finalPhrase = 'ValidateOkay';

    if (!g_domXSLFinal) {
        g_domXSLFinal = MakeEmptyDOM(true); // need free-threaded to use with XSLT
        LoadDOM(g_domXSLFinal, top.g_sPath + '/../support/AnalyzeResults.xsl')
    }

    var domSorted = MakeEmptyDOM();
    domSorted.loadXML(top.g_domElection.transformNode(g_domXSLFinal));

    var finalCounts = domSorted.documentElement;

    var oInfo = oElection.selectSingleNode('Info');

    var sSearch = 'Person[(@AgeGroup="Adult" or not(@AgeGroup)) and (@IneligibleToReceiveVotes="false" or not(@IneligibleToReceiveVotes))]';
    var adults = top.g_domCommunity.documentElement.selectNodes(sSearch);
    var numAdults = adults.length;

    // do various ballot counts
    var votedInPerson = 0, mailed = 0, droppedOff = 0;
    for (var i = 0; i < numAdults; i++) {
        var person = adults[i];
        var voted = person.getAttribute('Voted');
        switch (voted) {
            case 'VotedInPerson':
                votedInPerson++;
                break;
            case 'Mailed':
                mailed++;
                break;
            case 'DroppedOff':
                droppedOff++;
                break;
            case 'No':
            case '':
            case null:
                break;
            default:
                g_iValidationFailures++;
                g_sFailureList.push('Ballot status error:' + voted);
                alert(Phrase('InvalidCode', voted));
                return;
        }
    }

    var autoCounts = top.g_domElection.createElement('AutoCounts');
    autoCounts.setAttribute('AdultsInCommunity', numAdults);
    autoCounts.setAttribute('VotedInPerson', votedInPerson);
    autoCounts.setAttribute('MailedInBallots', mailed);
    autoCounts.setAttribute('DroppedOffBallots', droppedOff);


    var firstBallot = oElection.selectSingleNode('Ballot[1]')
    oElection.insertBefore(autoCounts, firstBallot);
    oElection.insertBefore(finalCounts, firstBallot);


    var useManual = oInfo.getAttribute('UseManualCounts') == 'true';
    var resultSource = useManual ? oElection.selectSingleNode('ManualResults') : autoCounts;

    CopyAttributes(finalCounts, resultSource, 'AdultsInCommunity,VotedInPerson,MailedInBallots,DroppedOffBallots');

    top.g_ballotsValidationStatus = (statusBefore == ValidationStatus.ReadyToReport)
                                        ? ValidationStatus.ReadyToReport
                                        : ValidationStatus.ReadyForReview;

    // do a save if needed
    top.SaveElection();


    RefreshAfterBallotValidation();

    //alert(Phrase(finalPhrase));

}

/// returns new status
function CheckBallotStatus(sBallotId, bAdjustButton, oBallot, sUniqCode) {
    // get the Ballot
    if (oBallot == null) {
        if (sBallotId != null) {
            oBallot = top.g_domElection.selectSingleNode('//Ballot[@Id="' + sBallotId + '"]');
        }
        else if (sUniqCode != null) {
            oBallot = top.g_domElection.selectSingleNode('//Ballot[@UniqCode="' + sUniqCode + '"]');
        }
    }

    if (oBallot == null) {
        alert(Phrase('Ballot Invalid'));
        return;
    }

    var oInfo = top.g_domElection.selectSingleNode('//Election/Info');

    if (bAdjustButton == null) bAdjustButton = false;

    // analyze the Votes and determine what the Ballot's status should be
    // Set the status in XML, and return that value from this function
    /*  Ok
    New
    TooFew
    TooMany
    ReviewNeeded
    DupName
    */

    var iNumNeeded = +oInfo.getAttribute('NumberToElect');

    // current status
    var sOldStatus = oBallot.getAttribute('BallotStatus');

    var override = oBallot.getAttribute('OverrideStatus');

    //alert('ID:' + oBallot.getAttribute('Id'))
    // assume Ballot will be Ok until proven otherwise
    var sNewStatus = 'Ok';


    // review all the votes
    var oVoteList = oBallot.selectNodes('Vote');

    // check each vote
    g_bShowAlertOnNew = g_bShowAlertOnNew_default;

    var bFoundDuplicate = false;
    var bFoundBlank = false;
    var iCompare;

    for (var i = 0; i < oVoteList.length; i++) {
        iCompare = CheckVotes(oVoteList[i]);
        bFoundDuplicate = bFoundDuplicate || (iCompare == 1);
        bFoundBlank = bFoundBlank | CheckVoteStatus(oVoteList, i);
    }

    if (bFoundDuplicate) sNewStatus = 'DupName';

    top.SaveCommunity(); // will save if any new people were found

    // check to see if any votes are set to New 
    oVoteList = oBallot.selectNodes("Vote[@VoteStatus='New']");
    if (oVoteList.length > 0) {
        sNewStatus = 'New';
    }

    if (bFoundBlank) {
        sNewStatus = 'TooFew';
    }

    // check count of updated votes
    oVoteList = oBallot.selectNodes("Vote");
    if (oVoteList.length < iNumNeeded) {
        sNewStatus = 'TooFew';
    }
    else if (oVoteList.length > iNumNeeded) {
        sNewStatus = 'TooMany';
    }

    switch (override) {
        case 'TooMany':
            sNewStatus = 'TooMany';
            break;

        case 'ReviewNeeded':
            sNewStatus = 'ReviewNeeded';
            g_iValidationFailures++;
            g_sFailureList.push(oBallot.getAttribute('Id'));
            break;
    }

    if (sNewStatus === 'New') {
        g_iValidationFailures++;
        g_sFailureList.push(oBallot.getAttribute('Id'));
    }

    if (bAdjustButton) {
        if (sNewStatus == 'Ok') {
            btnCloseBallot.style.display = 'none';
        }
    }
    if (sOldStatus != sNewStatus) {
        //alert(sOldStatus + ' . ' + sNewStatus)
        oBallot.setAttribute('BallotStatus', sNewStatus);
        CheckSave(true);
    }

    return sNewStatus;
}


function CheckVoteStatus(oVoteList, i)  // return true if is blank
{
    // check this particular vote to ensure it is okay

    var oVote = oVoteList[i];
    var bFoundBlank = false;

    var sCurrentStatus = oVote.getAttribute('VoteStatus');

    // if names are blank, set to New
    var oPerson = oVote.selectSingleNode('Person');

    var sLName = BlankForNull(oPerson.getAttribute('LName'));
    var sFName = BlankForNull(oPerson.getAttribute('FName'));
    var sAKAName = BlankForNull(oPerson.getAttribute('AKAName'));
    var sBahaiId = BlankForNull(oPerson.getAttribute('BahaiId'));


    if (sLName + sFName + sAKAName + sBahaiId == '') { // is blank, so set to NEW if not already
        if (sCurrentStatus == 'Spoiled') {
            // skip
        }
        else {
            bFoundBlank = true;
            if (sCurrentStatus != 'New' && sCurrentStatus != 'AddToList') {
                if (g_bDefaultAdd)
                    oVote.setAttribute('VoteStatus', 'AddToList');
                else
                    oVote.setAttribute('VoteStatus', 'New');

                CheckSave(true);
            }
        }
    }
    else { // not blank, not spoiled
        // When a name is picked from the list, it is set to match the community list status

        // check status of this person against the Community list

        var sSearch = 'Person[@LName="' + sLName + '" and @FName="' + sFName + '" and (not(@AKAName) or @AKAName="' + sAKAName + '") and (not(@BahaiId) or @BahaiId="' + sBahaiId + '")]';
        var oCommunityPerson = top.g_domCommunity.documentElement.selectSingleNode(sSearch);

        // If it is still New, then likely is a new name. Don't accept ballot if any names still at New

        if (oCommunityPerson == null) {
            if (sCurrentStatus == 'AddToList') {
                AddPersonToCommunity(oPerson);
                //setTimeout('alert(Phrase(\'NameAdded\',\'' + sFName + '\'))', 0);
                oVote.setAttribute('VoteStatus', 'Ok');
                CheckSave(true);
            }
            else if (sCurrentStatus != 'New') {
                oVote.setAttribute('VoteStatus', 'New');
                CheckSave(true);

                if (g_bShowAlertOnNew && !g_bRevalidatingAll) {
                    setTimeout('alert(Phrase(\'NewName\'))', 0);
                    g_bShowAlertOnNew = false;
                }
            }
        }
        else { // found matching person in the Community List

            // check the VotingEligibility of this person...
            //            if (sCurrentStatus == 'AddToList' || sCurrentStatus == 'New') {
            //                oVote.setAttribute('VoteStatus', 'Ok');
            //                CheckSave(true);
            //            }



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
                oVote.setAttribute('VoteStatus', 'Spoiled');
                oVote.setAttribute('SpoiledGroup', 'Ineligible');
                oVote.setAttribute('SpoiledDetail', reason);
            }
            else {
                oVote.setAttribute('VoteStatus', 'Ok');
                oVote.removeAttribute('SpoiledGroup');
                oVote.removeAttribute('SpoiledDetail');

                //                sTemp = oCommunityPerson.getAttribute('MinorityPriority');
                //                if (sTemp != null && oPerson.getAttribute('MinorityPriority') != sTemp) {
                //                    oPerson.setAttribute('MinorityPriority', sTemp);
                //                    CheckSave(true);
                //                }
            }
        }
    }

    if (sCurrentStatus != oVote.getAttribute('VoteStatus')) { // status has changed... update display
        RedisplayVoteStatus(i, oVote);
        CheckSave(true);
    }

    return bFoundBlank;
}

function RedisplayVoteStatus(i, oVote) {
    // update if visible
    var text = top.lists.VoteStatus[oVote.getAttribute('VoteStatus')];
    var reason = oVote.getAttribute('SpoiledDetail');
    if (reason) {
        text += '<br> ' + reason;
    }

    $('#VoteStatus_' + i).html(text);
}


function CheckVotes(oThisVote) // 1 = Dup, 2 = Blank
{
    // compare this vote to all the ones that come after

    var oPerson = oThisVote.selectSingleNode('Person');

    var sLName = BlankForNull(oPerson.getAttribute('LName')).CleanUp();
    var sFName = BlankForNull(oPerson.getAttribute('FName')).CleanUp();
    var sAKAName = BlankForNull(oPerson.getAttribute('AKAName')).CleanUp();
    var sBahaiId = BlankForNull(oPerson.getAttribute('BahaiId')).CleanUp();

    if (sLName + sFName + sAKAName + sBahaiId == '') {
        return 2;
    }

    var sSearch = 'following-sibling::Vote/Person[@LName="' + sLName + '" and @FName="' + sFName + '" and ((not(@AKAName) and "' + sAKAName + '"="") or @AKAName="' + sAKAName + '") and (not(@BahaiId) or @BahaiId="' + sBahaiId + '")]';
    sSearch += ' | preceding-sibling::Vote/Person[@LName="' + sLName + '" and @FName="' + sFName + '" and ((not(@AKAName) and "' + sAKAName + '"="") or @AKAName="' + sAKAName + '") and (not(@BahaiId) or @BahaiId="' + sBahaiId + '")]';

    var oDuplicatePerson = oThisVote.selectNodes(sSearch);

    if (oDuplicatePerson.length != 0) { // found a duplicate name... update the Ballot's status
        //var oBallot = oThisVote.selectSingleNode('ancestor::Ballot')
        //oBallot.setAttribute('BallotStatus') = 'DupName'
        //cheCheckSave(true)
        return 1;
    }
    return 0;
}


function AddPersonToCommunity(oPerson) {

    var sLName = BlankForNull(oPerson.getAttribute('LName'));
    var sFName = BlankForNull(oPerson.getAttribute('FName'));
    var sAKAName = BlankForNull(oPerson.getAttribute('AKAName'));
    var sBahaiId = BlankForNull(oPerson.getAttribute('BahaiId'));

    if (sLName + sFName + sAKAName + sBahaiId == '') return;

    // try to find this person
    var sSearch = 'Person[@LName="' + sLName + '" and @FName="' + sFName + '" and ((not(@AKAName) and "' + sAKAName + '"="") or @AKAName="' + sAKAName + '") and (not(@BahaiId) or @BahaiId="' + sBahaiId + '")]';

    var oExistingPerson = top.g_domCommunity.documentElement.selectSingleNode(sSearch);

    if (oExistingPerson == null) { // need to add

        var oNewPerson = top.g_domCommunity.createElement('Person');
        oNewPerson.setAttribute('UniqCode', GetNextUniqCode(top.g_domCommunity));
        oNewPerson.setAttribute('LName', sLName);
        oNewPerson.setAttribute('FName', sFName);

        if (sAKAName != '') oNewPerson.setAttribute('AKAName', sAKAName);
        if (sBahaiId != '') oNewPerson.setAttribute('BahaiId', sBahaiId);

        //        var sVE = BlankForNull(oPerson.getAttribute('VotingEligibility'));
        //        if (sVE != '') oNewPerson.setAttribute('VotingEligibility', sVE);

        //        var sMP = BlankForNull(oPerson.getAttribute('MinorityPriority'));
        //        if (sMP != '') oNewPerson.setAttribute('MinorityPriority', sMP);

        top.g_domCommunity.documentElement.appendChild(oNewPerson);

        CheckCommunitySave();

    }
    else {
        // person already exists...  add in Baha'i Id if provided
        if (sBahaiId != oExistingPerson.getAttribute('BahaiId')) {
            oExistingPerson.setAttribute('BahaiId', sBahaiId);
            CheckCommunitySave();
        }
    }

}

