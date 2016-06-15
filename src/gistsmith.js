(function(Gistsmith) {
  var Gistsmith = function(options) {
    // get all public gists
    remote(options.gist_url).call({
      onload: function(response) {
        console.log(response.target.response);
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
    }

    return {
      call: call
    }
  }

  if(!window.Gistsmith) {
    window.Gistsmith = Gistsmith;
  }
})();
