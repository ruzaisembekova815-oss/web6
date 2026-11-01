/* ------------------------------------------------------------------
   THE 20 CASES.
   Every run() is ONE jQuery chain that searches the PAGE (the DOM),
   not the PARTY array. It returns the found elements:
   guests (.guest) or rooms (.room).
   Times are compared in minutes: 20:30 = 1230, 21:00 = 1260, 21:30 = 1290.
   ------------------------------------------------------------------ */
var CASES = [
  { n: 1, short: 'Who is in the hall?',
    run: function () {
      return $('#room-hall .guest');
    } },

  { n: 2, short: 'Dressed in yellow or purple',
    run: function () {
      return $('.guest[data-color="yellow"], .guest[data-color="purple"]');
    } },

  { n: 3, short: 'AITU students upstairs',
    run: function () {
      return $('.floor-2 .guest[data-aitu="yes"]');
    } },

  { n: 4, short: 'Glasses or a bag',
    run: function () {
      return $('.guest[data-things~="glasses"], .guest[data-things~="bag"]');
    } },

  { n: 5, short: 'Came with nothing',
    run: function () {
      return $('.guest[data-things=""]');
    } },

  { n: 6, short: 'A phone but no bag',
    run: function () {
      return $('.guest[data-things~="phone"]:not([data-things~="bag"])');
    } },

  { n: 7, short: 'Arrived 20:30 – 21:00',
    run: function () {
      return $('.guest').filter(function () {
        var m = $(this).data('minutes');
        return m >= 1230 && m <= 1260;
      });
    } },

  { n: 8, short: 'After 21:00, not AITU',
    run: function () {
      return $('.guest[data-aitu="no"]').filter(function () {
        return $(this).data('minutes') > 1260;
      });
    } },

  { n: 9, short: 'Right next to Askar',
    run: function () {
      return $('.guest[data-name="Askar"]').prev()
        .add($('.guest[data-name="Askar"]').next());
    } },

  { n: 10, short: 'Last in each room',
    run: function () {
      return $('.guest:last-child');
    } },

  { n: 11, short: 'Third in each room',
    run: function () {
      return $('.guest:nth-child(3)');
    } },

  { n: 12, short: 'After Timur',
    run: function () {
      return $('.guest[data-name="Timur"]').nextAll();
    } },

  { n: 13, short: 'Right before someone in black',
    run: function () {
      return $('.guest[data-color="black"]').prev();
    } },

  { n: 14, short: 'Room of Aruzhan',
    run: function () {
      return $('.guest[data-name="Aruzhan"]').closest('.room');
    } },

  { n: 15, short: 'Rooms with < 6 guests',
    run: function () {
      return $('.room:not(:has(.guest:nth-child(6)))');
    } },

  { n: 16, short: 'Cup, but no glasses (rooms)',
    run: function () {
      return $('.room:has(.guest[data-things~="cup"])')
        .not(':has(.guest[data-things~="glasses"])');
    } },

  { n: 17, short: 'First to come to each room',
    run: function () {
      return $('.guest').filter(function () {
        var t = $(this).data('minutes');
        return $(this).siblings().filter(function () {
          return $(this).data('minutes') < t;
        }).length === 0;
      });
    } },

  { n: 18, short: 'Miras joins Askar and Inkar',
    run: function () {
      return buildCard(MIRAS, 0, 'living')
        .hide()
        .insertAfter('.guest[data-name="Askar"]')
        .fadeIn(800);
    } },

  { n: 19, short: 'Natasha goes home',
    run: function () {
      return $('.guest[data-name="Natasha"]')
        .delay(500)
        .fadeOut(800, function () { $(this).remove(); });
    } },

  { n: 20, short: 'Who took the cake?',
    run: function () {
      return $('.floor-1 .guest[data-things~="crumbs"]:not([data-things~="cup"])')
        .filter(function () {
          var m = $(this).data('minutes');
          return m > 1260 && m < 1290;
        })
        .filter(function () {
          return $(this).prev().add($(this).next()).filter('[data-aitu="yes"]').length > 0;
        });
    } }
];
