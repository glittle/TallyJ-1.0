<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:param name="Warning"/>
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
        <table class="Report">
          <tr>
            <td colspan="4" class="ReportTitle2">
              <br/>
              <xsl:value-of select="@Name"/>
            </td>
          </tr>
          <tr>
            <td class="ReportTitle" colspan="2" width="30%">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'DateOfElection'"/>
              </xsl:call-template>
            </td>
            <td colspan="2" width="70%">
              <xsl:value-of select="Info/@DateOfElection"/>
            </td>
          </tr>
          <tr>
            <td class="ReportTitle" colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Location'"/>
              </xsl:call-template>
            </td>
            <td colspan="2">
              <xsl:value-of select="Info/@Location"/>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="ReportTitle2">
              <br/>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Summary'"/>
              </xsl:call-template>
            </td>
          </tr>
          <xsl:variable name="A" select="FinalCounts/@AdultsInCommunity"/>
          <tr>
            <td width="9%">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'A'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2" width="70%">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Number of electors'"/>
              </xsl:call-template>
            </td>
            <td align="right" width="20%">
              <xsl:value-of select="$A"/>
            </td>
          </tr>
          <tr>
            <td colspan="4">&#160;</td>
          </tr>
          <xsl:variable name="B" select="number(FinalCounts/@VotedInPerson)"/>
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'B'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumInPerson'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$B"/>
            </td>
          </tr>
          <xsl:variable name="C" select="FinalCounts/@MailedInBallots + FinalCounts/@DroppedOffBallots"/>
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'C'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumAbsent'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$C"/>
            </td>
          </tr>
          <tr>
            <td/>
            <td colspan="2" class="ReportComment">
              &#160;<xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumDropped'"/>
              </xsl:call-template> : <xsl:value-of select="FinalCounts/@DroppedOffBallots"/>
              &#160;<xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumMailed'"/>
              </xsl:call-template> : <xsl:value-of select="FinalCounts/@MailedInBallots"/>
            </td>
            <td style="border-bottom: solid 1px black">&#160;</td>
          </tr>
          <xsl:variable name="D" select="count(Ballot)"/>
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'D'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'FormulaD'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$D"/>
            </td>
          </tr>
          <tr>
            <td/>
            <td colspan="2" class="ReportComment">
              &#160;<xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'PartRate'"/>
              </xsl:call-template> : <xsl:value-of select="format-number($D div $A, '##0%')"/>
            </td>
            <td/>
          </tr>
          <tr>
            <td colspan="4">&#160;</td>
          </tr>
          <xsl:variable name="E" select="count(Ballot[@BallotStatus!='Ok'])"/>

          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'E'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumSpoiled'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$E"/>
            </td>
          </tr>
          <tr>
            <td/>
            <td colspan="2" class="ReportComment">
              <xsl:if test="count(Ballot[@BallotStatus='DupName'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'DupNameLong'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='DupName'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='TooMany'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'BStatusTooMany'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='TooMany'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='TooFew'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'BStatusTooFew'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='TooFew'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='ReviewNeeded'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'BStatusReviewNeeded'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='ReviewNeeded'])"/>
              </xsl:if>
            </td>
            <td style="border-bottom: solid 1px black">&#160;</td>
          </tr>
          <xsl:variable name="F" select="$D - $E"/>
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'F'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumValid'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$F"/>
            </td>
          </tr>
          <tr>
            <td colspan="4">&#160;</td>
          </tr>
          <xsl:variable name="G" select="count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus!='Ok'])"/>
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'G'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumInvalid'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="$G"/>
            </td>
          </tr>
          <tr>
            <td/>
            <td colspan="2" class="ReportComment">
              <xsl:if test="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Unreadable'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'SpoiledTypeUnreadable'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Unreadable'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Ineligible'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'SpoiledTypeIneligible'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Ineligible'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Unidentifiable'])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'SpoiledTypeUnidentifiable'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='Ok']/Vote[@SpoiledGroup='Unidentifiable'])"/>
              </xsl:if>
              <xsl:if test="count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Spoiled' and not(@SpoiledGroup)])!=0">
                &#160;<xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'SpoiledOther'"/>
                </xsl:call-template>: <xsl:value-of select="count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Spoiled' and not(@SpoiledGroup)])"/>
              </xsl:if>
            </td>
            <td align="right" style="border-bottom: solid 1px black">&#160;</td>
          </tr>
          <xsl:variable name="H" select="count(Ballot[@BallotStatus='Ok']) * Info/@NumberToElect - count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus!='Ok'])"/>
          <!--  count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Ok'])  -->
          <tr>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'H'"/>
              </xsl:call-template>.
            </td>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumValidVotes1'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:value-of select="Info/@NumberToElect"/>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NumValidVotes2'"/>
              </xsl:call-template>

            </td>
            <td align="right">
              <xsl:value-of select="$H"/>
            </td>
          </tr>
          <tr>
            <td/>
            <td colspan="2" class="ReportComment">
              &#160;<xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ValidRate1'"/>
              </xsl:call-template><xsl:text> </xsl:text>
              <xsl:value-of select="Info/@NumberToElect"/>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ValidRate2'"/>
              </xsl:call-template> : <xsl:value-of select="format-number($H div ($D * Info/@NumberToElect) , '##0%')"/>
            </td>
            <td/>
          </tr>
          <tr>
            <td colspan="4" class="ReportTitle2">
              <br/>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Elected'"/>
              </xsl:call-template>
            </td>
          </tr>
          <xsl:call-template name="Report2">
            <!-- Report will be isolated - can't get to phrases, so pass them in here  -->
            <xsl:with-param name="PhraseVotes">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Votes'"/>
              </xsl:call-template>
            </xsl:with-param>
            <xsl:with-param name="PhraseTie">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Tie'"/>
              </xsl:call-template>
            </xsl:with-param>
            <xsl:with-param name="PhraseFirstRunnerup">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'FirstRunnerup'"/>
              </xsl:call-template>
            </xsl:with-param>
          </xsl:call-template>
        </table>
        <table width="100%">
          <tr>
            <td colspan="4" class="ReportTitle2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Tellers'"/>
              </xsl:call-template>
            </td>
          </tr>
          <tr>
            <td class="ReportTitle" style="width: 150px;">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ChiefTeller'"/>
              </xsl:call-template>
            </td>
            <td colspan="3">
              <xsl:value-of select="Info/@ChiefTeller"/>
            </td>
          </tr>
          <tr>
            <td class="ReportTitle" colspan="1">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'OtherTellers'"/>
              </xsl:call-template>
            </td>
            <td colspan="3">
              <xsl:value-of select="Info/@OtherTellers"/>
            </td>
          </tr>
          <tr>
            <td class="ReportTitle" colspan="4">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'SigTellers'"/>
              </xsl:call-template>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <div style="border-bottom: solid 1px black; padding-top: 20px;">&#160;</div>
            </td>
          </tr>
          <tr>
            <td colspan="4">
              <div style="border-bottom: solid 1px black; padding-top: 20px;">&#160;</div>
            </td>
          </tr>
        </table>
        <div style="float:right; margin-top: -1.6em; padding-right: 5px; font-size: 70%;">
          TallyJ v.<xsl:value-of select="$TallyJVersion" />
        </div>
      </body>
    </html>
  </xsl:template>
  <xsl:template name="Report2">
    <xsl:param name="PhraseTie"/>
    <xsl:param name="PhraseVotes"/>
    <xsl:param name="PhraseFirstRunnerup"/>
    <xsl:for-each select="/Election/FinalCounts/PersonCount[@Section='Top']">
      <tr>
        <td>
          <xsl:choose>
            <xsl:when test="@Section='Top'">
              <xsl:value-of select="@Position"/>
            </xsl:when>
          </xsl:choose>
        </td>
        <td colspan="2">
          <xsl:choose>
            <xsl:when test="@Section='Top'">
              <xsl:value-of select="@LName"/>
              <xsl:text>, </xsl:text>
              <xsl:value-of select="@FName"/>
              <xsl:choose>
                <xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
                  <xsl:text>&#160; [</xsl:text>
                  <xsl:value-of select="@AKAName"/>]
                </xsl:when>
              </xsl:choose>

            </xsl:when>
            <xsl:otherwise>
              <i class="ReportComment">
                <xsl:value-of select="$PhraseFirstRunnerup"/>
              </i>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:choose>
            <xsl:when test="@TieBreakGroup">
              <i class="ReportComment">
                <xsl:text> &#160; (</xsl:text>
                <xsl:value-of select="@Count"/>
                <xsl:text disable-output-escaping="yes">&#160;</xsl:text>
                <xsl:value-of select="$PhraseVotes"/>
                <xsl:text disable-output-escaping="yes">, </xsl:text>
                <xsl:value-of select="$PhraseTie"/>
                <xsl:text disable-output-escaping="yes">&#160;</xsl:text>
                <xsl:value-of select="@TieCount"/>
                <xsl:text disable-output-escaping="yes">&#160;</xsl:text>
                <xsl:value-of select="$PhraseVotes"/>
                <xsl:text>)</xsl:text>
              </i>
            </xsl:when>
            <xsl:otherwise>
              <i class="ReportComment">
                <xsl:text> &#160; (</xsl:text>
                <xsl:value-of select="@Count"/>
                <xsl:text disable-output-escaping="yes">&#160;</xsl:text>
                <xsl:value-of select="$PhraseVotes"/>
                <xsl:text>)</xsl:text>
              </i>
            </xsl:otherwise>
          </xsl:choose>
        </td>
        <td>
          <xsl:choose>
            <xsl:when test="@Section='Top' and @BahaiId and @BahaiId!='' and @BahaiId!='null'">
              <xsl:text>&#160; #</xsl:text>
              <xsl:value-of select="@BahaiId"/>
            </xsl:when>
          </xsl:choose>
        </td>
      </tr>
    </xsl:for-each>
  </xsl:template>
</xsl:stylesheet>
