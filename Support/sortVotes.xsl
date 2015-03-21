<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
	<xsl:output method="xml"/>
	<xsl:key name="keyName" match="//Vote/Person" use="concat(@LName,'_',@FName,'_',@AKAName)"/>
	<xsl:template match="/">
		<xsl:variable name="People_With_Count">
			<xsl:apply-templates select="//Vote/Person[generate-id(.)=generate-id(key('keyName',concat(@LName,'_',@FName,'_',@AKAName))[1])]" mode="Count"/>
		</xsl:variable>
		<VoteCount>
			<xsl:for-each select="msxsl:node-set($People_With_Count)/Person">
				<Person Key="{@ThisKey}" Count="{@Count}"/>
			</xsl:for-each>
		</VoteCount>
	</xsl:template>
	<xsl:template match="Person" mode="Count">
		<xsl:copy>
			<xsl:copy-of select="@*"/>
			<xsl:copy-of select="*"/>
			<!-- Add a calculated Count child to each <product>. -->
			<xsl:variable name="ThisKey" select="concat(@LName,'_',@FName,'_',@AKAName)"/>
			<xsl:attribute name="ThisKey"><xsl:value-of select="$ThisKey"/></xsl:attribute>
			<xsl:attribute name="Count"><xsl:value-of select="count(key('keyName',$ThisKey))"/></xsl:attribute>
		</xsl:copy>
	</xsl:template>
</xsl:stylesheet>
