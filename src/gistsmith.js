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

(function(Gistsmith) {
  const GISTSURL = 'https://api.github.com/users/%s%/gists';
  const POSTREG  = /^POST-(\d{1,2}-\d{1,2}-\d{2,4})/;
  const METAREG  = /^---\\(.*)---[\\n]+/m;

  var gists = [];

  var Gistsmith = function(options) {
    // get all public gists
    remote(GISTSURL.replace(/\%s\%/, options.username)).call({
      onload: function(response) {
        //var gists   = [];
        var results = response.target.response;

        for(result in results) {
          if(results[result].description.match(POSTREG)) {
            //gists.push(posts.parse(results[result]));
            console.log(results[result]);
            posts.parse(results[result], options.templates)
          }
        }
      }
    });
  }

  var remote = function(url) {
    var call = function(options) {
      var req = new XMLHttpRequest();
      req.onload = options.onload;
      req.open('GET', url, true);
      req.responseType = 'json';
      req.send();
    };

    return {
      call: call
    };
  };

  var posts = {
    parse: function(data, templates) {
      remote(data.url).call({
        onload: function(response) {
          // Gist JSON object
          var json = response.target.response.files[Object.keys(response.target.response.files)[0]];

          // seprate yaml from content
          var parts = json.content.match(/---([\s\S]*)---([\s\S]*)/);

          // clear returns and newlines from beginning and end of meta
          var meta = parts[1];
          var meta = meta.replace(/^[\r\n]+/, '');
          var meta = meta.replace(/[\r\n]+$/, '');

          // clear returns and newlines from beginning and end of content
          var content = parts[2];
          var content = content.replace(/^[\r\n]+/, '');
          var content = content.replace(/[\r\n]+$/, '');

          var info = {};
          var metaparts = meta.split(/[\r\n]+/);
          for(m in metaparts) {
            var parts = metaparts[m].split(/\s?:\s?/);
            info[parts[0]] = parts[1].replace(/^\"/, '').replace(/\"$/, '');
          }

          // set timestamp for sorting
          info.timestamp = new Date(info.date);

          views.list(templates.listing, info);
        }
      });
    }
  };

  var views = {
    list: function(template, data) {
      var div = document.createElement('div');
      div.className = 'gist';

      for(i in template) {
        views.build[template[i]](data, div);
      }

      document.getElementById('gists').appendChild(div);
    },
    build: {
      title: function(data, element) {
        var div  = document.createElement('div');
        var link = document.createElement('a');
        div.className = 'listing';
        link.innerHTML = data.title;
        link.href = 'https://google.com';
        div.appendChild(link);
        element.appendChild(div);
      },
      date: function(data, element) {
        var div  = document.createElement('div');
        div.className = 'gist-date';
        div.innerHTML = data.date;
        element.appendChild(div);
      },
      preview: function(data, element) {
        var div  = document.createElement('div');
        div.className = 'gist-preview';
        div.innerHTML = data.preview;
        element.appendChild(div);
      }
    }
  }

  if(!window.Gistsmith) {
    window.Gistsmith = Gistsmith;
  }
})();
