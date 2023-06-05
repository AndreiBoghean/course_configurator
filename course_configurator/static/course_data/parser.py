import json
import requests
import xml.etree.ElementTree as ET # used to parse the xml and retrieve the html we're interested in
from bs4 import BeautifulSoup # used to parse the html
import unicodedata
""" here is a rought outline of the json datastructure we aim to create:

courses = [
    "code": "name",
    "title": "code",
    "classes": [
        "class": "class code",
        "section": "section title (eg lb01)",
        "status": status (closed/open/etc.),

        "meetings": [
                "time of occurance": <unix timestamp>,
                "duration": <duration>,
                "location": "room",
                "instructor": "instructor"
        ]
    ]
]
"""

""" the xml we parse seems to be structured as follows

courses can be found in the xml by looking for:
  elements who's class is PAGROUPBOXLABELLEVEL1
or
  elements who's id contain "win0divSSR_CLSRSLT_WRK_GROUPBOX2GP"
  each course, starting from 0, has ID win0divSSR_CLSRSLT_WRK_GROUPBOX2GP$0...win0divSSR_CLSRSLT_WRK_GROUPBOX2GP$124

the element with the id will be enveloped by the element with the aforementioned class name
which will itself be envoloped by a <tr> tag.

sibling to this <tr> is a <tr> which is used to hold the different classes for the respective course
"""

def parseXML(xmlfilename):
    courses = []

    # initial html parsing
    item = ET.parse(xmlfilename).getroot().findall("./")[6]
    soup = BeautifulSoup(item.text.replace("\n", ""), 'html.parser')
    

    # find course title anchors
    course_title_anchors = soup.find_all(True, {"class": "PAGROUPBOXLABELLEVEL1"})

    for course_title_anchor in course_title_anchors:
        course_section_anchor = course_title_anchor.parent.parent

        # mine course names ##################################################################################
        course_str = unicodedata.normalize("NFKD", course_title_anchor.contents[0].contents[1]).strip()

        # course str is expected to be of the form "COMPSCI <CODE> - <TITLE>"
        course_code = "COMPSCI" + course_str[8:course_str.index(" - ")]
        course_title = course_str[course_str.index(" - ")+3:]

        #print(f"{course['code']=}\n{course['title']=}\n")

        # mine course selectables ############################################################################

        # obtain the <table> which holds a list of selectables
        selectables_parent_elem = course_section_anchor.contents[1].contents[0].contents[0].contents[1].contents[1].contents[0].contents[0].contents[0].contents[0].contents[0]
        # obtain the <table>'s children. filtering whitespace entries
        selectables = selectables_parent_elem.find_all(True, {"class": "PABACKGROUNDINVISIBLE"})

        #selectables = selectables_parent_elem
        #try:
        #    print(selectables.prettify())
        #except AttributeError:
        #    print(list(enumerate(selectables)))

        # count and print the amount of selectables, just for fun
        #i = 0
        #for selectable in selectables:
        #    i += 1
        #print(f"{i=}")

        parsed_selectables = []
        """ reminder of structure for each class (A COURSE HAS MANY CLASSES):
        "class": "class code",
        "section": "section title (eg lb01)",
        "status": status (closed/open/etc.),

        "meetings": [{
                "time of occurance": <unix timestamp>,
                "duration": <duration>,
                "location": "room",
                "instructor": "instructor"
        }]
        """
        for selectable in selectables:

            # mine course's selectable's info
            class_html = selectable.find(True, {"class": "PSLEVEL1GRIDNBONBO"}).contents[1]

            class_obj = {
                "class": class_html.contents[0].find("a").contents[0],
                "section": class_html.contents[1].find("span").contents[0],
                "status": class_html.contents[2].find("img").attrs["alt"]
            }

            # mine course's selectable's options
            meetings = []
            class_slots = selectable.find(True, {"class": "PSLEVEL3GRIDNBO"})
            for entry in class_slots.contents[1:]:
                meetings.append( {
                    "dates": entry.contents[0].find("span").contents[0],
                    "times": entry.contents[1].find("span").contents[0],
                    "room": entry.contents[2].find("span").contents[0],
                    "instructor": entry.contents[3].find("span").contents[0]
                } )

            class_obj["meetings"] = meetings
            parsed_selectables.append(class_obj)

        courses.append( {"code": course_code, "title": course_title, "classes": parsed_selectables } )
    
    return courses

def save_to_json(data, filename):
    with open(filename, 'w') as f:
        json.dump(data, f)


def main():
    courses = parseXML('courses.xml')
    save_to_json(courses, 'courses.json')


if __name__ == "__main__":

    # calling main function
    main()
