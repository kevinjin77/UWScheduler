# UWScheduler

An application to help Waterloo students find the best possible schedules to fit their needs. Check it out at [uwscheduler.com](https://www.uwscheduler.com)!

![Landing Page](https://github.com/kevinjin77/UWScheduler/raw/master/img/inputForm.png "Landing Page")

# Features
## Course Entry
There are two methods of importing your schedule into UWScheduler.

### Manual Entry
Under the manual entry tab, simply select the term you wish to generate the schedule for. Then enter, the number of courses you are taking, followed by the course codes of each course. (Eg. CS241e, MATH239, BIOL130, etc.)

### Importing from Quest
To import your courses from Quest, simply follow these steps:
1. [Sign in to Quest](https://quest.pecs.uwaterloo.ca/psp/SS/?cmd=login&languageCd=ENG&) and click Enroll.
2. Select all and copy. (List View)
3. Paste into the textbox!
4. Click the "Generate Schedules" button.

## Preferences
In the preferences section, you can enter how important each of the following factors is to creating the best schedule for you.
Each factor can be rated from a scale of 0 (uninimportant) to 10 (extremely important).
- **Gap** (Rate this highly if you want as few of the annoying 70 minute gaps in your schedule as possible.)
- **Lunch** (Rate this highly if you want a lengthy period of time for lunch on as many days as possible.)
- **Professor** (Rate this highly if you want the best professors according to their ratings on RateMyProfessors.)
You can also enter if you're OK with 8:30AM classes, or night classes (after 6:00PM).

## Generating Schedules
Once all of your courses and preferences are entered, click the Generate Schedules button!

### What's in a Schedule?
After loading briefly, a list of the top 100 schedules will appear underneath the form.
Each schedule contains all of the courses that have been selected for your schedule, as well as information about the location, times, enrollment, and more.
Underneath every schedule is a list of its ratings, as well as its overall rating, which is highlighted in red.

![Sample Schedule](https://github.com/kevinjin77/UWScheduler/raw/master/img/sampleSchedule.png "Sample Schedule")

### Show Tutorials
Also under each schedule is the "Show Tutorials" button, which upon clicking will add all of the tutorials to that given schedule.

### Show Calendar
Using FullCalendar, users may also view their schedule directly from the website.

![Sample Calendar](https://github.com/kevinjin77/UWScheduler/raw/master/img/sampleCalendar.png "Sample Calendar")

### Exporting to UWFlow
Finally, each schedule has the option to export it directly to UWFlow.
1. Click on "Copy Schedule to Clipboard"
2. After the modal appears, navigate to [UWFlow](https://uwflow.com/)
3. Sign in using either your Facebook/Email account.
4. Click the "Reimport" Button.
5. Highlight the textbox, and paste!
