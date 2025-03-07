from django.urls import path

from api.views import get_total_db_elements

urlpatterns = [
    path('get-total-schedama-events/', get_total_db_elements, name='get_total_db_elements'),
]
