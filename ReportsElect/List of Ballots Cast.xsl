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
        <table class="Report">
          <tr>
            <td colspan="3">
              <i>
                <xsl:text>(</xsl:text>
                <xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'TotalBallots'"/>
                </xsl:call-template>
                <xsl:text/>
                <xsl:value-of select="count(Ballot)"/>
                <xsl:text>)</xsl:text>
              </i>
            </td>
          </tr>
          <tr class="ReportTitle">
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'BallotId'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'BallotStatus'"/>
              </xsl:call-template>
            </td>
            <td>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'VotesOnBallot'"/>
              </xsl:call-template>
            </td>
          </tr>
          <xsl:apply-templates select="Ballot">
            <xsl:sort select="substring-before(@Id,'.')"/>
            <xsl:sort select="substring-after(@Id,'.')" data-type="number"/>
          </xsl:apply-templates>
        </table>
      </body>
    </html>
  </xsl:template>
  <xsl:template match="Ballot">
    <tr>
      <td class="ReportSmall">
        <a href="ballots.htm?ballot={@Id}">
          <xsl:value-of select="@Id"/>
        </a>
      </td>
      <td class="ReportSmall" nowrap="nowrap">
        <xsl:call-template name="Phrase">
          <xsl:with-param name="Key" select="concat('BStatus',@BallotStatus)"/>
        </xsl:call-template>
        <xsl:if test="@BallotStatus='Ok' and Vote[@VoteStatus!='Ok']">
          <xsl:text> (</xsl:text>
          <xsl:value-of select="count(Vote[@VoteStatus!='Ok'])"/>
          <xsl:text> </xsl:text>
          <xsl:call-template name="Phrase">
            <xsl:with-param name="Key" select="'BallotInvalidVotes2'"/>
          </xsl:call-template>
          <xsl:text>)</xsl:text>
        </xsl:if>
      </td>
      <td class="ReportSmall">
        <span>
          <xsl:attribute name="style">
            <xsl:choose>
              <xsl:when test="@BallotStatus!='Ok'">text-decoration: line-through</xsl:when>
            </xsl:choose>
          </xsl:attribute>
          <xsl:for-each select="Vote/Person">
            <span>
              <xsl:attribute name="style">
                padding-left:4px;<xsl:choose>
                  <xsl:when test="../@VoteStatus!='Ok'">text-decoration: line-through</xsl:when>
                </xsl:choose>
              </xsl:attribute>
              <xsl:value-of select="@FName"/>
              <xsl:text>&#160;</xsl:text>
              <xsl:value-of select="@LName"/>
              <xsl:choose>
                <xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
                  <xsl:text> (</xsl:text>
                  <xsl:value-of select="@AKAName"/>)
                </xsl:when>
              </xsl:choose>
            </span>
            <xsl:if test="position()!=last()">
              <xsl:text>, </xsl:text>
            </xsl:if>
          </xsl:for-each>
        </span>
      </td>
    </tr>
  </xsl:template>
</xsl:stylesheet>
