/// <reference path="jquery-1.4.4.js" />
/// <reference path="namelist.js" />
/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var reviewInfo = {
    saveNeeded: false
};

function PrepPage() {
    if (top.g_domElection == null || top.g_domElection.documentElement == null) {
        alert(Phrase('NeedElection'))
        return
    }

    //top.g_domCommunity = top.g_domCommunity
    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'))
        return
    }

    ShowReport();

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
    ShowReport();
}

function ShowReport() {

    DoReport('1Review'
      , Phrase('TellersReview')
      , top.g_domElection, 'Support');

    CheckForDuplicates();
    UpdateApproveButtonLabel();

    RefreshValidationStatus();

    setTimeout(function () {
        $('body').focus();
    }, 100);
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

            if (top.g_ballotsValidationStatus == ValidationStatus.NotReady) {
                xslProc.addParameter('Warning', Phrase('BallotsValidationStatus{0}'.filledWith(top.g_ballotsValidationStatus)))
            }
            xslProc.transform()

            divReport.innerHTML = xslProc.output // domClone.transformNode(domXSL)

            HookupEvents();
        }
        catch (e) {
            alert(Phrase('XSLError', e.description))
        }
    }
}

function HookupEvents() {
    var div = $('#divReport');
    //$('.btnEditElection').click(function () { top.Goto('Election', false); });
    $('#btnSaveBallotSources').click(SaveManualCounts);

    $('input.ManualCount').ForceNumericOnly();
    $('input#txtManualDroppedOff, input#txtManualMailedIn').keyup(UpdateManualInPerson);
    //$('#src1, #src2').change(UpdateSourceSelection);

    UpdateManualInPerson();
    VerifyAutoCounts();

    $('input.TieBreakCount')
      .ForceNumericOnly()
      .keyup(CheckForDuplicates)
      .change(function () {
          var src = $(this);
          src.val(Math.floor(+src.val()));
      });
    $('#btnSaveTieBreakCounts').click(SaveTieBreakCounts);

    $('#btnToggleAfter').click(function () {
        $('tr.HideAfter').toggle();
    });

    $('#btnApproved').click(function () {
        var cb = $('#cbApproved');
        // toggle
        cb.attr('checked', !cb.is(':checked'));

        SaveApproval();
    });

    $('#btnClearTieBreakCounts').click(function () {
        SaveTieBreakCounts();
    });

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

function VerifyAutoCounts() {
    var exactMatch = $('#AutoCountsWrong').length == 0;

    if (!exactMatch) {
        $('#src1, label[for="src1"]').attr('disabled', true);

        var changeNeeded = !$('#src2').is(':checked');

        if (changeNeeded) {
            $('#src2').attr('checked', true);
            SaveManualCounts();
        }
    }
}

function SaveManualCounts() {
    var dom = top.g_domElection;
    var election = dom.documentElement;
    var manualResult = election.selectSingleNode('ManualResults');

    manualResult.setAttribute('AdultsInCommunity', +$('input#txtManualAdults').val());
    manualResult.setAttribute('MailedInBallots', +$('input#txtManualMailedIn').val());
    manualResult.setAttribute('DroppedOffBallots', +$('input#txtManualDroppedOff').val());
    manualResult.setAttribute('VotedInPerson', +$('#ManualInPerson').text());

    var info = election.selectSingleNode('Info');

    var useManual;

    info.setAttribute('UseManualCounts', (useManual = $('#src2').is(':checked')) ? 'true' : 'false');

    RevalidateAll();

    ToggleUseClasses('UseAuto', !useManual);
    ToggleUseClasses('UseManual', useManual);

    UpdateApproveButtonLabel();
    RefreshValidationStatus();
}

function ToggleUseClasses(name, value) {
    var oldClass = '.{0}{1}'.filledWith(name, value);
    var newClass = '.{0}{1}'.filledWith(name, !value);

    $(oldClass).removeClass(oldClass).addClass(newClass);
}

function SaveApproval() {
    var cb = $('#cbApproved');

    top.SetApprovalForReporting(cb.is(':checked'), true);

    RefreshValidationStatus();
    UpdateApproveButtonLabel();
}

function UpdateApproveButtonLabel() {
    var cb = $('#cbApproved');
    var btn = $('#btnApproved');
    var bCurrentlyApproved = cb.is(':checked');

    btn.text(bCurrentlyApproved ? Phrase('ApproveForReportingRevoke') : Phrase('ApproveForReportingNow'));

    var allowApprove = true;

    // check for warnings
    if ($('#ReviewSteps li.Warning').length) { allowApprove = false; }

    // check status
    if (top.g_ballotsValidationStatus == ValidationStatus.NotReady) { allowApprove = false; }

    // verify that we have some results
    if (top.g_domElection.selectNodes('//PersonCount').length == 0) { allowApprove = false; }

    // check ballot counts

    if (bCurrentlyApproved && !allowApprove) {
        cb.attr('checked', false);
        SaveApproval();
        return;
    }

    if (allowApprove || bCurrentlyApproved) {
        btn.removeAttr('disabled');
    } else {
        btn.attr('disabled', true);
    }

}

function UpdateManualInPerson() {
    var droppedOff = +$('input#txtManualDroppedOff').val();
    var mailedIn = +$('input#txtManualMailedIn').val();

    var total = +$('#NumBallots').text().trim();

    var inPerson = total - droppedOff - mailedIn;

    if (inPerson < 0) {
        $('#ManualError').show();
    }
    else {
        $('#ManualError').hide();
    }

    $('#ManualInPerson').text(inPerson);

}

function RemoveTieBreakCounts() {

//    var nodes = election.selectNodes('//TieBreakCount');
//    for (var i = 0; i < nodes.length; i++) {
//        election.removeChild(nodes[i]);
//    }

}

function CheckForDuplicates() {
    var div = $('#InvalidTieCounts');
    var show = false;

    $('table.TieBreakList').each(function () {
        var table = $(this);
        var voteFor = +table.find('.VoteFor').text();

        //only care about the top X values
        table.find('.Error').remove();

        var inputs = $('input.TieBreakCount', table);
        var inputCounts = {};
        var inputValues = [];
        $(inputs).each(function () {
            var value = $(this).val();
            var totalAtThisValue = inputCounts[value] || 0;
            inputCounts[value] = totalAtThisValue + 1;
            inputValues.push(value);
        });
        // take the top x inputs
        var topInputValues = inputValues.sort(function (a, b) { return b - a; }).slice(0, voteFor);
        var bottomInputValues = inputValues.slice(voteFor);

        var inputsValuesInError = [];

        for (var inputValue in inputCounts) {
            if (inputValue === '') {
                inputsValuesInError.push(inputValue);
            }
            if ($.inArray(inputValue, topInputValues) != -1 && $.inArray(inputValue, bottomInputValues) != -1) {
                inputsValuesInError.push(inputValue);
            }
        }
        var foundError = inputsValuesInError.length != 0;
        if (foundError) {
            $(inputs).each(function () {
                var input = $(this);
                var value = input.val();
                if ($.inArray(value, inputsValuesInError) != -1) {
                    input.after('<span class=Error> *</span>');
                }
            });
        }

        if (foundError) show = true;
    });

    if (show) {
        div.show();
    }
    else {
        div.hide();
    }
}

function ReviewReport(type) {
    alert(type);
}

function UpdateSaveNeeded(ev) {

    reviewInfo.saveNeeded = true;
    //$('#btnSaveTieBreakCounts')
}

function SaveTieBreakCounts() {
    var dom = top.g_domElection;
    var election = dom.documentElement;

    // remove existing
    var nodes = election.selectNodes('//TieBreakCount');
    for (var i = 0; i < nodes.length; i++) {
        election.removeChild(nodes[i]);
    }

    //<Person LName="Zhang" FName="Millie" AgeGroup="Adult" VotingEligibility="Eligible"></Person>

    $('input.TieBreakCount').each(function () {
        var input = $(this);

        var parts = [];
        parts.push('@FName="{0}"'.filledWith(input.attr('fname')));
        parts.push('@LName="{0}"'.filledWith(input.attr('lname')));
        parts.push('(@BahaiId="{0}" or not(@BahaiId) and "{0}"="")'.filledWith(input.attr('bahaiid')));
        parts.push('(@AKAName="{0}" or not(@AKAName) and "{0}"="")'.filledWith(input.attr('akaname')));

        var filter = '//PersonCount[{0}]'.filledWith(parts.join(' and '));

        var person = election.selectSingleNode(filter);

        if (person == null) {
            alert('Internal error 3');
            return false;
        }

        var newNode = dom.createElement('TieBreakCount')
        CopyAttributes(newNode, person, 'FName,LName,AKAName,BahaiId');
        newNode.setAttribute('Count', input.val());

        election.appendChild(newNode);
    });

    RevalidateAll();

    UpdateApproveButtonLabel();
}




// Numeric only control handler
jQuery.fn.ForceNumericOnly =
function () {
    return this.each(function () {
        $(this).keypress(function (e) {
            var key = e.charCode || e.keyCode || 0;

            // allow backspace, tab, delete, arrows, numbers and keypad numbers ONLY
            return (
                key == 8 ||
                key == 9 ||
                key == 46 ||
                (key >= 37 && key <= 40) ||
                (key >= 48 && key <= 57) ||
                (key >= 96 && key <= 105));
        })
    })
};