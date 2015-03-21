<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:msxsl="urn:schemas-microsoft-com:xslt">
  <xsl:output media-type="html"/>
  <xsl:param name="Warning"/>
  <xsl:key name="keyName" match="//Ballot[@BallotStatus='Ok']/Vote[@VoteStatus='Ok']/Person" use="concat(@LName,'_',@FName,'_',@AKAName)"/>
  <xsl:template name="Phrase">
    <xsl:param name="Key"/>
    <xsl:variable name="KEY" select="translate($Key,'abcdefghijklmnopqrstuvwxyz','ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
    <xsl:value-of select="/*/Phrase[@Key=$KEY]/@Value" disable-output-escaping="yes"/>
  </xsl:template>
  <xsl:template match="/Election">
    <html>
      <body>
        <xsl:choose>
          <xsl:when test="$Warning">
            <!--<p class="ReportWarning">
              <xsl:value-of select="$Warning"/>
            </p>-->
          </xsl:when>
          <xsl:otherwise>

            <xsl:if test="Ballot[@BallotStatus='New'] or Ballot[@BallotStatus='ReviewNeeded']">
              <p class="ReportWarning">
                <xsl:call-template name="Phrase">
                  <xsl:with-param name="Key" select="'Incomplete'"/>
                </xsl:call-template>
              </p>
            </xsl:if>
            <table class="Report ReportWide">
              <colgroup>
                <col width="15px"></col>
                <col width="20%"></col>
                <col width="30%"></col>
                <col width="50%"></col>
              </colgroup>
              <tr>
                <td colspan="4" class="ReportTitle2">
                  <br/>
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'ApprovalSection'"/>
                  </xsl:call-template>
                </td>
              </tr>
              <tr>
                <td colspan="4">
                  <table>
                    <tr>
                      <td colspan="4">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'ReviewInfo'"/>
                        </xsl:call-template>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3">
                        <ul id="ReviewSteps">
                          <li>
                            <xsl:call-template name="Phrase">
                              <xsl:with-param name="Key" select="'ReviewTip1'"/>
                            </xsl:call-template>
                          </li>
                          <li>
                            <xsl:call-template name="Phrase">
                              <xsl:with-param name="Key" select="'ReviewTip2'"/>
                            </xsl:call-template>
                          </li>
                          <xsl:choose>
                            <xsl:when test="FinalCounts/PersonCount/@TieBreakGroup">
                              <li>
                                <xsl:if test="FinalCounts/PersonCount[@TieBreakResolved='false']">
                                  <xsl:attribute name="class">Warning</xsl:attribute>
                                </xsl:if>
                                <xsl:call-template name="Phrase">
                                  <xsl:with-param name="Key" select="'ReviewTipTies'"/>
                                </xsl:call-template>
                              </li>
                            </xsl:when>
                            <xsl:when test="FinalCounts/PersonCount/@Tie">
                              <li>
                                <xsl:call-template name="Phrase">
                                  <xsl:with-param name="Key" select="'ReviewTipTiesOkay'"/>
                                </xsl:call-template>
                              </li>
                            </xsl:when>
                          </xsl:choose>
                        </ul>
                      </td>
                    </tr>
                    <tr>
                      <td colspan="3">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'IsApprovedForReporting'"/>
                        </xsl:call-template>
                        &#160;
                        <input type="checkbox" disabled="disabled" id="cbApproved">
                          <xsl:if test="Info/@ApprovedForReporting='true'">
                            <xsl:attribute name="checked">checked</xsl:attribute>
                          </xsl:if>
                        </input>
                        &#160;
                        <button type="button" id="btnApproved"/>

                      </td>
                      <td>
                        <xsl:choose>
                          <xsl:when test="count(TieBreakCount) != count(FinalCounts/PersonCount[@TieBreakGroup])">
                            Unexpected tie-break counts found. &#160;
                            <button type="button" id="btnClearTieBreakCounts">Reset Counts</button>
                          </xsl:when>
                        </xsl:choose>
                      </td>
                    </tr>

                  </table>

                </td>
              </tr>


              <xsl:choose>
                <xsl:when test="FinalCounts/PersonCount/@TieBreakGroup">
                  <tr>
                    <td colspan="4" class="ReportTitle2">
                      <br/>
                      <xsl:call-template name="Phrase">
                        <xsl:with-param name="Key" select="'TieBreakNeeded'"/>
                      </xsl:call-template>
                    </td>
                  </tr>
                  <tr>
                    <td colspan="4">
                      <xsl:call-template name="Report3">
                      </xsl:call-template>
                    </td>
                  </tr>
                </xsl:when>
              </xsl:choose>

              <tr>
                <td colspan="4" class="ReportTitle2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'BallotIssues'"/>
                  </xsl:call-template>
                </td>
              </tr>
              <xsl:variable name="E" select="count(Ballot[@BallotStatus!='Ok'])"/>
              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'SpoiledBallots'"/>
                  </xsl:call-template>
                  <xsl:text>: </xsl:text>
                  <b>
                    <xsl:value-of select="$E"/>
                  </b>
                </td>
                <td colspan="2">
                  <xsl:for-each select="Ballot[@BallotStatus!='Ok']">
                    <xsl:sort select="substring-before(@Id,'.')"/>
                    <xsl:sort select="substring-after(@Id,'.')" data-type="number"/>

                    <xsl:choose>
                      <xsl:when test="@BallotStatus='ReviewNeeded' or @BallotStatus='New'">
                        <a href="ballots.htm?ballot={@Id}">
                          <xsl:value-of select="@Id"/>
                        </a>
                        <xsl:text> (</xsl:text>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="concat('Override', @BallotStatus)"/>
                        </xsl:call-template>
                        <xsl:text>)</xsl:text>
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:value-of select="@Id"/>
                      </xsl:otherwise>
                    </xsl:choose>
                    <xsl:choose>
                      <xsl:when test="position()=last()"></xsl:when>
                      <xsl:otherwise>
                        <xsl:text>, &#160; </xsl:text>
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:for-each>
                </td>
              </tr>
              <xsl:variable name="G" select="count(Ballot[@BallotStatus='Ok']/Vote[@VoteStatus!='Ok'])"/>
              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'SpoiledVotes'"/>
                  </xsl:call-template>
                  <xsl:text>: </xsl:text>
                  <b>
                    <xsl:value-of select="$G"/>
                  </b>
                  <xsl:if test="$G != 0">
                    <xsl:text> &#160; </xsl:text>
                    <xsl:call-template name="Phrase">
                      <xsl:with-param name="Key" select="'OnBallots'"/>
                    </xsl:call-template>
                  </xsl:if>
                </td>
                <td colspan="2">
                  <xsl:for-each select="Ballot[@BallotStatus='Ok' and Vote/@VoteStatus!='Ok']">
                    <xsl:sort select="substring-before(@Id,'.')"/>
                    <xsl:sort select="substring-after(@Id,'.')" data-type="number"/>
                    <xsl:value-of select="@Id"/>
                    <xsl:variable name="Votes">
                      <xsl:value-of select="count(Vote[@VoteStatus!='Ok'])"/>
                    </xsl:variable>
                    <xsl:if test="$Votes!=1">
                      <xsl:value-of select="concat(' (x', $Votes, ')')"/>
                    </xsl:if>
                    <xsl:choose>
                      <xsl:when test="position()=last()"></xsl:when>
                      <xsl:otherwise>
                        <xsl:text>, &#160; </xsl:text>
                      </xsl:otherwise>
                    </xsl:choose>
                  </xsl:for-each>
                </td>
              </tr>
              <tr>
                <td colspan="4" class="ReportTitle2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'MethodTitle'"/>
                  </xsl:call-template>
                </td>
              </tr>
              <xsl:variable name="D" select="count(Ballot)"/>
              <xsl:variable name="DAuto" select="number(AutoCounts/@VotedInPerson) + number(AutoCounts/@DroppedOffBallots) + number(AutoCounts/@MailedInBallots)"/>
              <tr>
                <td colspan="4">
                  <table width="90%">
                    <xsl:variable name="AutoClass" select="concat('UseAuto', Info/@UseManualCounts='false')"/>
                    <xsl:variable name="ManualClass" select="concat('UseManual', Info/@UseManualCounts='true')"/>

                    <tr class="ReportComment">
                      <td width="35%">
                      </td>
                      <td class="{$AutoClass}" align="right" width="20%">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'CommunityFile'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$ManualClass}" align="right" width="20%">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'Manual'"/>
                        </xsl:call-template>
                      </td>
                      <td></td>
                    </tr>

                    <tr>
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'AdultsInCommunity'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$AutoClass}" align="right">
                        <b>
                          <xsl:value-of select="number(AutoCounts/@AdultsInCommunity)"/>
                        </b>
                      </td>
                      <td class="{$ManualClass}"  align="right">
                        <input class="ManualCount" id="txtManualAdults" value="{number(ManualResults/@AdultsInCommunity)}" />
                      </td>
                      <td rowspan="2">
                      </td>
                    </tr>

                    <tr class="ReportComment" style="padding-top: 10px;">
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'BallotsReceived'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$AutoClass}" align="right" >
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'RegistrationPage'"/>
                        </xsl:call-template>
                      </td>
                      <td  class="{$ManualClass}" align="right">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'Manual'"/>
                        </xsl:call-template>
                      </td>
                      <td ></td>
                    </tr>

                    <tr>
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'VotedMailed'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$AutoClass}" align="right">
                        <b>
                          <xsl:value-of select="number(AutoCounts/@MailedInBallots)"/>
                        </b>
                      </td>
                      <td class="{$ManualClass}"  align="right">
                        <input class="ManualCount" id="txtManualMailedIn" value="{number(ManualResults/@MailedInBallots)}" />
                      </td>
                      <td rowspan="2">
                      </td>
                    </tr>

                    <tr>
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'VotedDroppedOff'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$AutoClass}" align="right">
                        <b>
                          <xsl:value-of select="number(AutoCounts/@DroppedOffBallots)"/>
                        </b>
                      </td>
                      <td class="{$ManualClass}"  align="right">
                        <input class="ManualCount" id="txtManualDroppedOff" value="{number(ManualResults/@DroppedOffBallots)}" />
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'VotedVotedInPerson'"/>
                        </xsl:call-template>
                      </td>
                      <td class="{$AutoClass}" align="right">
                        <b>
                          <xsl:value-of select="number(AutoCounts/@VotedInPerson)"/>
                        </b>
                      </td>
                      <td  class="{$ManualClass}" align="right">
                        <span class="Green">
                          <span id="ManualInPerson"/>
                          <xsl:text>*</xsl:text>
                        </span>
                      </td>
                      <td>
                        <span class="Warning Hidden ReportComment" id="ManualError">
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'ManualError'"/>
                          </xsl:call-template>
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'BallotsCounted'"/>
                        </xsl:call-template>
                        <xsl:text> (</xsl:text>
                        <b id="NumBallots">
                          <xsl:value-of select="$D"/>
                        </b>
                        <xsl:text> </xsl:text>
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'BallotsCountedEntered'"/>
                        </xsl:call-template>
                        <xsl:text>)</xsl:text>
                      </td>
                      <td class="{$AutoClass}" align="right">
                        <xsl:choose>
                          <xsl:when test="$D = $DAuto">
                            <span class="ReportComment Green">
                              <xsl:call-template name="Phrase">
                                <xsl:with-param name="Key" select="'TotalMatchesAuto'"/>
                              </xsl:call-template>
                            </span>
                            &#160;
                            <span class="Overline2">
                              <span class="Green">
                                &#160;
                                <xsl:value-of select="$DAuto"/>
                              </span>
                            </span>
                          </xsl:when>
                          <xsl:otherwise>
                            <span class="Warning ReportComment" id="AutoCountsWrong">
                              <xsl:call-template name="Phrase">
                                <xsl:with-param name="Key" select="'TotalWrongAuto'"/>
                              </xsl:call-template>
                            </span>
                            &#160;
                            <span class="Overline2">
                              <span class="Warning">
                                &#160;
                                <xsl:value-of select="$DAuto"/>
                              </span>
                            </span>
                          </xsl:otherwise>
                        </xsl:choose>
                      </td>
                      <td align="right" class="Green {$ManualClass}" >
                        <span class="Overline2">
                          &#160;
                          <xsl:value-of select="$D"/>
                          <xsl:text>*</xsl:text>
                        </span>
                      </td>
                      <td class="VAlignBottom">
                        <span class="Green ReportComment">
                          <xsl:text> &#160; *</xsl:text>
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'TotalMatchesManual'"/>
                          </xsl:call-template>
                        </span>
                      </td>

                    </tr>

                    <tr>
                      <td align="right">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'ChooseSource'"/>
                        </xsl:call-template>
                      </td>
                      <td align="right">
                        <label for="src1">
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'btnUseAuto'"/>
                          </xsl:call-template>
                        </label>
                        <input id="src1" type="radio" name="BallotCountSource" value="auto">
                          <xsl:choose>
                            <xsl:when test="Info/@UseManualCounts='false'">
                              <xsl:attribute name="checked">checked</xsl:attribute>
                            </xsl:when>
                          </xsl:choose>
                        </input>
                      </td>
                      <td  align="right">
                        <label for="src2">
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'btnUseManual'"/>
                          </xsl:call-template>
                        </label>
                        <input id="src2" type="radio" name="BallotCountSource" value="manual">
                          <xsl:choose>
                            <xsl:when test="Info/@UseManualCounts='true'">
                              <xsl:attribute name="checked">checked</xsl:attribute>
                            </xsl:when>
                          </xsl:choose>
                        </input>
                      </td>
                      <td>
                        <button type="button" id="btnSaveBallotSources">
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'Save'"/>
                          </xsl:call-template>
                        </button>
                      </td>
                    </tr>


                  </table>
                </td>
              </tr>
              <tr>
                <td colspan="4" class="ReportTitle2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'OtherInfo'"/>
                  </xsl:call-template>
                </td>
              </tr>

              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'NameToShow'"/>
                  </xsl:call-template>
                </td>
                <td colspan="2">
                  <xsl:value-of select="@Name"/>
                </td>
              </tr>
              <tr>
                <td colspan="2" width="30%">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'DateOfElection'"/>
                  </xsl:call-template>
                </td>
                <td colspan="2" width="70%">
                  <xsl:value-of select="Info/@DateOfElection"/>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'Location'"/>
                  </xsl:call-template>
                </td>
                <td colspan="2">
                  <xsl:value-of select="Info/@Location"/>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'ChiefTeller'"/>
                  </xsl:call-template>
                </td>
                <td colspan="2">
                  <xsl:value-of select="Info/@ChiefTeller"/>
                </td>
              </tr>
              <tr>
                <td colspan="2">
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'OtherTellers'"/>
                  </xsl:call-template>
                </td>
                <td colspan="2">
                  <xsl:value-of select="Info/@OtherTellers"/>
                </td>
              </tr>

              <!--BOTTOM
BOTTOM
BOTTOM -->

              <tr>
                <td colspan="4" class="ReportTitle2">
                  <br/>
                  <xsl:call-template name="Phrase">
                    <xsl:with-param name="Key" select="'ReviewVotes'"/>
                  </xsl:call-template>
                </td>
              </tr>
              <tr>
                <td colspan="4">
                  <table class="Report" cellspacing="5">
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
                      <td colspan="4">
                        <xsl:call-template name="Phrase">
                          <xsl:with-param name="Key" select="'NOTES'"/>
                        </xsl:call-template>
                        <xsl:text> &#160; </xsl:text>
                        <span class="ReportTitleComment">
                          <xsl:call-template name="Phrase">
                            <xsl:with-param name="Key" select="'NOTESCOMMENT'"/>
                          </xsl:call-template>
                        </span>
                      </td>
                    </tr>
                    <xsl:call-template name="Report2">
                      <xsl:with-param name="NumWanted" select="Info/@NumberToElect"/>
                      <xsl:with-param name="NumExtras" select="Info/@NumberOfAlternatesToReport"/>
                    </xsl:call-template>
                  </table>
                  <button type="button" id="btnToggleAfter">
                    <xsl:attribute name="accesskey">
                      <xsl:call-template name="Phrase">
                        <xsl:with-param name="Key" select="'BtnToggleAfterAccessKey'"/>
                      </xsl:call-template>
                    </xsl:attribute>
                    <xsl:call-template name="Phrase">
                      <xsl:with-param name="Key" select="'BtnToggleAfter'"/>
                    </xsl:call-template>
                  </button>
                </td>
              </tr>
            </table>
            <div style="margin: 10px 0">
              <!--spacer-->
            </div>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>
  <xsl:template name="Report2">
    <xsl:param name="NumExtras"/>
    <xsl:param name="NumWanted"/>
    <xsl:variable name="max">
      <xsl:for-each select="FinalCounts/PersonCount">
        <xsl:sort data-type="number" select="@Count" order="descending"/>
        <xsl:if test="position()=1">
          <xsl:value-of select="@Count"/>
        </xsl:if>
      </xsl:for-each>
    </xsl:variable>
    <xsl:for-each select="FinalCounts/PersonCount">
      <tr>
        <xsl:attribute name="class">
          <xsl:choose>
            <xsl:when test="@TieBreakResolved='true'">TiedOkay</xsl:when>
            <xsl:when test="@TieBreakGroup">Tied</xsl:when>
            <xsl:when test="@Section='Other' and @ForceShowOther='Review'">
              <xsl:text>After</xsl:text>
            </xsl:when>
            <xsl:when test="@Section='Other'">
              <xsl:text>HideAfter</xsl:text>
            </xsl:when>
            <xsl:when test="@Section='Extra'">
              <xsl:text>ReportNoteAlternates</xsl:text>
            </xsl:when>
          </xsl:choose>
        </xsl:attribute>
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
        <td>
          <xsl:value-of select="@Count"/>
        </td>
        <td>
          <span>
            <xsl:attribute name="class">
              <xsl:text>Bold </xsl:text>
              <xsl:choose>
                <xsl:when test="@TieBreakResolved='true'">TieOkay</xsl:when>
                <xsl:when test="@TieBreakGroup">Tie</xsl:when>
                <xsl:when test="@Tie and position()>(number($NumWanted) + number($NumExtras))">
                  <xsl:text>TieOkay</xsl:text>
                </xsl:when>
                <xsl:when test="@Tie">
                  TieOkay<!-- is tied, but no tie-break needed -->
                </xsl:when>
                <xsl:otherwise>Before</xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <xsl:value-of select="@Tie"/>
          </span>
        </td>
        <td>
          <span>
            <xsl:attribute name="class">
              <xsl:choose>
                <xsl:when test="@Close">Close</xsl:when>
              </xsl:choose>
            </xsl:attribute>
            <xsl:value-of select="@Close"/>
          </span>
        </td>
        <td>
          <xsl:choose>
            <xsl:when test="@TieBreakResolved='true'">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakResolved'"/>
              </xsl:call-template>
              <xsl:text>: </xsl:text>
              <xsl:value-of select="@TieCount"/>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakResolvedVotes'"/>
              </xsl:call-template>
            </xsl:when>
            <xsl:when test="@TieBreakGroup">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakNeeded'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakResolvedAt'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:value-of select="@Count"/>
            </xsl:when>
          </xsl:choose>
        </td>
        <td>
          <div size="{@Count}" max="{$max}">
            <xsl:attribute name="class">
              <xsl:text>Chart </xsl:text>
              <xsl:choose>
                <xsl:when test="@TieBreakResolved='true'">TieOkay</xsl:when>
                <xsl:when test="@TieBreakGroup">Tie</xsl:when>
                <xsl:when test="position()>(number($NumWanted) + number($NumExtras))">
                  <xsl:text>After</xsl:text>
                </xsl:when>
                <xsl:when test="@Tie">
                  TieOkay<!-- is tied, but no tie-break needed -->
                </xsl:when>
                <xsl:when test="@Close">Close</xsl:when>
                <xsl:otherwise></xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
          </div>
        </td>
      </tr>
      <!--Draw a line after the required number-->
      <xsl:choose>
        <xsl:when test="position()=number($NumWanted)">
          <tr>
            <td colspan="6">
              <hr/>
            </td>
          </tr>
        </xsl:when>
        <xsl:when test="position()=(number($NumWanted) + number($NumExtras))">
          <tr>
            <td colspan="6">
              <hr/>
            </td>
          </tr>
        </xsl:when>
      </xsl:choose>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="Report3">
    <xsl:for-each select="FinalCounts/PersonCount[@TieBreakGroup]">
      <xsl:variable name="CountAtTie" select="@Count"/>
      <xsl:variable name="TieSection" select="@Section"/>
      <xsl:choose>
        <xsl:when test="position()=1 or @TieBreakGroup!=preceding-sibling::*[1]/@TieBreakGroup">
          <xsl:variable name="VoteFor" select="count(../PersonCount[@Count = $CountAtTie and @Section = $TieSection])"/>
          <xsl:if test="@TieBreakGroup!=preceding-sibling::*[1]/@TieBreakGroup">
            <xsl:text disable-output-escaping="yes">&lt;/table></xsl:text>
            <br/>
          </xsl:if>
          <xsl:text disable-output-escaping="yes">&lt;table class="TieBreakList"></xsl:text>
          <tr>
            <xsl:attribute name="class">
              <xsl:choose>
                <xsl:when test="@TieBreakResolved='true'">TiedOkay</xsl:when>
                <xsl:otherwise>Tied</xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <td colspan="3">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote1'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:value-of select="@Count"/>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote2'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <span class="VoteFor">
                <xsl:value-of select="$VoteFor"/>
              </span>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote3'"/>
              </xsl:call-template>
            </td>
          </tr>
          <tr>
            <td></td>
            <td colspan="2" class="TiedTitle ReportComment">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakNote'"/>
              </xsl:call-template>
            </td>
          </tr>
        </xsl:when>
        <!--<xsl:when test="@TieBreakGroup!=preceding-sibling::*[1]/@TieBreakGroup">
          <xsl:variable name="VoteFor" select="count(../PersonCount[@Count = $CountAtTie and @Section = $TieSection])"/>
          <xsl:text disable-output-escaping="yes">&lt;/table></xsl:text>
          <xsl:text disable-output-escaping="yes">&lt;table class="TieBreakList"></xsl:text>
          <tr class="Tied">
            <td colspan="3">
              <br/>

              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote1'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <xsl:value-of select="@Count"/>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote2'"/>
              </xsl:call-template>
              <xsl:text> </xsl:text>
              <span class="VoteFor">
                <xsl:value-of select="$VoteFor"/>
              </span>
              <xsl:text> </xsl:text>
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieVote3'"/>
              </xsl:call-template>
            </td>
          </tr>
          <tr>
            <td></td>
            <td colspan="2" class="TiedTitle ReportComment">
              <xsl:call-template name="Phrase">
                <xsl:with-param name="Key" select="'TieBreakNote'"/>
              </xsl:call-template>
            </td>
          </tr>
        </xsl:when>-->
      </xsl:choose>
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
        <td colspan="2">
          <input type="text" class="TieBreakCount" fname="{@FName}" lname="{@LName}" akaname="{@AKAName}" bahaiid="{@BahaiId}">
            <xsl:attribute name="value">
              <xsl:value-of select="//TieBreakCount[@FName=current()/@FName and @LName=current()/@LName and (@AKAName=current()/@AKAName or not(@AKAName))][1]/@Count" />
            </xsl:attribute>
          </input>
        </td>
      </tr>
    </xsl:for-each>
    <xsl:text disable-output-escaping="yes">&lt;/table></xsl:text>
    <div class="Warning" id="InvalidTieCounts">
      <xsl:call-template name="Phrase">
        <xsl:with-param name="Key" select="'InvalidTieCounts'"/>
      </xsl:call-template>
    </div>
    <button type="button" id="btnSaveTieBreakCounts">
      <xsl:call-template name="Phrase">
        <xsl:with-param name="Key" select="'Save'"/>
      </xsl:call-template>
    </button>
  </xsl:template>

</xsl:stylesheet>
