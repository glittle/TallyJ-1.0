/// <reference path="jquery-1.4.4.js" />
/// <reference path="general.js" />
/// <reference path="namelist.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

var settings = {
    lastInitial: '',
    lastLName: '',
    phrases: {},
    lastEnvNum: 0    // read from community file
};

function PrepPage() {
    if (top.g_domCommunity == null || top.g_domCommunity.documentElement == null) {
        alert(Phrase('NeedCommunity'));
        return;
    }

    $('body').focus();

    settings.lastInitial = ''; // reset, in case we are refreshing the page
    settings.lastLName = '';

    // ensure XSD is loaded
    top.LoadCommunityXSD();

    var oCommunity = top.g_domCommunity.documentElement;
    divCommName.innerHTML = oCommunity.getAttribute('Name');

    settings.lastEnvNum = +(oCommunity.getAttribute('LastEnvNum') || 0);

    ShowAllNames();
}

function ShowAllNames() {

    FillPhrases();

    var people = top.g_domCommunity.documentElement.selectNodes('Person');
    var html = [];
    var count = 0;

    for (var i = 0; i < people.length; i++) {
        var personNode = people[i];

        var ageGroup = personNode.getAttribute('AgeGroup');
        var isAdult = ageGroup === null || ageGroup === 'Adult';

        var ineligible = personNode.getAttribute('IneligibleToReceiveVotes');
        var isIneligible = ineligible === 'true';

        if (isAdult && !isIneligible) {
            html.push(AddNameToList(personNode, ++count));
        }
    }

    $('#divRegListing')
      .html(html.join(''))
      .keydown(JumpToKey)
      .focus();

    $('.FDButton')
       .bind('click', function () { ButtonClicked($(this)); });

    $('.Buttons')
       .each(function () {
           this.onselectstart = function () { return false; };
       });
}

function JumpToKey(ev) {
    var which = ev.which;

    if (which < 65 || which > 90) {
        return;
    }

    var key = String.fromCharCode(which);
    var target = $('#Initial' + key.toUpperCase());

    if (target.length != 0) {
        //$('#divDebug').text(target.position().top);
        $('#divRegListing').scrollTop($('#divRegListing').scrollTop() + target.position().top);
    }
}

function FillPhrases() {
    var phrases = settings.phrases;
    phrases['BtnVotedInPerson'] = Phrase('BtnVotedInPerson');
    phrases['BtnMailed'] = Phrase('BtnMailed');
    phrases['BtnDroppedOff'] = Phrase('BtnDroppedOff');

}

function AddNameToList(personNode, index) {
    var classesRow = ['FDRow'];
    var classesLName = ['FDLName'];

    var LName = personNode.getAttribute('LName') + ',';
    var initial = LName.substring(0, 1).toUpperCase();

    var initialHtml = '';

    if (initial !== settings.lastInitial) {
        settings.lastInitial = initial;
        initialHtml = '<div class=NewInitial id="Initial{0}"><div class="Initial">{0}</div></div>'.filledWith(initial);
    }

    var FName = personNode.getAttribute('FName');
    var AKAName = personNode.getAttribute('AKAName');
    var BahaiId = personNode.getAttribute('BahaiId');
    var Voted = personNode.getAttribute('Voted');

    var isDup = false;

    if (LName === settings.lastLName) {
        isDup = true;
        classesLName.push('DupLName');
    }
    else {
        settings.lastLName = LName;
    }

    var htmlName = '<span class=Index>{Index}</span><span class="FDName {ClassesRest}"><span class="{ClassesLName}"><span>{LName}</span></span> <span class="FDRest">{FName}{AKAName}{BahaiId}</span></span>'.filledWith({
        Code: sUniqCode,
        LName: LName,
        FName: FName,
        Index: index,
        ClassesLName: classesLName.join(' '),
        ClassesRest: Voted ? ' IsSet' : '',
        AKAName: AKAName ? ' (' + AKAName + ')' : '',
        BahaiId: BahaiId ? ' <span class=FDBahaiId>#' + BahaiId + '</span>' : ''
    });

    var EnvNum = personNode.getAttribute('EnvNum');

    var buttons = '<span class=Buttons>{0}{1}{2}{3}</span>'.filledWith(
     MakeButton('Mailed', Voted),
     MakeEnvNumHolder(EnvNum),
     MakeButton('DroppedOff', Voted),
     MakeButton('VotedInPerson', Voted)
    );

    var sUniqCode = personNode.getAttribute('UniqCode');
    var htmlLine = '{Initial}<div id="UC_{Code}" class="{Classes}">{Buttons}{Name}</div>'.filledWith({
        Code: sUniqCode,
        Initial: initialHtml,
        Buttons: buttons,
        Name: htmlName,
        Classes: classesRow.join(' ')
    });

    return htmlLine;
}

function MakeButton(code, current, envNum) {
    var classes = ['FDButton', code];
    if (code === current) {
        classes.push('IsSet');
    }

    return '<span class="{0}">{1}</span>'.filledWith(
        classes.join(' '),
        settings.phrases['Btn' + code]
    );
}

function MakeEnvNumHolder(envNum) {
    if (envNum) {
        return '<span class=EnvNumHolder>{0}</span>'.filledWith(MakeEnvNumNode(envNum));
    }
    else {
        return '<span class=EnvNumHolder></span>';
    }
}

function MakeEnvNumNode(envNum) {
    return '<span class=EnvNum>#<span>{0}</span></span>'.filledWith(envNum || '?');

}

function ButtonClicked(btn) {

    var div = btn.parent().parent();
    var personUniqCode = div.attr('id').split('_')[1];

    var oNode = top.g_domCommunity.selectSingleNode('//Person[@UniqCode="' + personUniqCode + '"]')

    if (oNode == null) {
        alert('Internal error 1');
        return;
    }

    var alreadyPressed = btn.hasClass('IsSet');

    // remove from all
    div.find('.FDButton').removeClass('IsSet');
    div.find('.FDName').removeClass('IsSet');

    if (alreadyPressed) {
        // "unpress" it
        btn.parent().find('.EnvNumHolder').empty();
        oNode.removeAttribute('Voted');
        oNode.removeAttribute('EnvNum');
    }
    else {
        btn.addClass('IsSet');
        div.find('.FDName').addClass('IsSet');

        if (btn.hasClass('VotedInPerson')) {
            btn.parent().find('.EnvNumHolder').empty();
            oNode.setAttribute('Voted', 'VotedInPerson')
            oNode.removeAttribute('EnvNum');
        }
        else {
            // must be mailed or dropped
            var value;
            if (btn.hasClass('Mailed')) {
                value = 'Mailed';
            }
            else if (btn.hasClass('DroppedOff')) {
                value = 'DroppedOff';
            }
            else {
                alert('internal error 2');
                return;
            }

            var holder = btn.parent().find('.EnvNumHolder');

            var numDiv = holder.find('.EnvNum');
            if (numDiv.length !== 1) {
                var envNum = settings.lastEnvNum + 1;
                RememberCurrentLastEnvNum(envNum);
                holder.html(MakeEnvNumNode(envNum));
                oNode.setAttribute('EnvNum', envNum);
            }

            oNode.setAttribute('Voted', value)
        }
    }

    top.SaveCommunityQuick();
}

function RememberCurrentLastEnvNum(envNum) {
    settings.lastEnvNum = envNum;

    top.g_domCommunity.documentElement.setAttribute('LastEnvNum', envNum);
}
