/// <reference path="general.js" />
// TallyJ files Copyright 2002-2011 by Glen Little, Calgary, Alberta, Canada

/*

- on startup
- get last filename from ROOT, load into g_domElection
- get last community file from ROOT, load into g_domCommunity
  
- if not configured, go to Files to choose or create

*/

function PrepPage() {
    LoadPath()    // show link to source path
    GetFileList() // fill list of files
    ShowStatus()  // update block info
}


function ShowStatus() {
    var sHTML = ''
    sHTML += '<h3>' + top.g_sElectionName + '</h3>'
    sHTML += '<span class="comment">' + Phrase('File') + ': ' + top.GetValue('ElectionFile') + '</span>'
    divShowElection.innerHTML = sHTML

    sHTML = ''
    sHTML += '<h3>' + top.g_sCommunityName + '</h3>'
    sHTML += '<span class="comment">' + Phrase('File') + ': ' + top.GetValue('CommunityFile') + '</span>'
    divShowCommunity.innerHTML = sHTML

    try { selFileList.focus() } catch (e) { }

}


function GetFileList(sHighlightName) {
    var oSelect = selFileList

    // get the folder
    try {
        var oFolder = top.oFSO.GetFolder(top.g_sPath)
    }
    catch (e) {
        alert(e.description)
        return
    }

    var oFileList = new Enumerator(oFolder.files)

    if (typeof (sHighlightName) == 'undefined') sHighlightName = ''

    oSelect.options.length = 0

    var oFile = null
    var sName = ''

    for (; !oFileList.atEnd(); oFileList.moveNext()) {
        oFile = oFileList.item()
        sName = oFile.Name

        //alert(sName.substr(sName.length-4).toUpperCase())
        // only list the XML files
        if (sName.substr(sName.length - 4).toUpperCase() == '.XML'
       && sName.substr(0, 1) != '_') {
            AppendOption(oSelect, sName.substr(0, sName.length - 4), sName, (sHighlightName.toUpperCase() == sName.toUpperCase()))
        }
    }
}


function ShowFileDetail() {
    var e = selFileList //event.srcElement

    if (e.selectedIndex == -1) return

    var sShortFileName = e.options[e.selectedIndex].value

    var sFileName = top.g_sPath + '/' + sShortFileName

    // Originally, loaded XML text into a DOM
    // However, large community files were extremely slow to load...
    // Now, load text of file into memory, then scan through it
    // Tried to use SAX, but could find no info about SAX in JScript.

    var f = top.oFSO.OpenTextFile(sFileName, 1, false, -1);
    var sXMLText = f.ReadAll()
    f.close()

    if (sXMLText.charCodeAt(0) === 16188) {
        // assume we have an older ASCII file...
        f = top.oFSO.OpenTextFile(sFileName, 1, false, 0);
        sXMLText = f.ReadAll()
        f.close()
    }

    //    var sEncoding = sXMLText.substr(0, 2)
    //    if (sEncoding == String.fromCharCode(255) + String.fromCharCode(254)
    //    || sEncoding == String.fromCharCode(254) + String.fromCharCode(255)) { // file is in UTF-16/Unicode!
    //        sRoot = 'Unicode'
    //    }
    //    else {
    sRoot = TextFindRootElement(sXMLText)
    //  }

    switch (sRoot) {
        case 'Election':
            //divFile_File.innerText = sFileName
            divFile_FileType.innerText = 'Election'

            // load file  
            var domFile = MakeEmptyDOM()
            if (domFile == null) return

            domFile.loadXML(sXMLText)

            var oElection = domFile.documentElement
            var oInfo = oElection.selectSingleNode("Info")

            var sName = GetAttribute(oElection, 'Name')
            divFile_Name.innerText = '{0} ({1})'.filledWith(sName, GetAttribute(oInfo, 'CodeForThisComputer'));

            divFile_Info1Label.innerText = 'Election Date'
            divFile_Info1.innerText = GetAttribute(oInfo, 'DateOfElection')
            divFile_Info2Label.innerText = 'Ballots'
            divFile_Info2.innerText = oElection.selectNodes('Ballot').length

            if (sShortFileName.substr(0, 1) != '_') {
                btnLoad.style.display = ''
                btnLoad.fileName = sFileName
                btnLoad.fileType = 'Election'
                btnLoad.rootName = sName
                btnLoad.innerHTML = Phrase('FileLoad2')

                if (top.g_domElection) {
                    btnMerge.style.display = ''
                    btnMerge.fileName = sFileName
                    btnMerge.fileType = 'Election'
                    btnMerge.rootName = sName
                    btnMerge.innerHTML = Phrase('FileMerge2')
                }
                else {
                    btnMerge.style.display = 'none'
                }
                divMsg.innerHTML = ''
            }
            else {
                btnLoad.style.display = 'none'
                btnMerge.style.display = 'none'
                divMsg.innerHTML = '<span style="color:red">' + Phrase('IsTemplate') + '</span>'
            }
            break

        case 'Community':
            //divFile_File.innerText = sFileName
            divFile_FileType.innerText = Phrase('Community')

            // don't load into DOM - takes too long for large files
            //var domFile = MakeEmptyDOM()
            //if (domFile == null) return

            sName = TextGetAttribute(sXMLText, 'Community', 1, 'Name')

            divFile_Name.innerText = sName

            divFile_Info1Label.innerText = 'People'
            divFile_Info1.innerText = TextCountElements(sXMLText, 'Person')
            divFile_Info2Label.innerText = ''
            divFile_Info2.innerText = ''

            if (sShortFileName.substr(0, 1) != '_') {
                btnLoad.style.display = ''
                btnLoad.fileName = sFileName
                btnLoad.fileType = 'Community'
                btnLoad.rootName = sName
                btnLoad.innerHTML = Phrase('FileLoad3')

                if (false && top.g_domCommunity) // disabled for now
                {
                    btnMerge.style.display = ''
                    btnMerge.fileName = sFileName
                    btnMerge.fileType = 'Community'
                    btnMerge.rootName = sName
                    btnMerge.innerHTML = Phrase('FileMerge3')
                }
                else {
                    btnMerge.style.display = 'none'
                }
                divMsg.innerHTML = ''
            }
            else {
                btnLoad.style.display = 'none'
                btnMerge.style.display = 'none'
                divMsg.innerHTML = '<span style="color:red">' + Phrase('IsTemplate') + '</span>'
            }

            break

        default:
            //divFile_File.innerText = sFileName
            divFile_FileType.innerText = sRoot + ' ' + Phrase('Unsupported')

            divFile_Info1Label.innerText = ''
            divFile_Info1.innerText = ''
            divFile_Info2Label.innerText = ''
            divFile_Info2.innerText = ''
            divFile_Name.innerText = ''

            btnLoad.style.display = 'none'
            btnMerge.style.display = 'none'
            divMsg.innerHTML = Phrase('InvalidFile')
    }
}


function LoadFile() {
    // this will first get the details of the file to be loaded
    ShowFileDetail()

    // name of Election file selected
    try {
        var sFileType = btnLoad.fileType
    }
    catch (oErr) {
        alert(oErr)
    }

    switch (sFileType) {
        case 'Election':
            // check for current election

            // TODO: check if need to save current election
            /*
            if(oNode!=null)
            { // matching named Election found
            if(!confirm('An election with the same name is currently loaded in the browser.\n\nIf you click OK, the file will be loaded replacing the one currently loaded.'))
            {
            return
            }
            */
            top.SaveValue('ElectionFile', btnLoad.fileName)
            //SaveValue('ElectionName', btnLoad.rootName)

            top.LoadElection()

            break

        case 'Community':

            top.SaveValue('CommunityFile', btnLoad.fileName)
            //SaveValue('CommunityName', btnLoad.rootName)

            top.LoadCommunity()

            break

        default:
            //alert('? ' + sFileType)
    }

    // find the named election in the loaded list
    //var sQuery = '/ROOTSTUB/Election[@Name=\'' + sName + '\']'

    // see if the selected Election is already loaded
    //alert(domCopy.documentElement.xml)


    ShowStatus()

}


function MergeFile() {
    // name of file selected
    try {
        var sFileType = btnLoad.fileType
    }
    catch (oErr) {
        alert(oErr)
    }

    switch (sFileType) {
        case 'Election':
            // check for current election
            if (!top.g_domElection) { // no election to merge with!
                return
            }
            var sMergeFile = btnLoad.fileName

            var domMerge = MakeEmptyDOM()
            if (domMerge == null) return // error msg already shown

            var loaded = LoadDOM(domMerge, sMergeFile);
            
            if (!loaded) return;
            
            if (domMerge.documentElement == null) {
                alert(Phrase('InvalidElectionFile'))
                return
            }
            var oMergeElection = domMerge.selectSingleNode('/Election')
            if (oMergeElection == null) {
                alert(Phrase('InvalidElectionFile'))
                return
            }

            // all okay, do merge
            var iExisting = 0
            var iAdded = 0

            var oMergeBallotList = oMergeElection.selectNodes('Ballot')
            for (var i = 0; i < oMergeBallotList.length; i++) {
                var bMerge = true
                var oMergeBallot = oMergeBallotList[i]
                // got a Ballot to merge!

                // check to make sure the new ballot's Id does not conflict
                var sMergeId = oMergeBallot.getAttribute('Id')
                if (sMergeId == '') { // this new ballot does not have an Id, make one
                    sMergeId = GetNextElectionId()
                }
                else { // has an Id, check it
                    var oExistingBallot = top.g_domElection.documentElement.selectSingleNode('Ballot[@Id="' + sMergeId + '"]')
                    //alert(oExistingBallot.xml)          
                    if (oExistingBallot != null) { // found an existing copy of this ballot
                        iExisting += 1
                        bMerge = false
                    }
                }

                if (bMerge) {
                    // ballot will not conflict, merge it in
                    // set the UniqCode correctly
                    oMergeBallot.setAttribute('UniqCode', GetNextUniqCode(top.g_domElection))

                    top.g_domElection.documentElement.appendChild(oMergeBallot)
                    iAdded += 1
                    CheckSave()
                }
            }

            //alert('Added ' + iAdded + ' ballot(s)\nFound ' + iExisting + ' duplicate ballots - skipped')
            alert(Phrase('AddedSkipped', iAdded, iExisting))
            if (iAdded > 0) alert(Phrase('ClickSave'))

            break

        case 'Community':

            sMergeFile = btnLoad.fileName


            break

        default:
            //alert('? ' + sFileType)
    }

    // find the named election in the loaded list
    //var sQuery = '/ROOTSTUB/Election[@Name=\'' + sName + '\']'

    // see if the selected Election is already loaded
    //alert(domCopy.documentElement.xml)


    ShowStatus()

}


function LoadPath() {
    //PrepPath()

    // display content
    linkDataPath.href = 'file:///' + top.g_sPath
    divDataPath.innerText = top.g_sPath
}


function FilterName() {
    var e = event.srcElement
    var s = e.value

    if (s.indexOf('.') >= 0) s = s.substring(0, s.indexOf('.'))

    e.value = s + '.xml'
}

function CreateElection() {
    var sName = GetNewName()
    if (sName == '') return
    CopyTemplate('_ElectionTemplate.xml', sName)
}

function DupElection() {
    var sName = GetNewName()
    if (sName == '') return
    var sCurrFile = GetValue('ElectionFile').trim()
    if (sCurrFile == '') {
        alert(Phrase('NeedElectionToDup'))
        return
    }
    CopyTemplate(sCurrFile, sName, true)
}

function CreateCommunity() {
    var sName = GetNewName()
    if (sName == '') return
    CopyTemplate('_CommunityTemplate.xml', sName)
}

function CopyTemplate(sTemplate, sNewFile, bTemplateHasPath) {
    if (bTemplateHasPath)
        var sFullTemplate = sTemplate
    else
        sFullTemplate = top.g_sPath + '\\' + sTemplate

    if (!top.oFSO.FileExists(sFullTemplate)) {
        alert(Phrase('MissingTemplate', sTemplate))
        return
    }

    sFullNewFile = top.g_sPath + '\\' + sNewFile

    try {
        top.oFSO.CopyFile(sFullTemplate, sFullNewFile, false)

        var f = top.oFSO.GetFile(sFullNewFile)
        if (f.attributes & 1) {
            f.attributes = f.attributes - 1
        }
        f = null

        // now finish up
        CreateFileName.value = '';
        GetFileList(sNewFile);
        LoadFile();
        ShowFileDetail();
    }
    catch (e) {
        alert(e)
    }
}

function GetNewName() // return string
{
    var sName = CreateFileName.value.trim()
    if (sName == '') {
        alert(Phrase('SupplyFileName'))
        return ''
    }

    // filter illegal characters
    if (sName.search(/\\/g) == -1 && sName.search(/\//g) == -1) {// okay
    }
    else {
        alert(Phrase('InvalidCharInName'))
        return ''
    }

    // add .xml
    if (!sName.endsWith('.xml')) {
        sName += '.xml'
    }

    // check if file exists
    // could look through SELECT list already built, but it may be out of date
    var oFolder = top.oFSO.GetFolder(top.g_sPath)
    var oFileList = new Enumerator(oFolder.files)

    var oFile = null

    for (; !oFileList.atEnd(); oFileList.moveNext()) {
        oFile = oFileList.item()
        if (sName.toUpperCase() == oFile.Name.toUpperCase()) {
            alert(Phrase('NewFileExists'))
            return ''
        }
    }
    return sName
}
