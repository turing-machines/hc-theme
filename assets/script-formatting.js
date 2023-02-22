'use strict';

$$.jqueryPlugin('formatting', {
  methods: {
    init: function init(uid, options, $container) {
      this.$container = $container;

      if (!$container[0].hasAttribute('data-plugin-article-body')) {
        this.createIframe();
        this.createTable();
      }

      $container.find('table.tabs').each(function (i, element) {
        this.tabs($(element), 'tabs-' + uid + i);
      }.bind(this));
      $container.find('table.accordion').each(function (i, element) {
        this.accordions($(element));
      }.bind(this));
    },
    createIframe: function createIframe() {
      this.$container.find('iframe').each(function (i, element) {
        var $iframe = $(element);
        var height = $iframe.height() / $iframe.width() * 100;
        $iframe.wrap('<div class="iframe"></div>').parent().css('padding-bottom', height + '%');
      });
    },
    createTable: function createTable() {
      this.$container.find('table').each(function (i, element) {
        var $table = $(element);

        if (!$table.hasClass('tabs') && !$table.hasClass('accordion') && !$table.hasClass('table')) {
          var $tableContainer = $('<div class="table-container"></div>');
          $table.after($tableContainer);
          $tableContainer.append($table);
        }
      });
    },
    tabs: function tabs($element, id) {
      var $tab = $('<div class="' + $element.attr('class') + '"></div>');
      var $tabLinks = $('<div class="tabs__links js-tabs-links"></div>');
      var $tabContainers = $('<div class="tabs__containers js-tabs-containers"></div>');
      $element.find('tr:first-child td').each(function (i, element) {
        var tabId = id + i;
        $tabLinks.append('<a href="#' + tabId + '" tabindex="0">' + element.innerText + '</a>');
      });
      $element.find('tr:nth-child(2) td').each(function (i, element) {
        var tabId = id + i;
        $tabContainers.append('<div id="' + tabId + '" class="tabs__container">' + element.innerHTML + '</div>');
      });
      $tab.append($tabLinks).append($tabContainers);
      $element.after($tab);
      $element.remove();
      $tab.tabs();
    },
    accordions: function accordions($element) {
      var $accordion = $('<div class="' + $element.attr('class') + '"></div>');
      $element.find('td').each(function (i, element) {
        var $element = $(element);
        var $title = $element.find('h1, h2, h3, h4, h5').first();
        var title = $title.text();
        $title.remove();
        $accordion.append('\
        <div class="spoiler" data-plugin-spoiler>\
            <a class="spoiler__title js-spoiler-toggle" role="button" tabindex="0">' + title + '</a>\
            <div class="spoiler__text js-spoiler" aria-hidden="true">' + $element.html() + '</div>\
        </div>');
      });
      $element.after($accordion);
      $element.remove();
      $accordion.accordion();
    }
  }
});
