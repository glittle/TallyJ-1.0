<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:param name="Warning"/>
  <xsl:param name="TallyJVersion"/>
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
          TD.BottomBorder { text-align:right; padding-right: 15px; border-bottom: solid 1px black; }
          .Top { text-align: center; font-weight: bold; }
          .Report { width: 100%;}
          TH { text-align: left; }
          TD.Left { text-align: left; padding-left: 10px; }
          .Table2 { margin-top: 15px; }
          TR.UpSmall TD { font-size: 70%; text-align: center;  }
          .Signatures .BottomBorder { line-height: 2.4em; }
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
          <xsl:text> CERTIFICATE OF ELECTION for the</xsl:text>
        </div>
        <xsl:variable name="nthYear" select="number($Year) - 1956"/>
        <xsl:variable name="digit" select="substring($nthYear, string-length($nthYear), 1)"/>
        <!--<xsl:value-of select="$nthYear"></xsl:value-of>
        <xsl:value-of select="$digit"></xsl:value-of>-->
        <div class="Top">NATIONAL SPIRITUAL ASSEMBLY OF THE BAHÁ’ÍS OF ALASKA</div>
        <p>
          <xsl:text>This certifies that the </xsl:text>
          <xsl:value-of select="$nthYear" />
          <xsl:choose>
            <xsl:when test="$nthYear &gt; 10 and $nthYear &lt; 20">th</xsl:when>
            <xsl:when test="$nthYear = 1 or $digit = '1'">st</xsl:when>
            <xsl:when test="$nthYear = 2 or $digit = '2'">nd</xsl:when>
            <xsl:when test="$nthYear = 3 or $digit = '3'">rd</xsl:when>
            <xsl:otherwise>th</xsl:otherwise>
          </xsl:choose>
          <xsl:text> National Convention of the Bahá’ís of Alaska elected the following members to the Alaska National Spiritual Assembly.</xsl:text>
        </p>
        <table class="Report MainReport">
          <tr>
            <th style="width: 55%;" colspan="2" class="Left">NAME</th>
            <th style="width: 1%"></th>
            <th style="width: 20%">Alaska Bahá’í ID #</th>
            <th style="width: 1%"></th>
            <th style="width: 10%"># Votes</th>
            <th style="width: 1%"></th>
            <th style="width: 12%">Revote #</th>
          </tr>
          <xsl:for-each select="/Election/FinalCounts/PersonCount[@Section='Top']">
            <tr>
              <td style="width: 2%">
                <xsl:value-of select="@Position"/>
                <xsl:text>.</xsl:text>
              </td>
              <td class="BottomBorder Left">
                <xsl:value-of select="@LName"/>
                <xsl:text>, </xsl:text>
                <xsl:value-of select="@FName"/>
              </td>
              <td/>
              <td class="BottomBorder Left">
                <xsl:value-of select="@BahaiId"/>
                &#160;
              </td>
              <td/>
              <td class="BottomBorder">
                <xsl:value-of select="@Count"/>
                &#160;
                &#160;
                <!--style padding-right doesn't seem to work!-->
                &#160;
              </td>
              <td/>
              <td class="BottomBorder">
                <xsl:value-of select="@TieCount"/>
                &#160;
                &#160;
                &#160;
              </td>
            </tr>
          </xsl:for-each>
        </table>

        <xsl:variable name="B_Total" select="count(Ballot)"/>
        <xsl:variable name="B_Bad" select="count(Ballot[@BallotStatus!='Ok'])"/>
        <xsl:variable name="B_Ok" select="count(Ballot[@BallotStatus='Ok'])"/>
        <xsl:variable name="B_BadVotes" select="count(Ballot[@BallotStatus='Ok' and Vote[@VoteStatus!='Ok']])"/>
        <xsl:variable name="V_Bad" select="count(Ballot/Vote[@VoteStatus!='Ok'])"/>

        <table class="Table2 Report">
          <tr>
            <td style="width: 35%;">Number of valid ballots </td>
            <td style="width: 10%;" class="BottomBorder">
              &#160;
              <xsl:value-of select="$B_Ok"/>
              &#160;
            </td>
            <td style="width: 5%;"></td>
            <td style="width: 30%;">Number of valid revote ballots</td>
            <td style="width: 10%;" class="BottomBorder">
              &#160;
              <!--Not recorded by TallyJ-->
              &#160;
            </td>
          </tr>
          <tr>
            <td>Number of invalid ballots</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="$B_Bad"/>
              &#160;
            </td>
            <td></td>
            <td>Number of invalid revote ballots</td>
            <td class="BottomBorder">
              &#160;
              <!--Not recorded by TallyJ-->
              &#160;
            </td>
          </tr>
          <tr>
            <td>Total number of ballots</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="$B_Total"/>
              &#160;
            </td>
            <td></td>
            <td>Total number of revote ballots</td>
            <td class="BottomBorder">
              &#160;
              <!--Not recorded by TallyJ-->
              &#160;
            </td>
          </tr>
          <tr>
            <td>Number of ballots with ineligible names</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="$B_BadVotes"/>
              &#160;
            </td>
            <td colspan="3"></td>
          </tr>
          <tr>
            <td>Number of ineligible names</td>
            <td class="BottomBorder">
              &#160;
              <xsl:value-of select="$V_Bad"/>
              &#160;
            </td>
            <td colspan="3"></td>
          </tr>

        </table>


        <table class="Report Signatures">
          <tr>
            <td style="width: 15%; vertical-align: bottom; white-space:nowrap; padding-right: 20px;">CERTIFIED BY:</td>
            <td style="width: 41%;" class="BottomBorder">&#160;</td>
            <td style="width: 2%;"></td>
            <td style="width: 41%;" colspan="2" class="BottomBorder">&#160;</td>
          </tr>
          <tr class="UpSmall">
            <td/>
            <td>Signature of Chief Teller</td>
            <td></td>
            <td colspan="2">Signature of Teller</td>
          </tr>
          <tr>
            <td/>
            <td class="BottomBorder">&#160;</td>
            <td></td>
            <td colspan="2" class="BottomBorder">&#160;</td>
          </tr>
          <tr class="UpSmall">
            <td/>
            <td>Signature of Teller</td>
            <td></td>
            <td colspan="2">Signature of Teller</td>
          </tr>
          <tr>
            <td/>
            <td class="BottomBorder">&#160;</td>
            <td></td>
            <td style="width: 5%; vertical-align: bottom">DATE:</td>
            <td style="width: 36%; text-align: left; vertical-align: bottom;" class="BottomBorder">
              &#160;
              &#160;
              <xsl:value-of select="Info/@DateOfElection"></xsl:value-of>
            </td>
          </tr>
          <tr class="UpSmall">
            <td/>
            <td>Signature of Teller</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>

        </table>

        <div style="float:right; margin-top: -1.6em; padding-right: 5px; font-size: 70%;">
          TallyJ v.<xsl:value-of select="$TallyJVersion" />
        </div>
      </body>
    </html>


  </xsl:template>
</xsl:stylesheet>
