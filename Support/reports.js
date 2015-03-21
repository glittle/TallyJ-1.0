/// <reference path="jquery-1.4.4.js" />
/// <reference path="namelist.js" />
/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var g_iLookupSize = 12

function PrepPage() {
    if (top.g_domElection == null || top.g_domElection.documentElement == null) {
        alert(Phrase('NeedElection'))
    }
    else {
        BuildElectionReportList()
    }

    //top.g_domCommunity = top.g_domCommunity
    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'))
    } else {
        BuildCommReportList()
    }


    AdjustSizes();

    // focus on the New button
    $('#btnShowReport').focus();

    RefreshValidationStatus();
}

function RefreshValidationStatus() {
    $('#divValidationStatus')
            .removeClass('BallotsValidationStatus0')
            .removeClass('BallotsValidationStatus1')
            .removeClass('BallotsValidationStatus2')
            .addClass('BallotsValidationStatus{0}'.filledWith(top.g_ballotsValidationStatus))
            .text(Phrase('BallotsValidationStatus{0}'.filledWith(top.g_ballotsValidationStatus)));

}


function RefreshAfterBallotValidation() {
    RefreshValidationStatus();

    switch (g_lastReportType) {
        case 'r':
            ShowReport();
            break;

        case 'c':
            ShowCommReport();
            break;
    }
}

function BuildCommReportList() {
    BuildAnyReportList('ReportsComm', selCommReportList)
}


function BuildElectionReportList() {
    var oElection = top.g_domElection.documentElement
    var oInfo = oElection.selectSingleNode('Info')
    var iNum = oInfo.getAttribute('NumberToElect')
    var iNumExtra = oInfo.getAttribute('NumberOfAlternatesToReport')
    BuildAnyReportList('ReportsElect', selReportList, iNum, iNumExtra)
}


function BuildAnyReportList(sPath, oSelect, sVar1, sVar2) {
    //PrepPath()

    try {
        var oFolder = top.oFSO.GetFolder(top.g_sPath + '/../' + sPath + '/')
    }
    catch (e) {
        alert(e.description)
        return
    }

    var oFileList = new Enumerator(oFolder.files)

    oSelect.options.length = 0

    var oFile = null
    var sName = ''
    var sCoreName
    var sDisplayName


    for (var i = 0; !oFileList.atEnd(); i++, oFileList.moveNext()) {
        oFile = oFileList.item()
        sName = oFile.Name

        // only list the XSL files
        if (sName.substr(sName.length - 4).toUpperCase() === '.XSL') {
            sCoreName = sName.substr(0, sName.length - 4)

            if (sCoreName.substr(0, 6).toUpperCase() === 'CUSTOM') {
                sDisplayName = sCoreName;
                // use it
            } else {
                // get the translated name of this file, if possible
                sDisplayName = Phrase('File:' + sCoreName, sVar1, sVar2)
                if (sDisplayName.substr(0, 2) == '??') {
                    continue; // don't include unless it is named in the Phrases doc
                }
            }

            AppendOption(oSelect, sDisplayName, sCoreName)
        }
    }

    ++i  // add blank line to end

    oSelect.size = (i > g_iLookupSize) ? g_iLookupSize : i

}

function selReportListKeyPress() {
    var k = event.keyCode

    switch (k) {
        case 13:
            ShowReport()
            break

    }
}

function selCommReportListKeyPress() {
    var k = event.keyCode

    switch (k) {
        case 13:
            ShowCommReport()
            break

    }
}

var g_lastReportType = '';

function ShowReport(mode) {
    g_lastReportType = 'r';

    //alert(selBallotList.options[selBallotList.selectedIndex].text)
    DoReport(selReportList.options[selReportList.selectedIndex].value
      , selReportList.options[selReportList.selectedIndex].text
      , top.g_domElection, 'ReportsElect');

    if (mode === 'p') {
        PrintReport();
    } else {
        FocusInReport();
    }
}

function ShowCommReport(mode) {
    g_lastReportType = 'c';

    //alert(selBallotList.options[selBallotList.selectedIndex].text)
    DoReport(selCommReportList.options[selCommReportList.selectedIndex].value
      , selCommReportList.options[selCommReportList.selectedIndex].text
      , top.g_domCommunity, 'ReportsComm')

    if (mode === 'p') {
        PrintReport();
    } else {
        FocusInReport();
    }
}

function FocusInReport() {
    var iframe = document.getElementById('iReport');
    var doc = iframe.contentWindow.document;
    doc.body.focus();
}

function PrintReport() {
    var iframe = document.frames['iReport'];
    iframe.focus();
    iframe.print();
}

function DoReport(sFileName, sName, dom, sPath) {
    divReportTitle.innerHTML = sName
    document.title = Phrase('TallyJ') + ' ' + sName

    var domXSL = MakeEmptyDOM(true); // need free-threaded to use with XSLT
    LoadDOM(domXSL, top.g_sPath + '/../' + sPath + '/' + sFileName + '.xsl')

    // add phrases to XML
    // copy to a clone
    var domClone = MakeEmptyDOM()
    dom.save(domClone)
    var sKey, sNewKey, oNode

    for (sKey in top.g_oPhraseList) {
        sNewKey = ''

        if (sKey.startsWith('XSL:'))
            sNewKey = sKey.substring(4)
        else
            sNewKey = sKey
        /*
        if(sKey.startsWith('VoteStatus')) sNewKey=sKey
        if(sKey.startsWith('BStatus')) sNewKey=sKey
        if(sKey.startsWith('AgeGroup')) sNewKey=sKey
        if(sKey.startsWith('VotingElig')) sNewKey=sKey
        */
        if (sNewKey != '') {
            oNode = domClone.createElement('Phrase')
            oNode.setAttribute('Key', sNewKey)
            oNode.setAttribute('Value', top.g_oPhraseList[sKey])
            domClone.documentElement.appendChild(oNode)
        }
    }

    //domClone.save('c:\\temp\\x.xml')
    SetPI(domClone)

    var xslt = null;
    var progIDs = ['Msxml2.XSLTemplate.6.0'];

    for (var i = 0; i < progIDs.length; i++) {
        try {
            xslt = new ActiveXObject(progIDs[i]);
        }
        catch (ex) {
        }
    }

    if (xslt == null) {
        alert(Phrase('XSLError', 'No XSLTemplate'))
    }
    else {
        try {
            xslt.stylesheet = domXSL
            var xslProc = xslt.createProcessor()
            xslProc.input = domClone

            if (top.g_ballotsValidationStatus != ValidationStatus.ReadyToReport) {
                xslProc.addParameter('Warning', Phrase('BallotsValidationStatus{0}'.filledWith(top.g_ballotsValidationStatus)))
            }
            var now = new Date();
            xslProc.addParameter('Year', now.getFullYear());
            xslProc.addParameter('Date', now.toLocaleString());
            xslProc.addParameter('TallyJVersion', top.oHTA.version);

            xslProc.transform()

            //divReport.innerHTML = xslProc.output // domClone.transformNode(domXSL)

            var iframe = document.getElementById('iReport');
            var doc = iframe.contentWindow.document;
            doc.open();
            doc.write(xslProc.output);
            doc.close();

            HookupEvents();
        }
        catch (e) {
            alert(Phrase('XSLError', e.description))
        }
    }
}

function AdjustSizes() {
    $('#iReport').height($('table').first().find('tr').eq(1).outerHeight(false) - 30);
}


function Move(sel) {
    var iKey = event.keyCode
    var i = sel.selectedIndex
    if (event.shiftKey || event.altKey || event.ctrlKey) return
    switch (iKey) {
        case 40: // down
            i++
            break
        case 38: // up
            i--
            break
    }
    if (i < 0) i = 0
    if (i > sel.options.length - 1) i = sel.options.length - 1
    sel.selectedIndex = i
}

function HookupEvents() {
    var div = $('#divReport');
    $('#btnReviewUseManual').click(function () { ReviewReport('m'); });
    $('#btnReviewUseAuto').click(function () { ReviewReport('a'); });
    $('.btnEditElection').click(function () { top.Goto('Election', false); });

    var chartWidth = 250; // pixels

    $('.Chart').each(function () {
        var div = $(this);
        var size = +div.attr('size');
        var max = +div.attr('max');
        div.css({
            width: (chartWidth * (size / max)) + 'px'
        });

    });
}
function ReviewReport(type) {
    alert(type);
}