class DownloadItem {

    constructor(downloadUrl) {
        this.id = Util.randHash(10);
        this.downloadUrl = downloadUrl;
        this.downloadProgress = "0%";
        this.metaData = {
            hasError: false, 
            sourceUrl: null,
            thumbnail: null,
            title: "Unknown"
        };
        this.eventHandlers = [];

        this.registerEvents();
        debug("Download Item Initialized: "+this.id +" -> "+downloadUrl, 1);

        //this.gatherMetaData();

    }

    get hasFailed() {
        return this.metaData.hasError;
    }

    get url() {
        return this.downloadUrl;
    }

    get id() {
        return this._id;
    }

    get progress() {
        return this.downloadProgress;
    }

    set progress(p) {
        this.downloadProgress = p;
    }

    set id(hash) {
        this._id = hash;
    }

    get sourceUrl() {
        return this.metaData.sourceUrl;
    }

    get thumbnail() {
        return this.metaData.thumbnail;
    }

    set thumbnail(url) {
        this.metaData.thumbnail = url;
        this.eventTriggered("thumbnail");
    }

    addEventHandler(event, func){
        if(this.eventHandlers[event] == undefined){
            this.eventHandlers[event] = [];
        }

        this.eventHandlers[event].push(func);
    }

    registerEvents() {
        ipcRenderer.on(this.id, (event, handle, arg) => {
              debug("EVT {"+this.id+"} | "+handle+ " | "+arg, 4);

              switch(handle) {
                  case "sourceUrl":
                    if (arg == "YTDL-DONE") break;
                    this.metaData.sourceUrl = arg;
                    debug("Source URL Set to : "+this.sourceUrl);
                    break;
                  case "thumbnail":
                        if (arg == "YTDL-DONE") break;
                        var part = arg.trim().replace(/[\r\n]/g, '').replace("\n", "").replace("\r", "");
                        var elements = part.trim().split(" ");
                        elements.forEach(element => {
                            element = element.replace(/[\r\n]/g,'');
                            if(element.endsWith(".jpg") || element.endsWith(".png") || element.endsWith(".gif")){
                                this.metaData.thumbnail = element;
                                debug("Thumbnail set to : "+this.metaData.thumbnail);
                                this.eventTriggered("thumbnail");
                            }
                        });
                        if(arg.toLowerCase().includes("no thumbnails") && this.metaData.thumbnail == null){
                            debug("Thumbnail set to default, no thumbnail found");
                            // TODO - PROVIDE DEFAULT THUMBNAIL
                            this.metaData.thumbnail = "";
                            this.eventTriggered("thumbnail");
                        }
                    break;
                    case "download":
                        if(arg.toLowerCase().includes("error:")){
                            this.metaData.hasError = true;
                        }
                        if(arg.toLowerCase().includes("% of ")){
                            arg = arg.replace("\t", " ");
                            var parts = arg.split(" ");
                            parts.forEach(part => {
                                if(part.includes("%")){
                                    this.progress = part;
                                    this.eventTriggered("progress-update");
                                }
                            });
                        }
                        if(arg == "YTDL-DONE"){
                            debug(this.id+" DOWNLOAD COMPLETED");
                            this.eventTriggered("download-complete");
                        }
                    break;
              }

        });
    }

    eventTriggered(event) {
        for (var key in this.eventHandlers) {
            if(key == event) {
                this.eventHandlers[key].forEach(f => {
                    f();
                });
            }
        }
    }

    startDownload() {
        this.callAgent({
            hash:this.id,
            handle: "download",
            command: "youtube-dl",
            //args: ["-o", "c:\\users\\bradl_x1hnbb2\\Desktop\\ytdls\\%(title)s.%(ext)s" , "-f", "best", this.downloadUrl]
            //--extract-audio --audio-format mp3
            //args: ["-o", "c:\\users\\bradl_x1hnbb2\\Desktop\\ytdls\\%(title)s.%(ext)s" , "-f", "best", "--extract-audio", "--audio-format", "mp3", this.downloadUrl]
            args: ["-o", "c:\\users\\bradl_x1hnbb2\\Desktop\\ytdls\\%(title)s.%(ext)s" , "-f", "best",  this.downloadUrl]
        });
        // ipcRenderer.sendSync('ytdl',{
            // hash: this.id,
            // handle: 'download',
            // command: 'youtube-dl',
            // args: ["-o", "C:\\users\\bradl_x1hnbb2\\Desktop\\vids\\tumblr\\%(title)s.%(ext)s" , "-f", "best", this.downloadUrl]
        // });
    }

    cancelDownload() {

    }

    gatherMetaData() {

        // Get raw source url
       // ipcRenderer.sendSync('ytdl', {
       //                               hash: this.id,
     //                                 handle: "sourceUrl",
   //                                   command: "youtube-dl", 
 //                                     args: ["-f", "best", "-g", this.downloadUrl]
//                            });

        this.callAgent({
            hash:this.id,
            handle: "sourceUrl",
            command: "youtube-dl",
            args: ["-f", "best", "-g", this.downloadUrl]
        });

        // Get thumbnail url
        this.callAgent({
            hash:this.id,
            handle: "thumbnail",
            command: "youtube-dl",
            args: ["--list-thumbnails", this.downloadUrl]
        });
       // ipcRenderer.sendSync('ytdl', {
        //                              hash: this.id,
         //                             handle: "thumbnail",
          //                            command: "youtube-dl", 
           //                           args: ["--list-thumbnails", this.downloadUrl]
            //                });
    }

    callAgent(args) {
        return new Promise(resolve => {
            ipcRenderer.send('ytdl', args)
        });
    }
}