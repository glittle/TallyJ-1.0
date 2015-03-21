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
                <xsl:with-param name="Key" select="'BALLOTIDSTATUS'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'NAME'"/>
              </xsl:call-template>
            </td>
          </tr>
          <xsl:apply-templates select="Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Ok']/Person">
            <xsl:sort select="concat(@LName,'_',@FName,'_',@AKAName)"/>
            <xsl:sort select="substring-before(../../@Id,'.')"/>
            <xsl:sort select="substring-after(../../@Id,'.')" data-type="number"/>
          </xsl:apply-templates>
        </table>
      </body>
    </html>
  </xsl:template>
  <xsl:template match="Ballot/Vote/Person">
    <tr>
      <td class="ReportSmall">
        <xsl:value-of select="position()"/>
      </td>
      <!--<td class="ReportSmall">
        <xsl:attribute name="style">
          <xsl:choose>
            <xsl:when test="ancestor::Ballot[@BallotStatus='Ok'] and ancestor::Vote[@VoteStatus='Ok']"/>
            <xsl:otherwise>text-decoration: line-through</xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <i>
          <xsl:call-template name="Phrase">
            <xsl:with-param name="Key" select="concat('VoteStatus',current()/../@VoteStatus)"/>
          </xsl:call-template>
        </i>
      </td>-->
      <td class="ReportSmall">
        <a href="ballots.htm?ballot={ancestor::Ballot/@Id}">
          <xsl:value-of select="ancestor::Ballot/@Id"/>
        </a>
      </td>
      <td class="ReportSmall">
        <span>
          <xsl:value-of select="@LName"/>
          <xsl:text>, </xsl:text>
          <xsl:value-of select="@FName"/>
          <xsl:choose>
            <xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
              <xsl:text>&#160; [</xsl:text>
              <xsl:value-of select="@AKAName"/>]
            </xsl:when>
          </xsl:choose>
        </span>
      </td>
    </tr>
  </xsl:template>
</xsl:stylesheet>
