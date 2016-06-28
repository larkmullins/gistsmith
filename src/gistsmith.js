/*
 * REGEX Get YAML Metadata and Content    ^---\\(.*)---[\\n]+
 * REGEX Get line breaks at the end       (\\n)+$
 * REGEX Get line break at the start      ^\\n
 * REGEX Get all line breaks to replace   \\n
 *
 * GIST YAML Tags
 * - date
 * - slug
 * - title
 * - excerpt
 * - callout
 */

const GS_GISTSURL = "https://api.github.com/users/%s%/gists";
const GS_GISTURL  = "https://api.github.com/gists/%s%";

function GSException(message) {
  this.toString = function() {
    return "Gistsmith Exception: " + message;
  }
}

var Gistsmith = {
  instance: function() {
    return Gistsmith;
  },
  opts: {
    parse: function(options) {
      if(typeof options.username === "undefined") {
        throw new GSException("No Github username was provided");
      }

      if(typeof options.element === "undefined") {
        options.element = "gists";
      }

      if(typeof options.templates === "undefined") {
        options.templates = {};
        options.templates.list = ['title', 'date', 'excerpt'];
        options.templates.post = ['title', 'date', 'introduction'];
      } else if(typeof options.templates.list === "undefined") {
        options.templates.list = ['title', 'date', 'excerpt'];
      } else if(typeof options.templates.post === "undefined") {
        options.templates.post = ['title', 'date', 'introduction'];
      }

      return options;
    }
  },
  remote: function(url) {
    this.call = function(func) {
      var request = new XMLHttpRequest();
          request.onload = func;
          request.open("GET", url, true);
          request.responseType = "json";
          request.send();
    }

    return this;
  },
  // strips out meta infrmation and returns a full gist object
  construct: function(id, data) {
    var gist = {};

    // set ID
    gist.id = id;

    // seprate yaml from content
    var parts = data.content.match(/---([\s\S]*)---([\s\S]*)/);

    if(parts === null) {
      throw new GSException("Gist: " + id + " does not have YAML");
    }

    // clear returns and newlines from beginning and end of content
    var content = parts[2];
    var content = content.replace(/^[\r\n]+/, "");
    var content = content.replace(/[\r\n]+$/, "");
    gist.content = content;

    // clear returns and newlines from beginning and end of meta
    var yaml = parts[1];
    var yaml = yaml.replace(/^[\r\n]+/, "");
    var yaml = yaml.replace(/[\r\n]+$/, "");

    var meta = yaml.split(/[\r\n]+/);
    for(i in meta) {
      var parts = meta[i].split(/\s?:\s?/);
      gist[parts[0]] = parts[1].replace(/^\"/, "").replace(/\"$/, "");
    }

    return gist;
  },
  views: {
    createList: function(gist, element, template) {
      var GS = Gistsmith.instance();

      // create element variables
      var container =
          title =
          date =
          excerpt = null;

      // container element, holds all other elements
      container = GS.views.createElement('div', null, {'class': 'gist'});
      title     = GS.views.createTitle(gist.title, gist.slug);
      date      = GS.views.createDate(gist.date);

      if(typeof gist.excerpt !== "undefined") {
        excerpt = GS.views.createExcerpt(gist.excerpt);
      }

      // use list template to attach created elements
      for(i in template) {
        if(typeof window[template[i]] === "undefined") {
          throw new GSException("List template option: " + template[i] + " not allowed");
        }

        if(window[template[i]] !== null) {
          GS.views.attachElement(container, window[template[i]]);
        }
      }

      element = document.getElementById(element);
      element.appendChild(container);
    },
    createTitle: function(title, slug) {
      var GS = Gistsmith.instance();

      container = GS.views.createElement('div', null, {'class': 'gist-title'});
      link      = GS.views.createElement('a', title, {'href': slug});

      GS.views.attachElement(container, link);

      return container;
    },
    createDate: function(date) {
      var GS = Gistsmith.instance();

      container = GS.views.createElement('div', null, {'class': 'gist-date'});
      date      = GS.views.createElement('span', date, {});

      GS.views.attachElement(container, date);

      return container;
    },
    createExcerpt: function(excerpt) {
      var GS = Gistsmith.instance();

      container = GS.views.createElement('div', null, {'class': 'gist-excerpt'});
      excerpt   = GS.views.createElement('p', excerpt, {});

      GS.views.attachElement(container, excerpt);

      return container;
    },
    createElement: function(el, html, attr) {
      var e = document.createElement(el);
      for(i in attr) {
        e.setAttribute(i, attr[i]);
      }

      // add inner html
      if(html !== null) {
        e.innerHTML = html;
      }

      return e;
    },
    attachElement: function(parent, child) {
      parent.appendChild(child);
    }
  },
  go: function(options) {
    // get instance of Gistsmith
    var GS = Gistsmith.instance();

    // holds array of Gist objects
    var gists = [];

    // parse options
    options = GS.opts.parse(options);

    GS.remote(GS_GISTSURL.replace(/%s%/, options.username)).call(function(res) {
      var data = res.target.response;
      for(item in data) {
        // get individual gist ID
        var id = data[item].id;

        // use the Gist ID to get the actual gist data
        GS.remote(GS_GISTURL.replace(/%s%/, id)).call(function(res) {
          var item = res.target.response.files[Object.keys(res.target.response.files)[0]];
          var gist = GS.construct(id, item);

          gists.push(gist);

          GS.views.createList(gist, options.element, options.templates.list);
        });
      }
    });
  }
}
