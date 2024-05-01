# syntax=docker/dockerfile:1

# Comments are provided throughout this file to help you get started.
# If you need more help, visit the Dockerfile reference guide at
# https://docs.docker.com/engine/reference/builder/

ARG PYTHON_VERSION=3.11.0
# FROM python:${PYTHON_VERSION}-slim as base
FROM archlinux as base

RUN pacman -Syu nginx python python-pip --noconfirm

# Prevents Python from writing pyc files.
ENV PYTHONDONTWRITEBYTECODE=1

# Keeps Python from buffering stdout and stderr to avoid situations where
# the application crashes without emitting any logs due to buffering.
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Create a non-privileged user that the app will run under.
# See https://docs.docker.com/develop/develop-images/dockerfile_best-practices/#user
ARG UID=10001
RUN useradd \
    --comment "" \
    --shell "/sbin/nologin" \
    --uid "${UID}" \
    appuser

# Download dependencies as a separate step to take advantage of Docker's caching.
# Leverage a cache mount to /root/.cache/pip to speed up subsequent builds.
# Leverage a bind mount to requirements.txt to avoid having to copy them into
# into this layer.
RUN --mount=type=cache,target=/root/.cache/pip \
    --mount=type=bind,source=requirements.txt,target=requirements.txt \
    python -m pip install -r requirements.txt --break-system-packages

# Copy the source code into the container.
COPY . .

# parse the course data in preparation to use it
WORKDIR /app/course_configurator/static/course_data
RUN python parser.py
WORKDIR /app

# Switch to the non-privileged user to run the application.
# USER appuser

# Expose the port that the application listens on.
EXPOSE 8000
EXPOSE 8080

# Run the application.
CMD nginx -c /app/nginx.conf & gunicorn -c ./gunicorn/dev.py