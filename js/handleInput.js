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

var termMap = new Map();
for (let i = 0; i < terms.length; ++i) {
  termMap.set(terms[i], termNums[i]);
}

$('#calendar').fullCalendar({
  defaultView: 'agendaWeek',
  weekends: false,
  allDaySlot: false,
  minTime: '8:00:00',
  maxTime: '16:30:00',
  contentHeight: 'auto',
  header: false,
  aspectRatio: 1
});

var inputMode = 'manual';
$('#manual').click(() => {
  if (inputMode !== 'manual') {
    document.getElementById('form').style.display = 'block';
    document.getElementById('importForm').style.display = 'none';
    document.getElementById('importQuest').value = '';
    inputMode = 'manual';
  }
})

$('#import').click(() => {
  if (inputMode !== 'import') {
    document.getElementById('form').style.display = 'none';
    document.getElementById('importForm').style.display = 'block';
    document.getElementById('questBox').classList.remove("is-dirty");
    inputMode = 'import';
  }
})

for (let i = 0; i < 3; ++i) {
  let item = document.getElementById(`term${i}`)
  item.setAttribute('data-val', `${termNums[i]}`)
  item.innerHTML = `${terms[i]}`
}

var numCourses;
var input = document.getElementById('numCourses');
input.onchange = function () {
  for (let i = 1; i <= numCourses; ++i) {
    if (document.getElementById(`course${i}Input`)) {
      document.getElementById(`course${i}Input`).remove();
    }
  }
  let form = document.getElementById('form');
  numCourses = document.getElementById('numCourses2').value;
  for (let i = 1; i <= numCourses; ++i) {
    let div = document.createElement('div');
    div.id = `course${i}Input`
    div.setAttribute('style', 'display: block;');
    div.setAttribute('class', 'mdl-textfield mdl-js-textfield mdl-textfield--floating-label');
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

var gapSlider = document.getElementById('gapSlider');
gapSlider.onchange = function () {
  document.getElementById('gapWeight').innerHTML = gapSlider.value;
}

var lunchSlider = document.getElementById('lunchSlider');
lunchSlider.onchange = function () {
  document.getElementById('lunchWeight').innerHTML = lunchSlider.value;
}

var professorSlider = document.getElementById('professorSlider');
professorSlider.onchange = function () {
  document.getElementById('professorWeight').innerHTML = professorSlider.value;
}
