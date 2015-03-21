<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="C:\Data\Glen\Bahai\TallyJ\TallyJ_Local\Support\sortCommunity.xsl"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output method="xml" indent="yes"  omit-xml-declaration="yes"/>
  <xsl:key name="keyName" match="//Person" use="concat(@LName,'_',@FName,'_',@AKAName)"/>
  <xsl:template match="/">
    <xsl:apply-templates select="Community"/>
  </xsl:template>
  <xsl:template match="Community">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates select="Person">
        <xsl:sort select="@LName"/>
        <xsl:sort select="@FName"/>
        <xsl:sort select="@AKAName"/>
      </xsl:apply-templates>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="Person">
    <xsl:variable name="ThisKey" select="concat(@LName,'_',@FName,'_',@AKAName)"/>
    <xsl:variable name="Count" select="count(key('keyName',$ThisKey))"/>
    <xsl:copy>
      <xsl:apply-templates select="@*[local-name()!='Duplicates' and local-name()!='Key' and .!=' ' and .!='']"/>
      <xsl:choose>
        <xsl:when test="$Count != 1">
          <xsl:attribute name="Duplicates">
            <xsl:value-of select="$Count"/>
          </xsl:attribute>
        </xsl:when>
      </xsl:choose>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>
  <xsl:template match="@* | node()">
    <xsl:copy>
      <xsl:apply-templates select="@*"/>
      <xsl:apply-templates />
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
