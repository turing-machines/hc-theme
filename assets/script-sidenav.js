(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
    factory();
}(function () { 'use strict';

  var modalWrapperTemplate = function modalWrapperTemplate(children) {
    return "\n    <div>\n        <a href=\"#sidenav-modal\" tabindex=\"0\" class=\"btn btn--primary btn--full-width-xs is-hidden--lg-up\">\n            Open sidenav\n        </a>\n        <div id=\"sidenav-modal\" data-plugin-make-modal='{\"devices\": [\"mobile\", \"tablet\"], \"position\": \"right\"}'>\n            ".concat(children, "\n        </div>\n    </div>\n");
  };

  var containerTemplate = function containerTemplate(name) {
    var children = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : '';
    return "\n    <ul class=\"sidenav__list sidenav__list--".concat(name, "\">").concat(children, "</ul>\n");
  };

  var categoriesTemplate = function categoriesTemplate(categories) {
    return categories.map(function (category) {
      return "\n        <li class=\"sidenav__item sidenav__item--category\" data-category-id=\"".concat(category.id, "\">\n            <a class=\"sidenav__item__category js-spoiler-toggle\" role=\"button\" tabindex=\"0\">").concat(category.name, "</a>\n            <div class=\"sidenav__container js-spoiler\"></div>\n        </li>\n    ");
    }).join('');
  };

  var sectionsTemplate = function sectionsTemplate(sections) {
    return sections.map(function (section) {
      return "\n        <li class=\"sidenav__item sidenav__item--section\" data-section-id=\"".concat(section.id, "\">\n            <a class=\"sidenav__item__section js-spoiler-toggle\" role=\"button\" tabindex=\"0\">").concat(section.name, "</a>\n            <div class=\"sidenav__container js-spoiler\"></div>\n        </li>\n    ");
    }).join('');
  };

  var articlesTemplate = function articlesTemplate(articles, activeArticleId) {
    return articles.map(function (article) {
      return "\n        <li class=\"sidenav__item sidenav__item--article\" data-article-id=\"".concat(article.id, "\">\n            <a href=\"").concat(article.html_url, "\" class=\"sidenav__item__article ").concat(article.id === activeArticleId ? 'is-active' : '', "\" role=\"button\" tabindex=\"0\">\n                ").concat(article.title, "\n            </a>\n        </li>\n    ");
    }).join('');
  };

  var loadMoreButtonTemplate = function loadMoreButtonTemplate(url) {
    return "\n    <div class=\"sidenav__more\">\n        <button class=\"btn btn--xs btn--gray js-load-more\" data-url=\"".concat(url, "\">\n            <span>Load more</span>\n            <i class=\"fas fa-chevron-down\"></i>\n        </button>\n    </div>\n");
  };

  $$.jqueryPlugin('sidenav', {
    methods: {
      init: function init(uid, options, $container) {
        var _this2 = this;

        this.uid = uid;
        this.options = options;
        this.$container = $container.addClass('sidenav');
        this.isKnowledgeBase = $$.page.isCategoryPage() || $$.page.isSectionPage() || $$.page.isArticlePage();
        this.activeCategoryId = this.isKnowledgeBase ? $$.page.getCategoryId() : 0;
        this.activeSectionId = this.isKnowledgeBase ? $$.page.getSectionId() : 0;
        this.activeArticleId = this.isKnowledgeBase ? $$.page.getArticleId() : 0;

        this.bindEvents();
        this.fetchCategories(this.$container).then(function () {
          if (_this2.activeCategoryId) {
            _this2.fetchSectionsByCategoryId(_this2.activeCategoryId).then(function () {
              if (_this2.activeSectionId) {
                var categoryId = $container.closest('[data-category-id]').data('category-id');

                if (categoryId) {
                  _this2.fetchSectionsBySectionId(_this2.activeSectionId).then();

                  _this2.fetchArticlesBySectionId(_this2.activeSectionId).then();
                } else {
                  var $breadcrumbsItems = $('.breadcrumbs li');
                  var sections = [];
                  var ind = 0;

                  for (var i = 0; i < $breadcrumbsItems.length; i++) {
                    var linkUrl = $breadcrumbsItems.eq(i).find('a').attr('href');

                    if (linkUrl && window.$$.page.isSectionPage(linkUrl)) {
                      sections.push(window.$$.page.getPageId(linkUrl));
                    }
                  }

                  var _this = _this2;

                  (function sectionsIterator() {
                    Promise.all([_this.fetchSectionsBySectionId(sections[ind]), _this.fetchArticlesBySectionId(sections[ind])]).then(function () {
                      ind++;
                      if (sections[ind]) sectionsIterator();
                    });
                  })();
                }
              }
            });
          }
        });
      },
      bindEvents: function bindEvents() {
        var click = 'click.' + this.uid + ' enterkey.' + this.uid;
        this.$container.on(click, '.js-spoiler-toggle', this.handleSpoilerToggle.bind(this));
        this.$container.on(click, '.js-load-more', this.handleLoadMore.bind(this));
      },
      handleSpoilerToggle: function handleSpoilerToggle(event) {
        var $item = $(event.currentTarget).closest('.sidenav__item');

        if (!$item[0].hasAttribute('data-plugin-spoiler')) {
          event.stopPropagation();
          event.preventDefault();
          var categoryId = $item.data('category-id');
          var sectionId = $item.data('section-id');

          if (categoryId) {
            this.fetchSectionsByCategoryId(categoryId, $item);
          }

          if (sectionId) {
            this.fetchSectionsBySectionId(sectionId, $item);
            this.fetchArticlesBySectionId(sectionId, $item);
          }
        }
      },
      handleLoadMore: function handleLoadMore(event) {
        var $button = $(event.currentTarget);
        var $container = $button.closest('.sidenav__more');
        var url = $button.data('url');
        $button.removeClass('.js-load-more').html('<i class="fas fa-spinner"></i>');
        $container.addClass('sidenav__more--loading');
        this.fetchMoreData(url, $container);
      },
      fetchCategories: function fetchCategories($container) {
        var _this3 = this;

        return new $$.Request().fetch("/api/v2/help_center/".concat(window.theme.locale, "/categories"), {
          per_page: 100,
          draft: false
        }).then(function (data) {
          var html = containerTemplate('categories', categoriesTemplate(data.categories));
          //var modal = modalWrapperTemplate(html);
          $container.html(html);
          $$.initPlugins($container);
        });
      },
      fetchSectionsByCategoryId: function fetchSectionsByCategoryId(categoryId) {
        var _this4 = this;

        var $container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.$container.find("[data-category-id=\"".concat(categoryId, "\"]"));
        $container.addClass('sidenav__loading');
        return new $$.Request().fetch("/api/v2/help_center/".concat(window.theme.locale, "/categories/").concat(categoryId, "/sections"), {
          per_page: 100,
          draft: false
        }).then(function (data) {
          if (!data.sections.length) {
            return _this4.renderEmptyTemplate($container);
          }

          var sections = data.sections.filter(function (sec) {
            return !sec.parent_section_id;
          });
          var html = containerTemplate('sections', sectionsTemplate(sections));

          _this4.renderTemplate($container, html);
        });
      },
      fetchSectionsBySectionId: function fetchSectionsBySectionId(sectionId) {
        var _this5 = this;

        var $container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.$container.find("[data-section-id=\"".concat(sectionId, "\"]"));
        $container.addClass('sidenav__loading sidenav__loading--sections');
        var categoryId = $container.closest('[data-category-id]').data('category-id');
        return new $$.Request().fetch("/api/v2/help_center/".concat(window.theme.locale, "/categories/").concat(categoryId, "/sections"), {
          per_page: 100,
          draft: false
        }).then(function (data) {
          var sections = data.sections.filter(function (sec) {
            return sec.parent_section_id === sectionId;
          });

          if (!sections.length && !$container.hasClass('sidenav__loading--articles') && !$container.find('ul').length) {
            return _this5.renderEmptyTemplate($container);
          }

          $container.removeClass('sidenav__loading--sections');

          if (sections.length) {
            var html = containerTemplate('sections', sectionsTemplate(sections));

            _this5.renderTemplate($container, html, true);
          }
        });
      },
      fetchArticlesBySectionId: function fetchArticlesBySectionId(sectionId) {
        var _this6 = this;

        var $container = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this.$container.find("[data-section-id=\"".concat(sectionId, "\"]"));
        $container.addClass('sidenav__loading sidenav__loading--articles');
        return new $$.Request().fetch("/api/v2/help_center/".concat(window.theme.locale, "/sections/").concat(sectionId, "/articles"), {
          per_page: 100,
          draft: false
        }).then(function (data) {
          if (!data.articles.length && !$container.hasClass('sidenav__loading--sections') && !$container.find('ul').length) {
            return _this6.renderEmptyTemplate($container);
          }

          $container.removeClass('sidenav__loading--articles');

          if (data.articles.length) {
            var html = containerTemplate('articles', articlesTemplate(data.articles, _this6.activeArticleId));

            _this6.renderTemplate($container, html);

            if (data.page < data.page_count) {
              _this6.renderLoadMoreButton($container, data.next_page);
            }
          }
        });
      },
      fetchMoreData: function fetchMoreData(url, $container) {
        var _this7 = this;

        new $$.Request().fetch(url, {
          per_page: 100,
          draft: false
        }).then(function (data) {
          if (!data.articles.length && !data.sections.length) {
            return $container.remove();
          }

          var html = data.articles.length ? articlesTemplate(data.articles, _this7.activeArticleId) : sectionsTemplate(data.sections, _this7.activeSectionId);
          var $parentContainer = $container.closest('.sidenav__list');
          $container.remove();
          $parentContainer.append(html);

          if (data.page < data.page_count) {
            _this7.renderLoadMoreButton($parentContainer, data.next_page);
          }
        });
      },
      renderEmptyTemplate: function renderEmptyTemplate($container) {
        $container.removeClass('sidenav__loading').addClass('sidenav__empty');
        $container.find('.js-spoiler-toggle').removeClass('js-spoiler-toggle');
        $container.find('.js-spoiler').remove();
      },
      renderTemplate: function renderTemplate($container, html, isPrepend) {
        if (isPrepend) {
          $container.find('.js-spoiler').first().prepend(html);
        } else {
          $container.find('.js-spoiler').first().append(html);
        }

        if ($container.hasClass('sidenav__loading')) {
          $container.removeClass('sidenav__loading').attr('data-plugin-spoiler', '').spoiler();
          $container.find('.js-spoiler-toggle').first().click();
          $$.initPlugins($container);
        }
      },
      renderLoadMoreButton: function renderLoadMoreButton($container, buttonUrl) {
        var $list = $container.hasClass('sidenav__list') ? $container : $container.find('.sidenav__list').eq(0);
        $list.append(loadMoreButtonTemplate(buttonUrl));
      }
    }
  });

}));
