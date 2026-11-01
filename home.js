/* To add a new task: put one line into this list (href = the folder of the task). */
var TASKS = [
  { title: 'Assignment 6 · Task 1', text: 'Selector Detective — selectors and traversal', href: 'task1/index.html' },
  { title: 'Assignment 6 · Task 2', text: 'The party in motion — effects and animations', href: 'task2/index.html' }
  // { title: 'Assignment 7 · Task 1', text: '...', href: 'assignment7/task1/index.html' }
];

$(function () {
  var $list = $('#tasks');
  $.each(TASKS, function (i, t) {
    $('<a class="task">').attr('href', t.href)
      .append($('<span class="num">').text(i + 1))
      .append($('<span class="body">')
        .append($('<b>').text(t.title))
        .append($('<small>').text(t.text)))
      .appendTo($list);
  });
});
