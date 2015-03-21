<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:param name="Warning"/>
  <xsl:param name="Year"/>
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
          TD.BottomBorder { text-align:right;   text-transform: uppercase; padding-right: 25px; border-bottom: solid 1px black; }
          .NameUnder { border-bottom: solid 1px black; padding: 0 15px 0 5px; }
          .Top { text-align: center; font-weight: bold; }
          .Report { width: 100%;}
          TH { text-align: left; }
          TD.Left { text-align: left; padding-left: 10px; }
          TD.Right { text-align: right; padding-right: 150px; }
          .Table2 { margin-top: 15px; }
          TR.UpSmall TD { font-size: 90%; text-align: center;  }
          .Signatures .BottomBorder { line-height: 2.4em; }
          .NameList TD, .NameList TH { padding: 5px 20px 3px 7px; }
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
          <xsl:when test="Info/@ElectionType='Assembly'"/>
          <xsl:when test="Info/@ElectionType='AssemblyBiElection'"/>
          <xsl:when test="Info/@ElectionType='AssemblyTieBreak'"/>
          <xsl:otherwise>
            <p class="ReportWarning">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ReportTypeAssemblyOnly'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="Info/@ElectionType"/>
              </xsl:call-template>
            </p>
          </xsl:otherwise>
        </xsl:choose>
        <div class="Top">
          <xsl:value-of select="$Year" />
          <xsl:text> TELLERS' REPORT</xsl:text>
        </div>
        <p style="font-weight: bold">
          <xsl:text>The Spiritual Assembly of the Bahá’ís of </xsl:text>
          <span class="NameUnder">
            &#160;
            <xsl:value-of select="Info/@Location"></xsl:value-of>
            &#160;
          </span>
        </p>
        <xsl:variable name="Adults" select="number(FinalCounts/@AdultsInCommunity)"/>
        <table>
          <tr>
            <td style="width: 15em">Number of eligible voters</td>
            <td style="width: 5em;" class="BottomBorder">
              <xsl:value-of select="$Adults"/>
            </td>
          </tr>
          <tr>
            <td>Number of ballots cast in person</td>
            <td class="BottomBorder">
              <xsl:value-of select="number(FinalCounts/@VotedInPerson)"/>
            </td>
          </tr>
          <tr>
            <td>Number of ballots received by mail</td>
            <td class="BottomBorder">
              <xsl:value-of select="FinalCounts/@MailedInBallots"/>
            </td>
          </tr>
          <tr>
            <td>Number of hand-delivered ballots</td>
            <td class="BottomBorder">
              <xsl:value-of select="FinalCounts/@DroppedOffBallots"/>
            </td>
          </tr>
          <xsl:variable name="D" select="count(Ballot)"/>
          <tr>
            <td>Total ballots cast</td>
            <td class="BottomBorder">
              <xsl:value-of select="$D"/>
            </td>
          </tr>
          <tr>
            <td>Percentage of participation</td>
            <td class="BottomBorder">
              <xsl:value-of select="format-number($D div $Adults, '##0%')"/>
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


        <div class="Top" style="margin: 30px 350px 15px 0;">
          <xsl:text>ELECTED</xsl:text>
        </div>
        <table class="NameList" style="width: auto;" border="1">
          <tr>
            <th style="width: 25px"></th>
            <th style="width: 20em;">Name (Bahá’í ID)</th>
            <th style="white-space: nowrap">
              Number of Votes
              <xsl:choose>
                <xsl:when test="FinalCounts/PersonCount[@Section='Top' and @TieCount]">
                  <xsl:text> (Tie-break Votes)</xsl:text>
                </xsl:when>
              </xsl:choose>
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
                <xsl:choose>
                  <xsl:when test="@BahaiId">
                    <xsl:text> (</xsl:text>
                    <xsl:value-of select="@BahaiId"/>
                    <xsl:text>)</xsl:text>
                  </xsl:when>
                </xsl:choose>
                &#160;
              </td>
              <td class="Right">
                <xsl:value-of select="@Count"/>
                <xsl:choose>
                  <xsl:when test="@TieCount">
                    <xsl:text> (</xsl:text>
                    <xsl:value-of select="@TieCount"/>
                    <xsl:text>)</xsl:text>
                  </xsl:when>
                </xsl:choose>
                &#160;
                &#160;
                <!--style padding-right doesn't seem to work!-->
                &#160;
              </td>
            </tr>
          </xsl:for-each>
        </table>


        <table class="Report Signatures" style="margin-top: 20px;">
          <tr>
            <td style="width: 41%; text-align: center;" class="BottomBorder">
              <xsl:value-of select="Info/@ChiefTeller"/>
              &#160;
            </td>
            <td style="width: 2%;"></td>
            <td style="width: 41%;" class="BottomBorder">&#160;</td>
          </tr>
          <tr class="UpSmall">
            <td>Head Teller’s Name (block letters)</td>
            <td></td>
            <td>Signature of Head Teller*</td>
          </tr>
        </table>
        <p>*Note:  Signature is not required for electronic copy sent to the Records Department. </p>
        <p>
          Please send to <a href="mailto:records@cdnbnc.org">records@cdnbnc.org</a>.
        </p>
      </body>
    </html>


  </xsl:template>
</xsl:stylesheet>
