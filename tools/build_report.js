const fs = require('fs'), vm = require('vm');
const D = require('/home/claude/.npm-global/lib/node_modules/docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, ImageRun, Table, TableRow, TableCell,
        WidthType, ShadingType, AlignmentType, BorderStyle, LevelFormat } = D;

const IMG = '/home/claude/report_imgs/';
const results = JSON.parse(fs.readFileSync('/home/claude/aitu-party/screens/results.json', 'utf8'));
const CASES = vm.runInNewContext(fs.readFileSync('/home/claude/aitu-party/task1/cases.js', 'utf8') + ';CASES');
const PARTY = vm.runInNewContext(fs.readFileSync('/home/claude/aitu-party/task1/data.js', 'utf8') + ';PARTY');

const FULLW = 9026;
const p = (text, o = {}) => new Paragraph({ spacing: { after: 120 }, ...o.para, children: [new TextRun({ text, ...o.run })] });
const h1 = t => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const h2 = t => new Paragraph({ heading: HeadingLevel.HEADING_2, keepNext: true, children: [new TextRun(t)] });
const h3 = t => new Paragraph({ heading: HeadingLevel.HEADING_3, keepNext: true, children: [new TextRun(t)] });
const bullet = t => new Paragraph({ numbering: { reference: 'b', level: 0 }, spacing: { after: 60 }, children: [new TextRun(t)] });

function code(src, keep) {                 // one paragraph per line, grey background
  const lines = src.replace(/\t/g, '  ').split('\n');
  return lines.map((ln, i) => new Paragraph({
    keepLines: true, keepNext: keep || i < lines.length - 1,
    spacing: { after: 0, line: 240 },
    shading: { type: ShadingType.CLEAR, fill: 'F1F1F5' },
    indent: { left: 120, right: 120 },
    children: [new TextRun({ text: ln === '' ? ' ' : ln, font: 'Courier New', size: 17 })]
  })).concat([new Paragraph({ keepNext: !!keep, spacing: { after: 100 }, children: [] })]);
}
function img(file, w = 590) {
  const dim = require('child_process').execSync(`python3 -c "from PIL import Image;im=Image.open('${IMG + file}');print(im.width,im.height)"`).toString().trim().split(' ').map(Number);
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [
    new ImageRun({ type: 'png', data: fs.readFileSync(IMG + file), transformation: { width: w, height: Math.round(w * dim[1] / dim[0]) },
      altText: { title: file, description: file, name: file } })] });
}
const caption = t => p(t, { run: { italics: true, size: 18, color: '555555' }, para: { alignment: AlignmentType.CENTER } });

const border = { style: BorderStyle.SINGLE, size: 4, color: 'BBBBBB' };
const borders = { top: border, bottom: border, left: border, right: border };
function table(widths, rows, headFill = 'E8EEF7') {
  return new Table({ width: { size: widths.reduce((a, b) => a + b, 0), type: WidthType.DXA }, columnWidths: widths,
    rows: rows.map((r, ri) => new TableRow({ tableHeader: ri === 0, cantSplit: true, children: r.map((c, ci) => new TableCell({
      borders, width: { size: widths[ci], type: WidthType.DXA },
      shading: ri === 0 ? { type: ShadingType.CLEAR, fill: headFill } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: c, bold: ri === 0, size: 19 })] })] })) })) });
}

// ---- explanations for the 20 cases (short, plain words) ----
const WHY = {
  1: 'The room has the id #room-hall, so I take the guests inside it with a descendant selector.',
  2: 'Two attribute selectors separated by a comma work like "or": yellow OR purple.',
  3: 'The .floor-2 section contains the upstairs rooms; I keep only the cards with data-aitu="yes".',
  4: 'The selector [data-things~="glasses"] matches one word in the space-separated list of things. A comma means "or".',
  5: 'The things list of a guest with nothing is an empty string, so [data-things=""] finds them.',
  6: 'A phone in the list, and :not() removes everybody who has a bag.',
  7: 'filter() with a function: arrival time in minutes between 1230 (20:30) and 1260 (21:00), both included.',
  8: 'First the attribute selector takes non-AITU guests, then filter() keeps only minutes greater than 1260 (after 21:00; 21:00 itself is not after).',
  9: 'prev() gives the neighbour on the left, next() the neighbour on the right; add() joins them in one set.',
  10: ':last-child is the last card in its .guests container, so it works in every room at once.',
  11: ':nth-child(3) counts from 1, so it is the third card in each room.',
  12: 'nextAll() returns all the siblings after Timur, so only guests of his own room can be found.',
  13: 'prev() of every guest in black gives the card standing right before him (a black guest who stands first has no one before).',
  14: 'closest(".room") goes up the tree from Aruzhan to the room that contains her.',
  15: 'A room that does NOT contain a 6th card has fewer than 6 guests: :not(:has(.guest:nth-child(6))).',
  16: ':has() keeps rooms that have a cup, .not(":has(...)") throws out rooms where somebody has glasses. Only the balcony remains (the hall, the kitchen and the living room all have glasses).',
  17: 'For each guest I look at his siblings and check that none of them came earlier; if nobody did, he is the first in his room.',
  18: 'A new card is created with the same function as the other cards, hidden, inserted after Askar with insertAfter() (so it stands between Askar and Inkar) and shown with fadeIn().',
  19: 'delay() lets the highlight and the jump finish, then fadeOut() hides the card and the callback removes it from the page with remove().',
  20: 'Downstairs, has crumbs, no cup (selector); came after 21:00 and before 21:30 (filter); and at least one neighbour (prev + next) is an AITU student (filter). Timur is excluded because both neighbours are not AITU students.'
};

const body = [];
// ------------------------------------------------------------------ title
body.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Assignment #6. jQuery (Selectors, Effects, Animations)', bold: true, size: 36 })] }));
body.push(p('Name: [Your Name]        Group: [Your Group]', { run: { size: 24 } }));
body.push(p('GitHub repository: https://github.com/[your-username]/[repository-name]', { run: { size: 24 } }));
body.push(p('Folders: task1/ (Selector Detective), task2/ (The party in motion). Both pages use only jQuery: no other libraries, no onclick attributes, no CSS transitions or animations.'));

// ------------------------------------------------------------------ task 1
body.push(h1('Task 1. Selector Detective'));
body.push(h2('1.1 The party as an array'));
body.push(p('The whole party from the picture is one array, PARTY (file data.js). Every room has an id, a name, a floor and a list of guests from left to right. Every guest is an object with name, color (color of the clothes), time (arrival), aitu (true/false) and things (list of phone, glasses, bag, cup, crumbs).'));
body.push(...code(
`{ id: 'living', name: 'Living room', floor: 1, guests: [
  { name: 'Daniel',  color: 'blue',   time: '19:55', aitu: true,  things: ['glasses'] },
  { name: 'Zarina',  color: 'green',  time: '21:10', aitu: false, things: ['bag','phone','crumbs'] },
  ...
]}`));
body.push(table([1700, 900, 6426], [['Room', 'Floor', 'Guests from left to right (name, time)'],
  ...PARTY.map(r => [r.name, String(r.floor), r.guests.map(g => `${g.name} ${g.time}`).join(', ')])]));
body.push(p(''));
body.push(h2('1.2 Building the page'));
body.push(p('buildParty() goes through the array with $.each() and creates two floors, and rooms inside the floors. For every guest buildCard() makes a card: an avatar (Open Peeps from DiceBear), a ring in the color of the clothes, the name, the time, the icons of the things and a small badge for AITU students.'));
body.push(p('The data of a guest is stored on the card itself, as classes and as data-* attributes. The cases read only these attributes, never the array:'));
body.push(...code(
`<div class="guest card color-green not-aitu has-bag has-phone has-crumbs"
     data-name="Zarina" data-color="green" data-time="21:10" data-minutes="1270"
     data-aitu="no" data-things="bag phone crumbs" data-room="living" data-floor="1"
     data-pos="1"> ... </div>`));
body.push(p('data-minutes is the arrival time in minutes (21:10 = 21 * 60 + 10), so the times can be compared with ordinary numbers. data-pos is the place of the guest in the picture order; it is used in Task 2.'));
body.push(h2('1.3 What a click on a case does'));
body.push(bullet('buildParty() builds the page again, so every case starts from a clean page.'));
body.push(bullet('The jQuery chain of the case searches the page and returns the found cards (or rooms).'));
body.push(bullet('The found elements get the class .found (pink frame, yellow background) and jump once with animate(): top goes to -16px and back to 0.'));
body.push(bullet('The number and the names of the found guests are shown in the result panel, together with the jQuery chain.'));
body.push(...code(
`function runCase(c) {
  buildParty();                 // fresh page
  var $found = c.run();         // the jQuery chain
  $found.addClass('found');     // highlight
  jump($found);                 // animate() up and down
  showResult(c, $found);        // number and names
}`));
body.push(img('t1_case_01.png', 590));
body.push(caption('Figure 1. The page after case 1 (the buttons of the cases are at the top of the page).'));

body.push(h2('1.4 The 20 cases'));
CASES.forEach(c => {
  const src = c.run.toString().replace(/^function\s*\(\)\s*\{\s*/, '').replace(/\s*\}\s*$/, '');
  const lines = src.split('\n'); const ind = Math.min(...lines.slice(1).filter(l => l.trim()).map(l => l.match(/^ */)[0].length), 99);
  const clean = lines.map((l, i) => i === 0 ? l.trim() : l.slice(Math.min(ind, 99) === 99 ? 0 : ind - 2)).join('\n');
  body.push(h3(`Case ${c.n}. ${c.short}`));
  body.push(p(WHY[c.n], { para: { keepNext: true } }));
  body.push(...code(clean, true));
  body.push(p('Result: ' + results[c.n].split(' | ')[1].replace('Found: ', ''), { run: { bold: true } , para: { keepNext: true } }));
  body.push(img(`t1_case_${String(c.n).padStart(2, '0')}.png`, 470));
});
body.push(p('The thief is Zarina: she was downstairs, came at 21:10 (after 21:00, before 21:30), has cake crumbs and no cup, and stands between Daniel and Natasha, who are both AITU students.', { run: { bold: true } }));

// ------------------------------------------------------------------ task 2
body.push(h1('Task 2. The party in motion'));
body.push(p('Task 2 is a copy of the Task 1 files (folder task2/). The cases, the data and the page building are the same; app.js got new parts. Every effect uses its own place for animations so that effects do not break each other: the default "fx" queue for fades, jumps and the guest card; a separate queue "slide" for the cards that slide when a room is sorted; and a separate object for the flight of a moving guest. Everything is stopped with stop(queue, true), so nothing waits in a queue.'));

body.push(h2('2.1 Spotlight'));
body.push(p('After a case finds its guests, spotlight() fades all other guests to 20% in 0.3 s with fadeTo(300, 0.2); the found ones stay at 1. If the case finds rooms (cases 14, 15, 16), the guests of the found rooms stay bright and all other guests become pale. The Clear button stops the fades and fades everybody back to 1.'));
body.push(...code(
`function spotlight($found) {
  var $bright = $found.is('.room') ? $found.find('.guest') : $found;
  $('.guest').not($bright).fadeTo(300, 0.2);
  $bright.fadeTo(300, 1);
}`));
body.push(img('t2_spotlight_case3.png', 520)); body.push(caption('Figure: case 3, only the AITU students upstairs stay bright.'));
body.push(img('t2_spotlight_rooms_case14.png', 520)); body.push(caption('Figure: case 14 finds a room, so the guests of the other rooms are pale.'));
body.push(img('t2_clear.png', 520)); body.push(caption('Figure: after Clear everybody is bright again.'));

body.push(h2('2.2 Guest card'));
body.push(p('A click on a guest builds a card with words ("Came at 19:45", "AITU student", "Has a phone and a bag", "Came with nothing"...). The card is placed on top of the guest\'s avatar with the same size and position (offset()), and then animate() grows it to the full size while the text fades in. Esc or a click outside shrinks it back into the photo and removes it.'));
body.push(p('Only one card can be open. I keep the wish of the user in one variable (profile.wanted) and one small function profileSync() makes the real card match the wish: if another card is wanted, the open card is closed first and the new one opens when the closing is finished. Because of this, very fast clicks on different guests always end with exactly one card, the last one that was clicked.'));
body.push(...code(
`function profileSync() {
  if (profile.state === 'closing') return;          // finish() calls us again
  if (profile.state === 'open' && profile.name !== profile.wanted) { profileClose(); return; }
  if (profile.state === 'closed' && profile.wanted) profileOpen(profile.wanted);
}`));
body.push(img('t2_card_growing.png', 480)); body.push(caption('Figure: the card is growing out of the avatar.'));
body.push(img('t2_card_open.png', 480)); body.push(caption('Figure: the open card with all the information and the "Move to ..." buttons.'));
body.push(img('t2_card_shrinking.png', 480)); body.push(caption('Figure: after Esc the card shrinks back into the photo.'));

body.push(h2('2.3 Move'));
body.push(p('The card has a button for every other room. A click does these things:'));
body.push(bullet('The array is changed at once (takeFromArray + push), so the cases of Task 1 find the guest in the new room.'));
body.push(bullet('clone() makes a flying copy of the card; the old card becomes an invisible "leaving" place and its width is animated to 0 in 0.7 s (the empty place closes slowly).'));
body.push(bullet('In the new room an empty "gap" is added at the end and its width is animated from 0 to the width of a card (a place opens slowly).'));
body.push(bullet('The flying copy goes from the old position to the gap in 1 second. In every step of the animation I read offset() of the gap, so the card lands exactly in the place even if the page moves around.'));
body.push(bullet('At the end the gap is replaced by a real card of the guest and the flying copy is removed.'));
body.push(img('t2_move_flying.png', 520)); body.push(caption('Figure: Arman flies from the hall to the balcony; the hall closes the gap.'));
body.push(img('t2_move_done.png', 520)); body.push(caption('Figure: Arman is at the end of the balcony.'));
body.push(img('t2_move_case1.png', 520)); body.push(caption('Figure: case 1 now finds 5 guests in the hall, Arman is not there any more.'));

body.push(h2('2.4 Sort by time'));
body.push(p('Every room has a "Sort by time" button; the first click sorts, the second one returns to the picture order (data-pos). To make the cards slide I use the FLIP idea: (1) remember the position of every card with offset(); (2) put the cards in the new order in the DOM; (3) with css left/top put every card back to its old position; (4) animate left and top to 0 in 0.7 s. The animation uses its own queue "slide". If the button is clicked again while the cards are moving, stop(\'slide\', true) stops them where they are and the new slide starts from that point, so nothing jumps.'));
body.push(...code(
`stopSlide($cards);                                // stop the old slide
// 1) remember where the cards are   2) new order   3) back to old spot
$cards.animate({ left: 0, top: 0 }, { duration: 700, queue: 'slide' }).dequeue('slide');`));
body.push(img('t2_sort_sliding.png', 520)); body.push(caption('Figure: the living room cards are sliding.'));
body.push(img('t2_sort_sorted.png', 520)); body.push(caption('Figure: sorted: 19:55, 20:20, 20:30, 21:00, 21:10.'));
body.push(img('t2_sort_back.png', 520)); body.push(caption('Figure: second click, the picture order again.'));

body.push(h2('2.5 Fast clicks'));
body.push(bullet('Before a new case starts, running jumps are finished (stop(true, true)) and fades are stopped (stop(true)); a new fade starts from the current opacity, so there is no flash.'));
body.push(bullet('Sorting stops the old slide first, so five clicks in a row end in the sorted order with all left/top equal to 0.'));
body.push(bullet('The guest card follows the single variable profile.wanted, so there is never more than one card.'));
body.push(bullet('A move saves everything in the array at the start, and each flight is a separate object that is stopped if the page is rebuilt (cancelEverything()).'));
body.push(bullet('I tested the page with an automated browser: 25 mixed fast clicks on guests, cases, sort buttons and Esc left no gaps, no flying copies, no cards and no running animations afterwards (:animated was empty).'));
body.push(img('t2_sort_fast.png', 520)); body.push(caption('Figure: kitchen after 5 very fast clicks on "Sort by time": sorted order, no jumps.'));

body.push(h2('2.6 Checks from the assignment'));
body.push(table([2600, 3600, 2826], [
  ['Check', 'Expected result', 'My result'],
  ['Case 3, then Clear', 'Only the AITU students on the 2nd floor stay bright; Clear brings everybody back', 'Passed (5 guests bright, then all at opacity 1)'],
  ['Click a guest, then Esc', 'The card grows out of the avatar with all data; Esc shrinks it back', 'Passed'],
  ['Move Arman to the balcony', 'Arman flies to the end of the balcony; the hall closes the gap; case 1 no longer finds him', 'Passed (case 1 finds 5 guests)'],
  ['Sort the living room twice', 'Cards slide to 19:55, 20:20, 20:30, 21:00, 21:10, then back to the picture order', 'Passed'],
  ['Sort 5 times fast', 'The cards end in the sorted order without jumping or shaking', 'Passed (all left/top = 0)']
]));

// ------------------------------------------------------------------ conclusion
body.push(h1('Conclusion'));
body.push(p('In this assignment I learned how to find elements with jQuery selectors and traversal methods (attribute selectors like ~=, :has(), :not(), :nth-child(), prev(), next(), nextAll(), siblings(), closest(), add(), filter()), and how to keep the data of an object in classes and data-* attributes, so that the page itself is the source for the search. In Task 2 I learned that animations must be managed: stop() with the right queue name and clearQueue keeps fast clicks from building queues, offset() and css() let a card fly or slide between two places, and a small state variable (profile.wanted) is a simple way to keep an effect in the correct state. The hardest part was the sliding of cards (FLIP) and the flying card that has to land exactly in a place that is still opening.'));
body.push(p('GitHub repository with the source code: https://github.com/[your-username]/[repository-name]', { run: { bold: true } }));

const doc = new Document({
  styles: { default: { document: { run: { font: 'Calibri', size: 22 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 32, bold: true, font: 'Calibri', color: '1F3864' }, paragraph: { spacing: { before: 300, after: 160 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, font: 'Calibri', color: '2F5496' }, paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, font: 'Calibri', color: '444444' }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 } }
    ] },
  numbering: { config: [{ reference: 'b', levels: [{ level: 0, format: LevelFormat.BULLET, text: '•', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] }] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, right: 1440, bottom: 1134, left: 1440 } } }, children: body }]
});
Packer.toBuffer(doc).then(b => { fs.writeFileSync('/home/claude/Assignment6_YourName.docx', b); console.log('ok'); });
