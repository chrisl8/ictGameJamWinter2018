function main() {
  var mainInterval = setInterval(pollSwitches, 500);
  window.playerno = getParams();
  document.getElementById("title").innerHTML = "Station #" + (window.playerno+1);
}

function getParams() {
  var query = parseInt(top.location.search.split("?playerno=")[1]);
  return query;
}

function pollSwitches() {
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
      if (this.readyState == 4 && this.status == 200) {
         // Typical action to be performed when the document is ready:
           var json = {};
           try {
             json = JSON.parse(xhttp.responseText);
           }
           catch (ex) {
             console.error("invalid websock message recieved");
             showError();
           }
           if (json != {}) {
             // console.log(json);
             updateDisplay(json.buttonState);
             updateTime(json.timeRemaining);
             hideError();
           }
      }
  };
  xhttp.onerror = function() {
    showError();
  };
  xhttp.open("GET", "http://172.16.212.69:3000/stations", true);
  xhttp.send();
}

function showError() {
  document.getElementsByClassName("error")[0].style.display = "block";
  document.getElementsByClassName("blackout")[0].style.display = "block";
}

function hideError() {
  document.getElementsByClassName("error")[0].style.display = "none";
  document.getElementsByClassName("blackout")[0].style.display = "none";
}

function updateTime(time) {
  document.getElementsByClassName("digits")[0].innerHTML = time;
}

function updateDisplay(json) {
  for (var i = 0; i < json[window.playerno].length; i++) {
    var entity = json[window.playerno][i];
    var entityCollection = document.getElementsByClassName(entity.subType + "_" + entity.type);
    var index = parseInt(entity.label.replace(/[a-zA-Z]/g,""));
    if (Number.isNaN(index)) {
      index = 0;
    }
    else {
      index--;
    }
    var currentEntity = entityCollection[index];
    switch (entity.subType + "_" + entity.type) {
      case "big_button":
      case "small_button":
        if (entity.currentStatus == "on") {
          currentEntity.classList.add("down");
        }
        else {
          currentEntity.classList.remove("down");
        }
      break;
      case "arm_switch":
        if (entity.currentStatus == "on") {
          currentEntity.getElementsByClassName("arm_small_switch")[0].checked = true;
          currentEntity.classList.add("down");
        }
        else {
          currentEntity.getElementsByClassName("arm_small_switch")[0].checked = false;
          currentEntity.classList.remove("down");
        }
      break;
      case "small_switch":
        if (entity.currentStatus == "on") {
          currentEntity.checked = true;
        }
        else {
          currentEntity.checked = false;
        }
      break;
      case "undefined_knob":
        var angle = (parseInt(entity.currentStatus) * -0.352);
        currentEntity.style.transform = "rotate("+angle+"deg)";
      break;
    }
  }
}
//wait to load
setTimeout(main,100);
