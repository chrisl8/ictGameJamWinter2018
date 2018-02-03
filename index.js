function main() {
  var mainInterval = setInterval(pollSwitches, 100);
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
             updateDisplay(json);
             // console.log(json);
           }
      }
  };
  xhttp.open("GET", "http://172.16.212.69:3000/stations", true);
  xhttp.send();
}

function updateDisplay(json) {
  for (var i = 0; i < json.entities.length; i++) {
    var entity = json.entities[i];
    var entityCollection = document.getElementsByClassName(entity.type);
    var currentEntity = entityCollection[entity.index];
    switch (entity.type) {
      case "big_button":
      case "sm_button":
      case "arm_switch":
      case "switch":
        if (entity.state == "down") {
          currentEntity.classList.add("down");
        }
        else {
          currentEntity.classList.remove("down");
        }
      break;
      case "digits":
        currentEntity.innerHTML = entity.string;
      break;
      case "knob":
        currentEntity.style.transform = "rotate("+entity.amount+"deg)";
      break;
    }
  }
}
main();
