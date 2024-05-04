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
