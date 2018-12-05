var terminalVisible = false;
var debugMode = false;

$(document).ready(function(){ 
  $("#terminal").hide();
  $("#terminal").click(function(){
    $("#commandLineInput").focus();
  });
  $("#terminal").css("opacity", "1.0");

  bindCli();

  ipcRenderer.on('cliOutput', (event, arg) => {
      if(arg == "CLI-START") {
        disableInput(true);  
      } else if (arg == "CLI-DONE") {
        disableInput(false);
      } else {
        print(null, arg);
      }
  })
});

function disableInput(disabled){
    if(disabled) {
        $(".activeNewLine").hide();
    } else {
        $(".activeNewLine").show();
        $("#commandLineInput").focus();
    }
}

function bindCli() {
  $("#commandLineInput").keypress(function(e) {
    if(e.which == 13) {
      var input = $(this).val();
      $(this).val("");
      $(this).parent().find(".commandPrompt").append(" "+input);
     
      $(this).parent().find(".commandPrompt").addClass("staleClio");
      $(".activeNewLine").addClass("staleClio");


      $(".activeNewLine").removeClass("activeNewLine");
      $("#cliOutput").attr("id", "");
      var output = $("<pre></pre>");
      $(output).attr("id", "cliOutput");
    
      $("#terminal").append(output);
      executeCommand(input, output);

      var newLine = $("<div></div>");
      $(newLine).addClass("activeNewLine");
      $(newLine).append('<span class="commandPrompt">$ </span>');
      $(newLine).append(this);
      $("#terminal").append(newLine);
      $(this).focus();

    }
  });
}

function clear() {
  //  $(".staleClio").remove();
}

function executeCommand(command, output){
    switch(command) {
        case "":
            break;
        case "exit":
            showTerminal(false);
            break;
        case "debug":
            debugMode = !debugMode;
            print(output, "Debug mode set to: "+debugMode);
            break;
        case "devtools":
            Util.openDevTools();
            break;
        case "help":
            print(output, "Youtube Downloader Version 6.0.0");
            print(output, "Possible commands are:");
            print(output, "");
            print(output, " youtube-dl..............Executes the youtube-dl command line with parameters");
            print(output, " config..................Opens global configurations window")
            print(output, " help....................Displays this information");
            print(output, " exit....................Closes the terminal");
            print(output, "");
            break;
        case "config":
        case "configs":
        case "settings":
        case "configuration":
        case "configurations":
            $("#configBtn").click();
            break;
        case "clear":
            clear();
            break;
        default:
            var parts = command.split(" ");
            var arguments = [];
            for(var i = 1 ; i < parts.length; i++){
                arguments.push(parts[i]);
            }
            if(parts[0] == "youtube-dl"){
                ipcRenderer.sendSync('cli', {command: parts[0], args: arguments});
            } else if(parts[0] == "play"){ 
                print(null, "Playing video: "+parts[1]);
                playVideo(parts[0], parts[1]);
            } else {
                print(null, parts[0] + " is an unsupported command");
            }
            break;
    }
}

function showTerminal(visible){
    terminalVisible = visible;
    if(visible) {
        $("#terminal").fadeIn();
        $("#commandLineInput").focus();
    } else {
        $("#terminal").fadeOut();
    }
}

function toggleTerminal() {
    showTerminal(!terminalVisible);
}

function debug(line, flag) {
    var color = "#ffffff";
    if(flag == null || flag == 0){
        color = "#1dd1a1";
    } else if(flag == 1) {
        color = "#0abde3";
    } else if (flag ==2) {
        color = "#ff9f43";
    } else if (flag == 3) {
        color = "#ee5253";
    } else if (flag == 4) {
        color = "#f368e0";
    }
    if(debugMode) {
        print(null, "::: DEBUG ::: <span style=\"color:"+color+"\">"+line+"</span>");
        console.log(line);
    }
}

function print(output, line){
    if(output == null){
        $("#cliOutput").append(String(line)+"\n");
    } else {
        $(output).append(line+"<br/>");
    }
    $('#terminal').scrollTop($('#terminal')[0].scrollHeight);
}