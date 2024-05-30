from django.urls import path
from .views import IndexView\
    # , CreatePDFView, SpellCheckView, ReadPDFView

urlpatterns = [
    path('', IndexView.as_view(), name='index'),
    # path('pdf/<int:pdf_id>/', ReadPDFView.as_view(), name='read_pdf'),
    # path('create-pdf/', CreatePDFView.as_view(), name='create_pdf'),
    # path('spell-check/', SpellCheckView.as_view(), name='spell_check'),
]
