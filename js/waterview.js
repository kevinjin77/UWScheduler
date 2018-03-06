const uwApiKey = "a0fa5a0445627c840d18a3cf30d89995";
const googleApiKey = "AIzaSyDbxPyrNeLrgCJE_Fip-jqXcIJj3BzTLEw";
var done = false;

function processDate(weekdays) {
  var index = 0;
  var dayList = [];
  if (weekdays == null) {
    return dayList;
  }
   if (index < weekdays.length && weekdays[index] == 'M') {
     dayList.push("M")
     index++
   }
   if (index < weekdays.length && weekdays[index] == 'T' && (index + 1 == weekdays.length ? true : weekdays[index + 1] != 'h')) {
     dayList.push("T")
     index++;
   }
   if (index < weekdays.length && weekdays[index] == 'W')
   {
     dayList.push("W")
     index++;
   }
   if ((index + 1) < weekdays.length && weekdays[index] == 'T' && (index + 1 == weekdays.length ? true : weekdays[index + 1] == 'h'))
   {
     dayList.push("Th")
     index += 2;
   }
   if (index < weekdays.length && weekdays[index] == 'F')
   {
     dayList.push("F")
     index++;
   }

   return dayList;
}

function isTimeConflict(start1, end1, start2, end2) {
   return ((start1.getTime() <= end2.getTime()) && (end1.getTime() >= start2.getTime()))
}

function isConflict(course1, course2) {
  if (!(course1.section.includes("LEC") && course2.section.includes("LEC"))) {
    return true
  }
  let class1 = course1.classes[0]
  let class2 = course2.classes[0]
  let days1 = processDate(class1.date.weekdays)
  let days2 = processDate(class2.date.weekdays)
  let start1 = new Date(`1/1/2016 ${class1.date.start_time}`)
  let end1 = new Date(`1/1/2016 ${class1.date.end_time}`)
  let start2 = new Date(`1/1/2016 ${class2.date.start_time}`)
  let end2 = new Date(`1/1/2016 ${class2.date.end_time}`)
  for (let i = 0; i < days1.length; ++i) {
    if (days2.includes(days1[i]) && isTimeConflict(start1, end1, start2, end2)) {
      return true
    }
  }
  return false
}

const f = (a, b) => [].concat(...a.map(d => b.map(e => [].concat(d, e))));
const cartesian = (a, b, ...c) => (b ? cartesian(f(a, b), ...c) : a);

function submit() {
  done = false;
  var myNode = document.getElementById("schedules");
  while (myNode.firstChild) {
    myNode.removeChild(myNode.firstChild);
  }

  document.getElementById("loading").style.display = 'block'

  var term = document.getElementById('term').value
  var courseArr = [];
  for (let i = 1; i <= 5; ++i) {
    var courseString = document.getElementById(`course${i}`).value.toUpperCase()
    var firstDigit = courseString.search(/\d/)
    var course = [courseString.substring(0, firstDigit), courseString.substring(firstDigit)]
    courseArr.push(course)
  }
  var morning = document.getElementById('morning').checked;
  var night = document.getElementById('night').checked;
  var courses = []
  for (let i = 0; i < 5; ++i) {
    var requestString = `http://api.uwaterloo.ca/v2/terms/${term}/`
    requestString += `${courseArr[i][0]}/${courseArr[i][1]}/schedule.json?key=${uwApiKey}`
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": requestString,
      "method": "GET"
    }

    $.ajax(settings).then(function (response) {
      if (response.data.length === 0) {
        alert(`Error! ${courseArr[i][0]}${courseArr[i][1]} is not being offered this term!`)
      }
      let validClasses = response.data.filter(myClass =>
        isClassValid(myClass)
      )
      courses.push(validClasses)
    }).then(() => {
      generateSchedules(courses)
    })
  }
}

function isClassValid(myClass) {
  return !(!morning.checked && myClass.classes[0].date.start_time === '08:30')  &&
  !(!night.checked && new Date(`1/1/2016 ${myClass.classes[0].date.start_time}`) >= new Date("1/1/2016 18:00")) &&
  !(myClass.campus !== 'UW U')
}

function isScheduleValid(schedule) {
  for (let i = 0 ; i < schedule.length - 1; ++i) {
    for (let j = i+1; j < schedule.length; ++j) {
      if (isConflict(schedule[i], schedule[j]) ||
      schedule[i].campus !== "UW U" || schedule[j].campus !== "UW U") {
        // if ((morning && (schedule[i].classes[0].start_time === "8:30" || schedule[i].classes[0].start_time === "8:30")) ||
        // (night && (new Date(`1/1/2016 ${schedule[i].classes[0].end_time}`) >= new Date("1/1/2016 18:00") ||
        // new Date(`1/1/2016 ${schedule[j].classes[0].end_time}`) >= new Date("1/1/2016 18:00")))) {
          return false
        // }
      }
    }
  }
  return true
}

function generateSchedules(courses) {
  if (courses.length < 5) return
  let schedules = cartesian(courses[0], courses[1], courses[2], courses[3], courses[4]).filter(schedule =>
    isScheduleValid(schedule)
  )
  getTimes(schedules)
  calculateProfessorRating(schedules)
}

function compareTimes(time1, time2) {
  let num1 = parseInt(time1.substring(0, time1.indexOf(':'))) * 100 + parseInt(time1.substring(time1.indexOf(':')+1))
  let num2 = parseInt(time2.substring(0, time2.indexOf(':'))) * 100 + parseInt(time2.substring(time2.indexOf(':')+1))
  return num1 - num2
}

function getTimes(schedules) {
  schedules.forEach(schedule => {
    let mTimes = []
    let tTimes = []
    let wTimes = []
    let thTimes = []
    let fTimes = []
    for (let i = 0; i < schedule.length; ++i) {
      if (schedule[i].classes[0].date.weekdays === null) return
      if (schedule[i].classes[0].date.weekdays.includes("M")) {
        mTimes.push(schedule[i].classes[0].date.start_time)
        mTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.match(/(T[^h]|T$)/)) {
        tTimes.push(schedule[i].classes[0].date.start_time)
        tTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("W")) {
        wTimes.push(schedule[i].classes[0].date.start_time)
        wTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("Th")) {
        thTimes.push(schedule[i].classes[0].date.start_time)
        thTimes.push(schedule[i].classes[0].date.end_time)
      }
      if (schedule[i].classes[0].date.weekdays.includes("F")) {
        fTimes.push(schedule[i].classes[0].date.start_time)
        fTimes.push(schedule[i].classes[0].date.end_time)
      }
    }
    schedule.mTimes = [ ...new Set(mTimes) ].sort(compareTimes)
    schedule.tTimes = [ ...new Set(tTimes) ].sort(compareTimes)
    schedule.wTimes = [ ...new Set(wTimes) ].sort(compareTimes)
    schedule.thTimes = [ ...new Set(thTimes) ].sort(compareTimes)
    schedule.fTimes = [ ...new Set(fTimes) ].sort(compareTimes)
  })
}

// function calculateDistanceRating(schedules) {
//   var buildings = []
//   schedules.forEach(schedule => {
//     for (let i = 0; i < schedule.length; ++i) {
//       let building = schedule[i].classes[0].location.building
//       if (building && !buildings.includes(building)) {
//         buildings.push(building)
//       }
//     }
//   })
//   var buildingCoords = []
//   var buildingDistances = []
//   for (let i = 0; i < buildings.length; ++i) {
//     var settings = {
//       "async": true,
//       "crossDomain": true,
//       "url": `https://api.uwaterloo.ca/v2/buildings/${buildings[i]}.json?key=${uwApiKey}`,
//       "method": "GET"
//     }
//
//     $.ajax(settings).then(function (response) {
//       noRes = (response.data.length === 0)
//       let coords = noRes ? [buildings[i], {latitude: 43.47207511, longitude: -80.54394739}] :
//       [buildings[i], {latitude: parseFloat(response.data.latitude),
//         longitude: parseFloat(response.data.longitude)}]
//       buildingCoords.push(coords)
//     }).then(() => {
//       if (buildingCoords.length === buildings.length) {
//         var buildingMap = new Map(buildingCoords)
//         for (let i = 0; i < buildings.length - 1; ++i) {
//           for (let j = i + 1; j < buildings.length; ++j) {
//             let lat1 = buildingMap.get(buildings[i]).latitude
//             let long1 = buildingMap.get(buildings[i]).longitude
//             let lat2 = buildingMap.get(buildings[j]).latitude
//             let long2 = buildingMap.get(buildings[j]).longitude
//             var settings = {
//               "async": true,
//               "crossDomain": true,
//               "url": `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${lat1},${long1}&destinations=${lat2},${long2}&mode=walking&key=${googleApiKey}`,
//               "method": "GET"
//             }
//
//             $.ajax(settings).then(function (response) {
//               console.log(response)
//               buildingDistances.push([buildings[i] + buildings[j],
//                 response.rows[0].elements[0].duration.value])
//             })
//           }
//         }
//       }
//     }).then(() => {
//       if (buildingDistances.length === (buildings.length * buildings.length - 1) / 2) {
//         let distanceMap = new Map(buildingDistances)
//         schedules.forEach((schedule) => {
//           let totalRating = 0
//           for (let i = 0; i < schedule.length; ++i) {
//             let rating = profsMap.get(schedule[i].classes[0].instructors[0]) ?
//             profsMap.get(schedule[i].classes[0].instructors[0]) : 2
//             schedule[i].classes[0].rating = rating
//             totalRating += rating
//           }
//           schedule.professorRating = totalRating / schedule.length
//         })
//       }
//     })
//   }
// }

function calculateProfessorRating(schedules) {
  var profs = []
  schedules.forEach(schedule => {
    for (let i = 0; i < schedule.length; ++i) {
      let professor = schedule[i].classes[0].instructors[0]
      if (professor && !profs.includes(professor)) {
        profs.push(professor)
      }
    }
  })
  var profsRatings = []
  for (let i = 0; i < profs.length; ++i) {
    let commaIndex = profs[i].indexOf(',')
    let spaceIndex = profs[i].indexOf(' ')
    let lName = profs[i].substring(0, commaIndex)
    let fName = spaceIndex === -1 ? profs[i].substring(commaIndex + 1) :
    profs[i].substring(commaIndex + 1, spaceIndex)
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": `http://www.ratemyprofessors.com/find/professor/?&page=1&sid=1490&queryoption=TEACHER&queryBy=teacherName&query=${fName}+${lName}`,
      "method": "GET"
    }

    $.ajax(settings).then(function (response) {
      // if (response.professors.length === 0) {
      //   var settings = {
      //     "async": true,
      // 	  "crossDomain": true,
      // 	  "url": `http://www.ratemyprofessors.com/find/professor/?&page=1&sid=1490&queryoption=TEACHER&queryBy=teacherName&query=${lName}`,
      // 	  "method": "GET"
      // 	}
      //
      //   $.ajax(settings).then(function (response) {
      //     let rating = -1
      //     for (let i = 0; i < response.professors.length === 0; ++i) {
      //       if (response.professors[i].tFname.startsWith(fName[0])) {
      //         rating = parseFloat(response.professors[i].overall_rating)
      //       }
      //     }
      //     schedule[i].classes[0].rating = (rating === -1) ? "none" : rating
      //     totalRating += (rating === -1) ? 2 : rating
      //   })
      // } else {
      noRes = (response.professors.length === 0)
      let rating = noRes ? -1 : parseFloat(response.professors[0].overall_rating)
      profsRatings.push([profs[i], rating])
      // }
    }).then(() => {
      if (profsRatings.length === profs.length && !done) {
        done = true;
        let profsMap = new Map(profsRatings)
        schedules.forEach((schedule) => {
          let totalRating = 0
          for (let i = 0; i < schedule.length; ++i) {
            let score = profsMap.get(schedule[i].classes[0].instructors[0])
            let rating = (!score || score === -1) ? 2 : score
            schedule[i].classes[0].rating = (!score || score === -1) ? 'Not Found' : score
            totalRating += rating
          }
          schedule.professorRating = totalRating / schedule.length
        })
        calculateGapRating(schedules)
        calculateLunchRating(schedules)
        calculateRating(schedules)
      }
    })
  }
}

function getGapRating(times) {
  if (!times || times.length < 2) return 0
  var rating = 0
  for (let i = 1; i < times.length - 1; i+=2) {
    let start = new Date(`1/1/2016 ${times[i]}`)
    let end = new Date(`1/1/2016 ${times[i+1]}`)
    let elapsed = (end - start) / 60000
    if (elapsed > 10 && elapsed <= 70) {
      --rating
    }
  }
  return rating
}

function calculateGapRating(schedules) {
  schedules.forEach(schedule => {
    schedule.gapRating = getGapRating(schedule.mTimes) + getGapRating(schedule.tTimes)
    + getGapRating(schedule.wTimes) + getGapRating(schedule.thTimes) + getGapRating(schedule.fTimes)
  })
}

function getLunchRating(times) {
  if (!times || (new Date(`1/1/2016 ${times[0]}`) > new Date("1/1/2016 12:30")) ||
  (new Date(`1/1/2016 ${times[times.length]}`) < new Date("1/1/2016 12:00"))) {
    return 2
  }
  let rating = 0
  for (let i = 1; i < times.length - 1; i+=2) {
    let start = new Date(`1/1/2016 ${times[i]}`)
    let end = new Date(`1/1/2016 ${times[i+1]}`)
    if ((start <= new Date("1/1/2016 14:00")) && (end >= new Date("1/1/2016 11:00"))) {
      let elapsed = (end - start) / 60000
      if (elapsed <= 30) {
        rating = Math.max(0, rating)
      } else if (elapsed <= 70) {
        rating = Math.max(1, rating)
      } else {
        rating = Math.max(2, rating)
      }
    }
  }
  return rating
}

function calculateLunchRating(schedules) {
  schedules.forEach(schedule => {
    schedule.lunchRating = getLunchRating(schedule.mTimes) + getLunchRating(schedule.tTimes)
    + getLunchRating(schedule.wTimes) + getLunchRating(schedule.thTimes) + getLunchRating(schedule.fTimes)
  })
}

function calculateRating(schedules) {
  schedules.forEach(schedule => {
    schedule.overallRating = schedule.professorRating * 20 +
    schedule.lunchRating +
    schedule.gapRating
  })
  console.log(schedules)
  schedules.sort((a, b) => b.overallRating - a.overallRating)
  printSchedules(schedules)
}

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
  var name = document.createElement('th');
  name.setAttribute('scope', 'row');
  name.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  name.appendChild(document.createTextNode(courseName));
  var section = document.createElement('td');
  section.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  section.appendChild(document.createTextNode(courseSection));
  var enrolled = document.createElement('td');
  enrolled.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  enrolled.appendChild(document.createTextNode(courseEnrollment));
  var time = document.createElement('td');
  time.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  time.appendChild(document.createTextNode(courseTimes));
  var location = document.createElement('td');
  location.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  location.appendChild(document.createTextNode(courseLocation));
  var instructor = document.createElement('td');
  instructor.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  instructor.appendChild(document.createTextNode(courseProfessor));
  var rating = document.createElement('td');
  rating.setAttribute('class', 'mdl-data-table__cell--non-numeric');
  rating.appendChild(document.createTextNode(courseRating));
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
  document.getElementById("loading").style.display = 'none'
  for (let i = 0; i < 100; ++i) {
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
      th.appendChild(document.createTextNode(header));
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
    gap.appendChild(document.createTextNode(`Gap Rating: ${schedules[i].gapRating}`));
    let lunch = document.createElement('li');
    lunch.setAttribute('class', 'mdl-mdl-list__item');
    lunch.appendChild(document.createTextNode(`Lunch Rating: ${schedules[i].lunchRating}`));
    let prof = document.createElement('li');
    prof.setAttribute('class', 'mdl-mdl-list__item');
    prof.appendChild(document.createTextNode(`Professor Rating: ${parseFloat(schedules[i].professorRating).toFixed(1)}`));
    let overall = document.createElement('li');
    overall.setAttribute('class', 'mdl-mdl-list__item');
    overall.setAttribute('style', 'font-weight: bold; color: red');
    overall.appendChild(document.createTextNode(`Overall Rating: ${parseFloat(schedules[i].overallRating).toFixed(2)}`));
    list.appendChild(gap);
    list.appendChild(lunch);
    list.appendChild(prof);
    list.appendChild(overall);
    table.appendChild(list)
    printClasses(schedules[i], i);
  }
}
