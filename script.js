/**
 * This script uses the utils object "$$"
 *
 * $$.jqueryPlugin(pluginName, options);
 *      Creates a jQuery plugin and call this after the "page:loaded" event
 *
 *      options:
 *          api?: [] => jquery plugin api to the call as $(element).plugin('apiMethod', ...options);
 *          defaultOptions?: {} => jquery plugin default options
 *          methods: {} => jquery plugin methods. The "init" method is required
 *
 * $$.initPlugins($container?);
 *      Initializes all plugins in the container
 *
 * $$.Request(options?).fetch(url, data?);
 *      Fetches a data from the sessionStorage or makes request to the server
 *      Returns the <Promise>
 *
 *      options:
 *          ssPrefix: 'request' => SessionStorage prefix
 *          type: 'GET' => type of the request
 *
 * $$.getDuration($element);
 *      Fetches and returns a transition duration of the element
 */

/**
 * jQuery special event for detecting single enter key press
 *
 * @example:
 *
 * $('.btn').on('tap enterkey', ...);
 */
$.event.special.enterkey = {
  delegateType: 'keydown',
  bindType: 'keydown',
  handle: function(event) {
    var handleObj = event.handleObj;
    var ret = null;

    if (event.which === 13) {
      event.type = handleObj.origType;
      ret = handleObj.handler.apply(this, arguments);
      event.type = handleObj.type;
      return ret;
    }
  }
};

/**
 * jQuery special event for detecting single escape key press
 *
 * @example:
 *
 * $('.btn').on('tap escapekey', ...);
 */
$.event.special.escapekey = {
  delegateType: 'keydown',
  bindType: 'keydown',
  handle: function(event) {
    var handleObj = event.handleObj;
    var ret = null;

    if (event.which === 27) {
      event.type = handleObj.origType;
      ret = handleObj.handler.apply(this, arguments);
      event.type = handleObj.type;
      return ret;
    }
  }
};

/**
 * Dropdown plugin
 * This plugin use the "nanopop" package for setting dropdown positions.
 * More information https://github.com/Simonwep/nanopop
 *
 * @example:
 *
 * <div class="dropdown" data-plugin-dropdown>
 *     <a class="js-dropdown-open" tabindex="0" role="button" aria-label="Open">
 *         Open dropdown
 *     </a>
 *     <div class="dropdown__content js-dropdown" role="menu" aria-hidden="true">
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">One</a>
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">Two</a>
 *         <a href="#" class="dropdown__menuitem" rel="nofollow" role="menuitem">Three</a>
 *     </div>
 * </div>
 */
$$.jqueryPlugin('dropdown', {
  api: ['open', 'close'],
  defaultOptions: {
    // Open link selector.
    openLinkSelector: '.js-dropdown-open',

    // Close button selector. By default - all links with a "href" attribute in the dropdown container
    closeLinkSelector: '.js-dropdown a[href]',

    // Dropdown container selector
    dropdownSelector: '.js-dropdown',

    // Preferred position, any combination of [top|right|bottom|left]-[start|middle|end] is valid.
    // 'middle' is used as default-variant if you leave it out.
    position: 'bottom',

    // Margin between the dropdown and the trigger button
    margin: 12,

    // Add dropdown chevron
    addChevron: true,

    // jQuery event name which is triggered when dropdown is about to be opened
    eventOpen: 'dropdown:open',

    // jQuery event name which is triggered when dropdown is about to be closed
    eventClose: 'dropdown:close'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;
      this.lastPosition = '';
      this.popper = null;
      this.isOpened = false;

      this.$container = $container;
      this.$dropdown = this.$container.find(this.options.dropdownSelector);
      this.$trigger = this.$container.find(this.options.openLinkSelector).first();
      this.$document = $(document);
      this.$window = $(window);
      this.chevron = $();

      if (this.options.addChevron) {
        this.chevron = $('<div class="dropdown__chevron"></div>');
        this.$dropdown.append(this.chevron[0]);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$container.on(click, this.options.openLinkSelector, this.handleDropdownToggle.bind(this));
      this.$container.on(click, this.options.closeLinkSelector, this.close.bind(this));
      this.$document.on(click, this.handleDropdownClose.bind(this));
      this.$document.on('escapekey.' + this.uid, this.close.bind(this));
    },

    handleDropdownToggle: function(event) {
      event.preventDefault();
      if (!this.isOpened) {
        this.open($(event.currentTarget));
      }
      else {
        this.close();
      }
    },

    handleDropdownClose: function(event) {
      if (this.isOpened &&
        event.target !== this.$container[0] &&
        !$(event.target).closest(this.$container[0]).length
      ) {
        this.close();
      }
    },

    open: function($trigger) {
      if (!this.isOpened) {
        this.isOpened = true;

        if ($trigger) {
          this.$trigger = $trigger;
          this.$trigger.addClass('is-active');
        }

        this.update();
        this.$window.on('resize.' + this.uid, this.update.bind(this));
        this.$container.trigger(this.options.eventOpen, this);
      }
    },

    close: function() {
      if (this.isOpened) {
        this.isOpened = false;
        this.$dropdown.removeClass('is-active');
        this.$trigger.removeClass('is-active');
        this.$window.off('resize.' + this.uid);
        this.$container.trigger(this.options.eventClose, this);
      }
    },

    update: function() {
      this.popper = NanoPop.createPopper(this.$trigger[0], this.$dropdown[0], Object.assign({}, this.options, {
        container: document.documentElement.getBoundingClientRect()
      }));
      this.$dropdown.removeClass('dropdown__content--' + this.lastPosition);
      this.lastPosition = this.popper.update();
      this.$dropdown.addClass('is-active dropdown__content--' + this.lastPosition);

      if (this.options.addChevron) {
        this.setChevronPosition();
      }
    },

    setChevronPosition: function() {
      this.chevron
        .removeAttr('class style')
        .addClass('dropdown__chevron dropdown__chevron--' + this.lastPosition);

      var triggerRect = this.$trigger[0].getBoundingClientRect();
      var chevronRect = this.chevron[0].getBoundingClientRect();

      if (/^[tb]/i.test(this.lastPosition)) {
        this.chevron.offset({left: triggerRect.x + triggerRect.width / 2 - chevronRect.width / 2});
      }
      else {
        this.chevron.offset({top: triggerRect.y + triggerRect.height / 2 - chevronRect.height / 2});
      }
    }
  }
});

/**
 * Tabs plugin
 *
 * @example:
 *
 * <div class="tabs tabs--type-1 tabs--style-1" data-plugin-tabs>
 *     <div class="tabs__links js-tabs-links">
 *         <a href="#one" tabindex="0">One</a>
 *         <a href="#two" tabindex="0">Two</a>
 *         <a href="#three" tabindex="0">Three</a>
 *     </div>
 *     <div class="tabs__containers js-tabs-containers">
 *         <div id="one" class="tabs__container" aria-hidden="true">Content 1</div>
 *         <div id="two" class="tabs__container" aria-hidden="true">Content 2</div>
 *         <div id="three" class="tabs__container" aria-hidden="true">Content 3</div>
 *     </div>
 * </div>
 */
$$.jqueryPlugin('tabs', {
  api: ['toggle', 'destroy'],
  defaultOptions: {
    // Index of the Default active tab
    activeIndex: 0,

    // Selector of the container with links
    linksSelector: '.js-tabs-links',

    // Selector of the container with tabs
    containersSelector: '.js-tabs-containers',

    // jQuery event name which is triggered when tab is about to be opened
    eventOpen: 'tabs:open',

    // jQuery event name which is triggered after tab is opened
    eventOpened: 'tabs:opened'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;
      this.tabsContainerDelay = 10;
      this.triggerDuration = 400;
      this.tabDuration = 400;
      this.duration = 400;

      this.$container = $container;
      this.$links = this.$container.find(this.options.linksSelector).first();
      this.$containers = this.$container.find(this.options.containersSelector).first();
      this.$trigger = $();
      this.$tab = $();
      this.$lastTrigger = $();
      this.$lastTab = $();

      if (this.options.activeIndex !== -1) {
        this.toggle(0);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$links.on(click, 'a', this.handleTabsToggle.bind(this));
    },

    handleTabsToggle: function(event) {
      event.preventDefault();
      this.toggle($(event.currentTarget));
    },

    toggle: function($triggerOrIndex) {
      var $links = this.$links.children('a');
      var $containers = this.$containers.children('div');

      this.$lastTrigger = $links.filter('.is-active');
      this.$lastTab = $containers.filter('.is-active');

      this.$trigger = typeof $triggerOrIndex === 'number'
        ? $links.eq($triggerOrIndex)
        : $triggerOrIndex;

      if (!this.$trigger.length) {
        return;
      }

      var activeTabId = this.$trigger.attr('href').replace('#', '');
      this.$tab = $containers.filter('[id="' + activeTabId + '"]');

      this.$container.trigger(this.options.eventOpen, this);

      this.triggerDuration = $$.getDuration(this.$trigger);
      this.tabDuration = $$.getDuration(this.$tab);
      this.duration = this.triggerDuration > this.tabDuration ? this.triggerDuration : this.tabDuration;

      this.$containers.css('height', this.$containers.height());

      setTimeout(function() {
        this.$containers.css('height', this.$tab.outerHeight());
      }.bind(this), this.tabsContainerDelay);

      setTimeout(function() {
        this.$containers.css('height', '');
        this.$container.trigger(this.options.eventOpened, this);
      }.bind(this), this.tabsContainerDelay + this.duration);

      this.$lastTrigger.add(this.$lastTab).removeClass('is-active');
      this.$lastTab.attr('aria-hidden', 'true');
      this.$trigger.add(this.$tab).addClass('is-active');
      this.$tab.attr('aria-hidden', 'false');
    },

    destroy: function() {
      this.$links.off('.' + this.uid);
    }
  }
});

/**
 * Spoiler plugin
 *
 * @example
 * <div class="spoiler" data-plugin-spoiler>
 *     <a class="spoiler__title js-spoiler-toggle" role="button" tabindex="0">Spoiler title</a>
 *     <div class="spoiler__text js-spoiler" aria-hidden="true">
 *         Spoiler content
 *     </div>
 * </div>
 */
$$.jqueryPlugin('spoiler', {
  api: ['toggle', 'open', 'close', 'destroy'],
  defaultOptions: {
    // Spoiler is open
    open: false,

    // Selector of the toggle link
    linkSelector: '.js-spoiler-toggle',

    // Selector of the spoiler box
    spoilerSelector: '.js-spoiler',

    // Animation duration
    duration: 400,

    // jQuery event name which is triggered when spoiler is about to be opened
    eventOpen: 'spoiler:open',

    // jQuery event name which is triggered after spoiler is opened
    eventOpened: 'spoiler:opened',

    // jQuery event name which is triggered when spoiler is about to be closed
    eventClose: 'spoiler:close',

    // jQuery event name which is triggered after spoiler is closed
    eventClosed: 'spoiler:closed'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$link = this.$container.find(this.options.linkSelector).first();
      this.$spoiler = this.$container.find(this.options.spoilerSelector).first();

      if (this.options.open) {
        this.isOpen = false;
        this.open(true);
      }
      else {
        this.isOpen = true;
        this.close(true);
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$link.on(click, this.handleSpoilerToggle.bind(this));
    },

    handleSpoilerToggle: function(event) {
      event.preventDefault();
      this.toggle();
    },

    toggle: function() {
      if (this.isOpen) {
        this.close();
      }
      else {
        this.open();
      }
    },

    open: function(withoutAnimation) {
      if (!this.isOpen) {
        this.isOpen = true;
        this.$container.addClass('is-open');
        this.$link.add(this.$spoiler).addClass('is-active');
        this.$container.trigger(this.options.eventOpen, this);

        var duration = withoutAnimation === true ? 0 : this.options.duration;
        this.$spoiler.attr('aria-hidden', 'false').slideDown(duration, function() {
          this.$container.trigger(this.options.eventOpened, this);
        }.bind(this));
      }
    },

    close: function(withoutAnimation) {
      if (this.isOpen) {
        this.isOpen = false;
        this.$container.removeClass('is-open');
        this.$link.add(this.$spoiler).removeClass('is-active');
        this.$container.trigger(this.options.eventClose, this);

        var duration = withoutAnimation === true ? 0 : this.options.duration;
        this.$spoiler.attr('aria-hidden', 'true').slideUp(duration, function() {
          this.$container.trigger(this.options.eventClosed, this);
        }.bind(this));
      }
    },

    destroy: function() {
      this.$link.off('.' + this.uid);
    }
  }
});

/**
 * Accordion plugin
 * Groups spoilers into an accordion
 *
 * @example:
 * <div class="accordion accordion--type-1 accordion--style-2" data-plugin-accordion>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 *     <div class="spoiler" data-plugin-spoiler>...</div>
 * </div>
 */
$$.jqueryPlugin('accordion', {
  api: ['open', 'destroy'],
  defaultOptions: {
    // Index of the Default active spoiler
    activeIndex: -1,

    // Only one active spoiler in the accordion
    oneActive: true
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$spoilers = this.$container.children('[data-plugin-spoiler]');

      this.open(this.options.activeIndex, true);
      this.bindEvents();
    },

    bindEvents: function() {
      if (this.options.oneActive) {
        this.$spoilers.on('spoiler:open.' + this.uid, this.handleSpoilerOpen.bind(this));
      }
    },

    handleSpoilerOpen: function(event, spoiler) {
      this.$spoilers.each(function(i, element) {
        if (element !== spoiler.$container[0]) {
          $(element).spoiler('close');
        }
      });
    },

    open: function(index, withoutAnimation) {
      this.$spoilers.each(function(i, element) {
        var method = i === index ? 'open' : 'close';
        $(element).spoiler(method, withoutAnimation);
      });
    },

    destroy: function() {
      this.$spoilers.off('.' + this.uid);
    }
  }
});

/**
 * Styles elements from the article body
 */
$$.jqueryPlugin('articleBody', {
  methods: {
    init: function(uid, options, $container) {
      this.$container = $container;
      this.createIframe();
      this.createTable();
    },

    createIframe: function() {
      var $iframeContainer = $('<div class="iframe"></div>');
      var $iframe = this.$container.find('iframe');
      var height = $iframe.height() / $iframe.width() * 100;
      $iframe.after($iframeContainer);
      $iframeContainer.append($iframe).css('padding-bottom', height + '%');
    },

    createTable: function() {
      this.$container.find('table').each(function(i, element) {
        var $table = $(element);
        var $tableContainer = $('<div class="table-container"></div>');
        $table.after($tableContainer);
        $tableContainer.append($table);
      });
    }
  }
});

/**
 * Auto submit filtering form
 */
$$.jqueryPlugin('autosubmit', {
  methods: {
    init: function(uid, options, $container) {
      $container.find('input, select').on('change', function(event) {
        $(event.currentTarget).closest('form').submit();
      });
    }
  }
});

/**
 * List limit plugin
 * Truncates the list to the specified limit.
 * After clicking on the button, it expands the full list
 *
 * @example:
 * <ul data-plugin-list-limit='{"limit": 2}'>
 *     <li>One</li>
 *     <li>Two</li>
 *     <li>Three</li>
 *     <li class="js-ignore-item">Four</li>
 *     <li class="js-ignore-item">
 *         <button class="is-hidden js-show-more">Show more</button>
 *     </li>
 * </ul>
 */
$$.jqueryPlugin('listLimit', {
  defaultOptions: {
    // Limit
    limit: 3,

    // Selector to be ignored
    ignoreItemSelector: '.js-ignore-item',

    // "Show more" button selector
    showMoreSelector: '.js-show-more'
  },
  methods: {
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;

      this.$container = $container;
      this.$showMore = this.$container.find(this.options.showMoreSelector);
      this.$list = this.$container.find('li').not(this.options.ignoreItemSelector);

      if (this.$list.length <= this.options.limit) return;

      this.$showMore.removeClass('is-hidden');
      for (var i = this.options.limit; i < this.$list.length; i++) {
        this.$list.eq(i).addClass('is-hidden');
      }

      this.bindEvents();
    },

    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;
      this.$container.one(click, this.options.showMoreSelector, this.handleShowMore.bind(this));
    },

    handleShowMore: function(event) {
      event.preventDefault();
      this.destroy();
    },

    destroy: function() {
      this.$showMore.addClass('is-hidden');
      this.$list.removeClass('is-hidden');
      this.$container.off('.' + this.uid);
    }
  }
});

$$.jqueryPlugin('phone', {
  defaultOptions: {
    phone: ''
  },
  methods: {
    init: function(uid, options, $container) {
      if (options.phone) {
        $container.attr('href', 'tel:' + options.phone.replace(/[\s]/g, ''));
      }
    }
  }
});

var UI_DARK = 'ui-dark';
var UI_LIGHT = 'ui-light';
var LS_COLOR_SCHEME = 'upi-color-scheme';

$$.jqueryPlugin('color-switcher', {
  methods: {
    init: function(uid, options, $container) {
      $container.on('click', function(event) {
        event.preventDefault();

        var className = window.theme.darkMode ? UI_LIGHT : UI_DARK;
        localStorage.setItem(LS_COLOR_SCHEME, className);

        document.documentElement.classList.remove(UI_DARK, UI_LIGHT);
        document.documentElement.classList.add(className);
        window.theme.darkMode = className === UI_DARK;
      });
    }
  }
});

$$.jqueryPlugin('mobile-menu', {
  methods: {
    init: function(uid, options, $container) {
      this.$menu = $container.find('.js-header-menu');
      this.$searchbar = $container.find('.js-header-searchbar');
      this.$toggleMenu = $container.find('.js-toggle-menu');
      this.$toggleSearch = $container.find('.js-toggle-searchbar');

      this.bindEvents();
    },

    bindEvents: function() {
      this.$toggleMenu.on('click', this.handleMenuToggle.bind(this));
      this.$toggleSearch.on('click', this.handleSearchbarToggle.bind(this));
    },

    handleMenuToggle: function(event) {
      event.preventDefault();
      this.$menu.add(this.$toggleMenu).toggleClass('is-active');
    },

    handleSearchbarToggle: function(event) {
      event.preventDefault();
      this.$toggleSearch.add(this.$searchbar).toggleClass('is-active');
      this.$searchbar.slideToggle(300);
    }
  }
});

$$.jqueryPlugin('internal-url', {
  methods: {
    init: function(uid, options, $container) {
      var url = $container.attr('href');
      if (/^\/hc\//.test(url) && url.indexOf('/' + window.theme.locale + '/') === -1) {
        url = url.replace('/hc/', '/hc/' + window.theme.locale + '/');
        $container.attr('href', url);
      }
    }
  }
});

$$.jqueryPlugin('sidebar', {
  methods: {
    init: function(uid, options, $container) {
      this.$window = $(window);
      this.$container = $container;
      this.$controller = $container.find('.js-controller');
      this.$toggle = $container.find('.js-toggle');

      this.width = localStorage.getItem('theme:sidebar-width') || 0;
      this.x = 0;

      if (this.width) {
        this.setSidebarWidth();
      }

      this.bindEvents();
    },

    bindEvents: function() {
      this.$controller.on('mousedown.sidebar', this.handleDragStart.bind(this));
      this.$toggle.on('click', this.handleToggleClick.bind(this));
    },

    handleDragStart: function(event) {
      event.preventDefault();

      if (event.target === this.$toggle[0] || this.$toggle.find(event.target).length) {
        return;
      }

      this.$controller.addClass('is-active');
      this.width = this.$container.outerWidth();
      this.x = event.clientX;
      this.$window.on('mouseup.sidebar', this.handleDragEnd.bind(this));
      this.$window.on('mousemove.sidebar', this.handleDrag.bind(this));
    },

    handleDrag: function(event) {
      event.preventDefault();

      this.width = this.width + event.clientX - this.x;
      this.x = event.clientX;

      this.setSidebarWidth();
      this.$window.trigger('resize');
    },

    handleDragEnd: function(event) {
      event.preventDefault();

      this.$window.off('mousemove.sidebar');
      this.$window.off('mouseup.sidebar');

      localStorage.setItem('theme:sidebar-width', this.width);

      this.width = 0;
      this.x = 0;

      this.$controller.removeClass('is-active');
    },

    setSidebarWidth: function() {
      this.$container.css({
        '-ms-flex': '0 0 ' + this.width + 'px',
        'flex': '0 0 ' + this.width + 'px',
        'max-width': '35%'
      });

      this.$container.toggleClass('is-collapsed', this.width <= 100);
    },

    handleToggleClick: function() {
      console.log(2);
      this.$container.attr('style', '');
      this.$container.toggleClass('is-collapsed', this.width > 100);
      this.width = this.$container.outerWidth();
      localStorage.setItem('theme:sidebar-width', this.width);
      this.$window.trigger('resize');
    }
  }
});

$$.jqueryPlugin('fixed-sidebar', {
  methods: {
    init: function(uid, options, $container) {
      this.$container = $container;
      this.$parent = this.$container.closest('.main-container__sidebar');
      this.$previewBar = $('#preview-bar-container');

      this.setContainerWidth();
      this.$container.addClass('is-active');

      $(window).on('resize', this.setContainerWidth.bind(this));

      if (this.$previewBar.length) {
        this.setContainerHeight();
        this.parentMutationEvent();
      }
    },

    setContainerWidth: function() {
      if (window.innerWidth > 991) {
        this.$container.css('width', this.$parent.innerWidth() + 'px');

        if (this.$previewBar.length) {
          this.setContainerHeight();
        }
      }
      else {
        this.$container.removeAttr('style');
      }
    },

    setContainerHeight: function() {
      if (window.innerWidth > 991) {
        var rect = this.$previewBar[0].getBoundingClientRect();
        this.$container.css('height', 'calc(100vh - ' + (rect.height + rect.y + window.scrollY) + 'px)');
      }
    },

    parentMutationEvent: function() {
      var config = {
        attributes: true,
        childList: false,
        subtree: false
      };

      var callback = function(mutationsList) {
        mutationsList.forEach(function(mutation) {
          if (mutation.attributeName === 'style') {
            setTimeout(this.setContainerHeight.bind(this), 300);
          }
        }.bind(this));
      }.bind(this);

      var observer = new MutationObserver(callback);

      observer.observe(this.$previewBar[0], config);
    }
  }
});

$$.jqueryPlugin('activities', {
  defaultOptions: {
    // Button text
    buttonText: 'Read more...'
  },
  methods: {
    init: function(uid, options, $container) {
      this.options = options;
      this.$container = $container;

      this.observer = new MutationObserver(this.handleMutations.bind(this));
      this.observer.observe(this.$container[0], {childList: true, subtree: true});
    },

    handleMutations: function(mutationsList) {
      mutationsList.forEach(function(mutationRecord) {
        if (mutationRecord.addedNodes && mutationRecord.addedNodes.length) {
          mutationRecord.addedNodes.forEach(function(node) {
            var $element = $(node);
            if ($element.hasClass('recent-activity-item') && !$element.find('.js-read-more').length) {
              var url = $element.find('.recent-activity-item-link').attr('href');
              $element.append(
                '<a href="' + url + '" class="btn btn--light btn--md js-read-more">' + this.options.buttonText + '</a>');
            }
          }.bind(this));
        }
      }.bind(this));
    }
  }
});

$(window).trigger('script:loaded');

// $zopim(function() {
//    $zopim.livechat.hideAll();
// });
