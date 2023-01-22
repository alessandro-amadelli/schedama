from django.urls import path
from django.views.i18n import JavaScriptCatalog
from django.views.generic import TemplateView

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('create-event/', views.new_event_view, name='new_event_view'),
    path('save-event/', views.save_event_view, name='save_event_view'),
    path('participate/<str:eventID>', views.participate_view, name='participate_view'),
    path('add-participant/', views.add_participant_view, name='add_participant_view'),
    path('edit-event/<str:eventID>', views.edit_event_view, name='edit_event_view'),
    path('update-event/', views.update_event_view, name='update_event_view'),
    path('modify-participants/', views.modify_participants_view, name='modify_participants_view'),
    path('cancel-event/', views.cancel_event_view, name='cancel_event_view'),
    path('reactivate-event/', views.reactivate_event_view, name='reactivate_event_view'),
    path('history/', views.history_view, name='history_view'),
    path('about-us/', views.about_us_view, name='about_us_view'),
    path('jsi18n/', JavaScriptCatalog.as_view(), name='javascript-catalog'),
    path('serviceworker.js', (TemplateView.as_view(template_name="serviceworker.js", content_type='application/javascript', )), name='serviceworker.js'),
]