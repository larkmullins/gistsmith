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
  const GISTURL  = 'https://api.github.com/gists/%s%';
  const POSTREG  = /^post/i;
  const METAREG  = /^---\\(.*)---[\\n]+/m;

  var gists = [];

  var Gistsmith = function(opt) {
    var opt = options(opt);

    // get all public gists
    remote(GISTSURL.replace(/\%s\%/, opt.username)).call({
      onload: function(response) {
        //var gists   = [];
        var results = response.target.response;

        for(result in results) {
          if(results[result].description.match(POSTREG)) {
            posts.parse(results[result], opt)
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

  var options = function(options) {
    // date format
    options.dateFormat = typeof options.dateFormat === 'undefined' ? 'mm/dd/YYYY' : options.dateFormat;
    return options;
  }

  var posts = {
    parse: function(data, options) {
      remote(data.url).call({
        onload: function(response) {
          var info = {};
          info.id = response.target.response.id;

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

          //var info = {};
          var metaparts = meta.split(/[\r\n]+/);
          for(m in metaparts) {
            var parts = metaparts[m].split(/\s?:\s?/);
            info[parts[0]] = parts[1].replace(/^\"/, '').replace(/\"$/, '');
          }

          // set timestamp for sorting
          info.timestamp = new Date(info.date);

          views.init(options);
          views.list(info);
        }
      });
    },
    view: function(data) {
      remote(GISTURL.replace(/\%s\%/, data.id)).call({
        onload: function(response) {
          var data = response.target.response;
          var json = data.files[Object.keys(data.files)[0]];

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

          var blocks = markdown.parse(content);

          // render HTML
          var html = markdown.render(blocks);

          //views.post(response.target.response);
        }
      })
    }
  };

  var views = {
    init: function(options) {
      views.options = options;
    },
    list: function(data) {
      var template = views.options.templates.listing;
      var div = document.createElement('div');
      div.className = 'gist';

      for(i in template) {
        views.build[template[i]](data, div);
      }

      document.getElementById('gists').appendChild(div);
    },
    post: function(data) {

    },
    build: {
      title: function(data, element) {
        var div  = document.createElement('div');
        var link = document.createElement('a');
        div.className = 'listing';
        link.innerHTML = data.title;
        link.href = 'https://google.com';
        link.addEventListener('click', function(evt) {
          evt.preventDefault();
          posts.view(data);
        }, false);
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
      },
      introduction: function(data, element) {
        if(typeof data.introduction != 'undefined') {
          var div  = document.createElement('div');
          div.className = 'gist-introduction';
          div.innerHTML = data.introduction;
          element.appendChild(div);
        }
      }
    }
  };

  var markdown = {
    parse: function(content) {
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
        var text = mk[1].replace(/^\n+/, '').replace(/\n+$/, '');

        // block to be rendered
        var block = {};
        var result = '';

        // <h1> tag
        if(result = /^\#{1}\s+(.*)\s?\#{0,1}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h1';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h2> tag
        if(result = /^\#{2}\s+(.*)\s?\#{0,2}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h2';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h3> tag
        if(result = /^\#{3}\s+(.*)\s?\#{0,3}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h3';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h4> tag
        if(result = /^\#{4}\s+(.*)\s?\#{0,4}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h4';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h5> tag
        if(result = /^\#{5}\s+(.*)\s?\#{0,5}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h5';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <h6> tag
        if(result = /^\#{6}\s+(.*)\s?\#{0,6}/.exec(text)) {
          block.type = 'header';
          block.tag = 'h6';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <ol> tag
        if(result = /^\-{1}\s+(.*)\s?/.exec(text)) {
          block.tag = 'ol';
          block.text = result[1];
          blocks.push(block);
          continue;
        }

        // <p> tag
        if(result = /^([\w\s.\?\-\_]*)$/gm.exec(text)) {
          block.type = 'paragrah';
          block.tag = 'p';
          block.text = result[1];
          blocks.push(block);
          continue;
        }
      }

      //console.log(blocks);

      return blocks;
    },
    render: function(blocks) {
      var element;
      for(i in blocks) {
        if(blocks[i].tag == 'ol') {
          if(!element.outerHTML.match(/\<ol\>/)) {
            console.log('hello');
          }
        } else {
          element = document.createElement(blocks[i].tag);
        }

        element.innerHTML = blocks[i].text;
        document.getElementById('markdown').appendChild(element);
      }
    }
  };

  if(!window.Gistsmith) {
    window.Gistsmith = Gistsmith;
  }
})();
