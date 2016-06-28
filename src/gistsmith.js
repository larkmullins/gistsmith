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
    list: function(gists) {
      console.log('views list');
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

          //GS.views.list(gist)
        });
      }

      console.log(gists);
    });
  }
}