(function(Gistsmith) {
  const GISTSURL = 'https://api.github.com/users/%s%/gists';
  const POSTREG  = /^POST-(\d{1,2}-\d{1,2}-\d{2,4})/;
  
  var Gistsmith = function(options) {



    // get all public gists
    remote(GISTSURL.replace(/\%s\%/, options.username)).call({
      onload: function(response) {
        var gists = posts.init(response.target.response);


        console.log(gists);
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
    init: function(data) {
      var gists = [];
      for(i in data) {
        if(date = data[i].description.match(POSTREG)) {
          gists.push({
            date: date[1],
            id: data[i].id
          });
        }
      }
      return gists;
    },

    list: function(data) {
      var date = data.date
    }
  };

  if(!window.Gistsmith) {
    window.Gistsmith = Gistsmith;
  }
})();
