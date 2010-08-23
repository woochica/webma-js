/*jslint browser: true, immed: true, strict: true */
"use strict";

// Define global WebMa namespace for scripts.
// All browser scripts produced by WebMa developers should use the
// window.webma object as namespace.


/**
 * Initialize main webma namespaces.
*/
if (!window) {
    // Something very bad happenned. `window` must be defined.
    throw new Error('No object "window" found, maybe non browser environment?');
} else if (window.webma) {
    // Something bad happenned. `window.webma` should be undefined.
    throw new Error('Object "webma" already defined');
}

/**
 * Main namespace
 * @type {Object}
 */
var webma = {};

/**
 * WebMa tracking module based on Google Analytics
 *
 * Used for e-Commerce and Event Tracking.
 *
 * @type {Object}
 */
webma.analytics = {};

/**
 * WebMa Ajax Site Search module
 * @type {Object}
 */
webma.sitesearch = {};

/**
 * Useful extensions to JavaScript
 *
 * @type {Object}
 */
webma.util = {};


/**
 * WebMa widgets
 * @type {Object}
 */
webma.widgets = {};

/**
 * MODULE: `webma.analytics`
 */

/**
 * List of links marked for tracking.
 * @type {Array}
 */
webma.analytics.links = function() {
    var cls,
        i,
        nodes = document.getElementsByTagName('a'),
        links = [],
        re = /\btrack\b/;
    // Make sure Analytics is ready, otherwise throw error
    if (typeof pageTracker === 'undefined') {
        throw new Error('webma.analytics.links(): Google Analytics tracker not loaded');
    }
    // Find all links that have CSS class "track"
    for (i = 0; i < nodes.length; i++) {
        cls = nodes[i].className || '';
        if (nodes[i].href && re.test(cls)) {
            links[links.length] = nodes[i];
        }
    }
    webma.analytics.links = links;
};
webma.analytics.links = webma.util.productionize(webma.analytics.links);

/**
 * Return list of links that are marked for tracking.
 * They should have the class "track" and attribute "href" exists.
 * Optional argument filters list by CSS class.
 *
 * @param  {String}          cls CSS class
 * @return {webma.analytics}     An instance of webma.analytics
 */
webma.analytics.getLinks = function(cls) {
    if (!cls) {
        return this;
    }
    var i,
        len = this.links.length,
        re = new RegExp("\\b" + cls + "\\b"),
        that = Object.create(webma.analytics);
    that.links = [];
    for (i = 0; i < len; i++) {
        if (re.test(this.links[i].className)) {
            that.links[that.links.length] = this.links[i];
        }
    }
    return that;
};

/**
 * Attach Analytics event handler to links.
 *
 * @param {Function} fn Tracking function
 */
webma.analytics.trackLinks = function(fn) {
    var i,
        len = this.links.length;
    for (i = 0; i < len; i++) {
        webma.util.addEvent(this.links[i], 'click', function(href) {
            return function(e) {
                // Tracking function is called with argument link href
                fn(href);
            };
        }(this.links[i].href));
    }
    return this;
};

/**
 * Shortcut to track all PDF documents on current page with Google Analytics.
 *
 * @return {Array} List of tracked documents
 */
webma.analytics.trackPdfs = function() {

    // TODO use `this.getLinks` here
    return webma.analytics.getLinks('pdf').trackLinks(function(href) {
        pageTracker._trackEvent('Downloads', 'PDF', href);
    });

};

/**
 * Shortcut to track all email addresses on current page with Google Analytics.
 *
 * @return {Array} List of tracked email addresses
 */
webma.analytics.trackEmails = function() {

    // TODO use `this.getLinks` here
    return webma.analytics.getLinks('email').trackLinks(function(href) {
        pageTracker._trackEvent('Exit', 'Email', href.replace(/mailto:/, ''));
    });

};

/**
 * MODULE: `webma.util`
 */

/**
 * Decorate function with silent logging of errors on production environment.
 *
 * Borrowed idea from Nicholas C. Zakas.
 * http://www.nczonline.net/blog/2009/04/28/javascript-error-handling-anti-pattern/
 */
webma.util.productionize = (function() {
    var testDomains = /(\.wma$)|(^tesz?t)/,
        testHash = /wmaDebugMode/,
        debugMode = testDomains.test(window.location.host) || testHash.test(window.location.hash),
        log = function(ex) {
            // TODO ajax call back with error message to log service
            // pass
        };
    if (debugMode === true) {
        return function(f) {
            return function() {
                return f.apply(this, arguments);
            };
        };
    } else {
        return function(f) {
            return function() {
                try {
                    return f.apply(this, arguments);
                } catch (ex) {
                    log(ex.message);
                }
            };
        };
    }
}());

/**
 * Return a function that filters out from element's value those characters
 * that don't match against mask.
 *
 * @param  {Element}  el   DOM element
 * @param  {Array}    mask Array of regular expressions
 * @return {Function}
 */
webma.util.filter_maker = function(el, mask) {
    return function() {
        var i = 0,
            len = el.value.length;
        while (el.value[i] && el.value[i].match(new RegExp(mask[i]))) {
            i += 1;
        }
        if (i != len ) {
            // Cut off last character if match failed
            el.value = el.value.substring(0, i);
        }
    };
};

/**
 * Document event handler. If function `addEvent` already defined,
 * bind itself to it.
 *
 * @param  {HTMLElement} obj    DOM object
 * @param  {String }     evType Event type
 * @param  {Function}    fn     Function to attach to the event
 * @return {Boolean}
 */
webma.util.addEvent = window.addEvent || function (obj, evType, fn) {
    if (obj.addEventListener) {
        obj.addEventListener(evType, fn, false);
        return true;
    }
    else if (obj.attachEvent) {
        return obj.attachEvent('on' + evType,fn);
    }
    return false;
};

if (typeof Object.create !== 'function') {
    Object.create = function (o) {
        var F = function() {};
        F.prototype = o;
        return new F();
    };
}

/**
 * Always highlight parent menu.
 *
 * CMSalfa does not provide a way to also highlight the parent node of the
 * active menu. This function is a workaround for that.
 *
 * @deprecated CMSalfa now supports parent highlighting, no need to this
 *             workaround any more.
 */
webma.util.highlightParentMenu = function() {
    var active_menu,
        parent_menu,
        cls,
        i,
        nodes = document.getElementsByTagName('li'),
        re = /sdoc/i;
    // Get elements with class "sdoc"
    for (i = 0; i < nodes.length; i++) {
        cls = nodes[i].className || '';
        if (re.test(cls)) {
            active_menu = nodes[i];
        }
    }
    // Get ancient anchor element and set style "sdoc"
    if (active_menu) {
        // DOM path: li > ul > li.sdoc
        parent_menu = active_menu.parentNode.parentNode;
        if (parent_menu.nodeName === 'LI') {
            parent_menu.className = 'sdoc';
        }
    }
};

/**
 * Set attribute `target="_blank"` to nodes marked as external links
 * (using rel="external").
 *
 * This is a workaround to document type XHTML 1.0 Strict that does not count
 * target as a valid attribute and we have to be valid.
 */
webma.util.openExternalLinksInBlank = function() {
    var attr,
        i,
        nodes = document.getElementsByTagName('a'),
        re = /\bexternal\b/i;
    for (i = 0; i < nodes.length; i++) {
        attr = nodes[i].rel || '';
        if (re.test(attr)) {
            nodes[i].target = '_blank';
        }
    }
};

/**
 * Periodically poll location hash if it was changed, and call given function.
 *
 * @param {Function} f       Function to call if hash was changed
 * @param {Object}   context Context argument to apply on function
 */
webma.util.hashManager = function(f, context) {
    var prev = '';
    window.setInterval(function() {
        if (prev !== window.location.hash) {
            prev = window.location.hash;
            f.apply(context);
        }
    }, 100);
};


/**
 * MODULE: `webma.sitesearch`
 */

/**
 * Create a WebMa Ajax SiteSearch widget.
 *
 * All forms marked with class 'webma-search' are automatically discovered.
 */
webma.sitesearch = (function() {

    // TODO refactor to `webma.widgets.SiteSearchWidget`

    /**
     * Process WebMa Ajax Site Search.
     *
     * @param {Event} e
     */
    var _submit = function (e) {

        var content = document.getElementById('content'),
            idb, // search index database
            lang = 'utf',
            req,
            field, // search field
            source, // event source
            uri;

        e = e || window.event;

        if (e.preventDefault) {
            e.preventDefault(); // prevent default behaviour in Gecko browsers
        }

        source = e.srcElement || e.target;

        // When hitting enter to submit form, Internet Explorer sends back the
        // form as the event source, while modern browsers return the submit
        // button in all case.
        if (source.elements) {
	    field = source.elements[0];
        } else {
            // We assume here that submit button and search field have similar
            // IDs. The only difference is the type of the element.
            field = document.getElementById(source.id.replace('button', 'field'));
        }

        if (field.value === '') {
	    return false; // skip if no search term was given
        }

        // We store the name of idb as the last chunk of the IDs.
        idb = field.id.split(/-/).pop();

        content.innerHTML = '<p><img src="/images/data/loading.gif" alt="" /></p>';
        scrollTo(0,0);

        try {
	    req = new XMLHttpRequest();
        } catch (error) {
	    try {
	        req = new ActiveXObject('Microsoft.XMLHTTP');
	    } catch (error2) {
                // pass
	    }
        }

        try {
	    uri = window.location.protocol + '//' + window.location.host +
                '/images/data/search.php?encoding=' +
                lang + '&keyword=' + encodeURIComponent(field.value.toLowerCase()) +
                '&idb=' + idb + '.idb';
	    req.open('GET', uri);
            req.onreadystatechange = function () {
                if (req.readyState == 4) {
	            if ((req.status === 200) || (req.status === 0)) {
	                content.innerHTML = req.responseText;
	            }
	            return true;
                }
                return true;
            };
	    req.send(null);
            // Create a virtual pageview for Analytics Site Search tracking
            if (typeof pageTracker !== 'undefined') {
                pageTracker._trackPageview('/sitesearch/?q=' + field.value);
                pageTracker._setVar("sitesearch");
            }
        } catch (error3) {
            // pass
        }

        return false;
    };

    /**
     * Add event listener to all site search widgets.
     */
    return function() {
        // TODO: use document.getElementsByClassName if available
        var form,
            hash = document.location.hash,
            i,
            nodes = document.getElementsByTagName('form'),
            kw,
            len = nodes.length,
            re = /\bwebma-search\b/;
        // There may be more form widgets on the page. We handle all of them.
        for (i = 0; i < len; i++) {
            form = nodes[i];
	    if (re.test(form.className)) {
	        webma.util.addEvent(form, 'submit', _submit);
                // We suppose there are two elements in form with this order:
                // input and submit button.
	        webma.util.addEvent(form.elements.item(1), 'click', _submit);
	    }
        }
        // If hash looks like "#sitesearch&keyword" start a site search
        // process. Copy keyword to the input field and simulate clicking on
        // the search button.
        if (hash.indexOf('sitesearch') > 0) {
            // There can be campaign tags in the hash, too
            if (hash.indexOf('utm_source') && typeof pageTracker !== 'undefined') {
                pageTracker._setAllowAnchor(true);
            }
            // Although, there may be more than one site search forms, we
            // do not care about that now but using the first form.
            form = nodes[0];
            // Hash is something like "#sitesearch=kw&foor=bar&..."
            kw = hash.match(/sitesearch=([^&]+)/);
            if (typeof kw !== 'undefined') {
                // Chrome leaves hash in URL-encoded format
                kw = decodeURIComponent(kw[1]);
                form.elements[0].value = kw;
                form.elements[1].click();
            } else {
                throw new Error('webma.sitesearch(): no external keyword given, ' + hash);
            }
        }
    };

}());
webma.sitesearch = webma.util.productionize(webma.sitesearch);

/**
 * MODULE: `webma.widgets`
 */

/**
 * Create Lightbox widget based on Dojox.
 *
 * Convert all a[rel~="lightbox"] to Dojo Lightbox widgets. Try to load Dojo
 * and Lightbox if needed. Raise error if any of them cannot be loaded.
 *
 * @requires dojox.image.Lightbox
 * @throws   Error
 */
webma.widgets.lightboxWidget = function(){
    if (typeof dojo === 'undefined') {
        throw new Error('webma.widgets.lightboxWidget(): Dojo is not loaded');
    } else {
        try {
            dojo.require('dojox.image.Lightbox');
        } catch (ex) {
            throw new Error('webma.widgets.lightboxWidget(): ' + ex.message());
        }
    }
    var i,
        node,
        nodes = document.getElementsByTagName('A'),
        len = nodes.length,
        group,
        re = /\blightbox/,
        group_re = /\blightbox\[(.*?)\]/;
    for (i = 0; i < len; i++) {
        node = nodes[i];
        if (re.test(node.rel)) {
            node.setAttribute('dojoType', 'dojox.image.Lightbox');
            group = node.rel.match(group_re);
            if (group) {
                node.setAttribute('group', group[1]);
            }
        }
    }
    // TODO: if `parse` is invoked multiple times, it throws error
    dojo.addOnLoad(function() {
        dojo.parser.parse();
    });
};
webma.widgets.lightboxWidget = webma.util.productionize(webma.widgets.lightboxWidget);

/**
 * Create a blog widget.
 *
 * The widget class displays the latest items of a blog's feed in a container
 * element.
 *
 * Using Crockford's functional pattern to create object.
 *
 * @param {HTMLElement} container Container for widget
 * @param {String}      url       Atom feed URL
 * @param {number}      num       Number of items to display
 */
webma.widgets.blogWidget = function(container, url, num) {

    if (!container) {
        return;
    }

    var snippetDelimiter,
        number = num || 3;

    /**
     * Default snippet function
     *
     * It returns the builtin content snippet of a post.
     *
     * @access private
     * @param {Object} entry Entry in JSON
     * @param {Object} entryXml Entry in XML
     * @return {String} Post snippet
     */
    var snippetFn = function(entry, entryXml) {
        return entry.contentSnippet;
    };

    /**
     * Fetch feed and call function `createWidget`.
     *
     * @access public
     */
    var showWidget = function() {
        if (isFeedsLoaded) {
            var feed = new google.feeds.Feed(url);
            feed.setResultFormat(google.feeds.Feed.MIXED_FORMAT);
            feed.setNumEntries(number);
            feed.load(createWidget);
        } else {
            window.setTimeout(showWidget, 100);
        }
    };

    /**
     * Create a HTML widget.
     *
     * Parse result and generate HTML elements.
     *
     * @access private
     * @param {Object} result Feed result
     */
    var createWidget = function(result) {

        if (typeof result.error !== 'undefined')  {
            throw new Error('webma.widgets.blogWidget::createWidget(): ' + result.error.message);
        }

        if (!result.feed || !result.feed.entries) {
            throw new Error('webma.widgets.blogWidget::createWidget(): no feed item returned');
        }

        var content,
            contentEl,
            date,
            div,
            entry,
            entryXml,
            // Google Ajax Feed filters out HTML comments from JSON reponse, so we
            // have to parse the XML output to get the original data.
            entriesXml = google.feeds.getElementsByTagNameNS(result.xmlDocument, 'http://www.w3.org/2005/Atom', 'entry'),
            heading,
            i,
            j,
            len = result.feed.entries.length,
            link;

        for (i = 0; i < len; i++) {
            entry = result.feed.entries[i];

            // Container
            div = document.createElement('div');
            container.appendChild(div);

            // Permalink to post page
            link = document.createElement('a');
            link.appendChild(document.createTextNode(entry.title));
            link.href = entry.link;
            link.setAttribute('rel', 'external');

            // Post heading
            heading = document.createElement('h3');
            heading.appendChild(link);
            div.appendChild(heading);

            // Published date
            date = document.createElement('p');
            date.className = 'date';
            date.innerHTML = (function(date) {
                var d = new Date(date),
                    month = d.getMonth() + 1,
                    day = d.getDate();
                if (month < 10) {
                    month = '0' + month;
                }
                if (day < 10) {
                    day = '0' + day;
                }
                return d.getFullYear() + '.' +  month + '.' + day + '.';
            }(entry.publishedDate));
            div.appendChild(date);

            // Post content snippet

            // Search node that contains the post content
            entryXml = entriesXml[i];
            for (j = 0; i < entryXml.childNodes.length; j++) {
                if (entryXml.childNodes[j].nodeName === 'content') {
                    content = entryXml.childNodes[j].firstChild.data;
                    break;
                }
            }
            if (!content) {
                throw new Error('webma.widgets.blogWidget::createWidget(): no content found in feed');
            }
            contentEl = document.createElement('p');
            contentEl.className = 'post';
            contentEl.innerHTML = snippetFn(entry, content);
            div.appendChild(contentEl);
        }

    };
    createWidget = webma.util.productionize(createWidget);

    /**
     * Set customized snippet function
     *
     * @access public
     * @param {Function} fn Snippet function
     */
    var setSnippetFn = function(fn) {
        snippetFn = fn;
    };

    /**
     * Set delimiter string that marks the end of the post snippet
     *
     * @access public
     * @param {String} delimiter Delimiter string
     */
    var setSnippetDelimiter = function(delimiter) {
        snippetDelimiter = delimiter;
    };

    /**
     * Snippet function that cuts post at snippet delimiter string
     *
     * @access public
     */
    var showSnippetUntilDelimiter = function (entry, entryXml) {
        var snippet;
        if (!snippetDelimiter) {
            throw new Error('webma.widgets.blogWidget::showSnippetUntilDelimiter(): no snippet delimiter defined');
        }
        snippet = entryXml.split(snippetDelimiter);
        if (snippet.length > 0) {
            snippet = '<em>' + snippet[0].replace(/<[^>]*>/g, '') + '&hellip;</em>';
        }
        return snippet;
    };

    /**
     * Import `google.feeds' module. It has to be done once.
     *
     * @var {Boolean} `google.feeds` module loaded
     */
    var isFeedsLoaded = (function() {
        if (typeof google === 'undefined') {
            throw new Error('webma.widgets.blogWidget: module "google" not loaded, maybe missing API call?');
        }
        if (typeof google.feeds === 'undefined') {
            google.load('feeds', '1');
            google.setOnLoadCallback(function() {
                isFeedsLoaded = true;
                return false; // callback function needs it
            });
            return false;
        }
        return true;
    }());

    // Public instance methods
    return {
        getContainer: function () { return container; },
        getUrl: function () { return url; },
        getNumber: function () { return number; },
        setSnippetFn: setSnippetFn,
        setSnippetDelimiter: setSnippetDelimiter,
        showSnippetUntilDelimiter: showSnippetUntilDelimiter,
        showWidget: showWidget
    };

};

/**
 * Create a frame widget.
 *
 * @param {HTMLElement} f Iframe element
 */
webma.widgets.frameWidget = function(f) {
    var that = {};

    that.frame = f;

    /**
     * Adjust iframe's height to fit its content.
     */
    that.adjustHeight = function() {
        that.frame.style.height = that.frame.contentWindow.document.body.scrollHeight + 'px';
    };

    return that;
};

/**
 * Create a 'Table of Contents' widget.
 *
 * Fold all elements with CSS class name 'chapter' and only show one at time.
 * Do not allow nested chapters. Quietly exit and do not throw any errors when
 * one or more required elements are missing. This behaviour allows to simply
 * enable the widget in any context and let itself determine when to activate.
 *
 * Using pseudoclassical pattern to create object.
 *
 * @param {HTMLElement} controller  Element that contains controlling links
 *                                  (optional, default: #webma_toc_controller)
 * @param {HTMLElement} container   Element that contains chapters (optional,
 *                                  default: #content)
 * @param {Boolean}     autoLinking Whether enable auto linking (default: false)
 */
webma.widgets.TocWidget = function(controller, container, autoLinking) {
    controller = controller || document.getElementById('webma_toc_controller');
    container = container || document.getElementById('content');
    if (!container || !controller) {
        return;
    }

    var nodes = container.getElementsByTagName('div'),
        nodelist,
        i,
        len = nodes.length,
        re = /\bchapter\b/;

    // Collection of toggable elements
    this.chapters = [];
    this.controller = [];
    // Collection of links in controller container
    nodelist = controller.getElementsByTagName('a'); // don't need live nodelist
    for (i = 0; i < nodelist.length; i++){
        this.controller[this.controller.length] = nodelist[i];
    }

    // Collect and initially fold all chapters
    for (i = 0; i < len; i++) {
        if (re.test(nodes[i].className)) {
            nodes[i].style.display = 'none';
            this.chapters[this.chapters.length] = nodes[i];
        }
    }

    // On document load depending on the anchor hash, open proper chapter
    webma.util.hashManager(this.displayChapterByHash, this);

    // TODO: igazabol erre mar semmi szukseg a hashManager ota, hiszen az ugy
    // is folyamatosan figyeli a hash valtoztast, es aszerint megmutatja a tuttit
    if (autoLinking === true) {
        this.enableAutoLinking();
    }
};

/**
 * Display chapter by current location hash.
 */
webma.widgets.TocWidget.prototype.displayChapterByHash = function() {
    var hash = window.location.hash.replace(/#/, ''),
        el = document.getElementById(hash),
        i,
        len = this.controller.length,
        nodes = this.controller,
        re = new RegExp('#' + hash + '$');
    for (i = 0; i < len; i++) {
        if (re.test(nodes[i].href)) {
            this.toggleChapter(i);
            // Scroll document to the anchor
            if (typeof el.scrollIntoView !== 'undefined') {
                el.scrollIntoView(true);
            } else {
                window.scrollTo(0, 0);
            }
            break;
        }
    }
};

/**
 * Toggle visibility of chapters when clicking on the controlling links.
 *
 * When this function is not called, manually need to invoke
 * `webma.widgets.TocWidget.toggleChapter`.
 */
webma.widgets.TocWidget.prototype.enableAutoLinking = function() {
    var i,
        len = this.controller.length,
        nodes = this.controller,
        that = this;
    for (i = 0; i < len; i++) {
        webma.util.addEvent(nodes[i], 'click', (function(i) {
            return function(e) {
                that.toggleChapter(i);
            };
        }(i)));
    }
};

/**
 * Show specified chapter, fold others.
 *
 * @param {Number} n Chapter index
 */
webma.widgets.TocWidget.prototype.toggleChapter = function(n) {
    var i,
        len = this.chapters.length;
    for (i = 0; i < len; i++) {
        if (n === i) {
            this.chapters[i].style.display = 'block';
        } else {
            this.chapters[i].style.display = 'none';
        }
    }
};

/**
 * Create a Pager widget.
 *
 * Contents wrapped in a container element with class "page" will be split
 * into several visual parts. Visitor can browse amongst them with navigation
 * links. At time, only one of them is displayed, the rest is hidden.
 *
 * Using functional pattern to create object.
 *
 * Example markup:
 *
 *   <div id="content">
 *     <div class="page">
 *     ⋮
 *     </div>
 *     <div class="page">
 *     ⋮
 *     </div>
 *     ⋮
 *   </div>
 *
 *   <div id="webma-widgets-pagerwidget"></div>
 *
 * @param  {Object}      args            Elements to build widget on.
 * @param  {HTMLElement} args.container  Parent element contains content parts
 * @param  {HTMLElement} args.controller Parent element to hold controllers
 * @param  {String}      args.lblNext    Label of 'next page' button
 * @param  {String}      args.lblPrev    Label of 'previous page' button
 * @return {Object}                      Pager widget
 */
webma.widgets.pagerWidget = function(args) {
    if (!args.container || !args.controller) {
        return that;
    }

    var controller = args.controller,
        container = args.container,
        linkNext,
        linkPrev,
        that = {};

    /**
     * Currently shown page index.
     *
     * @type {Number}
     */
    that.active = null;

    /**
     * Show or hide controllers according to currently shown page.
     */
    var _updateControllers = function() {
        // on first page
        if ((that.active > 0) === false) {
            linkPrev.style.display = 'none';
        } else {
            linkPrev.style.display = 'block';
        }
        // on last page
        if ((that.active < that.pages.length - 1) === false) {
            linkNext.style.display = 'none';
        } else {
            linkNext.style.display = 'block';
        }

    };

    /**
     * Create controller widget.
     */
    var _createControllers = function() {
        // No need to create pages if whole article is in one page
        if (that.pages.length === 0) {
            return;
        }

        // Create prev button
        linkPrev = document.createElement('A');
        linkPrev.rel = 'prev';
        linkPrev.className = 'prev';
        linkPrev.appendChild(document.createTextNode(args.lblPrev));
        webma.util.addEvent(linkPrev, 'click', function() {
            that.next(-1);
            window.scrollTo(0, 0);
        });
        controller.appendChild(linkPrev);

        // Create next button
        linkNext = document.createElement('A');
        linkNext.rel = 'next';
        linkNext.className = 'next';
        linkNext.appendChild(document.createTextNode(args.lblNext));
        webma.util.addEvent(linkNext, 'click', function() {
            that.next();
            window.scrollTo(0, 0);
        });
        controller.appendChild(linkNext);
    };

    /**
     * Find all containers with class 'page' and show only first
     *
     * @type {Array}
     */
    that.pages = (function() {
        var i,
            cls,
            nodes,
            pages = [];
        nodes = container.childNodes;
        for (i = 0; i < nodes.length; i++) {
            cls = nodes[i].className || "";
            if (cls.match(/\bpage\b/)) {
                pages[pages.length] = nodes[i];
            }
        }
        return pages;
    })();

    /**
     * Switch to next page if any.
     *
     * @param {Number} arg Negative value means reverse order (optional)
     */
    var _next = function(arg) {
        var i;
        if (that.active === null) {
            // initialize
            that.active = 0;
        } else {
            // if arg is set and negative, step backwards
            if (arg !== null && arg < 0) {
                if (that.active === 0) {
                    return;
                }
                that.active--;
            } else {
                if (that.active === (that.pages.length - 1)) {
                    return;
                }
                that.active++;
            }
        }
        // Hide all pages but the first
        for (i = 0; i < that.pages.length; i++) {
            if (i !== that.active) {
                that.pages[i].style.display = 'none';
            } else {
                that.pages[i].style.display = 'block';
            }
        }
    };

    /**
     * Show next part of article.  If argument is negative, show previous.
     *
     * Update controller's state and adjust sidebar's height as well.
     *
     * @access public
     * @param  {Number} arg Negative value reverses step order (optional)
     */
    that.next = function(arg) {
        _next(arg);
        _updateControllers();
    };

    (function() {
        _createControllers();
        that.next();
    })();

    return that;

};

/**
 * Shuffle order of elements with CSS class name "randomize".
 *
 * @requires dojo.query
 * @param    {Object}      args           Function arguments
 * @param    {HTMLElement} args.container Container element of nodes
 */
webma.widgets.randomNodesWidget = function(args) {
    var container = args.container,
        i,
        cls,
        nodes = [],
        keys,
        len;

    if (!container) {
        return;
    }

    //+ Jonas Raoni Soares Silva
    //@ http://jsfromhell.com/array/shuffle
    var shuffle = function(o){
	for (var j, x, i = o.length; i; j = parseInt(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
	return o;
    };

    // Fill an array with keys upto nodes length
    nodes = dojo.query('#' + container.id + ' > .randomize');
    keys = [];
    len = nodes.length;
    for (i = 0; i < len; i++) {
        keys[i] = i;
    }
    keys = shuffle(keys);

    // Randomize nodes order
    for (i = 0; i < len; i++) {
        container.appendChild(nodes[keys[i]]);
    }

};


/**
 * Backward compatibility
 */
webma.dojo = {};
webma.dojo.loadLightbox = webma.widgets.lightboxWidget;
