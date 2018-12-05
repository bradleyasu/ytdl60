const {ipcRenderer} = require ('electron');


$(document).ready(function() {

  $("#footerInfoBar").hide();
  $("#failedStats").hide();

  // handle window size and auto resize
  $(window).resize(function(){resizeAll()});
  
  $("#downloadStateToggle").click(toggleDownloadFormat);

  $('.tabular.menu .item').tab();

  resizeAll();
  bindHotKeys();
  $("#urlInput").focus();
});

function bindHotKeys() {
  // When the user presses enter key in input to download a url
  $("#urlInput").keypress(function(e) {
    if(e.key == "Enter") {
      var input = $(this).val();
      $(this).val("");
      if(input.endsWith(":t!")){
        input = input.replace(":t!", "");
        downloadTumblr(input);
      } else if(input.includes("&list") && input.includes("youtu")) {
        downloadYoutubePlaylist(input);
      }else {
        download(input);
      }
    }

  });

  $('body').keyup(function(event){
    if(event.key == "F1") {
      event.preventDefault();
      toggleTerminal();
    }
    if(event.key == "F2") {
      event.preventDefault();
      toggleDownloadFormat();
    }
    if(event.key == "F3") {
      event.preventDefault();
      showGlobalConfigs();
    }
    if(event.key == "`") {
      event.preventDefault();
      $("#urlInput").focus();
    }
  });
}

function showGlobalConfigs() {
  $("#globalConfigs").modal({
    blurring:true
  }).modal("show");
}

function playVideo(url) {
  debug("Playing Video: "+url);
  $("#videoPlayer").modal({
    blurring: true,
    onVisible: function() {
      $("#videoPlayerElement").empty();
      var source = $("<source>");
      $(source).attr('src', url);
      $("#videoPlayerElement").append(source);
      document.getElementById("videoPlayerElement").load();
      document.getElementById("videoPlayerElement").play();
    },
    onHidden: function(){
      document.getElementById("videoPlayerElement").pause();
      resizeAll();
    }
  }).modal('show');
}

function resizeAll() {
  $("#downloadsContainer").height($('body').outerHeight() - $("#footer").outerHeight() - $("#controlbar").outerHeight()-20);
  $("#terminal").height($('body').height() - 8);
}


function toggleDownloadFormat() {
  if(currentState.downloadFormat == "audio") {
    currentState.downloadFormat = "video";
    $("#downloadStateIcon").removeClass("music");
    $("#downloadStateIcon").addClass("film");
  } else {
    currentState.downloadFormat = "audio";
    $("#downloadStateIcon").removeClass("film");
    $("#downloadStateIcon").addClass("music");
  }
}



String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};


// YouTube PlayList parsing and selction

function downloadYoutubePlaylist(url) { 
  ipcRenderer.on("playlist-parse", (event, handle, arg) => {
    if(handle == "playlist"){
      var json = JSON.parse(arg);
      download("https://youtube.com/watch?v="+json.id);
    }
  });
  setTimeout(function() {
    Util.callAgent("ytdl", {
        hash: "playlist-parse",
        handle: "playlist",
        command: "youtube-dl",
        args: ["-j", "--flat-playlist", url]
    });
  }, 200);
}

// TEMPORARY STUFF
var API_KEY = "Y7i0Sf2WGphZl5UIRFNyQERsrGifS23D7AvxW4X2cTRyCO0nQJ";
var blogs = [];

function downloadTumblr(name) {
  queryApi(name, 0, 0);
}


function queryApi(blogName, level, offset) {
    if(level > 2) {
      return;
    }
    if(blogName == undefined || blogName == "" || blogName == null ||$.inArray(blogs, blogName) != -1){
        return;
    }
    blogs.push(blogName);
    var apiUrl = "https://api.tumblr.com/v2/blog/"+blogName+"/posts/video?api_key="+API_KEY+"&limit=20&offset="+offset;

    $.getJSON( apiUrl, function( data ) {
        var posts = data.response.posts;

        //$(".result").hide();
        for(index in posts){
            var post = posts[index];
            // download("https://"+blogName+".tumblr.com/post/"+post.id);
            // gaycumandfun - thelodginghouse
            var item = download(post.video_url);
            item.thumbnail = post.thumbnail_url;
            //queryApi(post.source_title, level++);
        }
        if(posts.length == 20) {
          queryApi(blogName, level, offset+20);
        }
    });
}

