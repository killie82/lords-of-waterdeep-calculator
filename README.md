# Lords of Waterdeep scorekeeper

A fan-made, mobile-friendly scorekeeper for **Lords of Waterdeep**, published by Wizards of the Coast, and **Scoundrels of Skullport**.

## During play

Select game cards and faction cards to set up the table. Base is always selected; Undermountain and Skullport toggle independently. Select 2–5 factions for Base, or up to 6 with either expansion. Selected factions determine the player count and scoreboard order. Factions keep their colors: Knights of the Shield (yellow), City Guard (black), Silverstars (blue), Harpers (green), Red Sashes (red), and Gray Hands (gray). No player names, dropdowns, or checkboxes are needed.

Choose a faction using the color-and-icon cards inside Record points. Fill in one or more of the six vertically stacked categories and submit them together. Blank and zero fields are skipped. The score inputs accept whole numbers and request the numeric keypad on phones. Only Other / correction supports losses, using Gain / Loss buttons so a minus key is not needed. Amounts are changes, not replacement totals. Record each affected faction separately.

Each category is saved as a distinct history entry; Undo latest reverses the entire most recent submission. You can also remove an individual history entry. Unsubmitted values are saved separately for each faction and preserved when switching recipients.

The activity log is collapsed by default; expand it to review entries or undo a submission. Round tracking is optional, off by default, and contained in its own collapsed section. Enable it to attach round numbers to new entries. Previous/Next controls let you set the current round from 1 through 8. Turning tracking off stops adding round numbers without changing earlier entries or scores. Sections stay open while you work if you expand them; new games and page reloads begin with them collapsed.

Resources are entered only at the end; Lords stay hidden during play. Score effects manually from the physical cards. The app does not interpret individual cards or automatically trigger Plot Quest bonuses. Do not record the same gems under two sources.

The current game saves in this browser. This is a shared-device scorekeeper, not a synchronized multiplayer service. Clearing browser storage removes the saved game.

## Final scoring

For Skullport games, a modal first asks for the shared skull-track penalty (1–9). Select its magnitude and continue. Final scoring proceeds from the lowest live score to the highest; tied factions follow player-number order. The standings show points earned during play for unscored factions, and final totals for confirmed factions. The reveal order stays fixed as bonuses change the standings.

Each faction has two screens. First enter leftover adventurer cubes, Gold, and (for Skullport) skulls, then press **Reveal Lord**. Under **Lord Quest Types — pick two**, select two of the five colored Quest types: Warfare (reddish orange), Skullduggery (black), Arcana (purple), Piety (white), and Commerce (green). Enter one combined total of completed Quests across the two types, earning 4 VP each. Previously saved separate counts are combined automatically. Tap a selected type to remove it before choosing a replacement; changing the pair clears its count.

Alternatively, choose another bonus pill or expand the list of Lord names. Selecting a name or special bonus clears the Quest type selections; choosing Quest types clears the name or special bonus selection. The input labels show the qualifying condition and VP multiplier. Confirm with **Next player**, or show results after the last faction. The flow and entered values save automatically in the browser.

All 11 base Lords and 6 expansion Lords are supported; expansion choices appear for the enabled modules. Include qualifying Plot Quests; exclude Mandatory Quests from Lord quest bonuses. Buildings must be controlled at the end.

Leftover adventurers earn 1 VP each; every 2 Gold earns 1 VP, rounded down. For Skullport, set the common penalty from the farthest empty space from −1 on the physical corruption track. Enter each player's remaining corruption. The Xanathar earns 4 VP per token AND takes the normal penalty; its bonus input shares the skull count entered on the resource screen. During play, Skullport games have an immediate **−10 VP** button for the selected faction when a skull must be gained from an empty track. Tap once for each skull that cannot be taken; the log records the reason, and Undo reverses the penalty.

Irusyl scores one chosen Quest type; enter only its qualifying count, without choosing the type in the calculator. Halaster and Sangalor each use one combined count of their module's completed quests and controlled buildings, at 4 VP each. Older separate counts are combined automatically. The Xanathar shows the skull count carried over from the Tavern screen without asking for another input; go back to the Tavern to change it. Quest-pair labels name the two selected types.

Trobriand uses printed rewards of 10+ VP, excluding extra triggered bonuses. Final scoring includes only the during-play total, leftover adventurers, leftover Gold, Lord bonus, and corruption penalty. Use Other / correction in the during-play ledger for score corrections. The removed catch-all adjustment is ignored in older saved games.

Results show the breakdown and use remaining Gold to break ties. Final scoring is computed separately from the live ledger, so revisiting it does not duplicate bonuses.

## Local preview

With Node.js installed, run `npm start` and open http://127.0.0.1:4180. Run `npm test` for scoring checks. No dependencies or build step are needed. These static files can be hosted by GitHub Pages from the `main` branch and repository root.

## References

- [Official base rules](https://media.wizards.com/downloads/dnd/DnD_LOW_Rulebook_EN.pdf)
- [Official expansion rules](https://media.wizards.com/downloads/dnd/SOS_Rulebook.pdf)

Unofficial fan project, not affiliated with Wizards of the Coast. Game titles and Lord names belong to their respective owners. Card selection uses text labels rather than copied artwork.

End-game resources are entered for every faction on one page. Reveal order is based on live points plus leftover Adventurers and Gold minus Corruption penalties, before Lord bonuses. Ties follow player number; that order stays fixed during the reveal.

Use “Jump to end game scoring” on the home page to choose expansions and factions in player order, enter current scores (before resources or Lord bonuses), and choose the Skullport track value if applicable. Continue to the shared resource screen and then the ordered Lord reveal.

## GitHub Pages and Node 24

The Pages workflow uses Node 24 and Node 24-compatible GitHub actions. It runs the tests before deploying only the static website files. After pushing the workflow, set Settings → Pages → Build and deployment → Source to GitHub Actions (instead of Deploy from a branch). Then run “Test and deploy Pages” from the Actions tab or push a new commit to main. The built-in branch deployment workflow is managed by GitHub and cannot be upgraded from this repository.
