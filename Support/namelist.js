/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var g_divNameCurrent = null // which name in the text name list are we on?
var g_iNameCurrent = null   // where in the text name list are we?
var g_iMaxNamesToShow = 19
var g_domXSLVotes = null  // XSL to sort votes for ballot input

var g_sCurrentLName = ''
var g_sCurrentFName = ''
var g_sCurrentAKAName = ''
var g_sCurrentBahaiId = ''


// characters accepted for input
//TODO - extend this for non-English characters!
//var g_sValidChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷ÿŸ⁄€‹›ﬁü -.'`"
var g_sTranslateAccents = null

function ClickTextLookup(bDoubleClick) {
    var e = event.srcElement;
    var sUCId = e.id;
    if (sUCId.substr(0, 3) != 'UC_') {
        event.returnValue = false;
        event.cancelBubble = true;
        return
    }

    if (true) // bDoubleClick) -- if used mouse to click, select immediately -- 1.50
    {
        CopyFromList(sUCId)
        SelectTextName(e.id)
    }
    else {
        SelectTextName(e.id)
    }
}

function MoveLookup(iOffset) // version for text list
{
    // not on a name, abort
    if (g_iNameCurrent == null) return

    // record the desired location
    g_iNameCurrent += iOffset
    // check lower bound (upperbound will be checked in SelectTextName)
    if (g_iNameCurrent < 0) g_iNameCurrent = 0
    // move to it
    SelectTextName(null, g_iNameCurrent)
}

function QuoteNull(v) {
    if (v == null) return 'null'
    return "'" + v + "'"
}

function BuildTextNameLookup(sLName, sFName, sAKAName, sBahaiId, bDoSound, bShowVoted, bClearList) { // build list of names that should be shown now...
    // Search names for any combination of matches of first and last name 
    // 1.42 - main search is only by sFName

    //alert(sThisPage) 
    if (sThisPage == 'Ballots')
        if (g_sCurrentBallotUniqCode == '' || bClearList) {
            divTextNameLookup.innerText = Phrase('NamesWillShow')
            return
        }

    if (sFName == null) sFName = g_sCurrentFName
    if (sLName == null) sLName = g_sCurrentLName
    if (sAKAName == null) sAKAName = g_sCurrentAKAName
    if (sBahaiId == null) sBahaiId = g_sCurrentBahaiId
    if (bDoSound == null) bDoSound = false //1.46
    if (bShowVoted == null) bShowVoted = (sThisPage == 'Community') //1.50

    if (g_sTranslateAccents == null) BuildTranslateAccents()
    if (sFName == '') //  && sThisPage=='Ballots')
    {// to not show any names until something is typed, uncomment next two lines
        //divTextNameLookup.innerText = Phrase('BeginTyping')
        //g_divNameCurrent = null
        //return
    }

    // show wait
    ShowWait()

    // store for reuse if conditions change and list has to be rebuilt
    g_sCurrentLName = sLName
    g_sCurrentFName = sFName
    g_sCurrentAKAName = sAKAName
    g_sCurrentBahaiId = sBahaiId

    var saKey = {};
    var saValue = {};
    var saSearch = {};
    var saTyped = {};

    saKey[1] = 'FName' // this is for everything
    saValue[1] = sFName.CleanUp()
    saKey[2] = 'LName'
    saValue[2] = sLName.CleanUp()
    saKey[3] = 'AKAName'
    saValue[3] = sAKAName.CleanUp()
    saKey[4] = 'BahaiId'
    saValue[4] = sBahaiId.CleanUp()

    for (var i = 1; i <= 4; i++) {
        saSearch[i] = ''
        if (saValue[i] != '')
            saTyped[i] = saValue[i].replace(/\,/, '') // (ignore any comma)
        else
            saTyped[i] = ''
    }

    //alert(saValue[1] + '\n' + saValue[2] + '\n' + saValue[3] + '\n' + saValue[4])

    // check in FName input for "Last, First" or "First Last"   
    if (saValue[1] != '' && saValue[2] == '') // only first name
    {
        saSearch[1] += MakeSearch(saKey[1], saTyped[1])
        saSearch[2] += MakeSearch(saKey[2], saTyped[1])
        saSearch[3] += MakeSearch(saKey[3], saTyped[1])
        saSearch[4] += MakeSearch(saKey[4], saTyped[1])

        //saSearch[1] += 'ms:string-compare(translate(substring(concat(@' + saKey[1] + '," ",@' + saKey[2] + '),1,' + iaBefore[1] + '),' + g_sTranslateAccents + '),translate(' + saTyped[1] + ',' + g_sTranslateAccents + '),"","i")=0' 
        //saSearch[2] += 'ms:string-compare(translate(substring(concat(@' + saKey[2] + '," ",@' + saKey[1] + '),1,' + iaBefore[1] + '),' + g_sTranslateAccents + '),translate(' + saTyped[1] + ',' + g_sTranslateAccents + '),"","i")=0' 
    }
    else if (saValue[2] != '' && saValue[1] == '')  // only last name
    {
        saSearch[1] += MakeSearch(saKey[1], saTyped[2])
        saSearch[2] += MakeSearch(saKey[2], saTyped[2])
    }
    else if (saValue[1] != '' && saValue[2] != '') // both first and last
    {
        saSearch[1] += MakeSearch(saKey[1], saTyped[1]) + ' and ' + MakeSearch(saKey[2], saTyped[2])
        saSearch[2] += MakeSearch(saKey[2], saTyped[1]) + ' and ' + MakeSearch(saKey[1], saTyped[2])
    }

    if (saValue[3] != '') {// also have something in the other field
        if (saSearch[3] != '') saSearch[3] += ' or '
        saSearch[3] += MakeSearch(saKey[3], saTyped[3])
    }
    if (saValue[4] != '') {// also have something in the other field
        if (saSearch[4] != '') saSearch[4] += ' or '
        saSearch[4] += MakeSearch(saKey[4], saTyped[4])
    }
    if (saSearch[1] + saSearch[2] + saSearch[3] + saSearch[4] === '') {
        // default for blank
        saSearch[2] += MakeSearch(saKey[2], saTyped[1]);
    }

    //alert(saSearch[1] + '\n\n' + saSearch[2])   

    if (saSearch[1] != '')
        saSearch[1] = 'Person[' + saSearch[1] + ']'
    else
        saSearch[1] = 'Person[1=0]'

    if (saSearch[2] != '')
        saSearch[2] = 'Person[' + saSearch[2] + ' and not(' + saSearch[1] + ')]'
    else
        saSearch[2] = 'Person[1=0]'

    if (saSearch[3] != '')
        saSearch[3] = 'Person[' + saSearch[3] + ']'
    else
        saSearch[3] = 'Person[1=0]'

    if (saSearch[4] != '')
        saSearch[4] = 'Person[' + saSearch[4] + ']'
    else
        saSearch[4] = 'Person[1=0]'

    if (saValue[1] + saValue[2] + saValue[3] + saValue[4] == '') {
        saSearch[1] = 'Person'
    }

    //alert(saSearch[1] + '\n\n' + saSearch[2])   
    var oPeople1 = top.g_domCommunity.documentElement.selectNodes(saSearch[1])
    var oPeople2 = top.g_domCommunity.documentElement.selectNodes(saSearch[2])
    var oPeople3 = top.g_domCommunity.documentElement.selectNodes(saSearch[3])
    var oPeople4 = top.g_domCommunity.documentElement.selectNodes(saSearch[4])
    var iMatched = oPeople1.length + oPeople2.length + oPeople3.length + oPeople4.length

    var sHTML = ''
    var iNamesShown = 0

    //if(iMatched <= g_iMaxNamesToShow || g_iMaxNamesToShow==0) // show if under the limit
    // {
    if (iMatched == 1 || (oPeople1.length == 1 && oPeople2.length == 1 && oPeople1[0] == oPeople2[0])) {
        if (bDoSound) {
            FlashList();
            snd.src = g_sClickSound;
        }
    }
    for (i = 0; i < oPeople2.length && iNamesShown < g_iMaxNamesToShow; i++, iNamesShown++) {
        sHTML += AddNameToList(oPeople2[i], false, true, bShowVoted)
    }

    for (i = 0; i < oPeople1.length && iNamesShown < g_iMaxNamesToShow; i++, iNamesShown++) {
        sHTML += AddNameToList(oPeople1[i], i == 0, null, bShowVoted)
    }

    for (i = 0; i < oPeople3.length && iNamesShown < g_iMaxNamesToShow; i++, iNamesShown++) {
        sHTML += AddNameToList(oPeople3[i], i == 0, null, bShowVoted)
    }

    for (i = 0; i < oPeople4.length && iNamesShown < g_iMaxNamesToShow; i++, iNamesShown++) {
        sHTML += AddNameToList(oPeople4[i], i == 0, null, bShowVoted)
    }

    if (iNamesShown >= g_iMaxNamesToShow) {
        sHTML += '<div class=MaxNames>{0}</div>'.filledWith(Phrase('MaxNames'));
    }

    if (sHTML == '') {
        sHTML = Phrase('(No names match)')
        g_divNameCurrent = null
        g_iNameCurrent = null
        if (bDoSound) {
            snd.src = g_sBuzzSound
        }
    }
    // }
    //else
    // { // have too many names to show
    //  sHTML = Phrase('Matching', iMatched)
    // }

    oPeople1 = null
    oPeople2 = null
    oPeople3 = null
    oPeople4 = null

    // alert(iNamesShown + ' .. ' + g_iMaxNamesToShow)
    // alert(iNamesShown + ' .. ' + g_iMaxNamesToShow)
    // alert(sHTML)

    divTextNameLookup.innerHTML = sHTML

    //window.document.body.style.cursor = 'auto'

    SelectTextName()

    ClearWait()
}

function FlashList(off) {
    return;
    if (off) {
        AddHighlight(g_divNameCurrent)
    }
    else {
        RemoveHighlight(g_divNameCurrent)
        var flash = setTimeout('FlashList(true)', 200);
    }
}

function MakeSearch(sKey, sSearch) {
    var iBefore = sSearch.length
    sSearch = '"' + sSearch + '"'
    return 'ms:string-compare(translate(substring(@' + sKey + ',1,' + iBefore + '),' + g_sTranslateAccents + '),translate(' + sSearch + ',' + g_sTranslateAccents + '),"","i")=0'
}

function AddNameToList(oPerson, bShowBreak, bLastNameFirst, bShowVoted) {
    var bAdd = true
    var sHTML = ''
    if (bLastNameFirst == null) bLastNameFirst = false
    if (bShowVoted == null) bShowVoted = false
    var sUniqCode = oPerson.getAttribute('UniqCode')
    var bAddNonVoters = true;

    //if (sThisPage == 'Community') bAddNonVoters = true

    //var sName = oPerson.getAttribute('LName')
    //var sTemp = oPerson.getAttribute('FName')
    var sName = oPerson.getAttribute('FName')
    var sTemp = oPerson.getAttribute('LName')
    if (sTemp != '' && sTemp != null) {
        if (bLastNameFirst) {
            sName = sTemp + ', ' + sName
        }
        else {
            sName += ' ' + sTemp
        }
    }

    sTemp = oPerson.getAttribute('AKAName')
    if (sTemp != '' && sTemp != null) sName += ' [' + sTemp + ']'

    sTemp = oPerson.getAttribute('BahaiId')
    if (sTemp != '' && sTemp != null) sName += ' #' + sTemp

    // assume we will add this person
    bAdd = true

    sTemp = oPerson.getAttribute('AgeGroup')
    if (sTemp != 'Adult' && sTemp != null) {
        bAdd = bAddNonVoters
        if (bAdd) sName += ' <span class=ListWarn>{' + sTemp + '}</span>'
    }
    else { // have an adult
        sTemp = oPerson.getAttribute('IneligibleToReceiveVotes')
        if (sTemp != 'false' && sTemp != null) {
            bAdd = bAddNonVoters
            if (bAdd) sName += ' <span class=ListWarn>{' + Phrase('SpoiledTypeIneligible') + '}</span>'
        }
    }

    if (bAdd && bShowVoted) {
        sTemp = oPerson.getAttribute('Voted')
        if (sTemp != null && sTemp != '' && sTemp !== 'No')
            sName += ' <span class=ListVoted>{' + Phrase('Voted' + sTemp) + '}</span>'
    }

    if (bAdd) {
        if (sName.trim() == '') sName = Phrase('NoName')
        sHTML += '<div style="padding-left:10px;text-indent:-10px;cursor:hand;'
        if (bShowBreak) { // this is the start of the secondary list
            sHTML += 'border-top: 3px black double;'
        }
        sHTML += '" id="UC_' + sUniqCode + '">' + sName + '</div>'
    }
    return sHTML
}

//function BuildMaxNameList() {
//    var iCurrent = GetValue('MaxNamesToShow')
//    if (isNaN(iCurrent) || iCurrent == '') {
//        iCurrent = 20
//        SaveValue('MaxNamesToShow', iCurrent)
//    }

//    //AppendOption(selMaxNames, Phrase('FirstX', 20), 20, iCurrent == 20 ? true : false)
//    //AppendOption(selMaxNames, Phrase('FirstX', 100), 100, iCurrent == 100 ? true : false)

//    g_iMaxNamesToShow = iCurrent
//}

function SelectTextName(sUCId, iChildNumber) {
    // alert(sUCId + '\n' + iChildNumber)
    var divName = null
    var iNumNames = divTextNameLookup.children.length
    if (iNumNames == 0) return
    if (sUCId) { // given ID
        iChildNumber = null
        if (sUCId.substr(0, 3) == 'UC_') {
            //divName = document.getElementById(sUCId)
            divName = divTextNameLookup.children(sUCId)
            if (divName == null) {
                // error??
                return
            }
        }
    }
    else { // no Id given, look for number
        if (iChildNumber == null) {
            // default to first?
            if (iNumNames == 1)
                iChildNumber = 0
            else if (sThisPage == 'Community') {
                iChildNumber = g_iNameCurrent;
            }
            else {
                if (g_domXSLVotes == null) {
                    g_domXSLVotes = MakeEmptyDOM();
                    LoadDOM(g_domXSLVotes, top.g_sPath + '/../support/sortVotes.xsl');
                }
                // reload the sorted document
                var domCounted = MakeEmptyDOM();
                domCounted.loadXML(top.g_domElection.transformNode(g_domXSLVotes));

                // find most used...
                var iFoundMax = 0;
                var iFoundIndex = 0;
                for (var i = 0; i < iNumNames; ++i) {
                    sUCId = divTextNameLookup.children(i).id;
                    if (sUCId.substr(0, 3) == 'UC_') {
                        sUCId = sUCId.substring(3, 999);
                        var oPerson = top.g_domCommunity.selectSingleNode('//Person[@UniqCode="' + sUCId + '"]');
                        if (oPerson != null) {
                            var sLName = BlankForNull(oPerson.getAttribute('LName'));
                            var sFName = BlankForNull(oPerson.getAttribute('FName'));
                            var sAKAName = BlankForNull(oPerson.getAttribute('AKAName'));
                            var sKey = sLName + '_' + sFName + '_' + sAKAName;
                            var oCount = domCounted.selectSingleNode('//Person[@Key="' + sKey + '"]');
                            if (oCount != null) {
                                var iMyCount = +oCount.getAttribute("Count");

                                if (iMyCount > iFoundMax) {
                                    iFoundMax = iMyCount;
                                    iFoundIndex = i;
                                }

                            }
                        }
                    }
                }
                iChildNumber = iFoundIndex
            }
        }

        if (iChildNumber >= iNumNames)
            iChildNumber = iNumNames - 1

        if (typeof iChildNumber == 'undefined') return;

        divName = divTextNameLookup.children(iChildNumber)
        if (divName == null) {
            // list is empty
            return
        }
    }

    if (divName != null && typeof (divName.innerText) != 'undefined') {
        if (g_divNameCurrent != null) { // unhighlight previous name
            RemoveHighlight(g_divNameCurrent)
        }
        // highlight new name
        AddHighlight(divName)
        // remember it
        g_divNameCurrent = divName

        // determine what number we are at?
        if (iChildNumber != null) {
            g_iNameCurrent = iChildNumber
        }
        else {
            for (i = 0; i < iNumNames; ++i) {
                if (divTextNameLookup.children(i) == divName) {
                    g_iNameCurrent = i
                    break
                }
            }
        }
    }
    else { // didn't find a name
        g_divNameCurrent = null
        g_iNameCurrent = null
    }
    //alert(divName.id + '  ' + g_iNameCurrent)
}

function RemoveHighlight(eDiv) {
    if (typeof (eDiv.style) != 'undefined') {
        //alert(eDiv.id)
        eDiv.style.color = ''
        eDiv.style.backgroundColor = ''
    }
}

function AddHighlight(eDiv) {
    if (typeof (eDiv.style) != 'undefined') {
        eDiv.style.color = 'white'
        eDiv.style.backgroundColor = 'green'
    }
}

//function MaxNamesChanged() {
//    g_iMaxNamesToShow = selMaxNames.options[selMaxNames.selectedIndex].value
//    SaveValue('MaxNamesToShow', g_iMaxNamesToShow)
//    BuildTextNameLookup('', '', '', '')
//}

function BuildTranslateAccents() {
    // return    "abc", "ABC"
    // ¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷ÿŸ⁄€‹›ﬁü
    var sAccent = '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷ÿŸ⁄€‹›ﬁü'
    var sPlain = 'AAAAAAACEEEEIIIIDNOOOOOOUUUUYYY'
    g_sTranslateAccents = '"' + sAccent + sAccent.toLowerCase() + '","' + sPlain + sPlain.toLowerCase() + '"'
    //divTest.innerText = g_sTranslateAccents
}

