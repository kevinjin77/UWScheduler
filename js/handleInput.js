Element.prototype.remove = function() {
    this.parentElement.removeChild(this);
}
NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
    for(var i = this.length - 1; i >= 0; i--) {
        if(this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
}

var terms = [];
var termNums = []
const today = new Date();
const currMonth = today.getMonth() + 1;
const currYear = today.getFullYear();
const initTerm = 1100 + ((currYear - 2010) * 10 + 1 + 4 * Math.floor((currMonth - 1)/4))
if (currMonth >= 1 && currMonth <= 4) {
  terms = ['Fall ' + (currYear-1), 'Winter ' + currYear, 'Spring ' + currYear]
  termNums = [initTerm - 2, initTerm, initTerm + 4]
} else if (currMonth >= 5 && currMonth <= 8) {
  terms = ['Winter ' + currYear, 'Spring ' + currYear, 'Fall ' + currYear]
  termNums = [initTerm - 4, initTerm, initTerm + 4]
} else if (currMonth >= 9 && currMonth <= 12) {
  terms = ['Spring ' + currYear, 'Fall ' + currYear, 'Winter ' + (currYear+1)]
  termNums = [initTerm - 4, initTerm, initTerm + 2]
}

for (let i = 0; i < 3; ++i) {
  let item = document.getElementById(`term${i}`)
  item.setAttribute('data-val', `${termNums[i]}`)
  item.innerHTML = `${terms[i]}`
}

{/* <div class="mdl-textfield mdl-js-textfield">
  <input class="mdl-textfield__input" type="text" id="course3" value="ECON102"/>
  <label class="mdl-textfield__label">Course 3</label>
</div> */}

var numCourses;
var input = document.getElementById('numCourses');
input.onchange = function () {
  for (let i = 1; i <= numCourses; ++i) {
    document.getElementById(`course${i}Input`).remove();
  }
  let form = document.getElementById('form');
  numCourses = document.getElementById('numCourses2').value;
  for (let i = 1; i <= numCourses; ++i) {
    let div = document.createElement('div');
    div.id = `course${i}Input`
    div.setAttribute('class', 'mdl-textfield mdl-js-textfield');
    componentHandler.upgradeElement(div);
    let input = document.createElement('input');
    input.setAttribute('class', 'mdl-textfield__input');
    input.setAttribute('type', 'text');
    input.id = `course${i}`
    input.onfocus = () => {
      document.getElementById(`course${i}Input`).classList.add("is-focused");
    }
    input.oninput = () => {
      document.getElementById(`course${i}Input`).classList.add("is-dirty");
    }
    input.onblur = () => {
      document.getElementById(`course${i}Input`).classList.remove("is-focused");
      (input.value === '') && document.getElementById(`course${i}Input`).classList.remove("is-dirty");
    }
    let label = document.createElement('label');
    label.setAttribute('class', 'mdl-textfield__label');
    label.innerHTML = `Course ${i}`
    div.appendChild(input);
    div.appendChild(label);
    form.appendChild(div);
  }
};
