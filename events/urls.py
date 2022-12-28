from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create-event/', views.new_event_view, name='new_event_view'),
    path('about-us/', views.about_us_view, name='about_us_view'),
]