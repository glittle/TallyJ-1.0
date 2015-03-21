<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <xsl:output media-type="html"/>
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
        <xsl:if test="Ballot[@BallotStatus='New'] or Ballot[@BallotStatus='ReviewNeeded']">
          <p class="ReportWarning">
            <xsl:call-template name="Phrase">
              <xsl:with-param name="Key" select="'Incomplete'"/>
            </xsl:call-template>
          </p>
        </xsl:if>
        <table class="Report">
          <tr>
            <td colspan="3">
              <i>
                <xsl:text>(</xsl:text>
                <xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'TotalNames'"/>
                </xsl:call-template>
                <xsl:text/>
                <xsl:value-of select="count(FinalCounts/PersonCount)"/>
                <xsl:text>)</xsl:text>

              </i>
            </td>
          </tr>
          <tr class="ReportTitle">
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'Name'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'VOTES'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'UnitNumVotesTie'"/>
              </xsl:call-template>
            </td>
          </tr>
          <xsl:for-each select="FinalCounts/PersonCount">
            <xsl:sort select="@LName"/>
            <xsl:sort select="@FName"/>
            <tr>
              <td>
                <xsl:value-of select="@LName"/>
                <xsl:text>, </xsl:text>
                <xsl:value-of select="@FName"/>
                <xsl:choose>
                  <xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
                    <xsl:text>&#160; [</xsl:text>
                    <xsl:value-of select="@AKAName"/>]
                  </xsl:when>
                </xsl:choose>
              </td>
              <td align="center">
                <xsl:value-of select="@Count"/>
              </td>
              <td align="center">
                <xsl:value-of select="@TieCount"/>
              </td>
            </tr>
          </xsl:for-each>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
