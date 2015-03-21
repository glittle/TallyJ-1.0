<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
  <xsl:output media-type="html"/>
  <xsl:variable name="NumCol" select="3"/>
  <xsl:variable name="Voters" select="/Community/Person[(@AgeGroup='Adult' or not(@AgeGroup)) and (not(@IneligibleToReceiveVotes) or @IneligibleToReceiveVotes='false')]"/>
  <xsl:template match="/Community">
    <html>
      <head>
        <LINK REL="stylesheet" TYPE="text/css" HREF="../reportHelper.css"/>
        <script TYPE="text/javascript" SRC="../reportHelper.js"></script>
      </head>
      <body>
        <table class="Report">
          <tr>
            <td class="ReportTitle2">
              <br/>
              <xsl:value-of select="@Name"/>
              <xsl:text> (</xsl:text>
              <xsl:value-of select="count($Voters)"></xsl:value-of>
              <xsl:text>)</xsl:text>
            </td>
          </tr>
        </table>
        <table width="100%">
          <xsl:apply-templates select="$Voters">
            <xsl:sort select="@LName" order="ascending"/>
            <xsl:sort select="@FName" order="ascending"/>
            <xsl:sort select="@AKAName" order="ascending"/>
          </xsl:apply-templates>
        </table>
      </body>
    </html>
  </xsl:template>
  <xsl:template match="Person">
    <xsl:variable name="Initial" select="translate(substring(@LName,1,1),'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿabcdefghijklmnopqrstuvwxyz','AAAAAAACEEEEIIIIDNOOOOOOUUUUYYYAAAAAAACEEEEIIIIDNOOOOOOUUUUYYYABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
    <xsl:variable name="IsFirstOccurance">
      <xsl:choose>
        <xsl:when test="position()=1">true</xsl:when>
        <xsl:when test="preceding-sibling::*[translate(substring(@LName,1,1),'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿabcdefghijklmnopqrstuvwxyz','AAAAAAACEEEEIIIIDNOOOOOOUUUUYYYAAAAAAACEEEEIIIIDNOOOOOOUUUUYYYABCDEFGHIJKLMNOPQRSTUVWXYZ')=$Initial]">false</xsl:when>
        <xsl:otherwise>true</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="$IsFirstOccurance = 'true'">
        <tr>
          <td class="ReportTitle2" colspan="{$NumCol}">
            <xsl:value-of select="$Initial"/>
          </td>
        </tr>
        <tr>
          <xsl:apply-templates select="$Voters[translate(substring(@LName,1,1),'ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞŸàáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿabcdefghijklmnopqrstuvwxyz','AAAAAAACEEEEIIIIDNOOOOOOUUUUYYYAAAAAAACEEEEIIIIDNOOOOOOUUUUYYYABCDEFGHIJKLMNOPQRSTUVWXYZ') = $Initial]" mode="Columns">
            <xsl:sort select="@LName" order="ascending"/>
            <xsl:sort select="@FName" order="ascending"/>
            <xsl:sort select="@AKAName" order="ascending"/>
          </xsl:apply-templates>
        </tr>
      </xsl:when>
    </xsl:choose>
  </xsl:template>
  <xsl:template match="Person" mode="Columns">
    <xsl:variable name="MaxInCol" select="ceiling(last() div $NumCol)"/>
    <xsl:choose>
      <xsl:when test="position() mod $NumCol = 1 and position()!=1">
        <xsl:text disable-output-escaping="yes">&lt;/tr>&lt;tr></xsl:text>
      </xsl:when>
    </xsl:choose>
    <td class="ReportSmall">
      <xsl:value-of select="@LName"/>
      <xsl:text>, </xsl:text>
      <xsl:value-of select="@FName"/>
      <xsl:choose>
        <xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
          <xsl:text>&#160; (</xsl:text>
          <xsl:value-of select="@AKAName"/>)
        </xsl:when>
      </xsl:choose>
    </td>
  </xsl:template>
</xsl:stylesheet>
