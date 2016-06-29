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

const GS_POSTREG  = /^gs-post/i;
const GS_GISTSURL = "https://api.github.com/users/%s%/gists";
const GS_GISTURL  = "https://api.github.com/gists/%s%";

function GSException(message) {
  this.toString = function() {
    return "Gistsmith Exception: " + message;
  }
}

var Gistsmith = {
  options: [],
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
        options.templates.list = ['title', 'date'];
        options.templates.post = ['title', 'date', 'introduction'];
      } else if(typeof options.templates.list === "undefined") {
        options.templates.list = ['title', 'date'];
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
  construct: function(data) {
    // final object to return
    var gist = {};

    // set id this is global to github gists
    gist.id = data.id;

    // get meta information
    var metablock = data.description.match(/\[(.*)\]/);
    var metaparts = metablock[1].match(/\@(\w+)\:{1}\s+([\w\s\,\d-_=]+)\s?/g);

    for(part of metaparts) {
      part = part.replace(/^\s?/, '');
      part = part.replace(/\s?$/, '');
      var parts = /^\@(\w+)\:?\s+([\w\d\s\,\_\-\=]+)$/gi.exec(part);

      gist[parts[1]] = parts[2];
    }

    return gist;
  },
  views: {
    createList: function(gists, el, template) {
      var GS = Gistsmith.instance();

      // gist container is the wrapper that gets placed around the
      // element that the user sets in the options object
      var gistscontainer = GS.views.createElement('div', null, {'id': 'gists-container'});

      // get element by ID and get it's parent
      // then insert gistcontainer before the element
      var element = document.getElementById(el);
      var parent  = element.parentNode;
      parent.insertBefore(gistscontainer, element);

      // now remove the element so we can wrap it in the
      // gistcontainer wrapper
      element = element.parentNode.removeChild(element);

      // create element variables
      var container = title = date = null;

      for(gist of gists) {
        // container element, holds all other elements
        container = GS.views.createElement('div', null, {'class': 'gist'});
        title     = GS.views.createTitle(gist.title, gist.slug, gist.id);
        date      = GS.views.createDate(gist.date);

        // use list template to attach created elements
        for(i in template) {
          if(typeof window[template[i]] === "undefined") {
            throw new GSException("List template option: " + template[i] + " not allowed");
          }

          if(window[template[i]] !== null) {
            GS.views.attachElement(container, window[template[i]]);
          }
        }

        element.appendChild(container);
      }

      gistscontainer.appendChild(element);
    },
    createTitle: function(title, slug, id) {
      var GS = Gistsmith.instance();

      container = GS.views.createElement('div', null, {'class': 'gist-title'});
      link      = GS.views.createElement('a', title, {'href': slug, 'data-id': id});

      GS.views.addEvent(link, 'click', function(event) {
        event.preventDefault();

        var target = event.target || event.srcElement;

        var id = target.getAttribute('data-id');

        GS.post(id);
      });

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
    },
    addEvent: function(el, event, callback) {
      el.addEventListener(event, callback, false);
    }
  },
  post: function(id) {
    var GS = Gistsmith.instance();

    GS.remote(GS_GISTURL.replace(/%s%/, id)).call(function(res) {
      var item = res.target.response.files[Object.keys(res.target.response.files)[0]];

      var list = document.getElementById(GS.options.element);
          list = list.parentNode.removeChild(list);

      var gistscontainer = document.getElementById('gists-container');

      var btn = GS.views.createElement('a', 'Back to List', {'href': '#', 'id': 'gists-return'});
      gistscontainer.appendChild(btn);

      GS.views.addEvent(btn, 'click', function(event) {
        event.preventDefault();

        var gistpost = document.getElementById('gists-post');
        var gistsrtn = document.getElementById('gists-return');
        var parent   = gistpost.parentNode;
        parent.removeChild(gistpost);
        parent.removeChild(gistsrtn);

        parent.appendChild(list);
      });

      var post = GS.views.createElement('div', null, {'id': 'gists-post'});

      GS.markdown.render(GS.markdown.parse(item.content), post);

      gistscontainer.appendChild(post);
    });
  },
  markdown: {
    parse: function (content) {
      // normalize returns
      var content = content.replace(/[\r\n]/gm, '\n');

      var mk;
      var blocks = [];
      var regex = /([\s\S]+?)($|\n#|\n(?:\s*\n|$)+)/gm;

      if ((mk = /^(\s*\n)/.exec(content)) !== null) {
        regex.lastIndex = mk[0].length;
      }

      while((mk = regex.exec(content)) !== null) {
        if (mk[1].match(/^\n$/)) {
          continue;
        }

        // trim line breaks at front or back
        var text = mk[1].replace(/^[\n\r]+/, '').replace(/[\n\r]+$/, '');

        // block to be rendered
        var block = {};
        var result = [];

        // <h1> tag
        if(result = /^\#{1}\s+(.*)\s?\#{0,1}/.exec(text)) {
          block.tag = "h1";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h2> tag
        if(result = /^\#{2}\s+(.*)\s?\#{0,2}/.exec(text)) {
          block.tag = "h2";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h3> tag
        if(result = /^\#{3}\s+(.*)\s?\#{0,3}/.exec(text)) {
          block.tag = "h3";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h4> tag
        if(result = /^\#{4}\s+(.*)\s?\#{0,4}/.exec(text)) {
          block.tag = "h4";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h5> tag
        if(result = /^\#{5}\s+(.*)\s?\#{0,5}/.exec(text)) {
          block.tag = "h5";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h6> tag
        if(result = /^\#{6}\s+(.*)\s?\#{0,6}/.exec(text)) {
          block.tag = "h6";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <ul> tag
        if(result = /^\-{1}\s+(.*)\s?/.exec(text)) {
          block.tag = "ul";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <ol> tag
        if(result = /^\d+\.{1}\s+(.*)\s?/.exec(text)) {
          block.tag = "ol";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <p> tag
        if(result = /^([\w\s\d.\?\-\_\,\"\:\(\)\\\/]*)$/gm.exec(text)) {
          block.tag = "p";
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        if(result = /<div[^>]*>((.)*)<\/div>/.exec(text)) {
          block.tag = "div";
          block.text = result[1];
          blocks.push(block);
          continue;
        }
      }

      return blocks;
    },
    render: function(blocks, el) {
      var element;
      for(i in blocks) {
        if(blocks[i].tag == "ol" || blocks[i].tag == "ul") {
          if(!element.outerHTML.match(/\<ol\>|\<ul\>/)) {
            element = document.createElement(blocks[i].tag);
          }

          var li = document.createElement("li");
          li.innerHTML = blocks[i].text;
          element.appendChild(li);
        } else {
          element = document.createElement(blocks[i].tag);
          element.innerHTML = blocks[i].text;
        }

        el.appendChild(element);
      }
    }
  },
  go: function(options) {
    // get instance of Gistsmith
    var GS = Gistsmith.instance();

    // parse options
    GS.options = GS.opts.parse(options);

    GS.remote(GS_GISTSURL.replace(/%s%/, GS.options.username)).call(function(res) {
      var gists = [];
      var data  = res.target.response;
      for(item of data) {
        if(GS_POSTREG.exec(item.description) !== null) {
          gists.push(GS.construct(item));
        }
      }

      GS.views.createList(gists, GS.options.element, GS.options.templates.list);
    });
  }
}
