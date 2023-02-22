$$.jqueryPlugin('toc', {
  defaultOptions: {

    // Heading selectors
    headings: 'h1, h2, h3, h4, .h1, .h2, .h3, .h4',

    // Flat toc or tree
    flat: false,

    // The toc title
    title: 'On this page',

    // Show the container if headings not found
    showEmpty: false
  },
  methods: {
    /**
     * Plugin initialization
     * @param {Number} uid - unique plugin ID
     * @param {Object} options
     * @param {jQuery} $container
     */
    init: function(uid, options, $container) {
      this.uid = uid;
      this.options = options;
      this.elementList = [];
      this.elementTree = [];
      this.uperLevel = 6;

      this.$window = $(window);
      this.$container = $container;
      this.$article = $('[data-article-body]');
      this.$headings = this.$article.find(this.options.headings);

      if (!this.$article.length) return;

      this.lastElement = null;
      this.$headings.each(this.createTocElement.bind(this));
      this.createTree();

      if (this.elementTree.length || this.options.showEmpty) {
        this.$container.addClass('toc');
        this.createToc();
        this.setVariables();
        this.updateContainerWidth();
        this.handleWindowScroll();
        this.bindEvents();
        this.setVisibleItems();
      }
      else {
        this.$container.html('');
      }
    },

    setVisibleItems: function() {
      setTimeout(function() {
        var $tocElements = $('[data-toc-element-id]');
        $tocElements.addClass('is-hidden');
        this.$headings.filter(':visible').each(function(i, element) {
          $('[data-toc-element-id="' + $(element).data('id') + '"]').removeClass('is-hidden');
        });
      }.bind(this), 1);
    },

    /**
     * Set variables after toc render
     */
    setVariables: function() {
      this.offsetTop = this.getOffsetTop();
      this.$tocContainer = this.$container.find('.js-toc-container');
      this.$parentList = this.$tocContainer.find('.js-toc-list').first();
      this.tocPosition = 'top';
      this.lastActiveId = null;
      this.activeId = null;
      this.tocIsVisible = this.$container[0].offsetParent != null;
    },

    /**
     * Bind events
     */
    bindEvents: function() {
      var click = 'click.' + this.uid + ' enterkey.' + this.uid;

      this.$window.on('resize.' + this.uid, this.updateContainerWidth.bind(this));
      this.$window.on('scroll.' + this.uid, this.handleWindowScroll.bind(this));
      this.$container.on(click, 'a', this.handleLinkClick.bind(this));
      $('[data-article-body]').on('click', '.tabs-link', this.setVisibleItems.bind(this));
    },

    /**
     * Handle link click
     * Scroll the window to the heading
     * @param {Event} event
     */
    handleLinkClick: function(event) {
      var $link = $(event.currentTarget);
      var headingId = $link.attr('href').replace('#', '');

      if (headingId) {
        event.preventDefault();
        var $heading = this.$article.find('[data-id="' + headingId + '"]');
        var top = $heading.offset().top - this.offsetTop;
        $('html, body').animate({scrollTop: top}, 300);
      }
    },

    /**
     * Handle window scroll
     * Sets the position of the toc container
     * Finds the active link of the toc
     */
    handleWindowScroll: function() {
      if (this.tocIsVisible) {
        var containerRect = this.$container[0].getBoundingClientRect();

        if (containerRect.top <= this.offsetTop) {
          var tocContainerRect = this.$tocContainer[0].getBoundingClientRect();
          if (containerRect.bottom >= tocContainerRect.bottom && tocContainerRect.top >= this.offsetTop) {
            if (this.tocPosition !== 'center') {
              this.tocPosition = 'center';
              this.$tocContainer
                .removeClass('is-bottom')
                .addClass('is-fixed')
                .css('top', this.offsetTop);
            }
          }
          else if (this.tocPosition !== 'bottom') {
            this.tocPosition = 'bottom';
            this.$tocContainer
              .removeClass('is-fixed')
              .addClass('is-bottom')
              [0].style.top = null;
          }

        }
        else if (this.tocPosition !== 'top') {
          this.tocPosition = 'top';
          this.$tocContainer
            .removeClass('is-fixed is-bottom')
            [0].style.top = null;
        }

        for (var i = 0; i < this.$headings.length; i++) {
          var rect = this.$headings[i].getBoundingClientRect();
          if (rect.top > this.offsetTop + 1) {
            this.lastActiveId = this.activeId;
            this.activeId = i
              ? this.$headings.eq(i - 1).data('id')
              : null;
            break;
          }
          if (i === this.$headings.length - 1) {
            this.lastActiveId = this.activeId;
            this.activeId = this.$headings.eq(i).data('id');
          }
        }

        if (!this.activeId) {
          this.activeId = this.$headings.eq(0).data('id');
        }

        if (this.lastActiveId !== this.activeId) {
          if (this.lastActiveId) {
            this.$container
              .find('[data-toc-element-id="' + this.lastActiveId + '"]')
              .removeClass('is-active');
          }
          if (this.activeId) {
            var $element = this.$container.find('[data-toc-element-id="' + this.activeId + '"]');
            var elementRect = $element[0].getBoundingClientRect();
            var parentListRect = this.$parentList[0].getBoundingClientRect();
            $element.addClass('is-active');
            this.$parentList.animate(
              {scrollTop: elementRect.top - parentListRect.top - parentListRect.height / 2}, 50);
          }
        }
      }
    },

    /**
     * Returns the top offset of the toc container
     * @return {number}
     */
    getOffsetTop: function() {
      var $header = $('[data-plugin-header]');
      var mainTop = $('main[role="main"]').offset().top;

      return getComputedStyle($header[0])['position'] !== 'fixed'
        ? mainTop - $header.innerHeight() + 12
        : mainTop + 12;
    },

    /**
     * Creates a toc element and pushes them to the
     * "this.elementList" array
     * @param {number} ind
     * @param {HTMLElement} element
     */
    createTocElement: function(ind, element) {
      var $heading = $(element);

      var heading = {
        id: $$.createUID(),
        title: $heading.text(),
        level: this.getHeadingLevel($heading),
        parentId: null,
        children: []
      };

      if (this.uperLevel > heading.level) {
        this.uperLevel = heading.level;
      }

      if (this.elementList.length && !this.options.flat && heading.level > this.lastElement.level) {
        heading.parentId = this.lastElement.id;
      }

      if (!heading.parentId) {
        this.lastElement = heading;
      }

      this.elementList.push(heading);

      $heading.attr('data-id', heading.id);

    },

    /**
     * Creates toc element tree
     * from the toc element list
     */
    createTree: function() {
      if (this.options.flat) {
        return this.elementTree = this.elementList;
      }

      this.elementTree = this.elementList
        .filter(function(element) {
          return !element.parentId;
        })
        .map(function(element) {
          element.children = this.elementList.filter(function(element2) {
            return element2.parentId === element.id;
          });

          return element;
        }.bind(this));
    },

    /**
     * Creates toc html and renders them
     * on the page
     */
    createToc: function() {
      var html = this.tocWrapperTemplate(
        this.options.title,
        this.tocContainerTemplate(
          this.elementTree.map(function(element) {
            var children = element.children.length
              ? this.tocContainerTemplate(
                element.children.map(function(element) {
                  return this.tocElementTemplate(element.level - this.uperLevel, element, '');
                }.bind(this)).join('')
              )
              : '';

            return this.tocElementTemplate(
              element.level - this.uperLevel,
              element,
              children
            );
          }.bind(this)).join('')
        )
      );

      this.$container.html(html);
    },

    /**
     * Returns a heading level number
     * @param {jQuery} $heading
     * @return {number}
     */
    getHeadingLevel: function($heading) {
      var nodeNamePattern = /H1|H2|H3|H4|H5|H6/;
      var classNamePattern = /^([\s\S]*\s)?(h1|h2|h3|h4|h5|h6)(\s[\s\S]*)?$/;

      if (nodeNamePattern.test($heading[0].nodeName)) {
        return parseInt($heading[0].nodeName.replace('H', ''));
      }

      if (classNamePattern.test($heading.attr('class'))) {
        return parseInt($heading.attr('class').replace(classNamePattern, '$2').replace('h', ''));
      }

      return 6;
    },

    /**
     * Updates width and height of the container
     * @param {ClientRect?} containerRect
     */
    updateContainerWidth: function(containerRect) {
      this.tocIsVisible = this.$container[0].offsetParent != null;

      if (this.tocIsVisible) {
        this.offsetTop = this.getOffsetTop();

        containerRect = typeof containerRect === 'number'
          ? containerRect
          : this.$container[0].getBoundingClientRect();

        this.$tocContainer.css({
          'width': window.innerWidth - containerRect.left - 10,
          'max-height': window.innerHeight - this.offsetTop - 10
        });
      }
    },

    tocWrapperTemplate: function(title, children) {
      return '\
          <div class="toc__container js-toc-container">\
            <h4 class="toc__title">' + title + '</h4>\
            ' + children + '\
          </div>\
      ';
    },

    tocContainerTemplate: function(children) {
      return '<ul class="toc__list js-toc-list">' + children + '</ul>';
    },

    tocElementTemplate: function(level, element, children) {
      return '\
          <li class="is-hidden toc__element toc__element--level-' + level + '" data-toc-element-id="' + element.id + '">\
              <a href="#' + element.id + '">' + element.title + '</a>\
              ' + children + '\
          </li>\
      ';
    }
  }
});
