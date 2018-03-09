function copyTextToClipboard(text) {
  var textArea = document.createElement("textarea");
  textArea.style.position = 'fixed';
  textArea.style.top = 0;
  textArea.style.left = 0;
  textArea.style.width = '2em';
  textArea.style.height = '2em';
  textArea.style.padding = 0;
  textArea.style.border = 'none';
  textArea.style.outline = 'none';
  textArea.style.boxShadow = 'none';
  textArea.style.background = 'transparent';
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();

  try {
    var successful = document.execCommand('copy');
    showDialog({
        title: 'Schedule Copied to Clipboard!',
        text: `Paste the contents into UWFlow to create your schedule!<br>
        1. Navigate to uwflow.com<br>
        2. Sign In/Register with your Facebook/Email account<br>
        3. Navigate to your profile and click the "Reimport" button<br>
        4. Paste`,
        positive: {
            title: 'OK'
        }
    });
    // console.log('Copying text command was ' + msg);
  } catch (err) {
    // console.log('Oops, unable to copy');
  }

  document.body.removeChild(textArea);
}

var header =
`GO!
John Smith
My Academics
Course Selection (Undergrad only)
Search for Classes
Enroll
 	My Class Schedule	 	 	|	 	 	Shopping Cart	 	 	|	 	 	Add	 	 	|	 	 	Drop	 	 	|	 	 	Swap	 	 	|	 	 	Edit	 	 	|	 	 	Term Information	 	 	|	 	 	Exam Information
My Class Schedule
List View
Weekly Calendar View
Select Display Option
L
Winter 2018 | Undergraduate | University of Waterloo
Group Box
Collapse section Class Schedule Filter Options Class Schedule Filter Options
Show Enrolled Classes
Show Dropped Classes
Show Waitlisted Classes
`;

var footer =
`Printer Friendly Page
Go to top iconGo to top`

function convertDate(date) {
  let year = date.substr(0, date.indexOf('-'))
  let minusYear = date.substr(date.indexOf('-') + 1);
  let month = minusYear.substr(0, minusYear.indexOf('-'));
  let day = minusYear.substr(minusYear.indexOf('-') + 1);
  return `${month}/${day}/${year}`;
}

function convertTime(time) {
  let hour = parseInt(time.substr(0, time.indexOf(':')));
  let minute = time.substr(time.indexOf(':') + 1);
  if (hour >= 12) {
    return `${(hour === 12) ? 12 : hour - 12}:${minute}PM`
  } else {
    return `${hour}:${minute}AM`
  }
}

function flowConvertCourse(course) {
  let courseProfessor = course.classes[0].instructors[0];
  let commaIndex = courseProfessor.indexOf(',');
  let spaceIndex = courseProfessor.indexOf(' ');
  let lName = courseProfessor.substring(0, commaIndex);
  let fName = spaceIndex === -1 ? courseProfessor.substring(commaIndex + 1) :
  courseProfessor.substring(commaIndex + 1, spaceIndex);
  return `${course.subject} ${course.catalog_number} - ${course.title}
Status	Units	Grading	Deadlines
Enrolled
0.5
Extra to Degree
Academic Calendar Deadlines
Class Nbr	Section	Component	Days & Times	Room	Instructor	Start/End Date
${course.class_number}
${course.section.substr(course.section.indexOf(' ') + 1)}
${course.section.substr(0, course.section.indexOf(' '))}
${course.classes[0].date.weekdays} ${convertTime(course.classes[0].date.start_time)} - ${convertTime(course.classes[0].date.end_time)}
${course.classes[0].location.building} ${course.classes[0].location.room}
${fName} ${lName}
${convertDate(startDate)} - ${convertDate(endDate)}
`;
}

function flowConvertSchedule(schedule) {
  getTermDates()
  let courses = '';
  for (let i = 0; i < schedule.length; ++i) {
    courses += flowConvertCourse(schedule[i]);
  }
  return header + courses + footer;
}
