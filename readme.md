## project outline
2 main components: course combination stuff and course data parsing

### course combination stuff
- uses Django, bootstrap, fullcalendar.
- uses Gunicorn for application server
- uses nginx for web server
- can be built into docker container, but also has image `andreiboghean/course_configurator` on docker registry that gets updated with every commit to this repo, done via GitHub Actions.

#### noteworthy implementation detail
resolves conbinations of courses by mapping courses to a number with variable symbol base.
in binary terms, creates "bits" for each option, where each "bit" has a base number equal to the number of timeslots for that choice.
e.g. "Networks Lecture" or "networks Lab" would each be a "bit" and the number of timeslots would be the base for that specific bit.
it then increments and overflows appropriately.
also note that bits might (I dont remember if I ended up doing this) be ordered by base, so that slots with many options (lab slots) are changed the least frequently.
the motivation being that the things with less slots are what students are more interested in finding workarounds for. also in UofG compsci labs are an afterthought regardless.

### data parsing
- all relevant stuff is in [course_configurator/static/course_data](https://github.com/AndreiBoghean/course_configurator/tree/main/course_configurator/static/course_data)
- kept in static dir because forgot to move it out of there
- course XML data was manually saved by me from UofG using devTools, XML gets parsed and formatted to JSON with some minor tweaks to the data for conveience (mainly date & timestamp formatting)

## execution instructions:

### using docker:
1. create the docker image from source using `docker compose up --build` (or use [the existing docker image for this project](https://hub.docker.com/repository/docker/andreiboghean/course_configurator/general))
2. mount a folder containing `cert.pem` and `cert.key` to the `/app/sslDir` directory inside the container
3. bind container ports 8443 for https content and optionally port 8000 for http.

### alternatively:
1. create a `sslDir` folder in the project root, and place cert.pem and cert.key files inside.
2. (from course_configurator\course_configurator\static\course_data) run `python parser.py` to parse the coruse data xml into json
3. (from repo root) run `gunicorn -c ./gunicorn/dev.py` to start the application server
4. (from repo root) run `nginx -c ./nginx.conf` to start the web server

### lastly:
enjoy the website on port 8000 for http for 8443 for https
