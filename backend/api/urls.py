from django.urls import path
from . import views
urlpatterns = [
    path("", views.home),
    path("api/optimize-prompt", views.optimize_prompt),
]
