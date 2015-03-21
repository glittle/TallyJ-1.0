<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:param name="Warning"/>
  <xsl:param name="Year"/>
  <xsl:param name="TallyJVersion"/>
  <xsl:template name="Phrase">
    <xsl:param name="Key"/>
    <xsl:variable name="KEY" select="translate($Key,'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
    <xsl:value-of select="/*/Phrase[@Key=$KEY]/@Value"/>
  </xsl:template>
  <xsl:template match="/Election">
    <html>
      <head>
        <LINK REL="stylesheet" TYPE="text/css" HREF="../reportHelper.css"/>
        <script TYPE="text/javascript" SRC="../reportHelper.js"></script>
        <style TYPE="text/css">
          TD.BottomBorder { text-align:center; border-bottom: solid 1px black; }
          .Numbers TD.BottomBorder { text-align:right; padding-right: 15px;  }
          .NameUnder { border-bottom: solid 1px black; padding: 0 15px 0 5px; }
          .Top { text-align: center; font-weight: bold; }
          .Top1 { text-align: center; font-weight: bold; padding: 15px 0 15px 0; background-color: #ccc; font-size: 20pt; font-style: italic; }
          .Report { width: 100%;}
          TH { text-align: left; }
          TD.Left { text-align: left; padding-left: 10px; }
          TD.Right { text-align: right; padding-right: 150px; }
          .Table2 { margin-top: 15px; }
          TR.UpSmall TD { font-size: 90%; text-align: center;  }
          .Signatures .BottomBorder { line-height: 2.4em; }
          .NameList TH { padding: 5px 20px 3px 7px; vertical-align: bottom; }
          .NameList TD { padding: 5px 20px 3px 7px; border: solid 1px #666; }
          .NameList {border-collapse: collapse; width: auto; }
        </style>
      </head>
      <body>
        <xsl:if test="$Warning">
          <p class="ReportWarning">
            <xsl:value-of select="$Warning"/>
          </p>
        </xsl:if>
        <xsl:if test="not(Info/@ApprovedForReporting) or Info/@ApprovedForReporting!='true' or Ballot[@BallotStatus='New'] or Ballot[@BallotStatus='ReviewNeeded']">
          <p class="ReportWarning">
            <xsl:call-template name="Phrase">
              <xsl:with-param name="Key" select="'Incomplete'"/>
            </xsl:call-template>
          </p>
        </xsl:if>
        <xsl:choose>
          <xsl:when test="Info/@ElectionType='UnitConvention'"/>
          <xsl:when test="Info/@ElectionType='UnitConventionTieBreak'"/>
          <xsl:otherwise>
            <p class="ReportWarning">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ReportTypeUnitConventionOnly'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="Info/@ElectionType"/>
              </xsl:call-template>
            </p>
          </xsl:otherwise>
        </xsl:choose>
        <div class="Top1">
          <xsl:text>Electoral Unit Convention Report</xsl:text>
        </div>

        <table style="margin-top: 30px;">
          <tr>
            <td>ELECTORAL UNIT #</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="Info/@ElectoralUnit"></xsl:value-of>
              &#160;
            </td>
            <td style="padding-left: 30px; padding-right: 10px;">Number of delegates elected</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="Info/@NumberToElect"></xsl:value-of>
              &#160;
            </td>
          </tr>
          <tr>
            <td style="padding-right: 10px;">Convening Assembly/Group</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="Info/@Location"></xsl:value-of>
              &#160;
            </td>
            <td style="padding-left: 30px;">Date</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="Info/@DateOfElection"></xsl:value-of>
              &#160;
            </td>
          </tr>
        </table>






        <xsl:variable name="Adults" select="number(FinalCounts/@AdultsInCommunity)"/>
        <table style="margin-top: 30px;" class="Numbers">
          <tr>
            <td style="white-space: nowrap; padding-right: 10px; ">Number of ballots cast in person at voting location</td>
            <td class="BottomBorder">
              <xsl:value-of select="number(FinalCounts/@VotedInPerson)"/>
            </td>
          </tr>
          <tr>
            <td>Number of ballots sent by mail or hand-delivered</td>
            <td class="BottomBorder">
              <xsl:value-of select="FinalCounts/@MailedInBallots + FinalCounts/@DroppedOffBallots"/>
            </td>
          </tr>
          <xsl:variable name="D" select="count(Ballot)"/>
          <tr>
            <td>Number of voters who voted</td>
            <td class="BottomBorder">
              <xsl:value-of select="$D"/>
            </td>
          </tr>

          <tr>
            <td style="width: 15em">Number of eligible voters</td>
            <td style="width: 5em;" class="BottomBorder">
              <xsl:value-of select="$Adults"/>
            </td>
          </tr>

          <tr>
            <td>Percentage participation in the Vote</td>
            <td class="BottomBorder">
              <xsl:value-of select="format-number($D div $Adults, '##0%')"/>
            </td>
          </tr>

          <tr>
            <td style="width: 15em">Number not voting</td>
            <td style="width: 5em;" class="BottomBorder">
              <xsl:value-of select="$Adults - $D"/>
            </td>
          </tr>


          <tr>
            <td>Number of spoiled ballots</td>
            <td class="BottomBorder">
              <xsl:value-of select="count(Ballot[@BallotStatus!='Ok'])"/>
            </td>
          </tr>
          <tr>
            <td>Number of spoiled votes</td>
            <td class="BottomBorder">
              <xsl:value-of select="count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus!='Ok'])"/>
            </td>
          </tr>
        </table>


        <div style="margin: 30px 0 0 0;">
          <b>
            <xsl:text>DELEGATES ELECTED:</xsl:text>
          </b>
          List the names of the delegates elected.
        </div>
        <table class="NameList">
          <tr>
            <th style="width: 5%"></th>
            <th style="width: 34%;">Surname/First Name</th>
            <th style="width: 20%;">Bahá’í ID #</th>
            <th style="width: 20%">
              Number of votes after initial election
            </th>
            <th style="width: 20%">
              Number of votes after tie-breaking vote (if applicable)
            </th>
          </tr>
          <xsl:for-each select="FinalCounts/PersonCount[@Section='Top']">
            <tr>
              <td>
                <xsl:value-of select="@Position"/>
                <xsl:text>.</xsl:text>
              </td>
              <td class="Left">
                <xsl:value-of select="@LName"/>
                <xsl:text>, </xsl:text>
                <xsl:value-of select="@FName"/>
              </td>
              <td class="Left">
                <xsl:value-of select="@BahaiId"/>
              </td>
              <td class="Right">
                <xsl:value-of select="@Count"/>
              </td>
              <td class="Right">
                <xsl:value-of select="@TieCount"/>
              </td>
            </tr>
          </xsl:for-each>
        </table>


        <div style="margin: 30px 0 0 0;">
          List the
          <b>
            <u>
              <xsl:text>three</xsl:text>
            </u>
          </b>
          believers receiving the next highest number of votes, in order of votes received.
        </div>
        <table class="NameList">
          <tr>
            <th style="width: 5%"></th>
            <th style="width: 34%;">Surname/First Name</th>
            <th style="width: 20%;">Bahá’í ID #</th>
            <th style="width: 20%">
              Number of votes after initial election
            </th>
            <th style="width: 20%">
              Number of votes after tie-breaking vote (if applicable)
            </th>
          </tr>
          <xsl:for-each select="FinalCounts/PersonCount[@Section='Extra' or @ForceShowOther='Report']">
            <tr class="{@Section}">
              <td>
                <xsl:choose>
                  <xsl:when test="@Section='Extra'">
                    <xsl:value-of select="@Position"/>
                    <xsl:text>.</xsl:text>
                  </xsl:when>
                </xsl:choose>
              </td>
              <td class="Left">
                <xsl:value-of select="@LName"/>
                <xsl:text>, </xsl:text>
                <xsl:value-of select="@FName"/>
              </td>
              <td class="Left">
                <xsl:value-of select="@BahaiId"/>
              </td>
              <td class="Right">
                <xsl:value-of select="@Count"/>
              </td>
              <td class="Right">
                <xsl:value-of select="@TieCount"/>
              </td>
            </tr>
          </xsl:for-each>
        </table>

        <p style="text-align: center; margin-top: 60px;">
          Send one copy of this report immediately to:<br/>
          Email:  <a href="mailto:conventions@cdnbnc.org">conventions@cdnbnc.org</a><br/>
          Fax:  (905) 889-8184 or Post:  7200 Leslie St., Thornhill, ON L3T 6L8
        </p>
        <div style="float:right; margin-top: -40px; font-size: 70%;">
          TallyJ v.<xsl:value-of select="$TallyJVersion" />
        </div>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
