<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="xml" omit-xml-declaration="yes" />
  <xsl:key name="ValidVotePeople" match="//Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Ok']/Person" use="concat(@LName,'_',@FName,'_',@AKAName)"/>
  <xsl:template match="/">
    <xsl:variable name="People_With_Count">
      <xsl:apply-templates select="//Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Ok']/Person[generate-id(.)=generate-id(key('ValidVotePeople',concat(@LName,'_',@FName,'_',@AKAName))[1])]" mode="Count"/>
    </xsl:variable>
    <xsl:variable name="Sorted">
      <xsl:apply-templates select="msxsl:node-set($People_With_Count)/PersonCount" mode="Sort">
        <xsl:sort select="@Count" data-type="number" order="descending"/>
        <xsl:sort select="@TieCount" data-type="number" order="descending" />
      </xsl:apply-templates>
    </xsl:variable>
    <xsl:variable name="Sorted2">
      <xsl:apply-templates select="msxsl:node-set($Sorted)/PersonCount" mode="Info2">
        <xsl:with-param name="NumWanted" select="number(//Info/@NumberToElect)"/>
        <xsl:with-param name="NumExtras" select="number(//Info/@NumberOfAlternatesToReport)"/>
      </xsl:apply-templates>
    </xsl:variable>
    <xsl:variable name="Sorted3">
      <xsl:apply-templates select="msxsl:node-set($Sorted2)/PersonCount" mode="Info3">
      </xsl:apply-templates>
    </xsl:variable>
    <xsl:variable name="Sorted4">
      <xsl:apply-templates select="msxsl:node-set($Sorted3)/PersonCount" mode="Info4">
      </xsl:apply-templates>
    </xsl:variable>
    <xsl:variable name="Sorted5">
      <xsl:apply-templates select="msxsl:node-set($Sorted4)/PersonCount" mode="Info5">
      </xsl:apply-templates>
    </xsl:variable>
    <xsl:variable name="Sorted6">
      <xsl:apply-templates select="msxsl:node-set($Sorted5)/PersonCount" mode="Info6">
      </xsl:apply-templates>
    </xsl:variable>

    <xsl:element name="FinalCounts">
      <xsl:for-each select="msxsl:node-set($Sorted6)/PersonCount">
        <xsl:copy>
          <xsl:copy-of select="@*"/>
        </xsl:copy>
      </xsl:for-each>
    </xsl:element>
  </xsl:template>
  <xsl:template match="Person" mode="Count">
    <xsl:element name="PersonCount">
      <xsl:copy-of select="@*"/>
      <xsl:copy-of select="*"/>
      <!-- Add a calculated Count child to each <product>. -->
      <xsl:variable name="ThisKey" select="concat(@LName,'_',@FName,'_',@AKAName)"/>
      <xsl:attribute name="Count">
        <xsl:value-of select="count(key('ValidVotePeople',$ThisKey))"/>
      </xsl:attribute>
      <xsl:variable name="TieCount">
        <xsl:value-of select="//TieBreakCount[concat(@LName,'_',@FName,'_',@AKAName)=$ThisKey][1]/@Count" />
      </xsl:variable>
      <xsl:choose>
        <xsl:when test="$TieCount!=''">
          <xsl:attribute name="TieCount">
            <xsl:value-of select="$TieCount"/>
          </xsl:attribute>
        </xsl:when>
      </xsl:choose>
    </xsl:element>
  </xsl:template>
  <xsl:template match="PersonCount" mode="Sort">
    <xsl:copy-of select="." />
  </xsl:template>
  <xsl:template match="PersonCount" mode="Info2">
    <xsl:param name="NumWanted"/>
    <xsl:param name="NumExtras"/>
    <xsl:variable name="Position" select="position()"></xsl:variable>
    <xsl:variable name="Section">
      <xsl:choose>
        <xsl:when test="$Position &lt;= $NumWanted">Top</xsl:when>
        <xsl:when test="$Position &lt;= ($NumWanted + $NumExtras)">Extra</xsl:when>
        <xsl:otherwise>Other</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:copy-of select="*"/>
      <!-- Add a calculated Count child to each <product>. -->

      <xsl:attribute name="Position">
        <xsl:value-of select="$Position"/>
      </xsl:attribute>
      <xsl:attribute name="Section">
        <xsl:value-of select="$Section"/>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="@Count=preceding-sibling::*[1]/@Count">
          <xsl:attribute name="TiedPrev">1</xsl:attribute>
        </xsl:when>
      </xsl:choose>
      <xsl:choose>
        <xsl:when test="@Count=following-sibling::*[1]/@Count">
          <xsl:attribute name="TiedNext">1</xsl:attribute>
        </xsl:when>
      </xsl:choose>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="PersonCount" mode="Info3">
    <xsl:copy>
      <xsl:copy-of select="@*[not(name()='TiedPrev') and not(name()='TiedNext')]"/>
      <xsl:copy-of select="*"/>
      <!-- Add a calculated Count child to each <product>. -->

      <xsl:if test="@Section='Extra'">
        <xsl:attribute name="ExtraPosition">
          <xsl:value-of select="@Position - number(preceding-sibling::*[@Section='Top'][1]/@Position)"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:choose>
        <xsl:when test="@Section = 'Top' and @Count = following-sibling::*[@Section!='Top'][1]/@Count">
          <xsl:attribute name="TieBreakNeeded">true</xsl:attribute>
        </xsl:when>
        <xsl:when test="@Section = 'Extra' and (@TiedPrev or @TiedNext)">
          <xsl:attribute name="TieBreakNeeded">true</xsl:attribute>
        </xsl:when>
        <xsl:when test="@Section = 'Other' and @Count = preceding-sibling::*[@Section!='Other'][1]/@Count">
          <xsl:attribute name="TieBreakNeeded">true</xsl:attribute>
        </xsl:when>
      </xsl:choose>
      <xsl:variable name="CloseToPrev" select="(preceding-sibling::*[1]/@Count - @Count &lt; 3)"/>
      <xsl:variable name="CloseToNext" select="(@Count - following-sibling::*[1]/@Count &lt; 3)"/>

      <!-- 
    Single
      UP = &#8593; 
      Down = &#8595;
      Both = &#8597;
    Double
      Up = &#8657;
      Down = &#8659;
      Both = &#8661;
      -->
      <xsl:if test="@TiedPrev or @TiedNext">
        <xsl:attribute name="Tie">
          <xsl:choose>
            <xsl:when test="@TiedPrev and @TiedNext">&#8597;</xsl:when>
            <xsl:when test="@TiedPrev">&#8593;</xsl:when>
            <xsl:when test="@TiedNext">&#8595;</xsl:when>
          </xsl:choose>
        </xsl:attribute>
      </xsl:if>
      <xsl:if test="$CloseToPrev or $CloseToNext">
        <xsl:attribute name="Close">
          <xsl:choose>
            <xsl:when test="$CloseToPrev and $CloseToNext">&#8597;</xsl:when>
            <xsl:when test="$CloseToPrev">&#8593;</xsl:when>
            <xsl:when test="$CloseToNext">&#8595;</xsl:when>
          </xsl:choose>
        </xsl:attribute>
      </xsl:if>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="PersonCount" mode="Info4">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:copy-of select="*"/>

      <xsl:if test="@TieBreakNeeded='true'">
        <xsl:attribute name="TieBreakGroup">
          <xsl:value-of select="//PersonCount[@Count = current()/@Count][1]/@Position"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:if test="@Section='Other'">
        <xsl:choose>
          <xsl:when test="count(preceding-sibling::*[@Section!='Other' and @Count = current()/@Count])!=0">
            <xsl:attribute name="ForceShowOther">Report</xsl:attribute>
          </xsl:when>
          <xsl:when test="count(preceding-sibling::*[@Section!='Other' and @Count - current()/@Count &lt; 3])!=0">
            <xsl:attribute name="ForceShowOther">Review</xsl:attribute>
          </xsl:when>
          <xsl:when test="preceding-sibling::*[1][@Section!='Other']">
            <xsl:attribute name="ForceShowOther">Review</xsl:attribute>
          </xsl:when>
        </xsl:choose>
      </xsl:if>

    </xsl:copy>
  </xsl:template>
  <xsl:template match="PersonCount" mode="Info5">
    <xsl:copy>
      <xsl:copy-of select="@*"/>
      <xsl:copy-of select="*"/>

      <xsl:variable name="TieCount" select="@TieCount"></xsl:variable>
      <xsl:variable name="Section" select="@Section"></xsl:variable>
      <xsl:variable name="TieBreakGroup" select="@TieBreakGroup"></xsl:variable>

      <xsl:variable name="Tied" select="../PersonCount[@TieBreakGroup = $TieBreakGroup]"/>

      <xsl:choose>
        <xsl:when test="@TieBreakGroup">
          <xsl:attribute name="TieBreakResolved">
            <xsl:choose>
              <xsl:when test="$Tied[not(@TieCount)]">false</xsl:when>
              <xsl:when test="count($Tied[@TieCount = $TieCount and @Section != $Section]) > 1">false</xsl:when>
              <xsl:when test="count($Tied[@TieCount > 0]) = 0">false</xsl:when>
              <xsl:otherwise>true</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </xsl:when>
      </xsl:choose>
    </xsl:copy>
  </xsl:template>
  <xsl:template match="PersonCount" mode="Info6">
    <xsl:copy>
      <xsl:copy-of select="@*[name()!='TieBreakNeeded' and name()!='TieBreakResolved']"/>
      <xsl:copy-of select="*"/>

      <xsl:variable name="TieBreakGroup" select="@TieBreakGroup"></xsl:variable>
      <xsl:variable name="Tied" select="../PersonCount[@TieBreakGroup = $TieBreakGroup]"/>

      <!--copy false to others in the group-->
      <xsl:choose>
        <xsl:when test="@TieBreakGroup">
          <xsl:attribute name="TieBreakResolved">
            <xsl:choose>
              <xsl:when test="count($Tied[@TieBreakResolved='false'])>0">false</xsl:when>
              <xsl:otherwise>true</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </xsl:when>
      </xsl:choose>
    </xsl:copy>
  </xsl:template>
</xsl:stylesheet>
