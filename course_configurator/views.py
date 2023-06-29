from django.http import HttpResponse
from django.shortcuts import render

def index(request):
    return render(request, "index.html");

def courseDisplay(request):
    return render(request, "courseDisplay.html");

def courseSelect(request):
    return render(request, "courseSelect.html");