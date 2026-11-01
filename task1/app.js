
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
      'data-name': g.name,
      'data-color': g.color,
      'data-time': g.time,
      'data-minutes': toMinutes(g.time),
      'data-aitu': g.aitu ? 'yes' : 'no',
      'data-things': g.things.join(' '),
      'data-room': roomId,
      'data-floor': room.floor,
      'data-pos': pos
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

/* The whole house, built from the array. */
function buildParty() {
  var $house = $('#house').empty();
  $.each([2, 1], function (i, floor) {
    var $floor = $('<section class="floor">').addClass('floor-' + floor).attr('data-floor', floor);
    $('<div class="floor-label">').append($('<span>').text('FLOOR ' + floor)).appendTo($floor);
    $.each(PARTY, function (j, room) {
      if (room.floor !== floor) return;
      var $room = $('<div class="room">')
        .attr({ id: 'room-' + room.id, 'data-room': room.id, 'data-name': room.name,
                'data-floor': floor });
      $('<div class="room-head">').append($('<h3>').text(room.name)).appendTo($room);
      var $guests = $('<div class="guests">').appendTo($room);
      $.each(room.guests, function (k, g) { $guests.append(buildCard(g, k, room.id)); });
      $room.appendTo($floor);
    });
    $floor.appendTo($house);
  });
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


function jump($found) {
  var $target = $found.is('.room') ? $found : $found.find('.hop');
  var h = $found.is('.room') ? -8 : -16;
  $target.css('position', 'relative')
    .animate({ top: h }, 150)
    .animate({ top: 0 }, 150);
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
  buildParty();                                  
  var $found = c.run();                          // the jQuery chain
  $found.addClass('found');                      // highlight
  jump($found);                                  // jump once
  showResult(c, $found);                         // number + names
}

$(function () {
  buildLegend();
  buildParty();
  $.each(CASES, function (i, c) {
    $('<button class="case-btn">')
      .append($('<b>').text(c.n + '.')).append(' ' + c.short)
      .on('click', function () { runCase(c); })
      .appendTo('#cases');
  });
});
