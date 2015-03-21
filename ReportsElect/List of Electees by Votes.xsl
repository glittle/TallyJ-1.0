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
          <tr class="ReportTitle">
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'#'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'ELECTEES'"/>
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
          <xsl:call-template name="Report2">
          </xsl:call-template>
        </table>
      </body>
    </html>
  </xsl:template>
  <xsl:template name="Report2">
    <xsl:for-each select="FinalCounts/PersonCount">
      <!--Draw a line after the required number-->
      <xsl:choose>
        <xsl:when test="@Section!=preceding-sibling::*[1]/@Section">
          <tr>
            <td colspan="4">
              <hr/>
            </td>
          </tr>
        </xsl:when>
      </xsl:choose>
      <tr>
        <td>
          <xsl:value-of select="@Position"/>
        </td>
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
  </xsl:template>
</xsl:stylesheet>
