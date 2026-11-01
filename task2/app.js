

var CARD_W = 72, CARD_M = 2;     // width and side margin of a card (see CSS)
var PW = 280;                    // final width of the guest card
var sortedRooms = {};            // roomId -> true when the room is sorted by time
var dirty = false;               // true after case 18 / 19 changed only the page
var moves = [];                  // moves that are flying right now



function toMinutes(time) {
  var p = time.split(':');
  return parseInt(p[0], 10) * 60 + parseInt(p[1], 10);
}
function avatarUrl(name) {
  return 'https://api.dicebear.com/9.x/open-peeps/svg?seed=' + encodeURIComponent(name);
}
function getRoom(id) {
  return $.grep(PARTY, function (r) { return r.id === id; })[0];
}

function buildCard(g, pos, roomId) {
  var room = getRoom(roomId);
  var $card = $('<div>')
    .addClass('guest card color-' + g.color)
    .addClass(g.aitu ? 'aitu' : 'not-aitu')
    .attr({
      'data-name': g.name, 'data-color': g.color, 'data-time': g.time,
      'data-minutes': toMinutes(g.time), 'data-aitu': g.aitu ? 'yes' : 'no',
      'data-things': g.things.join(' '), 'data-room': roomId,
      'data-floor': room.floor, 'data-pos': pos        // pos = place in the picture order
    });
  $.each(g.things, function (i, t) { $card.addClass('has-' + t); });

  var $hop = $('<div class="hop">').appendTo($card);
  var $ring = $('<div class="avatar-wrap">').appendTo($hop);
  $('<img class="avatar" alt="">').attr('src', avatarUrl(g.name)).appendTo($ring);
  if (g.aitu) $('<span class="badge" title="AITU student">🎓</span>').appendTo($ring);
  $('<div class="g-name">').text(g.name).appendTo($hop);
  $('<div class="g-time">').text('⏲ ' + g.time).appendTo($hop);
  var $things = $('<div class="g-things">').appendTo($hop);
  $.each(g.things, function (i, t) {
    $('<span class="thing">').addClass('thing-' + t).text(ICONS[t]).appendTo($things);
  });
  return $card;
}

function buildParty() {
  cancelEverything();                           // stop all animations first
  var $house = $('#house').empty();
  $.each([2, 1], function (i, floor) {
    var $floor = $('<section class="floor">').addClass('floor-' + floor).attr('data-floor', floor);
    $('<div class="floor-label">').append($('<span>').text('FLOOR ' + floor)).appendTo($floor);
    $.each(PARTY, function (j, room) {
      if (room.floor !== floor) return;
      var $room = $('<div class="room">')
        .attr({ id: 'room-' + room.id, 'data-room': room.id, 'data-name': room.name, 'data-floor': floor });
      var $head = $('<div class="room-head">').append($('<h3>').text(room.name)).appendTo($room);
      $('<button class="sort-btn">Sort by time</button>')
        .attr('data-room', room.id).toggleClass('active', !!sortedRooms[room.id]).appendTo($head);

      var list = $.map(room.guests, function (g, k) { return { g: g, pos: k }; });
      if (sortedRooms[room.id]) {                 // a sorted room stays sorted after a rebuild
        list.sort(function (a, b) { return toMinutes(a.g.time) - toMinutes(b.g.time) || a.pos - b.pos; });
      }
      var $guests = $('<div class="guests">').appendTo($room);
      $.each(list, function (k, x) { $guests.append(buildCard(x.g, x.pos, room.id)); });
      $room.appendTo($floor);
    });
    $floor.appendTo($house);
  });
  dirty = false;
}

function buildLegend() {
  var $l = $('#legend');
  $('<span>').append(
    '<i class="dot red"></i><i class="dot blue"></i><i class="dot green"></i>' +
    '<i class="dot black"></i><i class="dot yellow"></i><i class="dot purple"></i> Clothing color'
  ).appendTo($l);
  $.each(ICONS, function (name, icon) {
    $('<span>').text(icon + ' ' + (name === 'crumbs' ? 'Cake crumbs' : name.charAt(0).toUpperCase() + name.slice(1))).appendTo($l);
  });
  $('<span>').text('⏲ Arrival time').appendTo($l);
  $('<span>').text('🎓 AITU student').appendTo($l);
}

/* ===================== B. STOP-ANIMATION HELPERS ===================== */
/* stop(queueName, clearQueue, jumpToEnd): we always clear the queue, so
   nothing waits in line and repeats after the user stops clicking. */

function stopSlide($els) { return $els.stop('slide', true, false); }

/* Stop everything and clean up the temporary elements. Called before a rebuild. */
function cancelEverything() {
  $.each(moves, function (i, m) { m.proxy.stop(true); m.$fly.remove(); });
  moves = [];
  $('.guest, .gap, .leaving, .hop, .room').stop('fx', true).stop('slide', true);
  $('.fly').remove();
  resetProfile();
}

/* ========================= C. SPOTLIGHT ========================= */

function spotlight($found) {
  var $bright = $found.is('.room') ? $found.find('.guest') : $found;   // rooms -> their guests
  $('.guest').not($bright).fadeTo(300, 0.2);                           // all the others: pale
  $bright.fadeTo(300, 1);
}

function clearSpotlight() {
  if (dirty) buildParty();
  $('.guest').stop('fx', true).fadeTo(300, 1);
  $('.found').removeClass('found');
}

function jump($found) {
  var $target = $found.is('.room') ? $found : $found.find('.hop');
  var h = $found.is('.room') ? -8 : -16;
  $target.css('position', 'relative').animate({ top: h }, 150).animate({ top: 0 }, 150);
}

function showResult(c, $found) {
  var names = $found.map(function () { return $(this).data('name'); }).get();
  var what = $found.is('.room') ? (names.length === 1 ? 'room' : 'rooms')
                                 : (names.length === 1 ? 'guest' : 'guests');
  $('#result-text').empty()
    .append($('<b>').text('Case ' + c.n + ': ' + c.short))
    .append('<br>Found: ')
    .append($('<span class="count">').text(names.length + ' ' + what))
    .append(names.length ? ' — ' + names.join(', ') : '');
  $('#chain').text(c.run.toString().replace(/^function \(\) \{\s*/, '').replace(/\s*\}$/, ''));
}

function runCase(c) {
  // 1. finish what is still moving (fast clicks): jump animations end at once,
  //    fades are stopped where they are (the next fade starts from there)
  $('.guest').stop('fx', true);
  $('.hop, .room').stop('fx', true, true);
  // 2. cases 18 / 19 changed only the page: build it again
  if (dirty) buildParty();
  $('.found').removeClass('found');
  // 3. the chain of the case
  var $found = c.run();
  if (c.n === 18 || c.n === 19) dirty = true;
  $found.addClass('found');
  spotlight($found);
  jump($found);
  showResult(c, $found);
}

/* ======================== D. GUEST CARD ======================== */
/* A small state machine. The user's wish is `wanted` (a name or null);
   profileSync() makes the real card match the wish, one step at a time.
   states: 'closed' | 'open' (also while growing) | 'closing'          */

var profile = { $el: null, name: null, state: 'closed', wanted: null, afterClose: [] };

function guestInfo($g) {
  return {
    name: $g.attr('data-name'), color: $g.attr('data-color'), time: $g.attr('data-time'),
    aitu: $g.attr('data-aitu') === 'yes',
    things: $.grep(($g.attr('data-things') || '').split(' '), function (t) { return t !== ''; }),
    room: $g.attr('data-room')
  };
}
var THING_WORDS = { phone: 'a phone', glasses: 'glasses', bag: 'a bag', cup: 'a cup', crumbs: 'cake crumbs' };
function joinWords(a) {
  if (a.length < 2) return a.join('');
  return a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
}

function buildProfile($g) {
  var d = guestInfo($g), room = getRoom(d.room);
  var $p = $('<div class="profile">').addClass('color-' + d.color);
  $('<img class="pc-photo" alt="">').attr('src', avatarUrl(d.name)).appendTo($p);
  var $rest = $('<div class="pc-rest">').appendTo($p);

  $('<div class="pc-head">')
    .append($('<div class="pc-name">').text(d.name))
    .append($('<div class="pc-sub">').text(d.aitu ? '🎓 AITU student' : 'Guest'))
    .appendTo($rest);

  var things = $.map(d.things, function (t) { return THING_WORDS[t]; });
  var $ul = $('<ul class="pc-lines">').appendTo($rest);
  $('<li>').text('Came at ' + d.time).appendTo($ul);
  $('<li>').text(d.aitu ? 'AITU student' : 'Not an AITU student').appendTo($ul);
  $('<li>').text(things.length ? 'Has ' + joinWords(things) : 'Came with nothing').appendTo($ul);
  $('<li>').text('Wears ' + d.color).appendTo($ul);
  $('<li>').text((d.room === 'balcony' ? 'Now on the ' : 'Now in the ') + room.name.toLowerCase()).appendTo($ul);

  $('<div class="pc-title">').text('Move this guest:').appendTo($rest);
  var $moves = $('<div class="pc-moves">').appendTo($rest);
  $.each(PARTY, function (i, r) {
    if (r.id === d.room) return;                     // a button for each OTHER room
    $('<button class="move-btn">').attr('data-room', r.id)
      .text('Move to the ' + r.name.toLowerCase()).appendTo($moves);
  });
  return $p;
}

function profileOpen(name) {
  var $g = $('.guest[data-name="' + name + '"]');
  if (!$g.length) { profile.wanted = null; return; }
  var $av = $g.find('.avatar-wrap');
  var $p = buildProfile($g);

  // measure the final height off-screen
  $p.css({ left: -9999, top: 0, width: PW, height: 'auto', visibility: 'hidden', borderRadius: 16 })
    .appendTo('body');
  var h = $p.outerHeight();

  // start: exactly on the avatar
  var from = $av.offset(), size = $av.outerWidth();
  var cx = from.left + size / 2, cy = from.top + size / 2;
  var $w = $(window);
  var to = {
    left: Math.max($w.scrollLeft() + 8, Math.min(cx - PW / 2, $w.scrollLeft() + $w.width() - PW - 8)),
    top:  Math.max($w.scrollTop() + 8,  Math.min(cy - h / 2,  $w.scrollTop() + $w.height() - h - 8))
  };
  $p.css({ visibility: 'visible', left: from.left, top: from.top, width: size, height: size,
           borderRadius: size / 2 });
  $p.find('.pc-rest').css('opacity', 0);

  profile.$el = $p; profile.name = name; profile.state = 'open';

  // grow
  $p.animate({ left: to.left, top: to.top, width: PW, height: h, borderRadius: 16 }, 300);
  $p.find('.pc-photo').animate({ left: 10, top: 10 }, 300);
  $p.find('.pc-rest').fadeTo(300, 1);
}

function profileClose() {
  var p = profile, $el = p.$el;
  p.state = 'closing';
  $el.addClass('closing');
  $el.stop('fx', true); $el.find('.pc-photo, .pc-rest').stop('fx', true);   // stop growing, keep size

  var finish = function () {
    $el.remove();
    p.$el = null; p.name = null; p.state = 'closed';
    profileSync();                                   // maybe the user wants another card now
  };
  var $av = $('.guest[data-name="' + p.name + '"]').find('.avatar-wrap');
  $el.find('.pc-rest').fadeTo(150, 0);
  if ($av.length) {                                  // shrink back into the photo
    var o = $av.offset(), size = $av.outerWidth();
    $el.find('.pc-photo').animate({ left: 0, top: 0 }, 250);
    $el.animate({ left: o.left, top: o.top, width: size, height: size, borderRadius: size / 2 }, 250, finish);
  } else {
    $el.fadeOut(150, finish);
  }
}

function profileSync() {
  if (profile.state === 'closing') return;                    // finish() will call us again
  if (profile.state === 'open' && profile.name !== profile.wanted) { profileClose(); return; }
  if (profile.state === 'closed') {
    var q = profile.afterClose; profile.afterClose = [];
    $.each(q, function (i, fn) { fn(); });                    // e.g. a move waiting for the card to close
    if (profile.wanted) profileOpen(profile.wanted);
  }
}

function resetProfile() {
  if (profile.$el) { profile.$el.find('*').stop(true); profile.$el.stop(true).remove(); }
  profile.$el = null; profile.name = null; profile.state = 'closed';
  profile.wanted = null; profile.afterClose = [];
}

/* ========================= E. MOVE A GUEST ========================= */

/* Remove the guest from the PARTY array (any room); returns the record. */
function takeFromArray(name) {
  for (var i = 0; i < PARTY.length; i++) {
    for (var k = 0; k < PARTY[i].guests.length; k++) {
      if (PARTY[i].guests[k].name === name) return PARTY[i].guests.splice(k, 1)[0];
    }
  }
  return null;
}
function recordFromDom($g) {                 // for guests that exist only on the page (Miras)
  var d = guestInfo($g);
  return { name: d.name, color: d.color, time: d.time, aitu: d.aitu, things: d.things };
}

function startMove(name, toId) {
  var $g = $('.guest[data-name="' + name + '"]');
  if (!$g.length || $g.attr('data-room') === toId) return;

  // 1. change the ARRAY at once, so the cases find the guest in the new room
  var rec = takeFromArray(name) || recordFromDom($g);
  getRoom(toId).guests.push(rec);

  // 2. the old card stops being a guest: it becomes an invisible "leaving" place
  stopSlide($g);
  var from = $g.offset();
  var opacity = $g.css('opacity');
  var $fly = $g.clone().removeClass('guest found').addClass('fly')
    .removeAttr('data-name data-room data-things data-color data-time data-minutes data-aitu data-floor data-pos')
    .css({ left: from.left, top: from.top, opacity: opacity })
    .appendTo('body');
  $g.stop('fx', true).removeClass('guest found').addClass('leaving').css({ left: 0, top: 0 });

  // 3. old room: the empty place closes slowly
  $g.animate({ width: 0, marginLeft: 0, marginRight: 0 }, 700, function () { $(this).remove(); });

  // 4. new room: a place opens slowly at the end
  var $gap = $('<div class="gap">').css({ width: 0, marginLeft: 0, marginRight: 0 })
    .appendTo('#room-' + toId + ' .guests');
  $gap.animate({ width: CARD_W, marginLeft: CARD_M, marginRight: CARD_M }, 700);

  // 5. the card flies over the house. It follows the gap's CURRENT position
  //    (offset()) in every step, so it lands exactly even if the layout moves.
  var m = { name: name, toId: toId, $fly: $fly, $gap: $gap, opacity: opacity, proxy: $({ p: 0 }) };
  moves.push(m);
  m.proxy.animate({ p: 1 }, {
    duration: 1000,
    step: function (now) {
      var t = $gap.offset();
      $fly.css({ left: from.left + (t.left - from.left) * now,
                 top:  from.top  + (t.top  - from.top)  * now });
    },
    complete: function () { land(m); }
  });
}

function land(m) {
  moves.splice($.inArray(m, moves), 1);
  var room = getRoom(m.toId);
  var rec = $.grep(room.guests, function (g) { return g.name === m.name; })[0];
  var pos = -1;
  $('#room-' + m.toId + ' .guest').each(function () { pos = Math.max(pos, $(this).data('pos')); });
  var $card = buildCard(rec, pos + 1, m.toId).css('opacity', m.opacity);
  m.$gap.stop(true).replaceWith($card);
  m.$fly.remove();
  if (sortedRooms[m.toId]) layoutRoom(m.toId);       // the room is sorted: the newcomer slides to its place
}

/* ========================== F. SORT BY TIME ========================== */
/* FLIP idea: 1) remember where every card IS now, 2) put the cards in the
   new order, 3) move every card back to its old spot with left/top,
   4) animate left/top to 0 -> the card slides to the new place.        */

function layoutRoom(roomId) {
  var $box = $('#room-' + roomId + ' .guests');
  var $cards = $box.children('.guest');
  var sorted = !!sortedRooms[roomId];

  stopSlide($cards);                                 // stop an older slide right where it is
  var items = $cards.map(function () {
    return { el: this, o: $(this).offset(), minutes: $(this).data('minutes'), pos: $(this).data('pos') };
  }).get();                                          // 1) where the cards are now
  $cards.css({ left: 0, top: 0 });

  items.sort(function (a, b) {
    return sorted ? (a.minutes - b.minutes || a.pos - b.pos) : (a.pos - b.pos);
  });
  $.each(items, function (i, it) { $box.append(it.el); });   // 2) new order
  $box.append($box.children('.gap'));                         //    empty places stay at the end

  $.each(items, function (i, it) {                            // 3) back to the old spot
    var now = $(it.el).offset();
    $(it.el).css({ left: it.o.left - now.left, top: it.o.top - now.top });
  });
  $cards.animate({ left: 0, top: 0 }, { duration: 700, queue: 'slide' }).dequeue('slide');   // 4) slide
}

/* ======================== G. START-UP / EVENTS ======================== */

$(function () {
  buildLegend();
  buildParty();

  $.each(CASES, function (i, c) {
    $('<button class="case-btn">')
      .append($('<b>').text(c.n + '.')).append(' ' + c.short)
      .on('click', function () { runCase(c); })
      .appendTo('#cases');
  });

  $('#clear').on('click', clearSpotlight);

  // sort button of a room: click = sorted, click again = picture order
  $('#house').on('click', '.sort-btn', function () {
    var id = $(this).attr('data-room');
    sortedRooms[id] = !sortedRooms[id];
    $(this).toggleClass('active', sortedRooms[id]);
    layoutRoom(id);
  });

  // click a guest: open (or close) the guest card
  $('#house').on('click', '.guest', function (e) {
    e.stopPropagation();                             // so the "click outside" handler does not run
    var name = $(this).attr('data-name');
    profile.wanted = (profile.wanted === name) ? null : name;
    profileSync();
  });

  // click outside the card, or Esc: close
  $(document).on('click', function (e) {
    if (profile.state === 'closed' || $(e.target).closest('.profile').length) return;
    profile.wanted = null;
    profileSync();
  });
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape') { profile.wanted = null; profileSync(); }
  });

  // "Move to the ..." button inside the card
  $(document).on('click', '.profile .move-btn', function () {
    if (profile.state !== 'open') return;
    var name = profile.name, toId = $(this).attr('data-room');
    profile.wanted = null;
    profile.afterClose.push(function () { startMove(name, toId); });   // fly after the card is closed
    profileSync();
  });
});
