function main() {
  var mainInterval = setInterval(pollSwitches, 1000);
  window.playerno = getParams();
}

function getParams() {
  var query = top.location.search.split("?playerno=")[1];
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
           }
           if (json != {}) {
             // console.log(json);
             updateDisplay(json);
           }
      }
  };
  xhttp.open("GET", "http://172.16.212.69:3000/stations", true);
  xhttp.send();
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
      case "arm_switch":
      case "small_switch":
        console.log(entity.currentStatus);
        if (entity.currentStatus == "on") {
          console.log(entity.subType + "_" + entity.type,currentEntity,index, entity.currentStatus);
          currentEntity.classList.add("down");
        }
        else {
          currentEntity.classList.remove("down");
        }
      break;
      case "digits":
        currentEntity.innerHTML = entity.string;
      break;
      case "undefined_knob":
        currentEntity.style.transform = "rotate("+entity.currentSetting+"deg)";
      break;
    }
  }
}
main();
