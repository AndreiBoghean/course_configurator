## execution instructions:

### using docker:
1. a docker image may be created, and run, from source using `docker compose up --build` (or use [the existing docker image for this project](https://hub.docker.com/repository/docker/andreiboghean/course_configurator/general))

### alternatively:
1. (from course_configurator\course_configurator\static\course_data) run `python parser.py` to parse the coruse data xml into json
2. (from repo root) run `python manage.py runserver` to start the django server
3. navigate to the web address displayed to you by django in the console
