/**
 * Downloader.js hosts the primary functions for interfacing with
 * the youtube-dl command line backend utility
 * 
 */

$(document).ready(function(){
});

var currentState = {
  downloadFormat: "audio"
}

var maxActiveDownloads = 3;
var activeDownloads = [];
var pendingDownloads = [];
var completedDownloadCount = 0;
var failedCount = 0;

/**
 * Provided a URL, this function will attempt to download the video via youtube-dl.  There is no URL
 * checking by design and is on the user to know if the video is hosted from a domain that is compatible 
 * with youtube-dl.  
 * 
 * @param {String URL} url URL of video to download.  
 */
function download(url) {
  // Is this the first download?
  isStartingDownload();

  var dItem = new DownloadItem(url);


  // add the component for the download to the UI
  addDownloadItem(dItem);

  queueDownload(dItem);

  // Dump the current state for debugging
  dumpState();

  return dItem;
}


/**
 * Sends debug output about the current state of the downloader
 * dumps all local and global variables related to current download
 * state 
 */
function dumpState() {
    debug("Download Format: "+ currentState.downloadFormat);
    debug("ACTIVE DOWNLOADS = "+activeDownloads.length);
    activeDownloads.forEach(item => {
        debug("    "+item.id+": "+item.url);
    });
}


/**
 * check to see if this is the first download and update
 * gui accordingly
 */
function isStartingDownload() {
  if(activeDownloads.length == 0){
    $("#notifyMessage").hide();
    $("#footer").hide();
    $("#controlbar").removeClass("controlbarStart");
    setTimeout(function(){$("#footer").show();resizeAll();
                    $("#footerInfoBar").slideDown();
                  }, 1000);
    return true;
  }
  return false;
}

/**
 * Remove a download item from active downloads and clean
 * the UI 
 * @param {Download Hash} item id
 */
function removeDownload(hash) {
    $("#"+id).remove();
}

/**
 * Adds the download UI component to the main screen
 */
function addDownloadItem(item) { 
  var url = item.url;
  var downloadItem = $("<div></div>");
  $(downloadItem).addClass("downloadItem");
  $(downloadItem).addClass("ui");
  $(downloadItem).addClass("segment");
  $(downloadItem).attr("id", item.id);

  var thumbnailImg = $("<div></div>");
  $(thumbnailImg).addClass("downloadItemThumbnail");
  $(thumbnailImg).attr("id", "thumb-"+item.id);

  $(downloadItem).append(thumbnailImg);

  // Build and append loader
  var loader = $("<div></div>");
  $(loader).attr("id", "ldr-"+item.id);
  $(loader).addClass("ui active dimmer");

  var loaderData = $("<div></div>");
  $(loaderData).attr("id", "ldrdta-"+item.id);
  $(loaderData).addClass("ui indeterminate text loader");
  $(loaderData).html("Preparing...");

  $(loader).append(loaderData);
  $(downloadItem).append(loader);

  // bind play video click event
  (function(item){
    // Handle Event of thumbnail found, set thumbnail image
    item.addEventHandler("thumbnail", function() {
        $("#thumb-"+item.id).css("background-image", "url("+item.thumbnail+")");
       // queueDownload(item);
    });
    item.addEventHandler("download-complete", function() {
      downloadComplete(item);
    });
    item.addEventHandler("progress-update", function() {
      setDownloadProgress(item.id, "prog", item.progress+" complete")
    });
    $(downloadItem).click(function(e){
      e.preventDefault();
      playVideo(item.sourceUrl);
    });
  })(item);

  //queueDownload(item);

  // animation show
  $(downloadItem).css("display", "none");
  $("#downloadsContainer").append(downloadItem);
  $(downloadItem).show(700,"easeOutBounce");

}

function queueDownload(item) {
  // Add this url to active downloads
  debug("ACTIVE DOWNLOADS COUNT: "+activeDownloads.length, 5);
  debug("PENDING DOWNLOADS COUNT: "+pendingDownloads.length, 5);
  if(activeDownloads.length < maxActiveDownloads){
    debug("Download Activated: "+item.id, 5);
    activateDownload(item);
  } else {
    debug("Download Queued: "+item.id, 5);
    setDownloadProgress(item.id, "prep", "Queued...");
    pendingDownloads.push(item);
  }

  // Update total percent completed
  updateTotalPercent();
}

function activateDownload(item) {
    setDownloadProgress(item.id, "prog", "Downloading...");
    activeDownloads.push(item);
    setTimeout(function() {
      item.gatherMetaData();
      item.startDownload();
    }, 50);
}

function downloadComplete(item) {
    if(item.hasFailed){
      failedCount++;
    } else {
      completedDownloadCount++;
    }
    setDownloadProgress(item.id, "hide", null);
    //delete activeDownloads[item];
    //activeDownloads = Util.removeByAttr(activeDownloads, "id", item.id);
    activeDownloads = activeDownloads.filter(function( obj ) {
      return obj.id !== item.id;
    });
    if(pendingDownloads.length > 0) {
      activateDownload(pendingDownloads[0]);
      pendingDownloads.shift();
    }

    // TODO Make sure that elements are being removed from active downloads list
    if(activeDownloads.length == 0){
      Util.notify("All Downloads Complete", completedDownloadCount+" files have been downloaded!");
    }

    // Update total percent completed
    updateTotalPercent();
}


function updateTotalPercent() {
  var totalDownloadCount = failedCount + completedDownloadCount + pendingDownloads.length + activeDownloads.length;

  var percent = (completedDownloadCount+failedCount) / totalDownloadCount * 100.0;
  percent = Math.round(percent);

  $("#totalPercentInfo").html(percent);

  if(totalDownloadCount == completedDownloadCount + failedCount){
    $("#totalPercentInfo").html(100);
  }

  if(failedCount > 0){
    $("#failedStats").show();
    var failedPercent = failedCount / totalDownloadCount * 100.0;
    failedPercent = Math.round(failedPercent);

    var successPercent = completedDownloadCount / totalDownloadCount * 100.0;
    successPercent = Math.round(successPercent);

    $("#totalSuccessPercentInfo").html(successPercent);
    $("#totalFailPercentInfo").html(failedPercent);
  }
}


function setDownloadProgress(id, state, value) {
    switch(state) {
        case "hide":
            $("#ldr-"+id).removeClass("active");
            $("#ldrdta-"+id).html("");
            break;
        case "prep":
            $("#ldr-"+id).addClass("active");
            $("#ldrdta-"+id).addClass("indeterminate");
            $("#ldrdta-"+id).html(value);
            break;
        case "prog":
            $("#ldr-"+id).addClass("active");
            $("#ldrdta-"+id).removeClass("indeterminate");
            $("#ldrdta-"+id).html(value);
            break;
    }
}

function isDownloadingAudio() {
  return (currentState.downloadFormat == "audio");
}