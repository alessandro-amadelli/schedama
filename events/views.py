from django.shortcuts import render
from django.http import HttpResponse

def index(request):
    return render(request, "events/index.html")

def new_event_view(request):

    return render(request, "events/new_event.html")

def about_us_view(request):

    return render(request, "events/about_us.html")