from django.urls import path
from .views import IndexView, ReadPDFView

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    path('read/<int:pdf_id>/', ReadPDFView.as_view(), name='read_pdf'),
    # path('create-pdf/<int:entry_id>/', CreatePDFView.as_view(), name='create_pdf'),
]
