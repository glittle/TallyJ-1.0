<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format">
	<xsl:output media-type="html"/>
	<xsl:variable name="Voters" select="/Community/Person"/>
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
						<td class="ReportTitle2">
							<br/>
							<xsl:value-of select="@Name"/>
						</td>
					</tr>
				</table>
				<table>
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
		<tr>
			<td class="ReportSmall">
				<xsl:value-of select="@BahaiId"/>
			</td>
			<td class="ReportSmall">
				<xsl:variable name="NotAdult">
					<xsl:choose>
						<xsl:when test="@AgeGroup != 'Adult'">true</xsl:when>
            <xsl:when test="@IneligibleToReceiveVotes = 'true'">true</xsl:when>
						<xsl:otherwise>false</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:if test="$NotAdult='true'">
					<xsl:text disable-output-escaping="yes">&lt;i></xsl:text>
				</xsl:if>
				<xsl:value-of select="@LName"/>
				<xsl:text>, </xsl:text>
				<xsl:value-of select="@FName"/>
				<xsl:choose>
					<xsl:when test="@AKAName and @AKAName!='' and @AKAName!='null'">
						<xsl:text>&#160; (</xsl:text>
						<xsl:value-of select="@AKAName"/>)</xsl:when>
				</xsl:choose>
				<xsl:choose>
					<xsl:when test="@AgeGroup != 'Adult'">
						<xsl:text>&#160; [</xsl:text>
						<xsl:call-template name="Phrase">
							<xsl:with-param name="Key" select="concat('AgeGroup',@AgeGroup)"/>
						</xsl:call-template>
						<xsl:text>]</xsl:text>
					</xsl:when>
          <xsl:when test="@IneligibleToReceiveVotes='true'">
            <xsl:text>&#160; [</xsl:text>
            <xsl:value-of  select="@ReasonToNotReceive"/>
            <xsl:text>]</xsl:text>
          </xsl:when>
        </xsl:choose>
				<xsl:if test="$NotAdult='true'">
					<xsl:text disable-output-escaping="yes">&lt;/i></xsl:text>
				</xsl:if>
			</td>
		</tr>
	</xsl:template>
</xsl:stylesheet>
