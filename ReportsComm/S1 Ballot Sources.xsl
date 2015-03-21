<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:template name="Phrase">
    <xsl:param name="Key"/>
    <xsl:variable name="KEY" select="translate($Key,'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
    <xsl:value-of select="/*/Phrase[@Key=$KEY]/@Value"/>
  </xsl:template>
  <xsl:template match="/Community">
    <html>
      <head>
        <LINK REL="stylesheet" TYPE="text/css" HREF="../reportHelper.css"/>
        <script TYPE="text/javascript" SRC="../reportHelper.js"></script>
      </head>
      <body>
        <table class="Report">
          <tr>
            <td colspan="4" class="ReportTitle">
              <xsl:value-of select="@Name"/>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="ReportTitle2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'BallotSourceReport'"/>
              </xsl:call-template>
            </td>
          </tr>
          <tr>
            <td colspan="4" class="ReportComment">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ElectionParticipationReport'"/>
              </xsl:call-template>
              <br/>
              <br/>
            </td>
          </tr>

          <tr>
            <td colspan="2" width="70%">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TotalReceived'"/>
              </xsl:call-template>
              <br/>
              <br/>
            </td>
            <td align="right" width="30%">
              <xsl:value-of select="count(Person[@Voted='VotedInPerson' or @Voted='DroppedOff' or @Voted='Mailed'] )"/>
            </td>
          </tr>
          <tr>
            <td colspan="2" width="70%">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'VotedVotedInPerson'"/>
              </xsl:call-template>
            </td>
            <td align="right" width="30%">
              <xsl:value-of select="count(Person[@Voted='VotedInPerson'])"/>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'VotedDroppedOff'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="count(Person[@Voted='DroppedOff'])"/>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'VotedMailed'"/>
              </xsl:call-template>
              <br></br>
              <br></br>
            </td>
            <td align="right">
              <xsl:value-of select="count(Person[@Voted='Mailed'])"/>
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'DidNotVote'"/>
              </xsl:call-template>
            </td>
            <td align="right">
              <xsl:value-of select="count(Person[(@Voted='No' or @Voted='' or not(@Voted)) and (@AgeGroup='Adult' or not(@AgeGroup)) and (@IneligibleToReceiveVotes='false' or not(@IneligibleToReceiveVotes))])"/>
            </td>
          </tr>
        </table>
      </body>
    </html>
  </xsl:template>

</xsl:stylesheet>
