function recieveMessage(msg) {
  if (msg) {
    var json = {};
    try {
      json = JSON.parse(msg);
    }
    catch (ex) {
      console.error("invalid websock message recieved");
    }
    updateDisplay(json)
  }
  else {
    console.error("invalid websock message recieved");
  }
}

function updateDisplay(json) {
  for (var i = 0; i < json.entities.length; i++) {
    var entity = json.entities[i];
    switch (entity.type) {
      var entityCollection = document.getElementsByClassName(entity.type);
      var currentEntity = entityCollection[entity.index];
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
