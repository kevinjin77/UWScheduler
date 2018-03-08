function printClass(myClass, index) {
  let courseName = myClass.subject + ' ' + myClass.catalog_number;
  let courseTitle = myClass.title;
  let courseSection = myClass.section;
  let courseEnrollment = myClass.enrollment_total + '/' + myClass.enrollment_capacity;
  let courseTimes =  myClass.classes[0].date.start_time + ' - ' + myClass.classes[0].date.end_time
  + ' ' + myClass.classes[0].date.weekdays;
  let courseLocation = myClass.classes[0].location.building + ' '
  + myClass.classes[0].location.room;
  let courseProfessor = myClass.classes[0].instructors[0];
  let courseRating = myClass.classes[0].rating;

  let table = document.getElementById('schedules' + index);
  let tr = document.createElement('tr');
  var name = document.createElement('td');
  name.setAttribute('scope', 'row');
  name.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  name.setAttribute('style', 'color: black;')
  name.innerHTML = courseName;
  var section = document.createElement('td');
  section.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  section.innerHTML = courseSection;
  var enrolled = document.createElement('td');
  enrolled.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  enrolled.innerHTML = courseEnrollment;
  var time = document.createElement('td');
  time.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  time.innerHTML = courseTimes;
  var location = document.createElement('td');
  location.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  location.innerHTML = courseLocation;
  var instructor = document.createElement('td');
  instructor.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  instructor.innerHTML = courseProfessor;
  var rating = document.createElement('td');
  rating.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  if (courseRating === 'Not Found') {
    let commaIndex = courseProfessor.indexOf(',')
    let spaceIndex = courseProfessor.indexOf(' ')
    let lName = courseProfessor.substring(0, commaIndex)
    let fName = spaceIndex === -1 ? courseProfessor.substring(commaIndex + 1) :
    courseProfessor.substring(commaIndex + 1, spaceIndex)
    let rmp = document.createElement('a');
    rmp.innerHTML = courseRating;
    rmp.setAttribute('href', `http://www.ratemyprofessors.com/search.jsp?query=${fName}+${lName}`);
    rmp.setAttribute('target', '_blank');
    rating.appendChild(rmp);
  } else {
    rating.innerHTML = courseRating;
  }
  tr.appendChild(name);
  tr.appendChild(section);
  tr.appendChild(enrolled);
  tr.appendChild(time);
  tr.appendChild(location);
  tr.appendChild(instructor);
  tr.appendChild(rating);
  table.appendChild(tr);
}

function printClasses(schedule, index) {
  schedule.forEach(myClass => {
    printClass(myClass, index);
  })
}

function printSchedules(schedules) {
  document.getElementById("loading").style.display = 'none';
  for (let i = 0; i < Math.min(schedules.length, 100); ++i) {
    let div = document.getElementById('schedules');
    let table = document.createElement('table');
    table.setAttribute('class', 'mdl-data-table mdl-js-data-table');
    table.setAttribute('style', 'width: 100%');
    let thead = document.createElement('thead');
    table.appendChild(thead);
    let tr = document.createElement('tr');
    thead.appendChild(tr);
    let headers = ['Course', 'Section', 'Enrolled', 'Time', 'Location', 'Instructor', 'Instructor Rating'];
    headers.forEach(header => {
      let th = document.createElement('th');
      th.setAttribute('scope', 'row');
      th.setAttribute('class', 'mdl-data-table__cell--non-numeric');
      th.innerHTML = header;
      tr.appendChild(th);
    })
    let tbody = document.createElement('tbody');
    tbody.setAttribute('id', 'schedules' + i);
    table.appendChild(tbody);
    div.appendChild(table);
    let list = document.createElement('ul');
    list.setAttribute('class', 'mdl-list');
    let gap = document.createElement('li');
    gap.setAttribute('class', 'mdl-mdl-list__item');
    gap.innerHTML = `Gap Rating: ${schedules[i].gapRating}`;
    let lunch = document.createElement('li');
    lunch.setAttribute('class', 'mdl-mdl-list__item');
    lunch.innerHTML = `Lunch Rating: ${schedules[i].lunchRating}`;
    let prof = document.createElement('li');
    prof.setAttribute('class', 'mdl-mdl-list__item');
    prof.innerHTML = `Professor Rating: ${parseFloat(schedules[i].professorRating).toFixed(1)}`;
    let overall = document.createElement('li');
    overall.setAttribute('class', 'mdl-mdl-list__item');
    overall.setAttribute('style', 'font-weight: bold; color: red');
    overall.innerHTML = `Overall Rating: ${parseFloat(schedules[i].overallRating).toFixed(2)}`;
    list.appendChild(gap);
    list.appendChild(lunch);
    list.appendChild(prof);
    list.appendChild(overall);
    printClasses(schedules[i], i);
    let listDiv = document.createElement('div');
    listDiv.setAttribute('style', 'float: left; display:inline-block;')
    listDiv.appendChild(list);
    div.appendChild(listDiv);
    let buttonDiv = document.createElement('div');
    buttonDiv.setAttribute('style', 'float: right; display:inline-block;');
    let exportBtn = document.createElement('button');
    exportBtn.className = 'mdl-button mdl-js-button mdl-button--icon'
    exportBtn.onclick = () => {
      copyTextToClipboard(flowConvertSchedule(schedules[i]));
    }
    let icon = document.createElement('i');
    icon.className = 'material-icons';
    icon.innerHTML = 'assignment';
    exportBtn.appendChild(icon);
    let label = document.createElement('label');
    label.innerHTML = "Copy Schedule To Clipboard"
    buttonDiv.appendChild(exportBtn);
    buttonDiv.appendChild(label)
    div.appendChild(buttonDiv);
  }
}
